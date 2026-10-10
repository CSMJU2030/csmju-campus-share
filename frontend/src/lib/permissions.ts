import type { SubsystemRole } from "@/types";

/**
 * ชื่อสิทธิ์ "ต้องตรงกับ backend/src/auth/permissions.ts เป๊ะ" และอยู่ในรูปแบบ
 * <resource>:<action>[:own|:any] ตาม authorization.md ข้อ 4 (ขีดล่างใช้ไม่ได้)
 *
 * ตารางนี้ใช้เพื่อ "ซ่อน/แสดงปุ่ม" เท่านั้น — backend เป็นผู้ตัดสินสิทธิ์จริงและตอบ 403
 * โครงของไฟล์นี้ล้อ backend ทีละบรรทัดเพื่อให้เทียบด้วยตาได้ว่าตรงกันหรือยัง
 */
export type Permission =
  | "listing:read"
  | "listing:create"
  | "listing:update:own"
  | "borrow-request:read:own"
  | "borrow-request:create"
  | "borrow-request:update:own"
  | "report:create"
  | "notification:read:own"
  | "notification:update:own"
  | "admin:access";

const STUDENT: Permission[] = [
  "listing:read",
  "listing:create",
  "listing:update:own",
  "borrow-request:read:own",
  "borrow-request:create",
  "borrow-request:update:own",
  "report:create",
  "notification:read:own",
  "notification:update:own",
];

// alumni = ดูอย่างเดียว (ลงของ / ขอยืม / รายงาน ไม่ได้)
const ALUMNI: Permission[] = [
  "listing:read",
  "borrow-request:read:own",
  "notification:read:own",
  "notification:update:own",
];

// lecturer = ใช้ระบบได้เท่านักศึกษา · staff = นักศึกษา + เป็นผู้ดูแลสาขาโดยตำแหน่ง
const LECTURER: Permission[] = [...STUDENT];
const STAFF: Permission[] = [...STUDENT, "admin:access"];
const ADMIN: Permission[] = [...STUDENT, "admin:access"];

const MATRIX: Record<SubsystemRole, readonly Permission[]> = { STUDENT, ALUMNI, LECTURER, STAFF, ADMIN };

export const can = (role: SubsystemRole | undefined, p: Permission) => !!role && (MATRIX[role]?.includes(p) ?? false);
