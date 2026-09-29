import { HttpException } from '@nestjs/common';

// รายการ error.code ปิดที่ 9 ค่า ตาม contracts/error-codes.json (standards 1.1)
// เพิ่มค่าใหม่ต้องผ่าน Change Process — ห้ามสร้าง code เองในโค้ด
export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

const STATUS_MAP: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 400, // ตรงกับ NestJS ValidationPipe default (ไม่ใช่ 422)
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export class AppException extends HttpException {
  public readonly code: ErrorCode;
  public readonly details?: string[] | Record<string, unknown>;
  /** 429 และ 503 ต้องมี header Retry-After เป็นวินาที (api-conventions.md ข้อ 4) */
  public readonly retryAfterSec?: number;

  constructor(
    code: ErrorCode,
    message: string,
    details?: string[] | Record<string, unknown>,
    retryAfterSec?: number,
  ) {
    super(message, STATUS_MAP[code]);
    this.code = code;
    this.details = details;
    this.retryAfterSec = retryAfterSec;
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

// details ต้องเป็น array ของข้อความเสมอ (contracts/error-codes.json -> meaning.VALIDATION_ERROR)
export const validationError = (message: string, details: string[]) =>
  new AppException('VALIDATION_ERROR', message, details);

export const conflict = (message: string, details?: Record<string, unknown>) =>
  new AppException('CONFLICT', message, details);

export const tooManyRequests = (message = 'เรียกถี่เกินไป กรุณารอสักครู่', retryAfterSec = 60) =>
  new AppException('TOO_MANY_REQUESTS', message, undefined, Math.max(1, retryAfterSec));

/** ใช้เมื่อ "สิ่งที่เราพึ่งพา" ล่มชั่วคราว เช่น DB — ห้ามใช้แทน 500 ของบั๊ก */
export const serviceUnavailable = (
  message = 'ระบบไม่พร้อมใช้งานชั่วคราว กรุณาลองใหม่',
  retryAfterSec = 10,
) => new AppException('SERVICE_UNAVAILABLE', message, undefined, Math.max(1, retryAfterSec));

export const internalError = (message = 'เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์') =>
  new AppException('INTERNAL_ERROR', message);
