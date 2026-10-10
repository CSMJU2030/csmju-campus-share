import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListingCategory, ListingStatus } from '@prisma/client';

/**
 * PATCH /v1/listings/:id — partial update ตาม api-conventions.md ข้อ 4
 * ("Send only fields you want to change") ทุกฟิลด์จึง optional
 *
 * เจ้าของแก้ได้เฉพาะข้อมูลที่ตัวเองกรอกตอนลงประกาศ + สลับเปิด/ปิด
 * `listingType` แก้ไม่ได้ — เปลี่ยนจาก "ให้ยืม" เป็น "ให้ต่อ" กลางคันจะทำให้
 * คำขอที่ค้างอยู่เปลี่ยนความหมาย (ให้ต่อไม่มีวงจรคืน) ถ้าจะเปลี่ยนให้ลงประกาศใหม่
 */
export class UpdateListingDto {
  @ApiPropertyOptional({ maxLength: 120, description: 'ชื่อสิ่งของ' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ maxLength: 1000, description: 'รายละเอียด — ส่งค่าว่างเพื่อลบคำอธิบายออก' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ListingCategory, enumName: 'ListingCategory' })
  @IsEnum(ListingCategory)
  @IsOptional()
  category?: ListingCategory;

  @ApiPropertyOptional({
    enum: ListingStatus,
    enumName: 'ListingStatus',
    description: 'เจ้าของตั้งได้เฉพาะ AVAILABLE กับ UNAVAILABLE ค่าที่เหลือระบบเปลี่ยนให้เอง',
  })
  @IsEnum(ListingStatus)
  @IsOptional()
  status?: ListingStatus;
}
