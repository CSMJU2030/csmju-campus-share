import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import { CoreHubIdentity } from './core-hub-identity';

// รูปแบบตาม contracts/openapi.yaml: { id, email, coreRole, subsystemRole, session.expiresAt? }
@Controller('v1/me')
export class MeController {
  @Get()
  getMe(@CurrentUser() user: CoreHubIdentity) {
    return {
      data: {
        id: user.id,
        email: user.email,
        coreRole: user.coreRole,
        subsystemRole: user.subsystemRole,
        // auth-contract.md ข้อ 7: frontend ใช้ค่านี้ต่ออายุล่วงหน้าก่อนโดน 401 กลางคัน
        ...(user.expiresAtUnix
          ? { session: { expiresAt: new Date(user.expiresAtUnix * 1000).toISOString() } }
          : {}),
      },
    };
  }
}
