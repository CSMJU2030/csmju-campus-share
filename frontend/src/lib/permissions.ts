import type { SubsystemRole } from "@/types";

export type Permission =
  | "listing:view" | "listing:create" | "listing:manage_own" | "borrow:request" | "borrow:view_mine"
  | "borrow:respond" | "report:create" | "notification:view_mine" | "admin:access";

const ALL: Permission[] = ["listing:view", "listing:create", "listing:manage_own", "borrow:request", "borrow:view_mine", "borrow:respond", "report:create", "notification:view_mine", "admin:access"];
const MEMBER = ALL.filter((p) => p !== "admin:access");
const ALUMNI: Permission[] = ["listing:view", "borrow:view_mine", "notification:view_mine"];

const MATRIX: Record<SubsystemRole, readonly Permission[]> = { STUDENT: MEMBER, ALUMNI, LECTURER: MEMBER, STAFF: ALL, ADMIN: ALL };

// ใช้เพื่อซ่อน/แสดงปุ่มเท่านั้น — backend เป็นผู้ตัดสินสิทธิ์จริง (403)
export const can = (role: SubsystemRole | undefined, p: Permission) => !!role && (MATRIX[role]?.includes(p) ?? false);
