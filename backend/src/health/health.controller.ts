import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { serviceUnavailable } from '../common/exceptions/app.exception';

// GET /api/health — api-conventions.md v1.1 ข้อ 8 (public, ไม่มีเวอร์ชัน)
// data.service ต้องตรงกับ name ใน subsystem.yaml เป๊ะ จึงอ่านจาก config ไม่ hardcode
@Controller('health')
export class HealthController {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get()
  async check() {
    // DB คือสิ่งที่ระบบพึ่งพา — ล่มชั่วคราวตอบ 503 + Retry-After (api-conventions.md ข้อ 4)
    // ไม่ใช่ 500 เพราะ 503 บอก client ว่า "ลองใหม่ได้" ส่วน 500 คือบั๊กที่ลองกี่ครั้งก็เหมือนเดิม
    if (!(await this.prisma.isReachable())) {
      throw serviceUnavailable('ฐานข้อมูลไม่พร้อมใช้งานชั่วคราว', 10);
    }
    return { data: { status: 'ok', service: this.config.get<string>('subsystem.name') } };
  }
}
