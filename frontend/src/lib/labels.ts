import type { ListingStatus, ListingType, NotificationType, ReportStatus, ReportTargetType, RequestStatus } from "@/types";

export const formatDate = (v: string) =>
  new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { dateStyle: "medium", timeZone: "Asia/Bangkok" }).format(new Date(v));

// แสดงป้ายภาษาไทย ถ้าเจอค่าที่ไม่รู้จักให้แสดงค่าดิบ
export const label = (map: Record<string, string>, key: string | null | undefined) => (key ? map[key] ?? key : "");

export const LISTING_TYPE_LABEL: Record<ListingType, string> = { BORROW: "ให้ยืม", GIVEAWAY: "ให้ต่อ" };
export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  AVAILABLE: "ว่าง", PENDING: "รอเจ้าของตอบ", BORROWED: "ถูกยืมอยู่",
  GIVEN_AWAY: "ส่งมอบแล้ว", UNAVAILABLE: "ปิดชั่วคราว", ARCHIVED: "เก็บถาวร",
};
export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: "รอเจ้าของตอบ", APPROVED: "อนุมัติแล้ว", REJECTED: "ปฏิเสธ",
  RETURNED: "คืนแล้ว", EXPIRED: "หมดเวลารอ", OVERDUE: "เกินกำหนดคืน",
};
export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  NEW_REQUEST: "คำขอใหม่", REQUEST_APPROVED: "อนุมัติคำขอ", REQUEST_REJECTED: "ปฏิเสธคำขอ",
  RETURN_REMINDER: "เตือนคืนของ", OVERDUE_FLAG: "เกินกำหนดคืน",
};
export const REPORT_TARGET_LABEL: Record<ReportTargetType, string> = { LISTING: "ประกาศ", BORROW_REQUEST: "คำขอยืม" };
export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = { OPEN: "รอดำเนินการ", RESOLVED: "ปิดแล้ว" };

// ค่า enum ListingCategory จาก backend/prisma/schema.prisma — ต้องตรงกันเป๊ะ
export const CATEGORY_LABEL: Record<string, string> = {
  BOOKS_MATERIALS: "หนังสือ/เอกสารประกอบการเรียน",
  CALCULATORS: "เครื่องคิดเลข",
  CABLES_CONNECTORS: "สาย/อะแดปเตอร์",
  PROJECT_EQUIPMENT: "อุปกรณ์ทำโปรเจกต์",
  CAMERA_PHOTOGRAPHY: "กล้อง/ขาตั้งกล้อง",
  TOOLS: "เครื่องมือช่าง",
  CLUB_ACTIVITY_GEAR: "อุปกรณ์กิจกรรมสาขา",
};
export const CATEGORY_KEYS = Object.keys(CATEGORY_LABEL);
