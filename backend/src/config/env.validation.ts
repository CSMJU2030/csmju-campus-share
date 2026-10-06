import { z } from 'zod';

// ล้มตอนบูตถ้า env ขาด/ผิด — ดีกว่าไปพังกลางทางตอน request จริง
// ชื่อทุกตัวตรงกับตารางใน standards/docs/deployment.md ข้อ 4.2 — server ส่งชื่อเหล่านี้มาให้
const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3002),

    DATABASE_URL: z.string().min(1),
    // deployment.md 4.1 — pg เปิด 10 เส้น/ระบบโดยดีฟอลต์ · 37 ระบบ = 370 เส้น เกินที่ PostgreSQL กลางรับได้
    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(5),

    // server ตั้งให้ตาม deployment.md 4.2 · โค้ดยังไม่ได้เรียก REST ของ Core Hub จึง optional
    CORE_HUB_URL: z.string().url().optional(),
    CORE_HUB_JWKS_URL: z.string().url(),
    CORE_HUB_WEB_URL: z.string().url(),
    CORE_HUB_ISSUER: z.string().min(1).default('core-hub'),
    CORE_HUB_AUDIENCE: z.string().min(1).default('csmju2030'),

    // ต้องตรงกับ name ใน subsystem.yaml เป๊ะ (api-conventions.md v1.1 ข้อ 8)
    SUBSYSTEM_ID: z.string().min(1),

    // code ของสาขาที่ระบบให้บริการ — รูปแบบตาม reference-data.md ข้อ 4
    DEPARTMENT_CODE: z
      .string()
      .regex(/^[A-Z0-9-]+$/, 'ต้องเป็นตัวพิมพ์ใหญ่ ตัวเลข หรือขีดกลางเท่านั้น')
      .default('CS'),

    // origin ที่เบราว์เซอร์เห็น (frontend) — ต้องตรงกับ base_url ใน subsystem.yaml
    // และตรงกับ callback_url ที่ลงทะเบียนกับ Core Hub
    PUBLIC_ORIGIN: z.string().url(),

    CORE_HUB_JWKS_CACHE_TTL_MS: z.coerce.number().int().positive().default(600_000),
    CORE_HUB_JWKS_MIN_REFRESH_INTERVAL_MS: z.coerce.number().int().positive().default(30_000),
    CORE_HUB_JWKS_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
    // auth-contract.md ข้อ 4: clock skew ต้องไม่เกิน 60 วินาที
    CORE_HUB_CLOCK_TOLERANCE_SEC: z.coerce.number().int().min(0).max(60).default(60),
    // tech-stack.md 1.4.1 — งานตั้งเวลาต้องอยู่เขตเวลาไทย
    TZ: z.string().min(1).default('Asia/Bangkok'),
  })
  .passthrough(); // ห้าม strip — PrismaService และ guard อ่าน process.env ตรง

export function validateEnv(raw: Record<string, unknown>) {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`ค่า environment ไม่ถูกต้องหรือไม่ครบ:\n${lines.join('\n')}`);
  }
  return parsed.data;
}
