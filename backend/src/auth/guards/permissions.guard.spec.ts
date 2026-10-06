import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { AuthEventsLogger } from '../auth-events.logger';
import { CoreHubIdentity, SubsystemRole } from '../core-hub-identity';
import { AppException } from '../../common/exceptions/app.exception';
import { Permission } from '../permissions';

const identity = (subsystemRole: SubsystemRole): CoreHubIdentity => ({
  id: 'user-001',
  coreUserId: 'user-001',
  email: 'someone@core.local',
  coreRole: 'student',
  subsystemRole,
});

const contextFor = (user?: CoreHubIdentity) =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user, path: '/api/v1/admin/stats' }) }),
  }) as unknown as ExecutionContext;

/** เรียก guard แล้วคืน error ที่โยนออกมา (ไม่ใช้ fail() ซึ่ง Jest 27+ ถอดออกแล้ว) */
const catchError = (run: () => unknown): unknown => {
  try {
    run();
    return undefined;
  } catch (error) {
    return error;
  }
};

describe('PermissionsGuard', () => {
  const authEvents = { authorizationDenied: jest.fn() } as unknown as AuthEventsLogger;

  const guardRequiring = (required?: Permission[]) => {
    const reflector = { getAllAndOverride: () => required } as unknown as Reflector;
    return new PermissionsGuard(reflector, authEvents);
  };

  beforeEach(() => jest.clearAllMocks());

  it('สิทธิ์ไม่พอ -> 403 FORBIDDEN (ห้ามเป็น 401 หรือ 404)', () => {
    const guard = guardRequiring([Permission.ADMIN_ACCESS]);
    const error = catchError(() => guard.canActivate(contextFor(identity(SubsystemRole.STUDENT))));

    expect(error).toBeInstanceOf(AppException);
    expect((error as AppException).code).toBe('FORBIDDEN');
    expect((error as AppException).getStatus()).toBe(403);
    expect(authEvents.authorizationDenied).toHaveBeenCalledTimes(1);
  });

  it('ไม่รู้ว่าเป็นใคร -> 401 UNAUTHORIZED', () => {
    const guard = guardRequiring([Permission.ADMIN_ACCESS]);
    const error = catchError(() => guard.canActivate(contextFor(undefined)));

    expect(error).toBeInstanceOf(AppException);
    expect((error as AppException).code).toBe('UNAUTHORIZED');
    expect((error as AppException).getStatus()).toBe(401);
  });

  it('มีสิทธิ์ -> ผ่าน', () => {
    const guard = guardRequiring([Permission.ADMIN_ACCESS]);
    expect(guard.canActivate(contextFor(identity(SubsystemRole.STAFF)))).toBe(true);
    expect(authEvents.authorizationDenied).not.toHaveBeenCalled();
  });

  it('endpoint ที่ไม่ประกาศ permission -> ผ่าน (JWT guard คุมอยู่แล้ว)', () => {
    expect(guardRequiring(undefined).canActivate(contextFor(identity(SubsystemRole.ALUMNI)))).toBe(true);
    expect(guardRequiring([]).canActivate(contextFor(identity(SubsystemRole.ALUMNI)))).toBe(true);
  });
});
