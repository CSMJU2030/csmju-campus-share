import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { forbidden, unauthorized } from '../../common/exceptions/app.exception';
import { AuthEventsLogger } from '../auth-events.logger';
import { CoreHubIdentity } from '../core-hub-identity';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { Permission, canAny } from '../permissions';

/**
 * Authorization guard (spec §15, §16).
 * ทำงานหลัง CoreHubJwtGuard: guard ตัวแรกตอบว่า "ใครเรียก" ตัวนี้ตอบว่า "role นี้ทำอะไรได้"
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authEvents: AuthEventsLogger,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: CoreHubIdentity }>();
    const user = request.user;

    if (!user) {
      throw unauthorized();
    }

    if (!canAny(user.subsystemRole, required)) {
      this.authEvents.authorizationDenied({
        sub: user.id,
        subsystemRole: user.subsystemRole,
        required,
        path: request.path,
        reason: 'missing_permission',
      });
      throw forbidden('คุณไม่มีสิทธิ์ทำรายการนี้');
    }

    return true;
  }
}