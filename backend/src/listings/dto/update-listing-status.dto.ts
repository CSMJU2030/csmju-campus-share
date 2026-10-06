import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ListingStatus } from '@prisma/client';

// เจ้าของใช้ endpoint นี้ปิด/เปิด listing เอง (unavailable <-> available)
// ห้ามตั้งเป็น borrowed/pending เอง — สถานะนั้นระบบเปลี่ยนให้อัตโนมัติตาม borrow request เท่านั้น
export class UpdateListingStatusDto {
  @ApiProperty({
    enum: ListingStatus,
    enumName: 'ListingStatus',
    description: 'เจ้าของตั้งได้เฉพาะ AVAILABLE กับ UNAVAILABLE ค่าที่เหลือระบบเปลี่ยนให้เอง',
  })
  @IsEnum(ListingStatus)
  status!: ListingStatus;
}
