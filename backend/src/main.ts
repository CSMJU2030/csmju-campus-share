import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AuthEventsLogger } from './auth/auth-events.logger';
import { EnvelopeInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // api-conventions.md v1.1 ข้อ 1: global prefix คือ "api" เฉยๆ (ไม่ใช่ "api/v1")
  // resource controller ต้องใส่ "v1/" เองในแต่ละ path เช่น @Controller('v1/listings')
  // /api/health อยู่ใน prefix (ไม่มีเวอร์ชัน) ส่วน /auth/* ต้อง exclude เพราะ callback_url ที่ลงทะเบียนกับ Core Hub ไม่มี prefix
  app.setGlobalPrefix('api', {
    exclude: ['auth/login', 'auth/callback', 'auth/logout'],
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

  const port = process.env.PORT || 3002;
  await app.listen(port);

  // event บังคับ subsystem.started (contracts/log-events.json)
  const config = app.get(ConfigService);
  app.get(AuthEventsLogger).subsystemStarted({
    subsystem: config.get<string>('subsystem.name', 'csmju-campus-share'),
    port,
    coreHubUrl: config.get<string>('coreHub.webUrl'),
    jwksUrl: config.get<string>('coreHub.jwksUrl'),
    issuer: config.get<string>('coreHub.issuer'),
    audience: config.get<string>('coreHub.audience'),
  });
}
bootstrap();