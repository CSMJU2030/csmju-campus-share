import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MaxLength, IsOptional } from 'class-validator';

export class ResolveReportDto {
  @ApiPropertyOptional({ maxLength: 300, description: 'บันทึกการปิดรายงาน ต่อท้าย reason เดิม' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  note?: string;
}
