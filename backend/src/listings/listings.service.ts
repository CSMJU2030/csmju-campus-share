import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';
import { conflict, forbidden, notFound, validationError } from '../common/exceptions/app.exception';
import { CoreHubIdentity } from '../auth/core-hub-identity';

// สถานะที่เจ้าของสลับเองได้ (ทั้งต้นทางและปลายทาง)
const OWNER_TOGGLEABLE = ['AVAILABLE', 'UNAVAILABLE'] as const;

@Injectable()
export class ListingsService {
  /** code ของสาขาที่ระบบให้บริการ — มาจาก env ไม่ใช่ค่าตายในโค้ด (DD-04) */
  private readonly departmentCode: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.departmentCode = config.get<string>('subsystem.departmentCode', 'CS');
  }

  async findMany(query: QueryListingsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where = {
      departmentCode: this.departmentCode,
      ...(query.category && { category: query.category }),
      ...(query.listingType && { listingType: query.listingType }),
      ...(query.status && { status: query.status }),
      ...(query.q && { title: { contains: query.q, mode: 'insensitive' as const } }),
      // fail-safe: ไม่โชว์ listing ที่ archive ไปแล้วใน list ปกติ
      ...(!query.status && { status: { not: 'ARCHIVED' as const } }),
    };

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing || listing.departmentCode !== this.departmentCode) {
      throw notFound('ไม่พบรายการของนี้');
    }
    return { data: listing };
  }

  async create(dto: CreateListingDto, user: CoreHubIdentity) {
    const listing = await this.prisma.listing.create({
      data: {
        ownerCoreUserId: user.coreUserId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        listingType: dto.listingType,
        departmentCode: this.departmentCode,
      },
    });
    return { data: listing };
  }

  /**
   * PATCH /v1/listings/:id — partial update (api-conventions.md ข้อ 4)
   * เจ้าของแก้ชื่อ/รายละเอียด/หมวดหมู่ และสลับเปิด-ปิดได้ในคำขอเดียวกัน
   */
  async update(id: string, dto: UpdateListingDto, user: CoreHubIdentity) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing || listing.departmentCode !== this.departmentCode) {
      throw notFound('ไม่พบรายการของนี้');
    }
    if (listing.ownerCoreUserId !== user.coreUserId) {
      throw forbidden('เฉพาะเจ้าของรายการเท่านั้นที่แก้ไขได้');
    }

    const editsContent =
      dto.title !== undefined || dto.description !== undefined || dto.category !== undefined;
    if (!editsContent && dto.status === undefined) {
      throw validationError('ไม่ได้ระบุสิ่งที่ต้องการแก้', [
        'at least one of: title, description, category, status',
      ]);
    }

    // เจ้าของสลับได้แค่ AVAILABLE <-> UNAVAILABLE
    if (
      dto.status !== undefined &&
      !OWNER_TOGGLEABLE.includes(dto.status as (typeof OWNER_TOGGLEABLE)[number])
    ) {
      throw validationError(
        `เจ้าของตั้งสถานะได้แค่ ${OWNER_TOGGLEABLE.join(', ')} เท่านั้น สถานะอื่นระบบจัดการให้อัตโนมัติ`,
        [`status must be one of: ${OWNER_TOGGLEABLE.join(', ')}`],
      );
    }

    // ...และแก้อะไรก็ได้ก็ต่อเมื่อ "ตอนนี้" อยู่ในสองสถานะนั้นด้วย
    // กันเคสปลดล็อก/แก้ชื่อของที่กำลังถูกยืม มีคำขอค้าง หรือให้ต่อไปแล้ว
    // (คนยืมต้องเห็นชื่อเดิมตลอดช่วงที่ถือของอยู่)
    const updated = await this.prisma.listing.updateMany({
      where: { id, status: { in: [...OWNER_TOGGLEABLE] } },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        // ส่งค่าว่างมา = ลบคำอธิบายออก (คอลัมน์เป็น nullable)
        ...(dto.description !== undefined && { description: dto.description || null }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.status !== undefined && { status: dto.status }),
        lastActivityAt: new Date(),
      },
    });
    if (updated.count === 0) {
      throw conflict('สถานะปัจจุบันของรายการนี้แก้เองไม่ได้ ระบบจัดการให้ตามคำขอยืม', [
        `currentStatus=${listing.status}`,
      ]);
    }

    return { data: await this.prisma.listing.findUniqueOrThrow({ where: { id } }) };
  }

  // ===== เรียกจาก scheduled task (ดู src/tasks) =====

  /**
   * listing ที่เงียบนานเกิน N วัน -> auto-archive
   * ครอบคลุมทั้งของที่ว่างและของที่เจ้าของปิดไว้แล้วลืม (มติทีม 2026-09-30)
   * ไม่แตะ PENDING / BORROWED / GIVEN_AWAY / ARCHIVED เพราะ WHERE ระบุสองสถานะนี้เท่านั้น
   * tech-stack.md ข้อ 1.4.1(1): คำสั่งเดียวที่มีเงื่อนไขครบใน WHERE (idempotent)
   */
  async autoArchiveStale(staleDays: number) {
    const cutoff = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);
    const result = await this.prisma.listing.updateMany({
      where: { status: { in: ['AVAILABLE', 'UNAVAILABLE'] }, lastActivityAt: { lt: cutoff } },
      data: { status: 'ARCHIVED' },
    });
    return result.count;
  }
}
