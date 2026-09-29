import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// coreUserId สมมติสำหรับ dev/test เท่านั้น (ค่า sub ที่ Core Hub จะออกให้จริง มีรูปแบบเป็นรหัสนักศึกษา)
const USERS = {
  owner1: '65123456', // เจ้าของสาย HDMI + หนังสือ
  owner2: '65654321', // เจ้าของกล้อง
  borrower1: '66111222',
  borrower2: '66333444',
};

async function main() {
  // seed ลบข้อมูลทั้งตารางก่อนเสมอ — กันรันผิดเครื่องจนข้อมูลจริงหาย
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ห้ามรัน seed บน production (seed ลบข้อมูลทุกตารางก่อน)');
  }
  console.log('เริ่ม seed ข้อมูลตัวอย่าง...');

  // ล้างข้อมูลเก่าก่อน (เรียงตาม foreign key)
  await prisma.report.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.borrowRequest.deleteMany();
  await prisma.listing.deleteMany();

  const hdmiCable = await prisma.listing.create({
    data: {
      ownerCoreUserId: USERS.owner1,
      title: 'สาย HDMI 2 เมตร',
      description: 'ใช้ต่อโปรเจกเตอร์ สภาพดี',
      category: 'CABLES_CONNECTORS',
      listingType: 'BORROW',
      status: 'AVAILABLE',
    },
  });

  const dataStructureBook = await prisma.listing.create({
    data: {
      ownerCoreUserId: USERS.owner1,
      title: 'หนังสือ Data Structures and Algorithms',
      description: 'ฉบับพิมพ์ล่าสุด มีรอยขีดเส้นใต้บ้าง',
      category: 'BOOKS_MATERIALS',
      listingType: 'BORROW',
      status: 'AVAILABLE',
    },
  });

  const tripod = await prisma.listing.create({
    data: {
      ownerCoreUserId: USERS.owner2,
      title: 'ขาตั้งกล้อง Tripod',
      category: 'CAMERA_PHOTOGRAPHY',
      listingType: 'BORROW',
      status: 'AVAILABLE',
    },
  });

  const oldCalculator = await prisma.listing.create({
    data: {
      ownerCoreUserId: USERS.owner2,
      title: 'เครื่องคิดเลข Casio fx-991',
      description: 'ไม่ใช้แล้ว ยกให้รุ่นน้องที่ต้องการ',
      category: 'CALCULATORS',
      listingType: 'GIVEAWAY',
      status: 'AVAILABLE',
    },
  });

  // คำขอยืมที่ pending อยู่ (ยังไม่อนุมัติ)
  const pendingRequest = await prisma.borrowRequest.create({
    data: {
      listingId: dataStructureBook.id,
      requesterCoreUserId: USERS.borrower1,
      message: 'ขอยืมอ่านสอบกลางภาคครับ คืนภายในสัปดาห์หน้า',
      status: 'PENDING',
    },
  });
  await prisma.listing.update({
    where: { id: dataStructureBook.id },
    data: { status: 'PENDING' },
  });

  // คำขอที่ overdue แล้ว (จำลองว่าเลยกำหนดคืนมา 5 วัน) — ให้เห็นใน admin/overdue-requests ทันที
  const overdueDueDate = new Date();
  overdueDueDate.setDate(overdueDueDate.getDate() - 5);

  await prisma.borrowRequest.create({
    data: {
      listingId: tripod.id,
      requesterCoreUserId: USERS.borrower2,
      message: 'ขอยืมถ่ายงานกิจกรรมสาขาครับ',
      status: 'OVERDUE',
      dueDate: overdueDueDate,
      respondedAt: new Date(overdueDueDate.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.listing.update({
    where: { id: tripod.id },
    data: { status: 'BORROWED' },
  });

  // รายงานปัญหา (report) ตัวอย่าง ให้เห็นใน admin/reports
  await prisma.report.create({
    data: {
      targetType: 'LISTING',
      targetId: hdmiCable.id,
      reporterCoreUserId: USERS.borrower1,
      reason: 'รูปที่ลงกับของจริงไม่ตรงกัน สายสั้นกว่าที่บอกไว้มาก',
    },
  });

  // notification ตัวอย่าง
  await prisma.notification.create({
    data: {
      recipientCoreUserId: USERS.owner1,
      type: 'NEW_REQUEST',
      title: `มีคนขอยืม "${dataStructureBook.title}"`,
      body: pendingRequest.message,
      refListingId: dataStructureBook.id,
      refRequestId: pendingRequest.id,
    },
  });

  // เคส giveaway ที่ส่งมอบแล้ว — ใช้ยืนยันว่า GIVEN_AWAY เป็นสถานะสิ้นสุดจริง
  const givenAwayPen = await prisma.listing.create({
    data: {
      ownerCoreUserId: USERS.owner1,
      title: 'ปากกาเขียนไวท์บอร์ด (ยกให้)',
      description: 'เหลือจากกิจกรรม ยกให้รุ่นน้อง',
      category: 'CLUB_ACTIVITY_GEAR',
      listingType: 'GIVEAWAY',
      status: 'GIVEN_AWAY',
    },
  });
  await prisma.borrowRequest.create({
    data: {
      listingId: givenAwayPen.id,
      requesterCoreUserId: USERS.borrower2,
      message: 'ขอรับครับ',
      status: 'APPROVED',
      respondedAt: new Date(),
    },
  });

  console.log('Seed เสร็จแล้ว:');
  console.log(`  Listings: ${hdmiCable.id}, ${dataStructureBook.id}, ${tripod.id}, ${oldCalculator.id}, ${givenAwayPen.id}`);
  console.log('  ต้องมี token จาก Core Hub ทุก endpoint ใต้ /api/v1 (ไม่มี public endpoint แล้ว)');
  console.log('  ลอง: curl -H "Authorization: Bearer <token>" http://localhost:3002/api/v1/listings');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });