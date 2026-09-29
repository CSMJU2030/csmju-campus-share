import type { NextConfig } from "next";

// Frontend ต้องอยู่ origin เดียวกับ backend เพื่อให้ cookie HttpOnly ใช้ได้ → proxy /api, /auth, /health ไป backend
const BACKEND = process.env.BACKEND_ORIGIN ?? "http://localhost:3002";

const config: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND}/api/:path*` },
      { source: "/auth/:path*", destination: `${BACKEND}/auth/:path*` },
      { source: "/health", destination: `${BACKEND}/health` },
    ];
  },
};

export default config;
