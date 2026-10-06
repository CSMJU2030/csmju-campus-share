import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReportTargetType } from '@prisma/client';

export class CreateReportDto {
  @ApiProperty({ enum: ReportTargetType, enumName: 'ReportTargetType' })
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType | undefined;

  @ApiProperty({ format: 'uuid', description: 'id ของประกาศหรือคำขอที่ถูกรายงาน' })
  @IsString()
  @IsNotEmpty()
  targetId: string | undefined;

  @ApiProperty({ maxLength: 500, description: 'เหตุผลที่รายงาน' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string | undefined;
}