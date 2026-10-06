import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingCategory, ListingType } from '@prisma/client';

// api-conventions.md v1.1 ข้อ 6: field ใน JSON เป็น camelCase
export class CreateListingDto {
  @ApiProperty({ maxLength: 120, description: 'ชื่อสิ่งของที่ลงประกาศ' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({ maxLength: 1000, description: 'รายละเอียดเพิ่มเติม' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ enum: ListingCategory, enumName: 'ListingCategory' })
  @IsEnum(ListingCategory)
  category!: ListingCategory;

  @ApiProperty({ enum: ListingType, enumName: 'ListingType' })
  @IsEnum(ListingType)
  listingType!: ListingType;
}
