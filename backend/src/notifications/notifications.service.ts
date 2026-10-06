import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { notFound } from '../common/exceptions/app.exception';
import { PaginationQueryDto, pageArgs, pageMeta } from '../common/dto/pagination-query.dto';

interface CreateNotificationInput {
  recipientCoreUserId: string;
  type: NotificationType;
  title: string;
  body?: string;
  refListingId?: string;
  refRequestId?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('NotificationsService');

  constructor(private readonly prisma: PrismaService) {}

  // Layer 1 (บังคับ): บันทึกแจ้งเตือนในระบบเราเอง — ทำงานได้ 100% ไม่พึ่งใคร
  async create(input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        recipientCoreUserId: input.recipientCoreUserId,
        type: input.type,
        title: input.title,
        body: input.body,
        refListingId: input.refListingId,
        refRequestId: input.refRequestId,
      },
    });

    // Layer 2 (เสริม, optional): ยิงต่อไปช่องทางภายนอก เช่น LINE ของเพื่อน
    // ตั้งใจ "ไม่ await" และห่อ try-catch ให้ fail เงียบๆ — ถ้า service ภายนอกล่ม/ยังไม่มี
    // ต้องไม่กระทบ flow หลักของเราเด็ดขาด (ดูหลักการ "เซฟกับตัวเราเองก่อน")
    this.tryExternalPush(notification.recipientCoreUserId, notification.title).catch(() => {
      /* no-op: fail เงียบๆ ตามตั้งใจ */
    });

    return notification;
  }

  /** collection ต้องมี meta เสมอ (api-conventions.md ข้อ 3) */
  async findForUser(coreUserId: string, query: PaginationQueryDto) {
    const { page, limit, skip, take } = pageArgs(query);
    const where = { recipientCoreUserId: coreUserId };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.notification.count({ where }),
    ]);

    return { data: items, meta: pageMeta(total, page, limit) };
  }

  /** ไม่เจอ หรือไม่ใช่ของผู้เรียก -> 404 (เดิม no-op เงียบๆ ทำให้บักซ่อนตัว) */
  async markRead(id: string, coreUserId: string) {
    const updated = await this.prisma.notification.updateMany({
      where: { id, recipientCoreUserId: coreUserId },
      data: { isRead: true },
    });
    if (updated.count === 0) throw notFound('ไม่พบการแจ้งเตือนนี้');
  }

  /**
   * จุดเชื่อมต่อ external notification (เช่น LINE ของเพื่อน) — ยังไม่ implement จริง
   * เพราะมาตรฐานการเรียกข้าม subsystem ยังไม่ชัดเจน (รอถาม PL)
   * และยังไม่ยืนยันว่าเพื่อนใช้ LINE Notify (ปิดบริการไปแล้ว มี.ค. 2025)
   * หรือ LINE Messaging API (LINE OA) ซึ่งวิธีเรียกต่างกันมาก
   *
   * เมื่อพร้อมจริง ค่อย implement เนื้อหาใน method นี้ — โครงที่เหลือของระบบไม่ต้องแก้
   */
  private async tryExternalPush(_recipientCoreUserId: string, _title: string): Promise<void> {
    // ยังไม่เปิดใช้งาน — เป็น placeholder ไว้ก่อน
    return;
  }
}