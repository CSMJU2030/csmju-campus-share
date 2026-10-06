# สรุปการเปลี่ยนแปลง

## ลบไฟล์/โฟลเดอร์เหล่านี้ออกจากโปรเจกต์
- `src/services/` (ทั้งโฟลเดอร์) — แทนที่ด้วย `src/lib/api.ts`
- `src/mocks/` (ทั้งโฟลเดอร์)
- `src/lib/format.ts` — แทนที่ด้วย `src/lib/labels.ts`
- `src/app/listings/[id]/edit/` — backend ไม่มี endpoint แก้ไข listing

## ไฟล์ที่ไม่ต้องแก้ (คงเดิม)
`src/lib/ui.ts`, `src/app/layout.tsx`, `src/app/listings/[id]/page.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `globals.css`,
`components/shared/{ConfirmDialog,FormField}.tsx`

## ต้องทำเอง
1. วางค่า enum ListingCategory ใน `src/lib/labels.ts` (`CATEGORY_LABEL`) — ตอนนี้ว่างเพราะยังไม่ได้รับค่า
2. ตั้ง redirect URI ของ Core Hub ให้ชี้ origin ของ frontend (`http://localhost:3003/auth/callback`) เพราะ cookie ต้องถูกตั้งผ่าน proxy
