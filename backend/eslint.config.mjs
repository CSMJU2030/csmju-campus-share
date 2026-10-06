// QA-01 — ชุดกฎ: eslint:recommended + typescript-eslint
//
// no-undef ปิดไว้ตามคำแนะนำของ typescript-eslint เอง — TypeScript ตรวจ symbol
// ที่ไม่มีอยู่จริงให้แล้วตั้งแต่ตอน compile และกฎนี้ให้ false positive กับ
// type-only construct (เช่น generic parameter) · globals ยังคงใส่ไว้ให้กฎอื่น
// ที่อ่าน scope (เช่น no-redeclare) รู้จัก global ของ Node และ Jest
import js from "@eslint/js";
import globals from "globals";
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
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      "no-undef": "off",
      // log-events.md กำหนดให้ log ผ่าน logger กลาง — console ที่เหลือต้องจงใจ
      // และมี eslint-disable กำกับเหตุผลไว้ (เช่น สคริปต์ generate-openapi)
      "no-console": "warn",
      // ขีดล่างนำหน้า = ตั้งใจไม่ใช้ (เช่น placeholder ที่รอ implement)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // สคริปต์ CLI — "ผลลัพธ์" ของมันคือข้อความบนเทอร์มินัล ไม่ใช่ log ของเซอร์วิส
    // log-events.md บังคับเฉพาะโค้ดที่รันเป็นเซอร์วิส จึงปิด no-console เฉพาะที่นี่
    files: ["prisma/seed.ts", "scripts/**/*.ts", "src/generate-openapi.ts"],
    rules: { "no-console": "off" },
  },
);

export default config;
