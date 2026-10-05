// QA-01 — ใช้เฉพาะชุด typescript-eslint
// ไม่ดึง @eslint/js เพราะกฎ no-undef จะร้องหา global ของ Node (process, console)
// ซึ่งต้องพึ่งแพ็กเกจ `globals` ที่ไม่อยู่ใน whitelist ของ ARC-02
import tseslint from "typescript-eslint";

const config = tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "prisma/migrations/**",
      // สคริปต์ทดสอบ cron ของทีม ไม่ขึ้น production และจงใจส่งค่าผิด type
      // เพื่อตรวจว่าระบบตอบ 409 — บังคับ type ที่นี่จะทดสอบสิ่งที่ตั้งใจไม่ได้
      "src/dev/**",
    ],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      // ขีดล่างนำหน้า = ตั้งใจไม่ใช้ (เช่น placeholder ที่รอ implement)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
);

export default config;
