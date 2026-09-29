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
    if (!decoded || !timingSafeEqual(decoded.state, stateParam)) {
      this.authEvents.jwtRejected({
        reason: decoded ? TokenRejectionReason.SSO_STATE_MISMATCH : TokenRejectionReason.SSO_STATE_MISSING,
        path: req.path,
      });
      // ห้าม redirect ซ้ำตามข้อ 5.1 — ตอบ 401 ตรงๆ
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