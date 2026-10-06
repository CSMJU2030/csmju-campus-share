import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

// สถานะที่อนุญาตให้ "คน" เปลี่ยนเองผ่าน endpoint นี้
// OVERDUE / EXPIRED ระบบเปลี่ยนให้อัตโนมัติเท่านั้น
const MANUAL_STATUSES = ['APPROVED', 'REJECTED', 'RETURNED'] as const;

export class UpdateBorrowRequestStatusDto {
  @ApiProperty({ enum: MANUAL_STATUSES, description: 'สถานะที่คนเปลี่ยนเองได้ ส่วน OVERDUE/EXPIRED ระบบตั้งให้' })
  @IsIn(MANUAL_STATUSES)
  status!: (typeof MANUAL_STATUSES)[number];

  @ApiPropertyOptional({ maxLength: 300, description: 'ข้อความตอบกลับถึงผู้ขอ' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  responseMessage?: string;

  // เจ้าของระบุตอนอนุมัติว่านัดคืนวันไหน — บังคับสำหรับ BORROW, ห้ามมีสำหรับ GIVEAWAY
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'กำหนดคืน — บังคับเมื่ออนุมัติรายการให้ยืม และห้ามมีสำหรับรายการให้ต่อ',
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
