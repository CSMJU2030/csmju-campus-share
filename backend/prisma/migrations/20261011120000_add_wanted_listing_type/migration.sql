-- เพิ่มประเภทประกาศ "ตามหา" (WANTED) ให้ enum ListingType
--
-- PostgreSQL 12 ขึ้นไปรัน ALTER TYPE ... ADD VALUE ใน transaction block ได้
-- (Prisma ครอบทุก migration ด้วย transaction เสมอ) · เซิร์ฟเวอร์ของโครงการเป็น 16.15
--
-- ห้ามใช้ค่า 'WANTED' ในไฟล์นี้ (INSERT / UPDATE / SET DEFAULT)
-- PostgreSQL จะปฏิเสธด้วย "unsafe use of new value of enum type"
-- ถ้าวันหลังต้องใช้ ให้แยกเป็น migration ไฟล์ถัดไป
ALTER TYPE "ListingType" ADD VALUE 'WANTED';
