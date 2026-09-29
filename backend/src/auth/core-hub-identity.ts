/** Subsystem-local roles. Deliberately NOT identical to Core Hub role names. */
export enum SubsystemRole {
  STUDENT = 'STUDENT',
  ALUMNI = 'ALUMNI',
  /** อาจารย์ — ใช้ระบบได้เท่านักศึกษา แต่ไม่ใช่ผู้ดูแลสาขาโดยอัตโนมัติ */
  LECTURER = 'LECTURER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

/**
 * Identity attached to a request. Every field originates from a
 * cryptographically verified Core Hub JWT claim - never from a header or body.
 */
export interface CoreHubIdentity {
  /** Core Hub user id (`sub`). */
  id: string;
  /** Alias of `id` — kept because most service code reads this name. */
  coreUserId: string;
  /** Core Hub email (`email`). */
  email: string;
  /** Core Hub central role (`role`). */
  coreRole: string;
  /** Core Hub session id (`sid`). */
  sessionId?: string;
  /** Result of the subsystem's own role mapping. */
  subsystemRole: SubsystemRole;
  /** `exp` ของ token ปัจจุบัน (epoch seconds) — ใช้ตอบ session.expiresAt ที่ /api/v1/me */
  expiresAtUnix?: number;
}

export interface CoreHubTokenPayload {
  sub: string;
  email?: string;
  role?: string;
  sid?: string;
  iss: string;
  aud: string | string[];
  iat?: number;
  exp?: number;
}

// core role มี 6 ค่าปิด ตาม authorization.md ข้อ 2 + contracts/jwt-contract.json
//   student · alumni · staff · lecturer · guest · admin
// ตารางนี้ "ต้องตรงกับ" defaultRoleMapping ในทะเบียน Core Hub เสมอ (authorization.md ข้อ 3)
//
// `guest` (ผู้เยี่ยมชม) จงใจไม่ใส่ — ไม่ใช่คนในสาขา จึงไม่มีเหตุให้ยืม/ให้ยืมของ
// ผลคือได้ 403 ซึ่งเป็นพฤติกรรมที่ถูกต้องตาม authorization.md ข้อ 3
const ROLE_MAP: Record<string, SubsystemRole> = {
  student: SubsystemRole.STUDENT,
  alumni: SubsystemRole.ALUMNI,
  lecturer: SubsystemRole.LECTURER,
  staff: SubsystemRole.STAFF,
  admin: SubsystemRole.ADMIN,
};

/** Maps the raw Core Hub `role` claim to this subsystem's SubsystemRole enum. */
export function mapCoreRole(coreRole: string | undefined): SubsystemRole | undefined {
  if (!coreRole) return undefined;
  return ROLE_MAP[coreRole.toLowerCase()];
}