import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ListingCategory, ListingType } from '@prisma/client';

// api-conventions.md v1.1 ข้อ 6: field ใน JSON เป็น camelCase
export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(ListingCategory)
  category!: ListingCategory;

  @IsEnum(ListingType)
  listingType!: ListingType;
}
