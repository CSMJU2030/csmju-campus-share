import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BorrowRequestsService } from '../borrow-requests/borrow-requests.service';
import { ListingsService } from '../listings/listings.service';

const LISTING_STALE_DAYS = 180; // ~6 เดือน ไม่มีความเคลื่อนไหว -> archive

// tech-stack.md ข้อ 1.4.1(2): ต้องระบุ timeZone ทุกงาน
// ไม่ระบุ = รันตาม UTC ของ container -> งานตีสองจะไปรันเก้าโมงเช้าเวลาไทย
const TZ = { timeZone: 'Asia/Bangkok' } as const;

/**
 * งานอัตโนมัติที่ทำให้ระบบอยู่รอดได้แม้ไม่มี Admin เฝ้าทุกวัน
 *
 * ทั้ง 3 งานเป็นคำสั่ง UPDATE เดียวที่มีเงื่อนไขครบใน WHERE (idempotent)
 * ถ้าวันหนึ่งต้องรันหลาย instance ให้ครอบด้วย pg_try_advisory_xact_lock ตาม tech-stack.md ข้อ 1.4.1(3)
 */
@Injectable()
export class TasksService {
  private readonly logger = new Logger('TasksService');

  constructor(
    private readonly borrowRequests: BorrowRequestsService,
    private readonly listings: ListingsService,
  ) {}

  // ทุกวันเที่ยงคืน (เวลาไทย) — คำขอที่เจ้าของไม่ตอบ -> EXPIRED
  @Cron('0 0 * * *', TZ)
  async handleAutoExpirePending() {
    const count = await this.borrowRequests.autoExpireStalePending();
    if (count > 0) this.logger.log(`Auto-expired ${count} stale pending request(s)`);
  }

  // ทุกวันตี 1 (เวลาไทย) — คำขอที่เกินกำหนดคืน -> OVERDUE
  @Cron('0 1 * * *', TZ)
  async handleAutoFlagOverdue() {
    const count = await this.borrowRequests.autoFlagOverdue();
    if (count > 0) this.logger.log(`Flagged ${count} overdue request(s)`);
  }

  // ทุกวันอาทิตย์ตี 2 (เวลาไทย) — listing ที่เงียบนาน -> ARCHIVED
  @Cron('0 2 * * 0', TZ)
  async handleAutoArchiveListings() {
    const count = await this.listings.autoArchiveStale(LISTING_STALE_DAYS);
    if (count > 0) this.logger.log(`Auto-archived ${count} stale listing(s)`);
  }
}
