import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwksService } from './jwks.service';
import { CoreHubTokenVerifier } from './core-hub-token.verifier';
import { AuthEventsLogger } from './auth-events.logger';
import { CoreHubJwtGuard } from './guards/core-hub-jwt.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MeController } from './me.controller';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController, MeController],
  providers: [
    JwksService,
    CoreHubTokenVerifier,
    AuthEventsLogger,
    AuthService,
    // ลำดับสำคัญ: global guard ทำงานตามลำดับที่ลงทะเบียน (ต้อง authenticate ก่อน authorize)
    { provide: APP_GUARD, useClass: CoreHubJwtGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AuthModule {}