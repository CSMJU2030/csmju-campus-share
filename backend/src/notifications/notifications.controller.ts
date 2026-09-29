import { Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';

// resource: /api/v1/notifications — ต้อง login เสมอ (global guard บังคับ ไม่มี public endpoint)
@Controller('v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @RequirePermissions(Permission.NOTIFICATION_READ_OWN)
  @Get()
  async findMine(@CurrentUser() user: CoreHubIdentity) {
    return { data: await this.notificationsService.findForUser(user.coreUserId) };
  }

  @RequirePermissions(Permission.NOTIFICATION_UPDATE_OWN)
  @Patch(':id')
  async markRead(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: CoreHubIdentity,
  ) {
    await this.notificationsService.markRead(id, user.coreUserId);
    return { data: { id, isRead: true } };
  }
}
