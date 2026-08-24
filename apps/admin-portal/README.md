# 🌐 Admin Portal — SmartFeed Studio

## 🚀 Run Application

```bash
# Start backend API and database first
pnpm docker:up
pnpm dev:backend

# Start Next.js Admin Portal (Port 3000)
pnpm dev:admin
```

- **URL**: `http://localhost:3000`
- **Default Super Admin**: `admin@smartfeed.studio` / `AdminPassword123!`

---

## 📌 Features

1. **Secure Admin Authentication (`/login`)**:
   - Dedicated login without public self-registration.
   - JWT access & refresh token storage.
2. **Dashboard Overview (`/`)**:
   - Inspired by `shadcn dashboard-01`.
   - Primary metric: **Всього користувачів (Total Users)** live count.
   - Infrastructure health cards (PostgreSQL, BullMQ Redis, S3/MinIO).
   - Recent registered users quick-table.
3. **Users Directory (`/users`)**:
   - Live debounced search by name and email.
   - Filtering by roles (`SUPER_ADMIN`, `ADMIN`, `USER`).
   - Plan quotas display (XML Limit, AI Credits).
4. **License Management (`/licenses`)**:
   - Plan tier cards (FREE, PRO, ENTERPRISE).
   - Active license directory.
5. **Admin Settings & Security (`/settings`)**:
   - Profile summary.
   - Direct password change form with validation.
   - Sidebar-07 profile menu with quick password change modal.

---

## 🛠 Commands

```bash
pnpm dev:admin       # Run in dev mode (Next.js 14)
pnpm build:admin     # Build production bundle
```
