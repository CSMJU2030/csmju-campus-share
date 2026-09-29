import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ListingsModule } from './listings/listings.module';
import { BorrowRequestsModule } from './borrow-requests/borrow-requests.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
// เพิ่ม import
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv }),
    PrismaModule,
    HealthModule,
    ListingsModule,
    BorrowRequestsModule,
    NotificationsModule,
    ReportsModule,
    AdminModule,
    TasksModule,
    AuthModule,
  ],
})
export class AppModule {}