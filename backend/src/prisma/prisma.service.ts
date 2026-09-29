
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({ adapter });

    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    // pg.Pool ต่อแบบ lazy — ถ้าไม่ยิง query จริง แอปจะบูตผ่านทั้งที่ DB ล่ม
    // แล้วไปพังตอน request แรกเป็น 500 ซึ่ง debug ยาก จึงตรวจให้ล้มตั้งแต่ตอนบูต
    try {
      await this.$queryRaw`SELECT 1`;
    } catch (error) {
      throw new Error(
        `เชื่อมต่อฐานข้อมูลไม่ได้ — ตรวจ DATABASE_URL และว่า PostgreSQL รันอยู่จริง: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** ใช้ที่ /api/health — true = DB ตอบได้จริง */
  async isReachable(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}

