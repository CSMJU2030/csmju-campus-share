// ชั้น extension บนของกลาง — ห้ามเขียน class ปุ่ม/input เองในหน้า ให้ import จากที่นี่
//
// ฐานทั้งหมดมาจาก @/csmju (คัดลอกมาจาก csmju-core-hub · ห้ามแก้ · ui-design-system.md §17.0)
// ไฟล์นี้เพิ่มเฉพาะสิ่งที่เอกสารระบุเองว่า "ยังไม่มีใน ui.ts ต้องเพิ่ม":
//   1. focus-visible ring 2px + offset 2px       — §7.2 "สถานะที่ต้องมีครบทุกปุ่ม" + §12.1 (5)
//   2. disabled:opacity-40 + cursor-not-allowed  — §7.2 (ของกลางมีเฉพาะใน dangerButtonClass)
//   3. min-h-11 (44px)                            — §6.1 touch target + หมายเหตุใน §7.2
// เมื่อของกลางเพิ่มครบแล้ว (คำขอ §17.4 -> UI-REQ-02) ให้ลบส่วนเพิ่มออก เหลือ `export * from "@/csmju";`
export * from "@/csmju";

import {
  primaryButtonClass as basePrimaryButtonClass,
  secondaryButtonClass as baseSecondaryButtonClass,
  dangerButtonClass as baseDangerButtonClass,
  inputClass as baseInputClass,
} from "@/csmju";

/** §7.2 + §12.1(5) — วงแหวน focus ที่มองเห็นได้ */
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container";

/** §7.2 — สถานะ disabled ที่ต้องมีครบทุกปุ่ม */
const disabledState = "disabled:cursor-not-allowed disabled:opacity-40";

/** §6.1 — พื้นที่กดขั้นต่ำ 44x44px (ของกลางสูง ~37px) */
const touchTarget = "min-h-11";

/** จัดกึ่งกลาง + ช่องไฟไอคอน 8px ตาม "ร่วมกันทุกปุ่มข้อความ" ใน §7.2
 *  (primaryButtonClass ของกลางมีอยู่แล้ว ส่วน secondary/danger ยังไม่มี) */
const buttonBox = "inline-flex shrink-0 items-center justify-center gap-2";

export const primaryButtonClass = `${basePrimaryButtonClass} ${touchTarget} ${focusRing} ${disabledState}`;
export const secondaryButtonClass = `${baseSecondaryButtonClass} ${buttonBox} ${touchTarget} ${focusRing} ${disabledState}`;
export const dangerButtonClass = `${baseDangerButtonClass} ${buttonBox} ${touchTarget} ${focusRing}`;

/** §7.2.1 — วงแหวน focus และสถานะ error ของ input มาจาก `.input-field` / `.input-error` ใน globals.css แล้ว
 *  ที่เพิ่มคือ hook ให้ aria-invalid ผูกกับสีขอบ error ได้โดยไม่ต้องสลับ class เอง */
export const inputClass = `${baseInputClass} aria-[invalid=true]:border-error`;
