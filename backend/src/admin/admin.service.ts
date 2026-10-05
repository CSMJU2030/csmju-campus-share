import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { conflict, notFound } from '../common/exceptions/app.exception';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { PaginationQueryDto, pageArgs, pageMeta } from '../common/dto/pagination-query.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ดูสถิติการใช้งาน (ตามสิทธิ์ Admin สาขาที่ระบุไว้ตอนออกแบบ role)
  async getStats() {
    const [
      listingsByStatus,
      requestsByStatus,
      openReportsCount,
      overdueCount,
      totalOwners,
    ] = await Promise.all([
      this.prisma.listing.groupBy({ by: ['status'], _count: true }),
      this.prisma.borrowRequest.groupBy({ by: ['status'], _count: true }),
      this.prisma.report.count({ where: { status: 'OPEN' } }),
      this.prisma.borrowRequest.count({ where: { status: 'OVERDUE' } }),
      this.prisma.listing.findMany({
        distinct: ['ownerCoreUserId'],
        select: { ownerCoreUserId: true },
      }),
    ]);

    return {
      data: {
        listingsByStatus: Object.fromEntries(
          listingsByStatus.map((row: { status: string; _count: number }) => [
            row.status,
            row._count,
          ]),
        ),
        requestsByStatus: Object.fromEntries(
          requestsByStatus.map((row: { status: string; _count: number }) => [
            row.status,
            row._count,
          ]),
        ),
        openReportsCount,
        overdueRequestsCount: overdueCount,
        activeListersCount: totalOwners.length,
      },
    };
  }

  // ตรวจสอบรายการที่มีปัญหา — เฉพาะที่ถูก flag เท่านั้น (ไม่ต้องไล่ดูทุกรายการ)
  async getOpenReports(query: PaginationQueryDto) {
    const { page, limit, skip, take } = pageArgs(query);
    const where = { status: 'OPEN' as const };

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'asc' }, // เก่าสุดก่อน กันเรื่องค้างนาน
        skip,
        take,
      }),
      this.prisma.report.count({ where }),
    ]);

    return { data: reports, meta: pageMeta(total, page, limit) };
  }

  async resolveReport(id: string, dto: ResolveReportDto, admin: CoreHubIdentity) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw notFound('ไม่พบรายงานนี้');
    if (report.status === 'RESOLVED') {
      throw conflict('รายงานนี้ถูกปิดไปแล้ว');
    }

    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedByCoreUserId: admin.coreUserId,
        resolvedAt: new Date(),
        ...(dto.note && { reason: `${report.reason}\n\n[ปิดโดย Admin]: ${dto.note}` }),
      },
    });
    return { data: updated };
  }

  // รายการที่ระบบ auto-flag ว่าเกินกำหนดคืน (จาก cron job) — ให้ Admin เห็นทันทีไม่ต้องไล่เช็คเอง
  async getOverdueRequests(query: PaginationQueryDto) {
    const { page, limit, skip, take } = pageArgs(query);
    const where = { status: 'OVERDUE' as const };

    const [requests, total] = await Promise.all([
      this.prisma.borrowRequest.findMany({
        where,
        include: { listing: true },
        orderBy: { dueDate: 'asc' }, // ค้างนานสุดก่อน
        skip,
        take,
      }),
      this.prisma.borrowRequest.count({ where }),
    ]);

    return { data: requests, meta: pageMeta(total, page, limit) };
  }
}