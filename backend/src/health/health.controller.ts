import { Controller, Get } from '@nestjs/common';

// GET /api/health → 200 { success: true, data: { status: "ok", service: "csmju-campusshare" } }
// ห้ามมีเวอร์ชัน (ไม่ใช่ /api/v1/health — อันนั้นเป็นของ Core Hub เท่านั้น)
// "service" ต้องตรงกับ name ใน subsystem.yaml เป๊ะ (aie-workflow.md ข้อ 3)
// public — ต้องประกาศใน subsystem.yaml -> public_endpoints ด้วย (แต่ยังไม่ต้อง auth guard จริงจนกว่าจะถึงขั้น 4)
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { data: { status: 'ok', service: 'csmju-campusshare' } };
  }
}