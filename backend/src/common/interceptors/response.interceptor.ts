import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface EnvelopeShape {
  data?: unknown;
  meta?: Record<string, unknown>;
}

/**
 * ตาม api-conventions.md v1.1 ข้อ 3: ทุก response (รวม /api/health) ต้องห่อด้วย
 * { success: true, data: {...}, meta?: {...} } — ไม่มี endpoint ไหนยกเว้น
 *
 * Service/Controller คืนค่าปกติ (object หรือ { data, meta } ถ้าต้องการ meta เช่น pagination)
 * interceptor นี้จะจัดรูปให้เอง ไม่ต้องเขียน envelope ซ้ำทุก endpoint
 */
@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((result: unknown) => {
        if (result && typeof result === 'object' && 'data' in (result as EnvelopeShape)) {
          const { data, meta } = result as EnvelopeShape;
          return meta ? { success: true, data, meta } : { success: true, data };
        }
        return { success: true, data: result ?? null };
      }),
    );
  }
}