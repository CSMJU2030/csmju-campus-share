import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { notFound, validationError } from '../common/exceptions/app.exception';
import { CoreHubIdentity } from '../auth/core-hub-identity';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReportDto, user: CoreHubIdentity) {
    if (!dto.targetId) {
      throw validationError('targetId ไม่ถูกต้อง', ['targetId is required']);
    }

    // เช็คว่า target มีอยู่จริงก่อนรับรายงาน กัน report มั่ว/ผิด id
    if (dto.targetType === 'LISTING') {
      const listing = await this.prisma.listing.findUnique({ where: { id: dto.targetId } });
      if (!listing) throw notFound('ไม่พบรายการของที่ต้องการรายงาน');
    } else if (dto.targetType === 'BORROW_REQUEST') {
      const request = await this.prisma.borrowRequest.findUnique({ where: { id: dto.targetId } });
      if (!request) throw notFound('ไม่พบคำขอยืมที่ต้องการรายงาน');
    } else {
      throw validationError('targetType ไม่ถูกต้อง', ['targetType must be one of: LISTING, BORROW_REQUEST']);
    }

    const reporterCoreUserId = user.coreUserId;

    const report = await this.prisma.report.create({
      data: {
        targetType: dto.targetType,
        targetId: dto.targetId,
        reporterCoreUserId,
        reason: dto.reason ?? '',
      },
    });
    return { data: report };
  }
}