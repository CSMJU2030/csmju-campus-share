import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ListingCategory, ListingStatus, ListingType } from '@prisma/client';

// รองรับ pagination ตาม api-conventions.md v1.1 ข้อ 5: ?page=1&limit=20 (สูงสุด 100)
// query param ทุกตัวต้อง camelCase (ข้อ 1)
export class QueryListingsDto {
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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}