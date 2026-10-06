import { SubsystemRole } from './core-hub-identity';

/**
 * Subsystem permissions (spec §16).
 *
 *   Core JWT -> Core Role -> Subsystem Role -> Permission -> Business Operation
 *
 * Business code asks for a permission, never for `role === 'admin'`.
 * `:own` variants are scope hints: the guard lets the request through and the
 * service performs the ownership check against business data.
 */
export enum Permission {
  LISTING_READ = 'listing:read',
  LISTING_CREATE = 'listing:create',
  LISTING_UPDATE_OWN = 'listing:update:own',

  BORROW_REQUEST_READ_OWN = 'borrow-request:read:own',
  BORROW_REQUEST_CREATE = 'borrow-request:create',
  BORROW_REQUEST_UPDATE_OWN = 'borrow-request:update:own',

  REPORT_CREATE = 'report:create',

  NOTIFICATION_READ_OWN = 'notification:read:own',
  NOTIFICATION_UPDATE_OWN = 'notification:update:own',

  ADMIN_ACCESS = 'admin:access',
}

const STUDENT_PERMISSIONS: Permission[] = [
  Permission.LISTING_READ,
  Permission.LISTING_CREATE,
  Permission.LISTING_UPDATE_OWN,
  Permission.BORROW_REQUEST_READ_OWN,
  Permission.BORROW_REQUEST_CREATE,
  Permission.BORROW_REQUEST_UPDATE_OWN,
  Permission.REPORT_CREATE,
  Permission.NOTIFICATION_READ_OWN,
  Permission.NOTIFICATION_UPDATE_OWN,
];

// alumni = ดูอย่างเดียว (ลงของ / ขอยืม / รายงาน ไม่ได้)
const ALUMNI_PERMISSIONS: Permission[] = [
  Permission.LISTING_READ,
  Permission.BORROW_REQUEST_READ_OWN,
  Permission.NOTIFICATION_READ_OWN,
  Permission.NOTIFICATION_UPDATE_OWN,
];

// lecturer = อาจารย์ ใช้ระบบได้เท่านักศึกษา (ยืม/ให้ยืม/ให้ต่อ/รายงาน)
// จงใจ "ไม่" ให้ ADMIN_ACCESS — ขอบเขตที่ตกลงไว้ระบุแค่ staff -> admin
// ถ้าภายหลังต้องการให้อาจารย์เป็นผู้ดูแลด้วย ให้เติม Permission.ADMIN_ACCESS ที่บรรทัดนี้จุดเดียว
const LECTURER_PERMISSIONS: Permission[] = [...STUDENT_PERMISSIONS];

// staff = ทำได้เท่า student + เป็น Admin สาขาโดยตำแหน่ง (ตามขอบเขต: staff -> admin)
const STAFF_PERMISSIONS: Permission[] = [...STUDENT_PERMISSIONS, Permission.ADMIN_ACCESS];

const ADMIN_PERMISSIONS: Permission[] = Object.values(Permission);

export const ROLE_PERMISSIONS: Readonly<Record<SubsystemRole, readonly Permission[]>> =
  Object.freeze({
    [SubsystemRole.STUDENT]: Object.freeze(STUDENT_PERMISSIONS),
    [SubsystemRole.ALUMNI]: Object.freeze(ALUMNI_PERMISSIONS),
    [SubsystemRole.LECTURER]: Object.freeze(LECTURER_PERMISSIONS),
    [SubsystemRole.STAFF]: Object.freeze(STAFF_PERMISSIONS),
    [SubsystemRole.ADMIN]: Object.freeze(ADMIN_PERMISSIONS),
  });

/** Does this subsystem role hold the given permission? */
export function can(role: SubsystemRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Does this subsystem role hold at least one of the given permissions? */
export function canAny(role: SubsystemRole, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => can(role, permission));
}