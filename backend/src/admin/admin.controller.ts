import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AdminService } from './admin.service';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';

// ทุก endpoint ในนี้ต้องมีสิทธิ์ admin:access (Layer 2)
@RequirePermissions(Permission.ADMIN_ACCESS)
@Controller('v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('reports')
  getOpenReports(@Query() query: PaginationQueryDto) {
    return this.adminService.getOpenReports(query);
  }

  @Patch('reports/:id')
  resolveReport(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: ResolveReportDto,
    @CurrentUser() user: CoreHubIdentity,
  ) {
    return this.adminService.resolveReport(id, dto, user);
  }

  @Get('overdue-requests')
  getOverdueRequests(@Query() query: PaginationQueryDto) {
    return this.adminService.getOverdueRequests(query);
  }
}