import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { EnvelopeInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ตาม api-conventions.md v1.1: global prefix คือ "api" เฉยๆ (ไม่ใช่ "api/v1")
  // resource controller ต้องใส่ "v1/" เองในแต่ละ path เช่น @Controller('v1/listings')
  // /api/health อยู่ใน prefix (versioned-ไม่ต้องมี) ส่วน /auth/callback ต้อง exclude เพราะต้องตรงกับ callback_url ที่ลงทะเบียนกับ Core Hub เป๊ะ (ไม่มี prefix เลย) — controller จะถูกเพิ่มในขั้น 4
  app.setGlobalPrefix('api', {
    exclude: ['auth/callback'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ห่อทุก response สำเร็จด้วย envelope { success, data, meta } (api-conventions.md ข้อ 3)
  app.useGlobalInterceptors(new EnvelopeInterceptor());

  // ห่อทุก error ด้วย envelope { success, error } + map เป็น error.code มาตรฐาน (ข้อ 4)
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`CampusShare backend running on port ${port}`);
}
bootstrap();