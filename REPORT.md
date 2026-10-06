# REPORT — csmju-campus-share

ระบบยืมและส่งต่อสิ่งของ สาขาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้
AIE: kongkiat · อัปเดต 2 ต.ค. 2569 · standards 1.7.0

## ผลรัน

```
run-all-checks.sh (ชุดตรวจ v1.7.0)
  16 / 19 ผ่าน

  ❌ check-branch-name.sh        รันบน branch main — CI ตรวจ branch ของ PR
  ❌ check-no-secrets.sh         อ่าน backend/.env จากดิสก์ · ไฟล์อยู่ใน .gitignore และไม่เคยถูก commit
  ❌ check-submodule-pointer.sh  .standards-version ในเครื่องยัง 1.0.0 — upstream/main เป็น 1.7.0 แล้ว รอ merge ลงมา
  ⚠️ check-openapi-sync.sh       ข้ามตอนรันในเครื่อง (ไม่มี pnpm ใน shell ที่ใช้ตรวจ) — รันจริงใน CI
  ⚠️ check-qa.sh QA-01..04       ข้ามตอนรันในเครื่องด้วยเหตุผลเดียวกัน
```

```
conformance
  ยังไม่ได้รัน — รอบัญชีทดสอบร่วมจากผู้ดูแล dev server
  (conformance.md 1.7.0: role ที่ไม่มีบัญชี -> SKIP · มี SKIP = NOT CONFORMANT)
```

```
unit test   34 / 34 ผ่าน  (pnpm -C backend test)
build       ผ่านทั้ง backend (nest build) และ frontend (next build)
```

## ไฟล์ที่สร้าง/แก้ไข

| path | ทำอะไร |
|---|---|
| `backend/src/auth/auth.service.ts` | `buildAuthorizeUrl` ไป `{CORE_HUB_WEB_URL}/sso/authorize?subsystem=&state=` · `buildLogoutUrl` ไป `/logout` ตาม auth-contract 1.2 ข้อ 5 |
| `backend/src/auth/auth.controller.ts` | เทียบ `state` ด้วย `timingSafeEqual` · state ไม่ตรง -> 401 ไม่ redirect ซ้ำ (ข้อ 5.1) · เบราว์เซอร์ได้หน้า "เข้าสู่ระบบอีกครั้ง" |
| `backend/src/auth/core-hub-token.verifier.ts` | เพิ่มขั้น 9 (`exp − iat ≤ 900+60`) และขั้น 10 (`azp`) ครบ 10 ขั้นตามข้อ 4 |
| `backend/src/auth/auth.errors.ts` | reason `token_lifetime_exceeded` · `invalid_azp` ตาม log-events.json 1.1 |
| `backend/src/auth/auth-events.logger.ts` | ส่ง `kid: null` เสมอเมื่อยังไม่รู้ kid — log-events.json กำหนด field ครบ 3 ตัว |
| `backend/src/auth/core-hub-identity.ts` | เพิ่ม `azp` ใน payload · เพิ่ม `LECTURER` ใน `SubsystemRole` และ `ROLE_MAP` |
| `backend/src/config/configuration.ts` · `jwks.service.ts` | default ชี้ `https://csmju2030.jowave.com` แทน `localhost` |
| `backend/src/prisma/prisma.service.ts` | ข้ามการตรวจ DB เมื่อ `OPENAPI_GENERATE=1` เพื่อให้ `generate:openapi` รันใน CI ที่ไม่มีฐานข้อมูลได้ |
| `backend/src/generate-openapi.ts` | เขียนใหม่ — ตั้ง env หลอกก่อน import AppModule เพื่อให้รันได้โดยไม่มี DB/`.env` |
| `backend/package.json` | เปลี่ยนชื่อ script เป็น `generate:openapi` (ชื่อที่ `check-openapi-sync.sh` มองหา) |
| `backend/prisma/schema.prisma` + migration | enum เป็น UPPER_SNAKE_CASE ตาม data-dictionary ข้อ 9.1 · คืน `GIVEN_AWAY` · เพิ่มหมวด `OTHER` |
| `backend/src/borrow-requests/borrow-requests.service.ts` | แยกสาย giveaway ออกจาก borrow · เปลี่ยนสถานะแบบ race-safe · cron เป็น CTE ตัวเดียว |
| `frontend/src/csmju/` | ของกลางจาก `csmju-core-hub` (ui.ts · icons.tsx) + README บันทึก sha256 และ commit ต้นทาง |
| `frontend/src/app/globals.css` | ของกลาง — ตรงกับต้นทางทุกไบต์ (`cmp` ผ่าน) |
| `frontend/src/app/local-overrides.css` · `frontend/src/lib/ui.ts` | override เฉพาะที่ ui-design-system สั่งให้แก้แต่ต้นทางยังไม่แก้ (ดูหัวข้อ "ยังทำไม่ได้") |
| `subsystem.yaml` | พอร์ต 3205/4205 · Core Hub ตัวจริง · `local_components` · `design_system` |
| `backend/.env.example` · `docker-compose.yml` · `frontend/next.config.ts` · `frontend/package.json` | พอร์ต frontend 3205 / backend 4205 ตามที่ผู้ดูแล dev server กำหนด |

## ชั้น auth ที่คัดลอกมา

- **ไม่ได้คัดลอกจาก `demo-student-subsystem`** — เขียนเองตั้งแต่ต้นจาก `auth-contract.md` โดยตรง
  ตั้งแต่ก่อนมี reference implementation ให้ใช้
- ตรวจเทียบกับ demo แล้วในจุดที่ต่างกัน: demo ไม่ตรวจ `state` เลย ส่วนเราตรวจ
  (ทำได้เพราะ Core Hub ตัวจริง echo `state` ตามข้อ 5 บรรทัด 181)
- `common/filters/http-exception.filter.ts` เป็นของเราเอง ตรวจแล้วไม่ log URL ที่มี query
  (ไม่ติดปัญหาที่ CHANGELOG 1.7.0 เตือนเรื่องไฟล์ของ demo ก่อน 1 ต.ค.)

## Role mapping ที่ประกาศ

| core role | subsystem role | ทำอะไรได้ |
|---|---|---|
| `student` | `STUDENT` | ลงของ · ขอยืม · ตอบคำขอของตัวเอง · รายงานปัญหา |
| `alumni` | `ALUMNI` | ดูอย่างเดียว + ดูคำขอของตัวเองที่ค้างอยู่ |
| `lecturer` | `LECTURER` | เท่า `STUDENT` — ไม่มี `admin:access` |
| `staff` | `ADMIN` | เท่า `STUDENT` + หน้าผู้ดูแล |
| `admin` | `ADMIN` | ทุก permission |
| `guest` | — | ไม่รับ (403) — ไม่ติ๊กในทะเบียน |

ตรงกับ `backend/src/auth/core-hub-identity.ts` (`ROLE_MAP`) และ `permissions.ts`

## ข้อสมมติที่ตั้งเอง

1. **`alumni` ได้สิทธิ์ดูอย่างเดียว ไม่ตัดออกทั้งหมด** — Core Hub เปลี่ยน role เป็น `alumni`
   เมื่อนักศึกษาจบการศึกษา ถ้าตัดสิทธิ์ทั้งหมด คนที่ยืมของค้างอยู่ตอนจบจะเข้ามาดูเรื่องของตัวเองไม่ได้
   และคำขอจะค้างสถานะ `OVERDUE` โดยไม่มีวันปิด
2. **`staff → ADMIN`** — ระบบนี้ตั้งใจให้ใช้ในสาขาเท่านั้น แต่ `staff` ของ Core Hub คือบุคลากร
   ทั้งมหาวิทยาลัย และระบบยังไม่มีการตรวจสังกัด (`department` ยังไม่มีใน Core Hub v1.0 ·
   data-dictionary ข้อ 1.3) จึงรับความเสี่ยงนี้ไว้ก่อน · กลไกสิทธิ์พิเศษรายบุคคลที่ควรใช้แทน
   ยังไม่มีผล (subsystem-registry: Core Hub ยังไม่ใส่ role ของสิทธิ์พิเศษลงใน token)
3. **`prisma/` อยู่ใน `backend/`** ตาม `repo-structure.md` ข้อ 2 — `ci-compliance-spec.md` ข้อ 8.2
   วาดไว้ที่ราก ทั้งสองฉบับออกมากับ 1.7.0 เหมือนกัน เลือกตามฉบับที่ว่าด้วยโครงสร้างโดยตรง
   และไม่มี check ตัวใดบังคับตำแหน่ง
4. **ไม่ติดตั้ง `@csmju2030/design-system`** — `ui-design-system.md` (ยัง 1.3.0 ใน standards 1.7.0)
   ระบุว่า package "ยังไม่ได้เผยแพร่" และ package ที่ publish ไว้ขัดกับ `auth-contract` 1.2 สี่จุด
   (ดู `claude/design-system-package-vs-standards-2026-10-01.md`)

## สิ่งที่ยังทำไม่ได้ / เคสที่ยังไม่ผ่าน

1. **SSO login ยังไม่เคยเดินจบ** — รอ admin ระบบกลางอนุมัติและเปิดใช้งานคำขอลงทะเบียน
2. **conformance ยังไม่ได้รัน** — รอบัญชีทดสอบร่วม role `student` (allowed) และ `alumni` (denied)
   จากผู้ดูแล dev server · ขาดบัญชีใดบัญชีหนึ่ง = SKIP = ไม่ผ่านตามกฎ 1.7.0
3. **Postman collection 47 requests ยังไม่ได้รัน** — ต้องมี token จริงก่อน
4. **`CsmjuAppShell` (ui-design-system ข้อ 5.1 sidebar 256px)** — ยังใช้ `AppFrame` ของเราเอง
   เพราะ template `csmju-subsystem-web` ที่ข้อ 17.0 อ้างถึงไม่มีอยู่ใน repo `csmju-core-hub`
   และ `connect-core-hub.md` สั่งไม่ให้โคลน repo นั้น — ขอให้ PM1 ชี้ขาด
5. **UI-REQ-01/02 ยัง override ไว้ในระบบเรา** — `--font-display` ขาด `var(--font-noto-thai)`
   (ข้อ 4.1 บรรทัด 413–414 สั่งให้แก้ไว้เอง) และ `ui.ts` ขาด `focus-visible` / `disabled` / `min-h-11`
   (ข้อ 7.2 · 12.1(5) · 6.1) — ขอให้แก้ที่ต้นทางแล้วเราจะลบ override ทิ้ง
6. **ยังไม่ได้ทดสอบ UI ด้วยสายตา** หลังเปลี่ยน `globals.css` เป็นของกลาง (22 → 320 บรรทัด)
