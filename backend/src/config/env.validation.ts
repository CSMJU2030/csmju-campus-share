import { z } from 'zod';

// ล้มตอนบูตถ้า env ขาด/ผิด — ดีกว่าไปพังกลางทางตอน request จริง
// ชื่อทุกตัวต้องตรงกับที่ configuration.ts อ่าน (COREHUB_* ไม่ใช่ CORE_HUB_*)
const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3002),

    DATABASE_URL: z.string().min(1),

    COREHUB_JWKS_URL: z.string().url(),
    COREHUB_WEB_URL: z.string().url(),
    COREHUB_ISSUER: z.string().min(1).default('core-hub'),
    COREHUB_AUDIENCE: z.string().min(1).default('csmju2030'),

    // ต้องตรงกับ name ใน subsystem.yaml เป๊ะ (api-conventions.md v1.1 ข้อ 8)
    SUBSYSTEM_NAME: z.string().min(1),

    // code ของสาขาที่ระบบให้บริการ — รูปแบบตาม reference-data.md ข้อ 4
    DEPARTMENT_CODE: z
      .string()
      .regex(/^[A-Z0-9-]+$/, 'ต้องเป็นตัวพิมพ์ใหญ่ ตัวเลข หรือขีดกลางเท่านั้น')
      .default('CS'),

    // origin ที่เบราว์เซอร์เห็น (frontend) — ต้องตรงกับ base_url ใน subsystem.yaml
    // และตรงกับ callback_url ที่ลงทะเบียนกับ Core Hub
    PUBLIC_ORIGIN: z.string().url(),

    COREHUB_JWKS_CACHE_TTL_MS: z.coerce.number().int().positive().default(600_000),
    COREHUB_JWKS_MIN_REFRESH_INTERVAL_MS: z.coerce.number().int().positive().default(30_000),
    COREHUB_JWKS_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
    // auth-contract.md ข้อ 4: clock skew ต้องไม่เกิน 60 วินาที
    COREHUB_CLOCK_TOLERANCE_SEC: z.coerce.number().int().min(0).max(60).default(60),
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
