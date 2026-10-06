import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CoreHubTokenVerifier } from '../core-hub-token.verifier';
import { AuthEventsLogger } from '../auth-events.logger';
import { TokenVerificationError } from '../auth.errors';
import { CoreHubIdentity, mapCoreRole } from '../core-hub-identity';
import { unauthorized } from '../../common/exceptions/app.exception';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { forbidden } from '../../common/exceptions/app.exception';
import { cookieSafeName, readCookie } from '../sso.util';
declare module 'express' {
  interface Request {
    user?: CoreHubIdentity;
  }
}

@Injectable()
export class CoreHubJwtGuard implements CanActivate {
  constructor(
    private readonly verifier: CoreHubTokenVerifier,
    private readonly authEvents: AuthEventsLogger,
    private readonly reflector: Reflector,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);

    try {
      const payload = await this.verifier.verify(token ?? '');
      const subsystemRole = mapCoreRole(payload.role);

      if (!subsystemRole) {
        this.authEvents.roleMappingFailed({ sub: payload.sub, coreRole: payload.role });
        throw forbidden('บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบนี้');   // เดิมใช้ unauthorized() — ผิดตามข้อ 8
      }

      req.user = {
        id: payload.sub,
        coreUserId: payload.sub,
        email: payload.email ?? '',
        coreRole: payload.role ?? '',
        sessionId: payload.sid,
        subsystemRole,
        expiresAtUnix: payload.exp,
      };

      this.authEvents.jwtVerified({ sub: payload.sub, coreRole: payload.role, subsystemRole });
      return true;
    } catch (error) {
      if (error instanceof TokenVerificationError) {
        this.authEvents.jwtRejected({ reason: error.reason, kid: error.kid, path: req.path });
        throw unauthorized(error.message);
      }
      throw error;
    }
  }

  private extractToken(req: Request): string | undefined {
    const [scheme, value, ...rest] = (req.header('authorization') ?? '').trim().split(/\s+/);
    if (value && rest.length === 0 && scheme?.toLowerCase() === 'bearer') {
      return value;
    }
    const cookieName = `${cookieSafeName(process.env.SUBSYSTEM_ID ?? 'csmju-campus-share')}_access_token`;
    return readCookie(req.header('cookie'), cookieName) ?? undefined;
  }
}