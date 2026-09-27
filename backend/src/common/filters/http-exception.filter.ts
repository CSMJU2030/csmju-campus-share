import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AppException } from '../exceptions/app.exception';

/**
 * ห่อทุก error response ด้วย envelope ตาม contracts/error-codes.json:
 * { success: false, error: { code, message, details } }
 *
 * - ถ้าเป็น AppException (ที่เราโยนเองตามเคสธุรกิจ) ใช้ code/message/details ตรงๆ
 * - ถ้าเป็น 400 จาก NestJS ValidationPipe (ยังไม่ผ่าน validate) map เป็น VALIDATION_ERROR
 *   โดยดึง response.message (เป็น string[] อยู่แล้วตาม default ของ Nest) มาเป็น details
 * - ถ้าเป็น error อื่นที่ไม่คาดคิด (bug, DB error ฯลฯ) ห่อเป็น INTERNAL_ERROR เสมอ
 *   ห้ามโชว์ stack trace หรือ error ดิบให้ client เห็น
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof AppException) {
      return res.status(exception.getStatus()).json({
        success: false,
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
        },
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      if (status === 400) {
        // Nest ValidationPipe default shape: { statusCode, message: string[] | string, error }
        const rawMessage = typeof body === 'object' && body !== null ? (body as { message?: unknown }).message : body;
        const details = Array.isArray(rawMessage) ? rawMessage : [String(rawMessage ?? exception.message)];
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details },
        });
      }

      this.logger.warn(`Unmapped HttpException: ${exception.message}`);
      return res.status(status >= 500 ? 500 : status).json({
        success: false,
        error: {
          code: status >= 500 ? 'INTERNAL_ERROR' : status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
          message: exception.message,
        },
      });
    }

    // error ที่ไม่คาดคิดจริงๆ (bug/DB) — log ไว้ฝั่งเซิร์ฟเวอร์ แต่ไม่โชว์รายละเอียดให้ client
    this.logger.error('Unhandled exception', exception as Error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์',
      },
    });
  }
}