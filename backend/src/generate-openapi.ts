/**
 * สร้าง backend/openapi.json จากโค้ดจริง (decorator ใน controller/dto)
 *
 * รัน: pnpm run generate:openapi   (ชื่อนี้เป๊ะ — scripts/check-openapi-sync.sh ของ standards มองหา
 * `.scripts["generate:openapi"]` ถ้าไม่เจอจะข้ามการตรวจ API-01 ไปเฉย ๆ)
 *
 * ci-compliance-spec.md ข้อ 8.2: openapi.json "ต้อง commit และ sync กับโค้ด"
 * ห้ามแก้ไฟล์นี้ด้วยมือ — generate จากโค้ดเท่านั้น ไม่งั้น contract เพี้ยนจากของจริง
 *
 * ต้องรันได้โดยไม่มีฐานข้อมูลและไม่มี .env เพราะ CI รันคำสั่งนี้ในเครื่องเปล่า
 * จึงเติมค่า env หลอกให้ครบก่อน import AppModule (ค่าเหล่านี้ไม่ถูกใช้ยิงไปไหนทั้งสิ้น)
 */
process.env.OPENAPI_GENERATE = '1';
// ไม่มีชื่อผู้ใช้และรหัสผ่านในสตริงนี้โดยตั้งใจ — SEC-01 จับ connection string ที่มีข้อมูลยืนยันตัวตนอยู่ด้วย
// และค่านี้ไม่ได้ถูกใช้ต่อสายจริง (OPENAPI_GENERATE=1 ข้ามการตรวจ DB ใน PrismaService)
process.env.DATABASE_URL ||= 'postgresql://127.0.0.1:5432/openapi';
process.env.COREHUB_JWKS_URL ||= 'https://csmju2030.jowave.com/api/v1/.well-known/jwks.json';
process.env.COREHUB_WEB_URL ||= 'https://csmju2030.jowave.com';
process.env.SUBSYSTEM_NAME ||= 'csmju-campus-share';
process.env.PUBLIC_ORIGIN ||= 'http://localhost:3205';

// import อยู่หลังการตั้ง process.env ข้างบนโดยตั้งใจ — AppModule อ่าน env ตอนถูก import
// จึงต้องตั้งค่าให้ครบก่อน (ESLint ของเราไม่ได้เปิดกฎ import/first จึงไม่ต้องปิดกฎใด)
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { writeFileSync } from 'node:fs';
import { AppModule } from './app.module';

/**
 * @nestjs/swagger 7.4 ยังไม่มี addGlobalResponse จึงเติมหลัง createDocument
 * api-conventions.md ข้อ 4: ทุก endpoint ตอบ error ด้วย envelope เดียวกัน
 * และ ข้อ 7.6: public ได้เฉพาะ 4 path ที่ประกาศใน subsystem.yaml
 */
const PUBLIC_OPERATIONS = ['/health', '/auth/login', '/auth/callback', '/auth/logout'];

const ERROR_ENVELOPE = {
  type: 'object',
  required: ['success', 'error'],
  properties: {
    success: { type: 'boolean', enum: [false] },
    error: {
      type: 'object',
      required: ['code', 'message'],
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: { type: 'array', items: { type: 'string' } },
      },
    },
  },
} as const;

const COMMON_ERRORS: Record<string, string> = {
  '400': 'คำขอไม่ถูกต้องหรือข้อมูลไม่ผ่านการตรวจ (BAD_REQUEST / VALIDATION_ERROR)',
  '401': 'ไม่มี token หรือ token ใช้ไม่ได้ (UNAUTHORIZED)',
  '403': 'ไม่มีสิทธิ์ทำรายการนี้ (FORBIDDEN)',
  '404': 'ไม่พบข้อมูล (NOT_FOUND)',
  '409': 'ขัดกับสถานะปัจจุบัน (CONFLICT)',
  '500': 'ข้อผิดพลาดฝั่งเซิร์ฟเวอร์ (INTERNAL_ERROR)',
  '503': 'ระบบที่พึ่งพาไม่พร้อมใช้งาน (SERVICE_UNAVAILABLE)',
};

function describeErrors(document: OpenAPIObject): void {
  for (const [path, item] of Object.entries(document.paths)) {
    const isPublic = PUBLIC_OPERATIONS.some((p) => path === p || path.endsWith(p));
    // PathItemObject ไม่มี index signature จึงต้องมองเป็น record ตอนวนอ่าน operation
    for (const operation of Object.values(item as Record<string, unknown>)) {
      const op = operation as {
        responses?: Record<string, unknown>;
        security?: unknown[];
      };
      if (!op || typeof op !== 'object') continue;

      op.responses = op.responses ?? {};
      for (const [status, description] of Object.entries(COMMON_ERRORS)) {
        if (status === '401' && isPublic) continue;
        if (status === '403' && isPublic) continue;
        if (op.responses[status]) continue;
        op.responses[status] = {
          description,
          content: { 'application/json': { schema: ERROR_ENVELOPE } },
        };
      }

      // 4 path นี้เปิดให้ผู้ที่ยังไม่ login ได้ตาม subsystem.yaml
      if (isPublic) op.security = [];
    }
  }
}

async function generate(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('CampusShare API')
    .setDescription('csmju-campus-share — ระบบยืมและส่งต่อสิ่งของ สาขาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้')
    .setVersion('0.1.0')
    .addServer('/api')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    // ทุก endpoint ต้องมี token ยกเว้นที่ประกาศไว้ใน PUBLIC_OPERATIONS ด้านล่าง
    .addSecurityRequirements('bearer')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  describeErrors(document);

  // ท้ายไฟล์ต้องมี newline — ไม่งั้น `git diff` ใน check-openapi-sync.sh เห็นต่างทุกครั้ง
  writeFileSync('./openapi.json', `${JSON.stringify(document, null, 2)}\n`);
  console.log('openapi.json generated');

  await app.close();
}

generate().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
