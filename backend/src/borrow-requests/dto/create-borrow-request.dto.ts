import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateBorrowRequestDto {
  // api-conventions.md v1.1 ข้อ 1: ทุก id ต้องเป็น UUID v4 · ค่าที่ไม่ใช่ -> 400
  @ApiProperty({ format: 'uuid', description: 'id ของประกาศที่ต้องการขอยืม' })
  @IsUUID('4')
  listingId!: string;

  @ApiPropertyOptional({ maxLength: 300, description: 'ข้อความถึงเจ้าของ' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  message?: string;
}
