import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

// สถานะที่อนุญาตให้ "คน" เปลี่ยนเองผ่าน endpoint นี้
// OVERDUE / EXPIRED ระบบเปลี่ยนให้อัตโนมัติเท่านั้น
const MANUAL_STATUSES = ['APPROVED', 'REJECTED', 'RETURNED'] as const;

export class UpdateBorrowRequestStatusDto {
  @IsIn(MANUAL_STATUSES)
  status!: (typeof MANUAL_STATUSES)[number];

  @IsString()
  @IsOptional()
  @MaxLength(300)
  responseMessage?: string;

  // เจ้าของระบุตอนอนุมัติว่านัดคืนวันไหน — บังคับสำหรับ BORROW, ห้ามมีสำหรับ GIVEAWAY
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
