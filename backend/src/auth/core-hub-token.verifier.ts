import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decodeProtectedHeader, errors as joseErrors, jwtVerify } from 'jose';
import { CoreHubTokenPayload } from './core-hub-identity';
import { JwksService } from './jwks.service';
import { TokenRejectionReason, TokenVerificationError } from './auth.errors';

/** The Core Hub contract is immutable (spec §43). */
const REQUIRED_ALGORITHM = 'RS256';

/** auth-contract ข้อ 4 ขั้น 9 — อายุ access token 15 นาที เผื่อ clock skew 60 วินาที */
const MAX_TOKEN_LIFETIME_SEC = 900;
const TOKEN_LIFETIME_SKEW_SEC = 60;

/**
 * Verifies a Core Hub access token (spec §9, §13).
 *
 * ครบ 10 ขั้นตาม auth-contract.md v1.2 (standards 1.7.0) ข้อ 4
 *
 * 1. require alg = RS256   2. read kid            3. get public key from JWKS
 * 4. verify signature      5. verify iss          6. verify aud
 * 7. verify exp            8. require sub
 * 9. token lifetime: ต้องมี iat และ exp - iat <= 900 (+60) วินาที — กัน refresh token (อายุ 7 วัน) ถูกใช้แทน
 * 10. azp: ถ้ามี ต้องเท่ากับชื่อระบบตัวเอง — กัน token ที่ออกให้ระบบอื่นถูกนำมาใช้ที่นี่
 *
 * ขั้น 10 ตอนนี้ตรวจเฉพาะเมื่อ token มี azp · เวอร์ชันถัดไปของสัญญาจะบังคับให้ต้องมี
 */
@Injectable()
export class CoreHubTokenVerifier {
  constructor(
    private readonly jwks: JwksService,
    private readonly config: ConfigService,
  ) {}

  async verify(token: string): Promise<CoreHubTokenPayload> {
    if (typeof token !== 'string' || token.trim().length === 0) {
      throw new TokenVerificationError(TokenRejectionReason.MISSING_TOKEN, 'No token supplied');
    }

    // Step 1-2: inspect the (unverified) header only to learn alg and kid.
    let header: ReturnType<typeof decodeProtectedHeader>;
    try {
      header = decodeProtectedHeader(token);
    } catch {
      throw new TokenVerificationError(
        TokenRejectionReason.MALFORMED_TOKEN,
        'Token is not a well-formed JWT',
      );
    }

    // `alg: none`, HS256 and every other algorithm are rejected outright.
    if (header.alg !== REQUIRED_ALGORITHM) {
      throw new TokenVerificationError(
        TokenRejectionReason.UNSUPPORTED_ALGORITHM,
        `Unsupported token algorithm: ${String(header.alg)}`,
        header.kid,
      );
    }

    if (typeof header.kid !== 'string' || header.kid.length === 0) {
      throw new TokenVerificationError(
        TokenRejectionReason.MISSING_KID,
        'Token header does not contain a key id',
      );
    }

    // Step 3: resolve the public key for this kid (refreshing JWKS if needed).
    const key = await this.jwks.getKey(header.kid);

    // Step 4-7: signature + registered claim validation, enforcing RS256 again.
    let payload: CoreHubTokenPayload;
    try {
      const result = await jwtVerify(token, key, {
        algorithms: [REQUIRED_ALGORITHM],
        issuer: this.config.get<string>('coreHub.issuer', 'core-hub'),
        audience: this.config.get<string>('coreHub.audience', 'csmju2030'),
        clockTolerance: this.config.get<number>('coreHub.clockToleranceSec', 5),
      });
      payload = result.payload as unknown as CoreHubTokenPayload;
    } catch (error) {
      throw this.translate(error, header.kid);
    }

    // Step 8: the subsystem also requires a usable subject.
    // `sub` เป็น string ทึบยาวไม่เกิน 64 — ไม่ใช่ UUID เสมอไป (auth-contract v1.2 ข้อ 10)
    if (typeof payload.sub !== 'string' || payload.sub.trim().length === 0) {
      throw new TokenVerificationError(
        TokenRejectionReason.INVALID_CLAIMS,
        'Token has no subject claim',
        header.kid,
      );
    }

    // Step 9: อายุ token — refresh token ของ Core Hub อายุ 7 วัน ถ้าถูกส่งมาแทน access token
    // ลายเซ็น iss aud exp จะผ่านหมด ขั้นนี้คือด่านเดียวที่จับได้
    if (typeof payload.iat !== 'number') {
      throw new TokenVerificationError(
        TokenRejectionReason.TOKEN_LIFETIME_EXCEEDED,
        'Token has no iat claim',
        header.kid,
      );
    }
    if (typeof payload.exp !== 'number') {
      throw new TokenVerificationError(
        TokenRejectionReason.TOKEN_LIFETIME_EXCEEDED,
        'Token has no exp claim',
        header.kid,
      );
    }
    if (payload.exp - payload.iat > MAX_TOKEN_LIFETIME_SEC + TOKEN_LIFETIME_SKEW_SEC) {
      throw new TokenVerificationError(
        TokenRejectionReason.TOKEN_LIFETIME_EXCEEDED,
        'Token lifetime exceeds the 15-minute access token limit',
        header.kid,
      );
    }

    // Step 10: azp — ตรวจเมื่อมีเท่านั้น จนกว่า Core Hub จะใส่ให้ครบทุก token
    const azp = (payload as { azp?: unknown }).azp;
    if (azp !== undefined) {
      const expected = this.config.get<string>('subsystem.name', '');
      if (typeof azp !== 'string' || azp !== expected) {
        throw new TokenVerificationError(
          TokenRejectionReason.INVALID_AZP,
          'Token was issued for a different subsystem',
          header.kid,
        );
      }
    }

    return payload;
  }

  private translate(error: unknown, kid: string): TokenVerificationError {
    if (error instanceof TokenVerificationError) {
      return error;
    }

    if (error instanceof joseErrors.JWTExpired) {
      return new TokenVerificationError(TokenRejectionReason.EXPIRED, 'Token has expired', kid);
    }

    if (error instanceof joseErrors.JWTClaimValidationFailed) {
      if (error.claim === 'iss') {
        return new TokenVerificationError(
          TokenRejectionReason.INVALID_ISSUER,
          'Token issuer is not the Core Hub',
          kid,
        );
      }
      if (error.claim === 'aud') {
        return new TokenVerificationError(
          TokenRejectionReason.INVALID_AUDIENCE,
          'Token audience does not include this platform',
          kid,
        );
      }
      return new TokenVerificationError(
        TokenRejectionReason.INVALID_CLAIMS,
        `Token claim "${error.claim}" is invalid`,
        kid,
      );
    }

    if (
      error instanceof joseErrors.JOSEError &&
      error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED'
    ) {
      return new TokenVerificationError(
        TokenRejectionReason.INVALID_SIGNATURE,
        'Token signature verification failed',
        kid,
      );
    }

    return new TokenVerificationError(
      TokenRejectionReason.MALFORMED_TOKEN,
      'Token could not be verified',
      kid,
    );
  }
}
