import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoreHubTokenVerifier } from './core-hub-token.verifier';
import { cookieSafeName } from './sso.util';

const STATE_TTL_SEC = 600; // ห้ามเกิน ตามข้อ 5.2

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly verifier: CoreHubTokenVerifier,
  ) {}

  private get subsystemName(): string {
    return this.config.get<string>('subsystem.name', 'csmju-campus-share');
  }

  /** origin ที่เบราว์เซอร์เห็นจริง — ใช้ตรวจ next และเป็นปลายทางของ redirect หลัง callback */
  get publicOrigin(): string {
    return this.config.get<string>('app.publicOrigin', 'http://localhost:3003');
  }

  get stateCookieName(): string {
    return `${cookieSafeName(this.subsystemName)}_sso_state`;
  }

  get accessTokenCookieName(): string {
    return `${cookieSafeName(this.subsystemName)}_access_token`;
  }

  get stateCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/auth/callback', // ตามข้อ 5.2 — ห้ามใช้ "/"
      maxAge: STATE_TTL_SEC * 1000,
    };
  }

  /** Max-Age = exp - ตอนนี้ (ไม่ใช่ค่าคงที่) ตามข้อ 5.1 */
  accessTokenCookieOptions(expUnixSec: number) {
    const maxAgeMs = Math.max(0, expUnixSec * 1000 - Date.now());
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: maxAgeMs,
    };
  }

  /**
   * ตัวเลือกสำหรับ "ลบ" คุกกี้ session — attribute ต้องตรงกับตอนตั้งทุกตัว
   * ไม่ใช้ res.clearCookie() เพราะ Express 5 ลบ maxAge ออกเสมอ (lib/response.js:720)
   * จึงได้แต่ Expires=1970 ไม่มี Max-Age=0 ที่ conformance L3-22 บังคับ
   */
  get clearedAccessTokenCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0,
    };
  }

  /**
   * จุดเริ่ม SSO — auth-contract.md v1.2 (standards 1.7.0) ข้อ 5 บรรทัด 149
   *
   *   GET /auth/login -> 302 {CORE_HUB_WEB_URL}/sso/authorize?subsystem=<ชื่อ>&state=<state>
   *
   * ห้ามส่ง `callback_url` ไปด้วย — Core Hub รู้จากทะเบียนแล้ว (ข้อ 5 ตาราง endpoint)
   * Core Hub "ส่ง state ต่อตรงตัว ห้ามสร้างเอง" (ข้อ 5 บรรทัด 181) เราจึงเทียบ state ขากลับได้
   */
  buildAuthorizeUrl(state: string): string {
    const webUrl = this.config.get<string>('coreHub.webUrl');
    const params = new URLSearchParams({ subsystem: this.subsystemName, state });
    return `${webUrl}/sso/authorize?${params.toString()}`;
  }

  /** ออกจากระบบไปหน้า /logout ของเว็บ Core Hub (connect-core-hub.md ข้อ 6 ข้อทดสอบที่ 4) */
  buildLogoutUrl(): string {
    return `${this.config.get<string>('coreHub.webUrl')}/logout`;
  }

  /** verify ครบ 10 ขั้นผ่าน verifier ตัวเดียวกับ guard — ห้ามเชื่อ token จาก URL เฉยๆ */
  async verifyIncomingToken(token: string) {
    return this.verifier.verify(token);
  }
}