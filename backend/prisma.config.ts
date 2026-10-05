import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Prisma 7 อ่าน seed จากที่นี่ ไม่ได้อ่านคีย์ "prisma" ใน package.json อีกแล้ว
    // ไม่มีบรรทัดนี้ = `prisma db seed` และ `migrate reset` หา seed ไม่เจอ
    seed: "ts-node prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});