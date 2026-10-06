// QA-01 — ของกลางใน src/csmju/ ห้ามแก้ (ui-design-system.md ข้อ 17.0) จึงไม่ lint โฟลเดอร์นั้น
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "src/csmju/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default config;
