# ⚡ SmartFeed Studio — Operations, Terminal Commands & Extended Rules

## ⚡ Key Terminal Commands

- **Start Infrastructure**: `pnpm docker:up` (Postgres: 5432, Redis: 6379, MinIO: 9000/9001)
- **Stop Infrastructure**: `pnpm docker:down`
- **Start All Apps (Dev)**: `pnpm dev`
- **Run Backend API**: `pnpm dev:backend`
- **Run Admin Portal**: `pnpm dev:admin`
- **Run Desktop Vite**: `pnpm dev:desktop`
- **Build All Apps**: `pnpm build`
- **Run Backend E2E Tests**: `pnpm --filter @smartfeed/backend-api test:e2e`
- **Run Desktop E2E Tests**: `pnpm test:desktop`
- **Run Desktop Tests (Headed)**: `pnpm test:desktop:headed`
- **Run Desktop Tests (UI Mode)**: `pnpm test:desktop:ui`
- **Run Admin E2E Tests**: `pnpm test:admin`
- **Run Admin Tests (Headed)**: `pnpm test:admin:headed`
- **Run Admin Tests (UI Mode)**: `pnpm test:admin:ui`
- **Lint & Format**: `pnpm lint:fix && pnpm format`
- **Prisma Schema Sync**: `pnpm --filter @smartfeed/backend-api exec prisma db push`
- **Run Database Seeder**: `pnpm prisma:seed`
- **Open Prisma Studio**: `pnpm prisma:studio`

---

## 🌐 Default Ports & Access Credentials

- **Backend API**: `http://localhost:4000/api` (Swagger: `http://localhost:4000/api/docs`)
- **Admin Portal**: `http://localhost:3000`
- **Desktop UI**: `http://localhost:1420`
- **PostgreSQL**: `localhost:5432` (DB: `smartfeed_db`, User: `postgres`, Pass: `postgrespassword`)
- **Redis**: `localhost:6379`
- **MinIO Console**: `http://localhost:9001` (User: `minioadmin`, Pass: `minioadminpassword`)
- **MinIO API**: `http://localhost:9000` (Bucket: `smartfeed-storage`)
- **Default Super Admin**: `admin@smartfeed.studio` / `AdminPassword123!`
