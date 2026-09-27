import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface GatewayUser {
  coreUserId: string; // = sub ใน JWT ของ Core Hub — อ่านจาก X-User-Id ชั่วคราว (ดูคำเตือนด้านล่าง)
  layer1Role: 'student' | 'alumni' | 'staff' | 'admin'; // จาก X-Layer1-Role
  faculty: string; // จาก X-Faculty
}

declare module 'express' {
  interface Request {
    gatewayUser?: GatewayUser;
  }
}

/**
 * ⚠️ ไฟล์นี้ผิดสถาปัตยกรรมจริงของ CSMJU2030 (ยืนยันจาก overview.md + auth-contract.md ฉบับ standards):
 * "API Gateway ที่ตรวจ JWT แทนระบบย่อย ❌ ยังไม่มี — อย่าออกแบบโดยสมมติว่ามี"
 * การเชื่อ X-User-Id / X-Layer1-Role / X-Faculty ตรง ๆ แบบนี้คือช่องโหว่ — ใครก็ส่ง header ปลอมมาเองได้
 * (ไม่มี gateway คั่นกลางที่ verify แล้วจริง)
 *
 * ไฟล์นี้เก็บไว้ชั่วคราวเพื่อให้โค้ดส่วนอื่น compile ผ่านเท่านั้น
 * ขั้นถัดไป (ขั้น 4 ตาม aie-workflow.md) ต้องลบไฟล์นี้ทิ้ง แล้วคัดลอกชั้น auth จริง
 * (jwks.service.ts, core-hub-token.verifier.ts, guards/, decorators/) จาก demo-student-subsystem
 * ตรวจ JWT ด้วย jose + JWKS ตาม auth-contract.md ข้อ 4 ห้ามเขียน verify logic เอง
 */
@Injectable()
export class GatewayAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const coreUserId = req.header('X-User-Id');
    const layer1Role = req.header('X-Layer1-Role') as GatewayUser['layer1Role'] | undefined;
    const faculty = req.header('X-Faculty');

    if (coreUserId && layer1Role && faculty) {
      req.gatewayUser = { coreUserId, layer1Role, faculty };
    }

    next();
  }
}