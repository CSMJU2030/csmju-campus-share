import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ReportTargetType } from '@prisma/client';

export class CreateReportDto {
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType | undefined;

  @IsString()
  @IsNotEmpty()
  targetId: string | undefined;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string | undefined;
}