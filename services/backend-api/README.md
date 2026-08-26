# ⚙️ Backend API — SmartFeed Studio

## 🚀 Run Tests

```bash
# Start infrastructure first (PostgreSQL + Redis + MinIO)
pnpm docker:up

# Run all E2E tests
pnpm --filter @smartfeed/backend-api test:e2e
```

---

## 📌 Overview

Central REST API for SmartFeed Studio built with **NestJS 11** + **CQRS** + **Prisma ORM** + **PostgreSQL**.

- **Base URL**: `http://localhost:4000/api`
- **Swagger Docs**: `http://localhost:4000/api/docs`

---

## 📊 E2E Test Coverage

> **Agent Rule:** Whenever a new `*.e2e-spec.ts` file is added to `services/backend-api/test/`,
> update this table and the one in [AGENTS.md](./AGENTS.md).

| Test File                                                                    | Endpoints Covered                                                                                                                       | Tests | Status  |
| :--------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :---: | :-----: |
| [`test/auth.e2e-spec.ts`](./test/auth.e2e-spec.ts)                           | `POST /api/auth/register`, `POST /api/auth/login`                                                                                       |  12   | ✅ PASS |
| [`test/password-recovery.e2e-spec.ts`](./test/password-recovery.e2e-spec.ts) | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`                                                                       |   8   | ✅ PASS |
| [`test/users.e2e-spec.ts`](./test/users.e2e-spec.ts)                         | `GET /api/users`, `GET /api/users/stats`, `POST /api/auth/change-password`                                                              |   7   | ✅ PASS |
| [`test/navigation.e2e-spec.ts`](./test/navigation.e2e-spec.ts)               | `GET /api/navigation`, `GET /api/navigation/admin`, `POST /api/navigation`, `PATCH /api/navigation/:id`, `DELETE /api/navigation/:id`   |   8   | ✅ PASS |
| [`test/plans.e2e-spec.ts`](./test/plans.e2e-spec.ts)                         | `GET /api/plans`, `GET /api/plans/admin`, `POST /api/plans`, `PATCH /api/plans/:id`, `DELETE /api/plans/:id`, `GET /api/licenses/admin` |  12   | ✅ PASS |

**Total: 47 tests — 47 passing**

> **🧹 Mandatory Data Teardown:** All E2E test suites cleanly wipe all test-generated users, licenses, tariff plans, and navigation items in `afterAll` to guarantee zero test leftovers or database pollution.

---

## 📡 API Endpoints

### Auth

| Method | Endpoint                    | Description                                      | Auth     |
| :----- | :-------------------------- | :----------------------------------------------- | :------- |
| `POST` | `/api/auth/register`        | Register new user → returns JWT tokens           | —        |
| `POST` | `/api/auth/login`           | Login with email + password → returns JWT tokens | —        |
| `POST` | `/api/auth/refresh`         | Refresh access token using refresh token         | —        |
| `POST` | `/api/auth/forgot-password` | Request password reset token / instructions      | —        |
| `POST` | `/api/auth/reset-password`  | Reset user password using reset token            | —        |
| `GET`  | `/api/auth/me`              | Get current user profile                         | `Bearer` |
| `POST` | `/api/auth/change-password` | Change authenticated user password               | `Bearer` |

### Users

| Method | Endpoint           | Description                                  | Auth     |
| :----- | :----------------- | :------------------------------------------- | :------- |
| `GET`  | `/api/users`       | Get all registered users with their licenses | `Bearer` |
| `GET`  | `/api/users/stats` | Get total users and license statistics       | `Bearer` |

### Licenses

| Method | Endpoint           | Description                       | Auth     |
| :----- | :----------------- | :-------------------------------- | :------- |
| `GET`  | `/api/licenses/my` | Get current user license & quotas | `Bearer` |

### Navigation (Dynamic & Role/Plan-Based Access Control)

| Method   | Endpoint                  | Description                                                  | Auth             |
| :------- | :------------------------ | :----------------------------------------------------------- | :--------------- |
| `GET`    | `/api/navigation`         | Get accessible navigation items filtered by user role & plan | `Bearer`         |
| `GET`    | `/api/navigation/admin`   | Get all navigation items for configuration (Admin only)      | `Bearer (Admin)` |
| `POST`   | `/api/navigation`         | Create a new dynamic navigation item                         | `Bearer (Admin)` |
| `PATCH`  | `/api/navigation/reorder` | Reorder navigation items                                     | `Bearer (Admin)` |
| `PATCH`  | `/api/navigation/:id`     | Update label, path, icon, roles, plan, visibility            | `Bearer (Admin)` |
| `DELETE` | `/api/navigation/:id`     | Delete dynamic navigation item                               | `Bearer (Admin)` |

### Storage

| Method | Endpoint                     | Description                      | Auth     |
| :----- | :--------------------------- | :------------------------------- | :------- |
| `POST` | `/api/storage/presigned-url` | Generate S3 presigned upload URL | `Bearer` |

---

## 🏛 CQRS Architecture

```
HTTP Request
    │
NavigationController / AuthController
    │
    ├── CommandBus ──── CreateNavigationItemCommand ──── CreateNavigationItemHandler ──── PrismaService (write)
    │              └── UpdateNavigationItemCommand ──── UpdateNavigationItemHandler ──── PrismaService (write)
    │              └── DeleteNavigationItemCommand ──── DeleteNavigationItemHandler ──── PrismaService (write)
    │              └── ReorderNavigationItemsCommand ── ReorderNavigationItemsHandler ── PrismaService (write)
    │
    └── QueryBus   ──── GetAccessibleNavigationQuery ─── GetAccessibleNavigationHandler ─ Filter by Role & Plan
                   └── GetAllNavigationItemsQuery   ─── GetAllNavigationItemsHandler ─── PrismaService (read)
```

---

## ⚡ Dev Commands & Database GUI

```bash
pnpm dev:backend                                          # Start API in watch mode
pnpm --filter @smartfeed/backend-api exec prisma db push  # Sync Prisma schema
pnpm prisma:seed                                          # Seed admin account & default navigation
pnpm prisma:studio                                        # Open Prisma Studio GUI (http://localhost:5555)
```

### 🔍 Direct Database Connection (GUI Clients)

Connect your database GUI (e.g., TablePlus, DBeaver, pgAdmin) using:

- **Host**: `localhost`
- **Port**: `5432`
- **User**: `postgres`
- **Password**: `postgrespassword`
- **Database**: `smartfeed_db`
- **Connection URL**: `postgresql://postgres:postgrespassword@localhost:5432/smartfeed_db?schema=public`
