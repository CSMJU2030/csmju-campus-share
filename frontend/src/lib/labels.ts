import type { ListingStatus, ListingType, NotificationType, ReportStatus, ReportTargetType, RequestStatus, SubsystemRole } from "@/types";

export const formatDate = (v: string) =>
  new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { dateStyle: "medium", timeZone: "Asia/Bangkok" }).format(new Date(v));

// แสดงป้ายภาษาไทย ถ้าเจอค่าที่ไม่รู้จักให้แสดงค่าดิบ
export const label = (map: Record<string, string>, key: string | null | undefined) => (key ? map[key] ?? key : "");

// แสดงบทบาทข้าง avatar ใน CsmjuAppShell — ค่าตรงกับ SubsystemRole ใน backend/src/auth/permissions.ts
export const ROLE_LABEL: Record<SubsystemRole, string> = {
  STUDENT: "นักศึกษา", ALUMNI: "ศิษย์เก่า", LECTURER: "อาจารย์", STAFF: "บุคลากร", ADMIN: "ผู้ดูแลระบบ",
};

export const LISTING_TYPE_LABEL: Record<ListingType, string> = { BORROW: "ให้ยืม", GIVEAWAY: "ให้ต่อ", WANTED: "ตามหา" };

/**
 * คำเรียกที่ต่างกันตามประเภทประกาศ — เก็บรวมที่เดียวแทนการกระจาย ternary ตามคอมโพเนนต์
 * WANTED กลับทิศจากอีกสองประเภท: เจ้าของประกาศคือคนที่อยากได้ คนกดคือคนที่มีของมาเสนอ
 * กลไกเบื้องหลังเหมือน GIVEAWAY ทุกอย่าง (ไม่มีวันนัดคืน ไม่มีวงจรคืน อนุมัติแล้วปิดถาวร)
 * ต่างกันแค่ถ้อยคำ — ดู backend/src/borrow-requests/borrow-requests.service.ts (hasReturnCycle)
 */
export const TYPE_COPY: Record<ListingType, {
  /** ปุ่มของคนที่ไม่ใช่เจ้าของ ในหน้ารายละเอียด */
  cta: string;
  /** คำอธิบายใต้ปุ่มนั้น — ว่าง = ไม่ต้องแสดง */
  ctaHint: string;
  /** ปุ่มตอบรับของเจ้าของ ในหน้าคำขอ */
  approve: string;
  /** ข้อความแทนช่องวันนัดคืน — ว่าง = ประเภทนี้ต้องระบุวันนัดคืน */
  noDueDateNote: string;
  /** ข้อความเมื่อรายการปิดถาวรแล้ว (สถานะ GIVEN_AWAY) */
  closedNote: string;
}> = {
  BORROW: {
    cta: "ขอยืม",
    ctaHint: "",
    approve: "อนุมัติ",
    noDueDateNote: "",
    closedNote: "ของชิ้นนี้ถูกส่งมอบให้ผู้อื่นไปแล้ว",
  },
  GIVEAWAY: {
    cta: "ขอรับ",
    ctaHint: "ของชิ้นนี้เป็นการ \u201cให้ต่อ\u201d เมื่อเจ้าของอนุมัติจะถือว่าส่งมอบแล้วและปิดรายการถาวร ไม่มีการคืน",
    approve: "อนุมัติและส่งมอบ",
    noDueDateNote: "รายการให้ต่อไม่มีวันนัดคืน — อนุมัติแล้วถือว่าส่งมอบและปิดรายการถาวร",
    closedNote: "ของชิ้นนี้ถูกส่งมอบให้ผู้อื่นไปแล้ว",
  },
  WANTED: {
    cta: "ฉันมีของชิ้นนี้",
    ctaHint: "ประกาศนี้เป็นการ \u201cตามหา\u201d — กดเพื่อเสนอของให้ผู้ประกาศ เมื่อเขารับข้อเสนอจะปิดประกาศถาวร ไม่มีการคืนผ่านระบบ",
    approve: "รับข้อเสนอ",
    noDueDateNote: "ประกาศตามหาไม่มีวันนัดคืน — รับข้อเสนอแล้วจะปิดประกาศถาวร",
    closedNote: "ผู้ประกาศได้รับของแล้ว ประกาศนี้ปิดแล้ว",
  },
};
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
  OTHER: "อื่นๆ",
};
export const CATEGORY_KEYS = Object.keys(CATEGORY_LABEL);
