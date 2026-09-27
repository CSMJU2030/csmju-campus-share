import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBorrowRequestDto } from './dto/create-borrow-request.dto';
import { UpdateBorrowRequestStatusDto } from './dto/update-borrow-request-status.dto';
import { GatewayUser } from '../common/middleware/gateway-auth.middleware';
import { conflict, forbidden, notFound, validationError } from '../common/exceptions/app.exception';

// นโยบาย fail-safe (ดูหลักการที่ตกลงกันไว้ — ระบบต้องอยู่รอดได้แม้ไม่มี Admin เฝ้า)
const PENDING_EXPIRE_DAYS = 3; // เจ้าของไม่ตอบภายในกี่วัน -> auto-expire

@Injectable()
export class BorrowRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateBorrowRequestDto, user: GatewayUser) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listing_id },
    });
    if (!listing) throw notFound('ไม่พบรายการของนี้');

    if (listing.ownerCoreUserId === user.coreUserId) {
      throw forbidden('ไม่สามารถขอยืมของของตัวเองได้');
    }
    if (listing.status !== 'available') {
      // ของถูกยืมไปแล้ว/ไม่พร้อมให้ยืม ตรงกับเคสที่ออกแบบ error mapping ไว้ตั้งแต่แรก
      throw conflict('ของชิ้นนี้ไม่ว่างให้ยืมในตอนนี้', { listing_status: listing.status });
    }

    const [request] = await this.prisma.$transaction([
      this.prisma.borrowRequest.create({
        data: {
          listingId: listing.id,
          requesterCoreUserId: user.coreUserId,
          message: dto.message,
        },
      }),
      this.prisma.listing.update({
        where: { id: listing.id },
        data: { status: 'pending', lastActivityAt: new Date() },
      }),
    ]);

    await this.notifications.create({
      recipientCoreUserId: listing.ownerCoreUserId,
      type: 'new_request',
      title: `มีคนขอยืม "${listing.title}"`,
      body: dto.message,
      refListingId: listing.id,
      refRequestId: request.id,
    });

    return { data: request };
  }

  async findMine(user: GatewayUser) {
    // คำขอที่ "ฉันเป็นคนขอ" + คำขอที่ "ฉันเป็นเจ้าของของ" รวมกัน ให้ frontend แยก tab เอง
    const [asRequester, asOwner] = await Promise.all([
      this.prisma.borrowRequest.findMany({
        where: { requesterCoreUserId: user.coreUserId },
        include: { listing: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.borrowRequest.findMany({
        where: { listing: { ownerCoreUserId: user.coreUserId } },
        include: { listing: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { data: { as_requester: asRequester, as_owner: asOwner } };
  }

  async updateStatus(id: string, dto: UpdateBorrowRequestStatusDto, user: GatewayUser) {
    const request = await this.prisma.borrowRequest.findUnique({
      where: { id },
      include: { listing: true },
    });
    if (!request) throw notFound('ไม่พบคำขอยืมนี้');

    if (dto.status === 'approved' || dto.status === 'rejected') {
      return this.ownerRespond(request, dto, user);
    }
    if (dto.status === 'returned') {
      return this.markReturned(request, user);
    }
    // กัน DTO หลุดมาถึงนี่ (ปกติ class-validator IsIn กันไว้แล้วชั้นหนึ่ง)
    throw validationError('สถานะไม่ถูกต้อง',  ['status']);
  }

  private async ownerRespond(
    request: Awaited<ReturnType<PrismaService['borrowRequest']['findUniqueOrThrow']>> & {
      listing: { ownerCoreUserId: string; id: string; title: string };
    },
    dto: UpdateBorrowRequestStatusDto,
    user: GatewayUser,
  ) {
    if (request.listing.ownerCoreUserId !== user.coreUserId) {
      throw forbidden('เฉพาะเจ้าของของเท่านั้นที่อนุมัติ/ปฏิเสธคำขอได้');
    }
    if (request.status !== 'pending') {
      throw conflict('คำขอนี้ถูกตอบกลับไปแล้ว หรือหมดอายุแล้ว', {
        current_status: request.status,
      });
    }

    const isApproved = dto.status === 'approved';

    const [updatedRequest] = await this.prisma.$transaction([
      this.prisma.borrowRequest.update({
        where: { id: request.id },
        data: {
          status: dto.status,
          responseMessage: dto.response_message,
          respondedAt: new Date(),
          dueDate: isApproved && dto.due_date ? new Date(dto.due_date) : undefined,
        },
      }),
      this.prisma.listing.update({
        where: { id: request.listing.id },
        data: {
          status: isApproved ? 'borrowed' : 'available',
          lastActivityAt: new Date(),
        },
      }),
    ]);

    await this.notifications.create({
      recipientCoreUserId: request.requesterCoreUserId,
      type: isApproved ? 'request_approved' : 'request_rejected',
      title: isApproved
        ? `คำขอยืม "${request.listing.title}" ได้รับการอนุมัติ`
        : `คำขอยืม "${request.listing.title}" ถูกปฏิเสธ`,
      body: dto.response_message,
      refListingId: request.listing.id,
      refRequestId: request.id,
    });

    return { data: updatedRequest };
  }

  private async markReturned(
    request: Awaited<ReturnType<PrismaService['borrowRequest']['findUniqueOrThrow']>> & {
      listing: { ownerCoreUserId: string; id: string; title: string };
    },
    user: GatewayUser,
  ) {
    // ทั้งผู้ยืมและเจ้าของ confirm ว่าคืนแล้วได้ (กันเคสอีกฝ่ายลืม/ไม่ว่าง)
    const isParty =
      request.requesterCoreUserId === user.coreUserId ||
      request.listing.ownerCoreUserId === user.coreUserId;
    if (!isParty) {
      throw forbidden('ไม่ใช่คู่กรณีของคำขอยืมนี้');
    }
    if (request.status !== 'approved' && request.status !== 'overdue') {
      throw conflict('คำขอนี้ยังไม่อยู่ในสถานะที่คืนได้', {
        current_status: request.status,
      });
    }

    const [updatedRequest] = await this.prisma.$transaction([
      this.prisma.borrowRequest.update({
        where: { id: request.id },
        data: { status: 'returned', returnedAt: new Date() },
      }),
      this.prisma.listing.update({
        where: { id: request.listing.id },
        data: { status: 'available', lastActivityAt: new Date() },
      }),
    ]);

    return { data: updatedRequest };
  }

  // ===== เรียกจาก scheduled task (ดู src/tasks) — implement หลักการ fail-safe =====

  /** เจ้าของไม่ตอบภายใน PENDING_EXPIRE_DAYS วัน -> auto-expire คืนของกลับเป็น available */
  async autoExpireStalePending() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - PENDING_EXPIRE_DAYS);

    const stale = await this.prisma.borrowRequest.findMany({
      where: { status: 'pending', requestedAt: { lt: cutoff } },
      include: { listing: true },
    });

    for (const req of stale) {
      await this.prisma.$transaction([
        this.prisma.borrowRequest.update({
          where: { id: req.id },
          data: { status: 'expired' },
        }),
        this.prisma.listing.update({
          where: { id: req.listingId },
          data: { status: 'available' },
        }),
      ]);
      await this.notifications.create({
        recipientCoreUserId: req.requesterCoreUserId,
        type: 'request_rejected',
        title: `คำขอยืม "${req.listing.title}" หมดเวลารอ`,
        body: `เจ้าของไม่ตอบกลับภายใน ${PENDING_EXPIRE_DAYS} วัน ระบบยกเลิกคำขอให้อัตโนมัติ`,
        refRequestId: req.id,
        refListingId: req.listingId,
      });
    }
    return stale.length;
  }

  /** เกินกำหนดคืน -> auto-flag เป็น overdue ให้ Admin เห็นทันทีโดยไม่ต้องไล่เช็คเอง */
  async autoFlagOverdue() {
    const now = new Date();
    const overdue = await this.prisma.borrowRequest.findMany({
      where: { status: 'approved', dueDate: { lt: now } },
      include: { listing: true },
    });

    for (const req of overdue) {
      await this.prisma.borrowRequest.update({
        where: { id: req.id },
        data: { status: 'overdue' },
      });
      await this.notifications.create({
        recipientCoreUserId: req.requesterCoreUserId,
        type: 'overdue_flag',
        title: `เกินกำหนดคืน "${req.listing.title}" แล้ว`,
        refRequestId: req.id,
        refListingId: req.listingId,
      });
    }
    return overdue.length;
  }
}