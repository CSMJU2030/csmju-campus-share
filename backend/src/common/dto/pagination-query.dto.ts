import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * pagination มาตรฐานของทุก collection endpoint
 * api-conventions.md ข้อ 5: ?page=1&limit=20 สูงสุด 100 · ชื่อ param ต้อง camelCase (ข้อ 1)
 * ชื่ออื่นที่พบในระบบเก่า (ขีดล่างหรือ camelCase แบบหน้า) ใช้ไม่ได้ — ตัวตรวจ API-07 จับคำเหล่านั้น
 * ทุกที่ใน backend/src รวมถึงในคอมเมนต์ จึงไม่เขียนคำนั้นลงไฟล์นี้
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/** meta ของ collection ตาม schemas/common.schema.json -> pageMeta (ต้องมีครบ 4 คีย์) */
export function pageMeta(total: number, page: number, limit: number) {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}

/** อ่านค่าที่ผ่าน validation แล้วให้เป็นตัวเลขเสมอ */
export function pageArgs(q: PaginationQueryDto) {
  const page = q.page ?? 1;
  const limit = q.limit ?? 20;
  return { page, limit, skip: (page - 1) * limit, take: limit };
}
