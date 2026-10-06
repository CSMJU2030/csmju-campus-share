import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingStatusDto } from './dto/update-listing-status.dto';
import { QueryListingsDto } from './dto/query-listings.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';

// resource: /api/v1/listings
// api-conventions.md v1.1 ข้อ 1 + 7.6 + checklist: ห้ามมี route ใต้ /api/v1/ ที่เป็น public
// -> ไม่มี @Public() ในไฟล์นี้ (ตัดสินใจข้อ 1 ทางเลือก ก) · JWT + permission มาจาก global guard
@Controller('v1/listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @RequirePermissions(Permission.LISTING_READ)
  @Get()
  findAll(@Query() query: QueryListingsDto) {
    return this.listingsService.findMany(query);
  }

  @RequirePermissions(Permission.LISTING_READ)
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.listingsService.findOne(id);
  }

  @RequirePermissions(Permission.LISTING_CREATE)
  @Post()
  create(@Body() dto: CreateListingDto, @CurrentUser() user: CoreHubIdentity) {
    return this.listingsService.create(dto, user);
  }

  // เจ้าของเปิด/ปิดรายการเอง (ตรวจความเป็นเจ้าของใน service)
  @RequirePermissions(Permission.LISTING_UPDATE_OWN)
  @Patch(':id')
  updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateListingStatusDto,
    @CurrentUser() user: CoreHubIdentity,
  ) {
    return this.listingsService.updateStatus(id, dto, user);
  }
}
