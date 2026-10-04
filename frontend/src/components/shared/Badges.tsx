// ป้ายสถานะ = ห่อ <StatusBadge> ของกลาง (ui-design-system.md ข้อ 17.0) แล้วแมปค่า enum ของระบบนี้เป็น tone + ข้อความไทย
// การแมปเป็นเรื่องเฉพาะของ CampusShare จึงอยู่ที่นี่ · สีและรูปทรงมาจากของกลางทั้งหมด ไม่เขียน class สีเองแล้ว
import { StatusBadge as CsmjuStatusBadge, type StatusTone } from "@/csmju";
import { LISTING_STATUS_LABEL, LISTING_TYPE_LABEL, REQUEST_STATUS_LABEL, label } from "@/lib/labels";

const LISTING_TONE: Record<string, StatusTone> = {
  AVAILABLE: "success", PENDING: "warning", BORROWED: "info",
  GIVEN_AWAY: "info", UNAVAILABLE: "neutral", ARCHIVED: "neutral",
};
const REQUEST_TONE: Record<string, StatusTone> = {
  PENDING: "warning", APPROVED: "success", REJECTED: "neutral",
  RETURNED: "info", EXPIRED: "neutral", OVERDUE: "error",
};

export const StatusBadge = ({ status }: { status: string }) => (
  <CsmjuStatusBadge tone={LISTING_TONE[status] ?? "neutral"} label={label(LISTING_STATUS_LABEL, status)} />
);
export const RequestStatusBadge = ({ status }: { status: string }) => (
  <CsmjuStatusBadge tone={REQUEST_TONE[status] ?? "neutral"} label={label(REQUEST_STATUS_LABEL, status)} />
);

// ประเภทการให้ (ยืม/ให้ต่อ) ไม่ใช่ "สถานะ" จึงไม่ใช้ StatusBadge ของกลาง — ใช้ token สีตรงๆ
export function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-full bg-primary-container/10 px-2.5 py-1 text-label-sm text-primary-container">
      {label(LISTING_TYPE_LABEL, type)}
    </span>
  );
}
