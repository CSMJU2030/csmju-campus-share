import { SetMetadata } from '@nestjs/common';
import { Permission } from '../permissions';

export const PERMISSIONS_KEY = 'permissions';

/** ต้องมีอย่างน้อยหนึ่งในสิทธิ์ที่ระบุ (ตรวจโดย PermissionsGuard) */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);