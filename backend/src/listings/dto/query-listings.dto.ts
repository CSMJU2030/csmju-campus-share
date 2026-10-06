import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListingCategory, ListingStatus, ListingType } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

// รองรับ pagination ตาม api-conventions.md v1.1 ข้อ 5: ?page=1&limit=20 (สูงสุด 100)
// query param ทุกตัวต้อง camelCase (ข้อ 1)
export class QueryListingsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ListingCategory, enumName: 'ListingCategory' })
  @IsOptional()
  @IsEnum(ListingCategory)
  category?: ListingCategory;

  @ApiPropertyOptional({ enum: ListingType, enumName: 'ListingType' })
  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @ApiPropertyOptional({ enum: ListingStatus, enumName: 'ListingStatus' })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiPropertyOptional({ description: 'ค้นหาจากชื่อสิ่งของ' })
  @IsOptional()
  @IsString()
  q?: string;
}
