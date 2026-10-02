-- เพิ่มหมวด "อื่นๆ" ต่อท้าย ListingCategory
--
-- ใช้ ALTER TYPE ... ADD VALUE ได้เลย (ไม่ต้องสร้าง type ใหม่แบบ migration ก่อนหน้า)
-- เพราะเป็นการ "เพิ่มค่า" ไม่ใช่ "เปลี่ยนชื่อค่าเดิม" ของเก่าในตารางจึงไม่ต้องแปลง
-- PostgreSQL 12 ขึ้นไปรันคำสั่งนี้ใน transaction ได้ (เราใช้ postgres:16) ข้อจำกัดที่เหลือคือ
-- ห้ามใช้ค่าใหม่ใน transaction เดียวกัน ซึ่ง migration นี้ไม่ได้ใช้
ALTER TYPE "ListingCategory" ADD VALUE 'OTHER';
