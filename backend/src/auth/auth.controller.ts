import { Controller, Get, HttpCode, Post, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthEventsLogger } from './auth-events.logger';
import { Public } from './decorators/public.decorator';
import { TokenRejectionReason, TokenVerificationError } from './auth.errors';
import { badRequest, forbidden, unauthorized } from '../common/exceptions/app.exception';
import { mapCoreRole } from './core-hub-identity';
import { decodeStateCookie, encodeStateCookie, generateState, isValidNext, readCookie, timingSafeEqual } from './sso.util';
const DEFAULT_NEXT = '/';

/** auth-contract.md v1.2 ข้อ 5.1 — เบราว์เซอร์ที่ state ไม่ตรงต้องได้หน้าที่มีปุ่มเริ่มใหม่ ไม่ใช่ JSON เปล่า */
const RETRY_LOGIN_PAGE = `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>เข้าสู่ระบบอีกครั้ง · CampusShare</title></head>
<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;line-height:1.6">
<h1 style="font-size:1.5rem">เข้าสู่ระบบไม่สำเร็จ</h1>
<p>การเข้าสู่ระบบใช้เวลานานเกินไป หรือเบราว์เซอร์ไม่ได้เก็บคุกกี้ไว้ กรุณาลองใหม่อีกครั้ง</p>
<p><a href="/auth/login" style="display:inline-block;min-height:44px;line-height:44px;padding:0 1.25rem;border-radius:.5rem;background:#2154d9;color:#fff;text-decoration:none;font-weight:600">เข้าสู่ระบบอีกครั้ง</a></p>
</body></html>`;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authEvents: AuthEventsLogger,
  ) {}

  @Public()
  @Get('login')
  login(@Query('next') nextRaw: string | undefined, @Res() res: Response) {
    res.set('Cache-Control', 'no-store');

    // ตรวจ next กับ origin ที่ตั้งค่าไว้ ไม่ใช่ req.get('host') ซึ่ง client ปลอมได้
    const next = isValidNext(nextRaw, this.authService.publicOrigin) ? nextRaw! : DEFAULT_NEXT;

    // state นี้พิสูจน์ได้แค่ว่า "เบราว์เซอร์นี้เริ่ม login ผ่านเรา" — เทียบขากลับไม่ได้
    // เพราะ Core Hub v1.0.0 ทิ้ง state ของระบบย่อยแล้วสร้างของตัวเอง (ดู auth.service.ts)
    const state = generateState();
    res.cookie(
      this.authService.stateCookieName,
      encodeStateCookie(state, next),
      this.authService.stateCookieOptions,
    );

    return res.redirect(this.authService.buildAuthorizeUrl(state));
  }

  @Public()
  @Get('callback')
  async callback(
    @Query('access_token') accessToken: string | undefined,
    @Query('state') stateParam: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    res.set('Cache-Control', 'no-store');
    res.set('Referrer-Policy', 'no-referrer');

    // ไม่มี state เลย = เข้าทาง sidebar ของ Core Hub — ทิ้ง token ห้ามแตะคุกกี้ state (ข้อ 5.1)
    if (!stateParam) {
      // ห้าม log URL เต็มของ callback (มี token อยู่ใน query) — log แค่ path
      this.authEvents.jwtRejected({ reason: TokenRejectionReason.SSO_RESTART_WITHOUT_STATE, path: req.path });
      return res.redirect('/auth/login');
    }

    // เดิม: const rawCookie = req.cookies?.[this.authService.stateCookieName] as string | undefined;
    const rawCookie = readCookie(req.header('cookie'), this.authService.stateCookieName) ?? undefined;
    res.clearCookie(this.authService.stateCookieName, { path: '/auth/callback' });

    if (!accessToken) {
      throw badRequest('ไม่ได้รับ access_token จาก Core Hub');
    }

    const decoded = rawCookie ? decodeStateCookie(rawCookie) : null;

    // auth-contract.md v1.2 ข้อ 5.1 บรรทัด 203:
    //   มี state แต่ไม่มีคุกกี้ หรือไม่ตรงกัน -> 401 **ห้าม redirect ซ้ำ**
    //   (เบราว์เซอร์ที่ไม่เก็บคุกกี้จะวนไม่จบ) · ที่ขอ text/html ให้หน้าที่มีปุ่ม "เข้าสู่ระบบอีกครั้ง"
    // Core Hub ส่ง state ของเราต่อตรงตัว (บรรทัด 181) การเทียบจึงมีผลจริง
    if (!decoded || !timingSafeEqual(decoded.state, stateParam)) {
      this.authEvents.jwtRejected({
        reason: decoded ? TokenRejectionReason.SSO_STATE_MISMATCH : TokenRejectionReason.SSO_STATE_MISSING,
        kid: null,
        path: req.path,
      });
      if ((req.header('accept') ?? '').includes('text/html')) {
        return res.status(401).type('html').send(RETRY_LOGIN_PAGE);
      }
      throw unauthorized('SSO state ไม่ตรงกันหรือหมดอายุ');
    }

    let payload;
    try {
      payload = await this.authService.verifyIncomingToken(accessToken);
    } catch (error) {
      if (error instanceof TokenVerificationError) {
        throw unauthorized(error.message);
      }
      throw error;
    }

    // รู้ตัวตนแล้ว (signature ผ่าน) แต่ core role ไม่ถูกรับ = 403 ไม่ใช่ 401 (ข้อ 8)
    const subsystemRole = mapCoreRole(payload.role);
    if (!subsystemRole) {
      throw forbidden('บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบนี้');
    }

    const next = isValidNext(decoded.next, this.authService.publicOrigin) ? decoded.next : DEFAULT_NEXT;

    res.cookie(
      this.authService.accessTokenCookieName,
      accessToken,
      this.authService.accessTokenCookieOptions(payload.exp ?? Math.floor(Date.now() / 1000) + 900),
    );

    return res.redirect(next);
  }

  // POST ไม่ใช่ GET ตามข้อ 5 — ตอบ 303 ไม่ใช่ 302
  @Public()
  @Post('logout')
  @HttpCode(303)
  logout(@Res() res: Response) {
    res.set('Cache-Control', 'no-store');
    res.clearCookie(this.authService.accessTokenCookieName, { path: '/' });
    res.clearCookie(this.authService.stateCookieName, { path: '/auth/callback' });
    return res.redirect(303, this.authService.buildLogoutUrl());
  }
}