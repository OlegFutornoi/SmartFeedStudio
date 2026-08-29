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

```bash
pnpm --filter @smartfeed/backend-api test:e2e
```

> **Agent Rule:** Whenever a new `*.e2e-spec.ts` file is added to `services/backend-api/test/`,
> update this table and the one in [AGENTS.md](./AGENTS.md).

| Test File                                                                                | Endpoints Covered                                                                                                                                                                                                                                                                                                                                                         | Tests | Status  |
| :--------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---: | :-----: |
| [`test/auth.e2e-spec.ts`](./test/auth.e2e-spec.ts)                                       | `POST /api/auth/register`, `POST /api/auth/login`                                                                                                                                                                                                                                                                                                                         |  12   | ✅ PASS |
| [`test/password-recovery.e2e-spec.ts`](./test/password-recovery.e2e-spec.ts)             | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`                                                                                                                                                                                                                                                                                                         |   8   | ✅ PASS |
| [`test/licenses.e2e-spec.ts`](./test/licenses.e2e-spec.ts)                               | `GET /api/licenses/my`, `GET /api/licenses/quotas` (real-time unified quotas, downgrade excess detection), `POST /api/licenses/select-plan`, dynamic duration, expiration & `RequireActiveLicenseGuard`, `PATCH /api/licenses/:id/status` (Suspend/Resume), `DELETE /api/licenses/:id`                                                                                    |  17   | ✅ PASS |
| [`test/organizations.e2e-spec.ts`](./test/organizations.e2e-spec.ts)                     | `GET /api/organizations`, `GET /api/organizations/:id`, `PATCH /api/organizations/:id`, `GET /api/organizations/:id/members`, `POST /api/organizations/:id/members` (`maxTeamSeats` quota checks), `DELETE /api/organizations/:id/members/:memberId`, corporate license upgrade, inheritance for existing users, corporate expiration access blocks, and renewal          |  13   | ✅ PASS |
| [`test/team-invitations.e2e-spec.ts`](./test/team-invitations.e2e-spec.ts)               | `POST /api/organizations/:id/invitations` (Token link + Mailer), `GET /api/organizations/:id/invitations`, `DELETE /api/organizations/:id/invitations/:invitationId`, `GET /api/invitations/:token`, `POST /api/invitations/accept`, 403 guard for MEMBER, Mailpit delivery                                                                                               |  11   | ✅ PASS |
| [`test/users.e2e-spec.ts`](./test/users.e2e-spec.ts)                                     | `GET /api/users`, `GET /api/users/stats`, `POST /api/users` (create user by admin), `PATCH /api/users/:id/status` (Suspend/Resume), `DELETE /api/users/:id`, `SUPER_ADMIN` exclusion, `orgRoleFilter` (`OWNERS`, `MEMBERS`), `POST /api/auth/change-password`                                                                                                             |  18   | ✅ PASS |
| [`test/security-access-control.e2e-spec.ts`](./test/security-access-control.e2e-spec.ts) | RBAC admin endpoint protection, multi-tenant ABAC organization isolation, invited member plan modification guards (`ONLY_OWNER_CAN_CHANGE_PLAN`), password validation on invite accept, and S3 Presigned URL user scoping                                                                                                                                                 |  17   | ✅ PASS |
| [`test/navigation.e2e-spec.ts`](./test/navigation.e2e-spec.ts)                           | `GET /api/navigation`, `GET /api/navigation/admin`, `POST /api/navigation`, `PATCH /api/navigation/:id`, `DELETE /api/navigation/:id`                                                                                                                                                                                                                                     |   8   | ✅ PASS |
| [`test/plans.e2e-spec.ts`](./test/plans.e2e-spec.ts)                                     | `GET /api/plans` (STARTER/GROWTH/PRO/ENTERPRISE), `GET /api/plans/admin`, `POST /api/plans`, `PATCH /api/plans/:id`, `DELETE /api/plans/:id`, `GET /api/licenses/admin`                                                                                                                                                                                                   |  12   | ✅ PASS |
| [`test/payments.e2e-spec.ts`](./test/payments.e2e-spec.ts)                               | `POST /api/payments/checkout` (Monthly & Yearly), `POST /api/payments/wayforpay/webhook` (MD5 signature verification, Approved & Declined, automatic license activation), `GET /api/payments/transactions`, `GET /api/payments/my-transactions`, `GET /api/payments/stats`, `GET & PATCH /api/payments/settings`                                                          |  12   | ✅ PASS |
| [`test/suppliers.e2e-spec.ts`](./test/suppliers.e2e-spec.ts)                             | `POST /api/suppliers` (CRUD, markup rules, tenant code isolation, 409 duplicate check), `GET /api/suppliers`, `GET /api/suppliers/:id`, `PATCH /api/suppliers/:id`, `DELETE /api/suppliers/:id`                                                                                                                                                                           |   7   | ✅ PASS |
| [`test/feeds-parsing.e2e-spec.ts`](./test/feeds-parsing.e2e-spec.ts)                     | `POST /api/feeds/analyze` (XML/CSV auto-detection, SKU count per category), `POST /api/feeds/analyze-url` (fetch URL + markup calculation), `POST /api/feeds/import-async` (BullMQ background queue, jobId, selective category filter), `GET /api/feeds/jobs/:id`, `GET /api/feeds/suppliers/:id/sources`, `POST /api/feeds/import-content`, `POST /api/feeds/import-url` |   7   | ✅ PASS |
| [`test/products.e2e-spec.ts`](./test/products.e2e-spec.ts)                               | `POST /api/products` (manual creation with attributes/images, duplicate SKU prevention), `GET /api/products` (pagination, price range filters, search), `GET /api/products/:id`, `PATCH /api/products/:id`, `DELETE /api/products/:id`, `GET /api/products/categories-summary`, `POST /api/products/bulk-delete`                                                          |   9   | ✅ PASS |

**Total: 13 suites — 156 tests — 156 passing (100%)** (4-tier plan: STARTER → GROWTH → PRO → ENTERPRISE)

> **🧹 Mandatory Zero-Leftovers Data Teardown:** All E2E test suites utilize the centralized helper `cleanDatabase` (`test/utils/teardown.helper.ts`) in both `beforeAll` (pre-clean) and `afterAll` (post-clean) hooks. All test-generated entities are wiped in strict foreign-key safe sequence: `Snapshots` & `ProductImages` → `OrganizationInvitations` → `OrganizationMembers` → `Licenses` → `Organizations` → `Users` → `TariffPlans` & `NavigationItems` (and future `Products`/`Catalogs`), guaranteeing zero test leftovers or database pollution.

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

| Method | Endpoint           | Description                                  | Auth             |
| :----- | :----------------- | :------------------------------------------- | :--------------- |
| `GET`  | `/api/users`       | Get all registered users with their licenses | `Bearer (Admin)` |
| `GET`  | `/api/users/stats` | Get total users and license statistics       | `Bearer (Admin)` |

### Organizations & Team Seats

| Method   | Endpoint                                           | Description                                                        | Auth     |
| :------- | :------------------------------------------------- | :----------------------------------------------------------------- | :------- |
| `GET`    | `/api/organizations`                               | Get list of organizations current user belongs to                  | `Bearer` |
| `GET`    | `/api/organizations/:id`                           | Get organization profile with quotas and member counts             | `Bearer` |
| `PATCH`  | `/api/organizations/:id`                           | Update organization name                                           | `Bearer` |
| `GET`    | `/api/organizations/:id/members`                   | Get list of organization members                                   | `Bearer` |
| `DELETE` | `/api/organizations/:id/members/:memberId`         | Remove team member (liberates team seat)                           | `Bearer` |
| `GET`    | `/api/organizations/:id/invitations`               | Get list of pending team invitations                               | `Bearer` |
| `POST`   | `/api/organizations/:id/invitations`               | Create invitation token & dispatch email (enforces quota limit)    | `Bearer` |
| `DELETE` | `/api/organizations/:id/invitations/:invitationId` | Revoke pending team invitation                                     | `Bearer` |
| `GET`    | `/api/invitations/:token`                          | Get public invitation details (org name, email, role, inviter)     | —        |
| `POST`   | `/api/invitations/accept`                          | Accept invitation (creates user/sets password & adds to workspace) | —        |

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
