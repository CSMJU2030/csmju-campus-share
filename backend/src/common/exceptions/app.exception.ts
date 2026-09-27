import { HttpException } from '@nestjs/common';

// รายการ error.code ต้องอยู่ใน 7 ค่านี้เท่านั้น (contracts/error-codes.json — closed enum)
// เพิ่มค่าใหม่ต้องเสนอ PM3 ก่อน — ห้ามสร้าง code เองในโค้ด
export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

const STATUS_MAP: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 400, // ตรงกับ NestJS ValidationPipe default (ไม่ใช่ 422)
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export class AppException extends HttpException {
  public readonly code: ErrorCode;
  public readonly details?: string[] | Record<string, unknown>;

  constructor(code: ErrorCode, message: string, details?: string[] | Record<string, unknown>) {
    super(message, STATUS_MAP[code]);
    this.code = code;
    this.details = details;
  }
}

// helper functions ให้เรียกสั้นๆ ใน service/controller
export const badRequest = (message = 'คำขอไม่ถูกต้อง') => new AppException('BAD_REQUEST', message);

export const unauthorized = (message = 'ไม่มี token หรือ token หมดอายุ') =>
  new AppException('UNAUTHORIZED', message);

export const forbidden = (message = 'ไม่มีสิทธิ์ทำรายการนี้') =>
  new AppException('FORBIDDEN', message);

export const notFound = (message = 'ไม่พบข้อมูลที่ต้องการ') =>
  new AppException('NOT_FOUND', message);

// details ต้องเป็น array ของข้อความเสมอ (contracts/error-codes.json → meaning.VALIDATION_ERROR)
export const validationError = (message: string, details: string[]) =>
  new AppException('VALIDATION_ERROR', message, details);

export const conflict = (message: string, details?: Record<string, unknown>) =>
  new AppException('CONFLICT', message, details);

export const internalError = (message = 'เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์') =>
  new AppException('INTERNAL_ERROR', message);