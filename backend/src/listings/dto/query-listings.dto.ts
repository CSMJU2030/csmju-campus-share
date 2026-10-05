import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ListingCategory, ListingStatus, ListingType } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

// รองรับ pagination ตาม api-conventions.md v1.1 ข้อ 5: ?page=1&limit=20 (สูงสุด 100)
// query param ทุกตัวต้อง camelCase (ข้อ 1)
export class QueryListingsDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ListingCategory)
  category?: ListingCategory;

  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @IsOptional()
  @IsString()
  q?: string; // ค้นหาจาก title
}
