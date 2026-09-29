import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBorrowRequestDto } from './dto/create-borrow-request.dto';
import { UpdateBorrowRequestStatusDto } from './dto/update-borrow-request-status.dto';
import { conflict, forbidden, notFound, validationError } from '../common/exceptions/app.exception';
import { CoreHubIdentity } from '../auth/core-hub-identity';

// นโยบาย fail-safe — ระบบต้องอยู่รอดได้แม้ไม่มี Admin เฝ้า
const PENDING_EXPIRE_DAYS = 3;
const CURRENT_DEPARTMENT = 'computer-science';

/** แถวที่ได้จาก UPDATE ... RETURNING ของงานตั้งเวลา */
interface AffectedRequestRow {
  id: string;
  listing_id: string;
  requester_core_user_id: string;
  title: string;
}

@Injectable()
export class BorrowRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateBorrowRequestDto, user: CoreHubIdentity) {
    const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
    if (!listing || listing.department !== CURRENT_DEPARTMENT) throw notFound('ไม่พบรายการของนี้');

    const requesterCoreUserId = user.coreUserId;
    if (listing.ownerCoreUserId === requesterCoreUserId) {
      throw forbidden('ไม่สามารถขอยืมของของตัวเองได้');
    }
    if (listing.status !== 'AVAILABLE') {
      throw conflict('ของชิ้นนี้ไม่ว่างให้ยืมในตอนนี้', { listingStatus: listing.status });
    }

    // จอง listing ก่อนสร้างคำขอ ภายใน transaction เดียว — สองคนกดพร้อมกันจะมีคนเดียวที่ผ่าน
    const request = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.listing.updateMany({
        where: { id: listing.id, status: 'AVAILABLE' },
        data: { status: 'PENDING', lastActivityAt: new Date() },
      });
      if (claimed.count === 0) {
        throw conflict('ของชิ้นนี้เพิ่งถูกคนอื่นขอไปก่อนหน้าคุณ', { listingStatus: 'PENDING' });
      }
      return tx.borrowRequest.create({
        data: {
          listingId: listing.id,
          requesterCoreUserId,
          message: dto.message,
        },
      });
    });

    await this.notifications.create({
      recipientCoreUserId: listing.ownerCoreUserId,
      type: 'NEW_REQUEST',
      title: listing.listingType === 'GIVEAWAY'
        ? `มีคนขอรับ "${listing.title}"`
        : `มีคนขอยืม "${listing.title}"`,
      body: dto.message,
      refListingId: listing.id,
      refRequestId: request.id,
    });

    return { data: request };
  }

  async findMine(user: CoreHubIdentity) {
    const coreUserId = user.coreUserId;

    const [asRequester, asOwner] = await Promise.all([
      this.prisma.borrowRequest.findMany({
        where: { requesterCoreUserId: coreUserId },
        include: { listing: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.borrowRequest.findMany({
        where: { listing: { ownerCoreUserId: coreUserId } },
        include: { listing: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    // api-conventions.md ข้อ 6: field ใน JSON เป็น camelCase
    return { data: { asRequester, asOwner } };
  }

  async updateStatus(id: string, dto: UpdateBorrowRequestStatusDto, user: CoreHubIdentity) {
    const request = await this.prisma.borrowRequest.findUnique({
      where: { id },
      include: { listing: true },
    });
    if (!request) throw notFound('ไม่พบคำขอยืมนี้');

    if (dto.status === 'APPROVED' || dto.status === 'REJECTED') {
      return this.ownerRespond(request, dto, user);
    }
    return this.markReturned(request, user);
  }

  private async ownerRespond(
    request: { id: string; status: string; requesterCoreUserId: string; listing: { id: string; title: string; ownerCoreUserId: string; listingType: string } },
    dto: UpdateBorrowRequestStatusDto,
    user: CoreHubIdentity,
  ) {
    if (request.listing.ownerCoreUserId !== user.coreUserId) {
      throw forbidden('เฉพาะเจ้าของของเท่านั้นที่อนุมัติ/ปฏิเสธคำขอได้');
    }
    if (request.status !== 'PENDING') {
      throw conflict('คำขอนี้ถูกตอบกลับไปแล้ว หรือหมดอายุแล้ว', { currentStatus: request.status });
    }

    const isApproved = dto.status === 'APPROVED';
    const isGiveaway = request.listing.listingType === 'GIVEAWAY';

    if (isApproved && isGiveaway && dto.dueDate) {
      throw validationError('รายการให้ต่อไม่มีกำหนดคืน', [
        'dueDate must not be set when approving a GIVEAWAY listing',
      ]);
    }
    if (isApproved && !isGiveaway && !dto.dueDate) {
      throw validationError('ต้องระบุวันกำหนดคืนตอนอนุมัติ', [
        'dueDate is required when approving a BORROW listing',
      ]);
    }

    // GIVEAWAY ที่อนุมัติ = ส่งมอบแล้ว -> GIVEN_AWAY เป็นสถานะสิ้นสุด ไม่กลับมา AVAILABLE อีก
    const nextListingStatus = !isApproved ? 'AVAILABLE' : isGiveaway ? 'GIVEN_AWAY' : 'BORROWED';

    const updatedRequest = await this.prisma.$transaction(async (tx) => {
      // เงื่อนไข status: 'PENDING' อยู่ใน WHERE — สองคนกดอนุมัติพร้อมกันจะผ่านคนเดียว
      const changed = await tx.borrowRequest.updateMany({
        where: { id: request.id, status: 'PENDING' },
        data: {
          status: dto.status,
          responseMessage: dto.responseMessage,
          respondedAt: new Date(),
          dueDate: isApproved && dto.dueDate ? new Date(dto.dueDate) : null,
        },
      });
      if (changed.count === 0) {
        throw conflict('คำขอนี้เพิ่งถูกตอบกลับไปแล้ว', { currentStatus: request.status });
      }

      await tx.listing.updateMany({
        where: { id: request.listing.id, status: 'PENDING' },
        data: { status: nextListingStatus, lastActivityAt: new Date() },
      });

      return tx.borrowRequest.findUniqueOrThrow({ where: { id: request.id } });
    });

    await this.notifications.create({
      recipientCoreUserId: request.requesterCoreUserId,
      type: isApproved ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED',
      title: isApproved
        ? `คำขอ "${request.listing.title}" ได้รับการอนุมัติ`
        : `คำขอ "${request.listing.title}" ถูกปฏิเสธ`,
      body: dto.responseMessage,
      refListingId: request.listing.id,
      refRequestId: request.id,
    });

    return { data: updatedRequest };
  }

  private async markReturned(
    request: { id: string; status: string; requesterCoreUserId: string; listing: { id: string; title: string; ownerCoreUserId: string; listingType: string } },
    user: CoreHubIdentity,
  ) {
    // GIVEAWAY ไม่มีวงจรคืน — จบที่การส่งมอบตามขอบเขตที่ตัดสินไว้
    if (request.listing.listingType === 'GIVEAWAY') {
      throw conflict('รายการให้ต่อไม่มีการคืน จบที่การส่งมอบแล้ว', { listingType: 'GIVEAWAY' });
    }

    const coreUserId = user.coreUserId;
    const isParty =
      request.requesterCoreUserId === coreUserId ||
      request.listing.ownerCoreUserId === coreUserId;
    if (!isParty) throw forbidden('ไม่ใช่คู่กรณีของคำขอยืมนี้');

    if (request.status !== 'APPROVED' && request.status !== 'OVERDUE') {
      throw conflict('คำขอนี้ยังไม่อยู่ในสถานะที่คืนได้', { currentStatus: request.status });
    }

    return {
      data: await this.prisma.$transaction(async (tx) => {
        const changed = await tx.borrowRequest.updateMany({
          where: { id: request.id, status: { in: ['APPROVED', 'OVERDUE'] } },
          data: { status: 'RETURNED', returnedAt: new Date() },
        });
        if (changed.count === 0) {
          throw conflict('คำขอนี้เพิ่งถูกแจ้งคืนไปแล้ว', { currentStatus: request.status });
        }
        await tx.listing.updateMany({
          where: { id: request.listing.id, status: 'BORROWED' },
          data: { status: 'AVAILABLE', lastActivityAt: new Date() },
        });
        return tx.borrowRequest.findUniqueOrThrow({ where: { id: request.id } });
      }),
    };
  }

  // ===== เรียกจาก scheduled task (ดู src/tasks) =====
  // tech-stack.md ข้อ 1.4.1(1): ต้องเป็นคำสั่ง UPDATE เดียวที่มีเงื่อนไขครบใน WHERE
  // ห้ามดึงรายการออกมาก่อนแล้ววนแก้ทีละแถว (ไม่ idempotent เมื่อรันซ้อนกัน)
  // ใช้ RETURNING เพื่อรู้ว่าแถวไหนถูกแตะจริง แล้วค่อยส่งแจ้งเตือนตามหลัง

  /** เจ้าของไม่ตอบภายใน PENDING_EXPIRE_DAYS วัน -> EXPIRED และคืน listing เป็น AVAILABLE */
  async autoExpireStalePending() {
    const cutoff = new Date(Date.now() - PENDING_EXPIRE_DAYS * 24 * 60 * 60 * 1000);

    const rows = await this.prisma.$queryRaw<AffectedRequestRow[]>`
      WITH expired AS (
        UPDATE borrow_requests
           SET status = 'EXPIRED', updated_at = now()
         WHERE status = 'PENDING' AND requested_at < ${cutoff}
        RETURNING id, listing_id, requester_core_user_id
      ), freed AS (
        UPDATE listings
           SET status = 'AVAILABLE', last_activity_at = now(), updated_at = now()
         WHERE id IN (SELECT listing_id FROM expired) AND status = 'PENDING'
        RETURNING id
      )
      SELECT e.id, e.listing_id, e.requester_core_user_id, l.title
        FROM expired e
        JOIN listings l ON l.id = e.listing_id
    `;

    for (const row of rows) {
      await this.notifications.create({
        recipientCoreUserId: row.requester_core_user_id,
        type: 'REQUEST_REJECTED',
        title: `คำขอ "${row.title}" หมดเวลารอ`,
        body: `เจ้าของไม่ตอบกลับภายใน ${PENDING_EXPIRE_DAYS} วัน ระบบยกเลิกคำขอให้อัตโนมัติ`,
        refRequestId: row.id,
        refListingId: row.listing_id,
      });
    }
    return rows.length;
  }

  /** เกินกำหนดคืน -> OVERDUE (เฉพาะ BORROW เท่านั้น GIVEAWAY ไม่มีกำหนดคืน) */
  async autoFlagOverdue() {
    const rows = await this.prisma.$queryRaw<AffectedRequestRow[]>`
      UPDATE borrow_requests br
         SET status = 'OVERDUE', updated_at = now()
        FROM listings l
       WHERE l.id = br.listing_id
         AND br.status = 'APPROVED'
         AND br.due_date IS NOT NULL
         AND br.due_date < now()
         AND l.listing_type = 'BORROW'
      RETURNING br.id, br.listing_id, br.requester_core_user_id, l.title
    `;

    for (const row of rows) {
      await this.notifications.create({
        recipientCoreUserId: row.requester_core_user_id,
        type: 'OVERDUE_FLAG',
        title: `เกินกำหนดคืน "${row.title}" แล้ว`,
        refRequestId: row.id,
        refListingId: row.listing_id,
      });
    }
    return rows.length;
  }
}
