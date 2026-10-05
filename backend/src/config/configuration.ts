export default () => ({
  coreHub: {
    jwksUrl: process.env.COREHUB_JWKS_URL ?? 'https://csmju2030.jowave.com/api/v1/.well-known/jwks.json',
    jwksCacheTtlMs: Number(process.env.COREHUB_JWKS_CACHE_TTL_MS ?? 600_000),
    jwksMinRefreshIntervalMs: Number(process.env.COREHUB_JWKS_MIN_REFRESH_INTERVAL_MS ?? 30_000),
    jwksRequestTimeoutMs: Number(process.env.COREHUB_JWKS_REQUEST_TIMEOUT_MS ?? 5_000),
    issuer: process.env.COREHUB_ISSUER ?? 'core-hub',
    audience: process.env.COREHUB_AUDIENCE ?? 'csmju2030',
    clockToleranceSec: Number(process.env.COREHUB_CLOCK_TOLERANCE_SEC ?? 60), // contract ข้อ 4: ≤60 วิ ไม่ใช่ 5
    webUrl: process.env.COREHUB_WEB_URL ?? 'https://csmju2030.jowave.com',
  },
  subsystem: {
    name: process.env.SUBSYSTEM_NAME ?? 'csmju-campus-share',
    // code ของสาขาที่ระบบนี้ให้บริการ (reference-data.md ข้อ 4: ^[A-Z0-9-]+$)
    // ห้ามเขียนค่าตายในโค้ด — DD-04 · ค่า CS มาจาก reference-data.md ข้อ 9
    departmentCode: process.env.DEPARTMENT_CODE ?? 'CS',
  },
  app: {
    // origin ที่เบราว์เซอร์เห็นจริง = frontend ที่ proxy /api, /auth, /health ไป backend
    // (ดู frontend/next.config.ts) — callback_url ที่ลงทะเบียนกับ Core Hub ต้องเป็น origin นี้
    // ห้ามอนุมานจาก req.get('host') เพราะ client ปลอม Host header ได้
    publicOrigin: process.env.PUBLIC_ORIGIN ?? 'http://localhost:3003',
  },
});