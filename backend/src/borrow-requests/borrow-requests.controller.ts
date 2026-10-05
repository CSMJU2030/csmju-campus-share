import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { BorrowRequestsService } from './borrow-requests.service';
import { CreateBorrowRequestDto } from './dto/create-borrow-request.dto';
import { UpdateBorrowRequestStatusDto } from './dto/update-borrow-request-status.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('v1/borrow-requests')
export class BorrowRequestsController {
  constructor(private readonly borrowRequestsService: BorrowRequestsService) {}

  @RequirePermissions(Permission.BORROW_REQUEST_CREATE)
  @Post()
  create(@Body() dto: CreateBorrowRequestDto, @CurrentUser() user: CoreHubIdentity) {
    return this.borrowRequestsService.create(dto, user);
  }

  @RequirePermissions(Permission.BORROW_REQUEST_READ_OWN)
  @Get('mine')
  findMine(@CurrentUser() user: CoreHubIdentity, @Query() query: PaginationQueryDto) {
    return this.borrowRequestsService.findMine(user, query);
  }

  @RequirePermissions(Permission.BORROW_REQUEST_UPDATE_OWN)
  @Patch(':id')
  updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateBorrowRequestStatusDto,
    @CurrentUser() user: CoreHubIdentity,
  ) {
    return this.borrowRequestsService.updateStatus(id, dto, user);
  }
}