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

  /** ห้ามส่ง callback_url ไปด้วย — Core Hub รู้ callback_url จากทะเบียนแล้ว */
  buildAuthorizeUrl(state: string): string {
    const webUrl = this.config.get<string>('coreHub.webUrl');
    const params = new URLSearchParams({ subsystem: this.subsystemName, state });
    return `${webUrl}/sso/authorize?${params.toString()}`;
  }

  buildLogoutUrl(): string {
    return `${this.config.get<string>('coreHub.webUrl')}/logout`;
  }

  /** verify ครบ 8 ขั้นผ่าน verifier ตัวเดียวกับ guard — ห้ามเชื่อ token จาก URL เฉยๆ */
  async verifyIncomingToken(token: string) {
    return this.verifier.verify(token);
  }
}