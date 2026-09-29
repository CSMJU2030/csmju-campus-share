// ชนิดข้อมูลตามสัญญา backend
// api-conventions.md v1.1 ข้อ 6: field ใน JSON เป็น camelCase ทั้งหมด (ไม่มี snake_case แล้ว)
// data-dictionary.md ข้อ 9.1: ค่า enum เป็น UPPER_SNAKE_CASE
// TODO(C26): ต้องเลิกเขียน type เองแล้ว generate จาก openapi.json แทน (tech-stack.md ข้อ 3)

export type SubsystemRole = "STUDENT" | "ALUMNI" | "LECTURER" | "STAFF" | "ADMIN";
export type ListingType = "BORROW" | "GIVEAWAY";
export type ListingStatus = "AVAILABLE" | "PENDING" | "BORROWED" | "GIVEN_AWAY" | "UNAVAILABLE" | "ARCHIVED";
export type ListingCategory = string; // ค่าจริงอยู่ใน lib/labels.ts (CATEGORY_LABEL)
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "RETURNED" | "EXPIRED" | "OVERDUE";
export type NotificationType = "NEW_REQUEST" | "REQUEST_APPROVED" | "REQUEST_REJECTED" | "RETURN_REMINDER" | "OVERDUE_FLAG";
export type ReportTargetType = "LISTING" | "BORROW_REQUEST";
export type ReportStatus = "OPEN" | "RESOLVED";

export interface Me {
  id: string;
  email: string;
  coreRole: string;
  subsystemRole: SubsystemRole;
  /** auth-contract.md ข้อ 7 — ใช้ต่ออายุล่วงหน้าก่อนโดน 401 กลางคัน */
  session?: { expiresAt: string };
}

export interface Listing {
  id: string; ownerCoreUserId: string; title: string; description: string | null;
  category: ListingCategory; listingType: ListingType; status: ListingStatus;
  department: string | null; lastActivityAt: string; createdAt: string; updatedAt: string;
}
export interface BorrowRequest {
  id: string; listingId: string; requesterCoreUserId: string; message: string | null; responseMessage: string | null;
  status: RequestStatus; requestedAt: string; respondedAt: string | null; dueDate: string | null; returnedAt: string | null;
  createdAt: string; listing?: Listing;
}
export interface MineRequests { asRequester: BorrowRequest[]; asOwner: BorrowRequest[] }
export interface Notification {
  id: string; recipientCoreUserId: string; type: NotificationType; title: string; body: string | null;
  refListingId: string | null; refRequestId: string | null; isRead: boolean; createdAt: string;
}
export interface Report {
  id: string; targetType: ReportTargetType; targetId: string; reporterCoreUserId: string; reason: string;
  status: ReportStatus; createdAt: string; resolvedByCoreUserId: string | null; resolvedAt: string | null;
}
export interface AdminStats {
  listingsByStatus: Record<string, number>; requestsByStatus: Record<string, number>;
  openReportsCount: number; overdueRequestsCount: number; activeListersCount: number;
}

export interface Meta { total: number; page: number; limit: number; totalPages: number }
export type ErrorCode =
  | "BAD_REQUEST" | "VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND"
  | "CONFLICT" | "TOO_MANY_REQUESTS" | "INTERNAL_ERROR" | "SERVICE_UNAVAILABLE";
// details: VALIDATION_ERROR = string[]; CONFLICT = object เช่น { listingStatus } / { currentStatus }
export type Envelope<T> =
  | { success: true; data: T; meta?: Meta }
  | { success: false; error: { code: ErrorCode; message: string; details?: unknown } };
