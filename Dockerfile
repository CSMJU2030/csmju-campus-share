# Dockerfile ของระบบย่อย = backend (NestJS) ตามกฎ ARC-04
# tech-stack.md ข้อ 1.1 บังคับให้ repo มี Dockerfile และ docker-compose.yml
# frontend มี Dockerfile ของตัวเองที่ frontend/Dockerfile
#
# build จากรากของ repo:  docker build -t campusshare-backend .
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# ---------- dependencies ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json
RUN pnpm install --frozen-lockfile --filter csmju-campusshare...

# ---------- build ----------
FROM base AS build
# prisma.config.ts อ่าน env("DATABASE_URL") ตั้งแต่ตอน generate — ใส่ค่าหลอกไว้ตอน build
# (กับดักที่ aie-workflow.md บันทึกไว้: pnpm install ล้มบน CI ตอน prisma generate)
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend ./backend
RUN pnpm --filter csmju-campusshare exec prisma generate \
 && pnpm --filter csmju-campusshare build

# ---------- runtime ----------
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY backend/package.json ./backend/package.json
WORKDIR /app/backend
EXPOSE 3002
CMD ["node", "dist/main"]
