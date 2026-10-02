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
process.env.DATABASE_URL ||= 'postgresql://openapi:openapi@127.0.0.1:5432/openapi';
process.env.COREHUB_JWKS_URL ||= 'https://csmju2030.jowave.com/api/v1/.well-known/jwks.json';
process.env.COREHUB_WEB_URL ||= 'https://csmju2030.jowave.com';
process.env.SUBSYSTEM_NAME ||= 'csmju-campus-share';
process.env.PUBLIC_ORIGIN ||= 'http://localhost:3205';

/* eslint-disable import/first */
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'node:fs';
import { AppModule } from './app.module';

async function generate(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('CampusShare API')
    .setDescription('csmju-campus-share — ระบบยืมและส่งต่อสิ่งของ สาขาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้')
    .setVersion('0.1.0')
    .addServer('/api')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // ท้ายไฟล์ต้องมี newline — ไม่งั้น `git diff` ใน check-openapi-sync.sh เห็นต่างทุกครั้ง
  writeFileSync('./openapi.json', `${JSON.stringify(document, null, 2)}\n`);
  // eslint-disable-next-line no-console
  console.log('openapi.json generated');

  await app.close();
}

generate().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
