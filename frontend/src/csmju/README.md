# csmju/ — ของกลางจาก design system (ห้ามแก้)

ที่มา: `csmju-core-hub` @ `88a600f`

| ไฟล์ปลายทาง | คัดลอกมาจาก | sha256 (16 ตัวแรก) |
|---|---|---|
| `ui.ts`    | `frontend/app/backoffice/_components/ui.ts` | `7542f1fea4ce707b` |
| `icons.tsx`| `frontend/app/components/icons.tsx`         | `a081d9ab028f5ea9` |

> `frontend/src/app/globals.css` ก็มาจาก `csmju-core-hub/frontend/app/globals.css` และอยู่ใต้กฎเดียวกัน

## กฎ (ui-design-system.md §17.0)

- ❌ **ห้ามแก้ไฟล์ในโฟลเดอร์นี้และ `app/globals.css`** — เท่ากับ fork design system
  ต้องการเปลี่ยน → แก้ที่ `csmju-core-hub` แล้วแจกจ่ายใหม่ (ขอผ่าน PM ตาม §17.4)
- ส่วนที่ระบบเราต้องเพิ่มเอง อยู่ใน `src/lib/ui.ts` (ชั้น extension) และ `src/app/local-overrides.css` เท่านั้น
- component ที่ยังไม่มีในของกลาง → ประกอบเองใน `src/components/` และประกาศใน `subsystem.yaml` → `local_components`

## อัปเดตของกลาง (ห้าม merge ทีละบรรทัด — ทับทั้งไฟล์)

```bash
git -C ../csmju-core-hub pull
cp ../csmju-core-hub/frontend/app/backoffice/_components/ui.ts frontend/src/csmju/ui.ts
cp ../csmju-core-hub/frontend/app/components/icons.tsx         frontend/src/csmju/icons.tsx
cp ../csmju-core-hub/frontend/app/globals.css                  frontend/src/app/globals.css
```

## ยังขาดเทียบกับ §17.0 (รอ template `csmju-subsystem-web` — U3)

`CsmjuAppShell` · `CsmjuLogo` · `PageHeader` · `Modal` · `ConfirmDeleteModal` · `Tabs` · `StatusBadge` · `public/csmju-logo.png`
ของพวกนี้ยังไม่มีใน `csmju-core-hub/frontend` ในรูปที่คัดลอกมาตรงๆ ได้ — ตอนนี้ระบบเราใช้ local component แทนไปก่อน
