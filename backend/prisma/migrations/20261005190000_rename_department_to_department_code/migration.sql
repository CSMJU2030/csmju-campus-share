-- data-dictionary.md ข้อ 3: ReferenceCode ต้องชื่อ <ชุด>_code และเก็บเฉพาะ code
-- data-dictionary.md ข้อ 9.3: เปลี่ยนชื่อคอลัมน์ต้องใช้ RENAME COLUMN ห้าม drop + add (ข้อมูลหาย)
ALTER TABLE "listings" RENAME COLUMN "department" TO "department_code";

-- reference-data.md ข้อ 9: code `computer-science` ถูกเปลี่ยนเป็น `CS` ก่อน 1.7.0
-- ระบบที่เคยเก็บค่าเดิมต้อง UPDATE เป็นค่าใหม่
UPDATE "listings" SET "department_code" = 'CS' WHERE "department_code" = 'computer-science';

-- ค่ามาจาก env DEPARTMENT_CODE ที่ชั้น service — ไม่ให้ฐานมีค่าตายซ้อนเป็นแหล่งความจริงที่สอง
ALTER TABLE "listings" ALTER COLUMN "department_code" DROP DEFAULT;
