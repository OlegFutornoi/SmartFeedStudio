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
- **Super Admin**: Initialized via `pnpm admin:set` (configurable via `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

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
4. **Tariff Plans Management (`/plans`)**:
   - Dynamic plan tier cards (STARTER, GROWTH, PRO, ENTERPRISE).
   - Dialog for plan creation, editing, supplier limits (`maxSuppliersLimit`), pricing, and duration (`durationDays`).
5. **Customer Licenses Registry (`/licenses`)**:
   - Dedicated active license registry table with shadcn faceted filters (Plan Tier, Active/Expired/Lifetime status, S3 Cloud Backup), instant search, sorting, and active filter pills.
6. **Dynamic Navigation Management (`/navigation`)**:
   - Visual catalog of menu items with live access control simulator.
7. **Admin Settings Submenu (`/settings`)**:
   - Profile summary and direct password change form.
   - Payment Gateways preview (`/settings/payments`).
   - AI Provider settings preview (`/settings/ai`).

---

## 🛠 Commands

```bash
pnpm dev:admin       # Run in dev mode (Next.js 14)
pnpm build:admin     # Build production bundle
```
