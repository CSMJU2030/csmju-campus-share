import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` รันจาก postinstall ซึ่งเกิดตอน clone ใหม่และใน Docker runtime stage
// ที่ยังไม่มี DATABASE_URL · ถ้าประกาศ datasource ด้วย env() ตายตัว config จะโยน
// PrismaConfigEnvError ทำให้ `pnpm install` ล้มทั้งคำสั่ง — generate ไม่ต้องต่อฐานข้อมูลอยู่แล้ว
// คำสั่งที่ต้องใช้ฐานข้อมูลจริง (migrate, db seed) ยังล้มพร้อมข้อความของ Prisma เองตามปกติ
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Prisma 7 อ่าน seed จากที่นี่ ไม่ได้อ่านคีย์ "prisma" ใน package.json อีกแล้ว
    // ไม่มีบรรทัดนี้ = `prisma db seed` และ `migrate reset` หา seed ไม่เจอ
    seed: "ts-node prisma/seed.ts",
  },
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});