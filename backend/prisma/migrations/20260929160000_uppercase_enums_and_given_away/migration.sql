-- ปรับค่า enum ทั้ง 7 ตัวเป็น UPPER_SNAKE_CASE ตาม data-dictionary.md ข้อ 9.1
-- และคืนค่า GIVEN_AWAY ที่ migration 20260925190425 ลบทิ้งไปกลับมาเป็นสถานะสิ้นสุดของ GIVEAWAY
--
-- ใช้วิธี "สร้าง type ใหม่แล้วสลับ" ทั้งชุด จึงรันใน transaction เดียวได้
-- (ต่างจาก ALTER TYPE ... ADD VALUE ที่ PostgreSQL ห้ามรันร่วม statement ที่ใช้ค่านั้น)
-- ค่าเดิมทุกตัวเป็น snake_case ตัวพิมพ์เล็ก จึงแปลงด้วย upper() ได้ตรงตัว

-- ListingType
CREATE TYPE "ListingType_new" AS ENUM ('BORROW', 'GIVEAWAY');
ALTER TABLE "listings" ALTER COLUMN "listing_type" TYPE "ListingType_new"
  USING (upper("listing_type"::text)::"ListingType_new");
ALTER TYPE "ListingType" RENAME TO "ListingType_old";
ALTER TYPE "ListingType_new" RENAME TO "ListingType";
DROP TYPE "ListingType_old";

-- ListingStatus (+ GIVEN_AWAY)
CREATE TYPE "ListingStatus_new" AS ENUM ('AVAILABLE', 'PENDING', 'BORROWED', 'GIVEN_AWAY', 'UNAVAILABLE', 'ARCHIVED');
ALTER TABLE "listings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "listings" ALTER COLUMN "status" TYPE "ListingStatus_new"
  USING (upper("status"::text)::"ListingStatus_new");
ALTER TYPE "ListingStatus" RENAME TO "ListingStatus_old";
ALTER TYPE "ListingStatus_new" RENAME TO "ListingStatus";
DROP TYPE "ListingStatus_old";
ALTER TABLE "listings" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';

-- ListingCategory
CREATE TYPE "ListingCategory_new" AS ENUM ('BOOKS_MATERIALS', 'CALCULATORS', 'CABLES_CONNECTORS', 'PROJECT_EQUIPMENT', 'CAMERA_PHOTOGRAPHY', 'TOOLS', 'CLUB_ACTIVITY_GEAR');
ALTER TABLE "listings" ALTER COLUMN "category" TYPE "ListingCategory_new"
  USING (upper("category"::text)::"ListingCategory_new");
ALTER TYPE "ListingCategory" RENAME TO "ListingCategory_old";
ALTER TYPE "ListingCategory_new" RENAME TO "ListingCategory";
DROP TYPE "ListingCategory_old";

-- BorrowRequestStatus
CREATE TYPE "BorrowRequestStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RETURNED', 'OVERDUE', 'EXPIRED');
ALTER TABLE "borrow_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "borrow_requests" ALTER COLUMN "status" TYPE "BorrowRequestStatus_new"
  USING (upper("status"::text)::"BorrowRequestStatus_new");
ALTER TYPE "BorrowRequestStatus" RENAME TO "BorrowRequestStatus_old";
ALTER TYPE "BorrowRequestStatus_new" RENAME TO "BorrowRequestStatus";
DROP TYPE "BorrowRequestStatus_old";
ALTER TABLE "borrow_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- NotificationType
CREATE TYPE "NotificationType_new" AS ENUM ('NEW_REQUEST', 'REQUEST_APPROVED', 'REQUEST_REJECTED', 'RETURN_REMINDER', 'OVERDUE_FLAG');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new"
  USING (upper("type"::text)::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";

-- ReportTargetType
CREATE TYPE "ReportTargetType_new" AS ENUM ('LISTING', 'BORROW_REQUEST');
ALTER TABLE "reports" ALTER COLUMN "target_type" TYPE "ReportTargetType_new"
  USING (upper("target_type"::text)::"ReportTargetType_new");
ALTER TYPE "ReportTargetType" RENAME TO "ReportTargetType_old";
ALTER TYPE "ReportTargetType_new" RENAME TO "ReportTargetType";
DROP TYPE "ReportTargetType_old";

-- ReportStatus
CREATE TYPE "ReportStatus_new" AS ENUM ('OPEN', 'RESOLVED');
ALTER TABLE "reports" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "reports" ALTER COLUMN "status" TYPE "ReportStatus_new"
  USING (upper("status"::text)::"ReportStatus_new");
ALTER TYPE "ReportStatus" RENAME TO "ReportStatus_old";
ALTER TYPE "ReportStatus_new" RENAME TO "ReportStatus";
DROP TYPE "ReportStatus_old";
ALTER TABLE "reports" ALTER COLUMN "status" SET DEFAULT 'OPEN';
