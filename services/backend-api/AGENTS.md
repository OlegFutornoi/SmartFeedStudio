# ⚙️ Antigravity Agent Guide — Backend API (`services/backend-api`)

## 📌 Purpose

The **Backend API** is the central REST service for SmartFeed Studio, built on a strictly decoupled **CQRS (Command Query Responsibility Segregation)** architecture with NestJS, Prisma ORM, BullMQ Redis queues, and S3 Presigned URL management.

---

## 🛠 Tech Stack

- **Framework**: NestJS 11
- **Architecture Pattern**: `@nestjs/cqrs` (CommandBus, QueryBus, EventBus)
- **Database & ORM**: PostgreSQL 16 + Prisma ORM (v7) with PG Driver Adapter
- **Background Jobs / Queues**: BullMQ + Redis 7 (`@nestjs/bullmq`)
- **Authentication**: `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`
- **Cloud Storage**: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- **Documentation**: Swagger OpenAPI (`@nestjs/swagger`) at `/api/docs`
- **Validation**: `class-validator`, `class-transformer`

---

## 📂 Folder Structure & Module Separation

```text
services/backend-api/
├── prisma/
│   ├── schema.prisma           # Prisma database schema (User, License, Snapshot, ProductImage)
│   └── seed.ts                 # Database seeder (creates Super Admin and Demo User)
├── src/
│   ├── modules/
│   │   ├── users/              # [DATA LAYER ONLY] User database persistence
│   │   │   ├── commands/       # CreateUserCommand, CreateUserHandler
│   │   │   ├── queries/        # GetUserByEmailQuery, GetUserByIdQuery
│   │   │   ├── events/         # UserCreatedEvent
│   │   │   └── users.module.ts # Zero knowledge of auth/tokens/passports
│   │   ├── auth/               # [AUTH & TOKENS LAYER] Authentication & strategies
│   │   │   ├── auth.service.ts # Dispatches CreateUserCommand & GetUserByEmailQuery
│   │   │   ├── auth.controller.ts # /auth/register, /auth/login, /auth/refresh, /auth/me
│   │   │   ├── strategies/     # JwtStrategy (Passport)
│   │   │   ├── guards/         # JwtAuthGuard
│   │   │   ├── dto/            # RegisterDto, LoginDto, RefreshTokenDto
│   │   │   └── auth.module.ts
│   │   ├── licenses/           # [LICENSES & QUOTAS] Plan tiers & auto-provisioning
│   │   │   ├── events/         # UserCreatedEventHandler (auto-creates FREE license)
│   │   │   ├── commands/       # CreateLicenseCommand, CreateLicenseHandler
│   │   │   ├── queries/        # GetLicenseByUserIdQuery, GetLicenseByUserIdHandler
│   │   │   ├── licenses.controller.ts # /licenses/my, /licenses/upgrade
│   │   │   └── licenses.module.ts
│   │   └── storage/            # [OBJECT STORAGE] Presigned S3 URLs
│   │       ├── commands/       # GeneratePresignedUploadUrlCommand & Handler
│   │       ├── storage.controller.ts # /storage/presigned-url
│   │       └── storage.module.ts
│   ├── prisma/
│   │   ├── prisma.service.ts   # Prisma connection lifecycle
│   │   └── prisma.module.ts    # Global Prisma module
│   ├── app.module.ts           # Root module assembling CQRS, BullMQ, and Domain modules
│   └── main.ts                 # Bootstrap with Swagger (/api/docs), CORS, and Global Pipes
├── tsconfig.json
└── package.json
```

---

## 🏛 CQRS Decoupling Rules (Strictly Enforced)

1. **`UsersModule`**:
   - Handles **ONLY** Prisma CRUD operations for `User`.
   - `CreateUserHandler` hashes passwords with bcrypt, inserts DB record, and emits `UserCreatedEvent` to `EventBus`.
   - Has **NO** dependencies on `@nestjs/jwt`, `Passport`, or `AuthService`.

2. **`AuthModule`**:
   - Handles token creation, validation, refresh, and auth endpoints.
   - Talks to `UsersModule` **strictly** via `CommandBus` and `QueryBus`:
     - Registration: `commandBus.execute(new CreateUserCommand(email, password, fullName, role))`
     - Login: `queryBus.execute(new GetUserByEmailQuery(email))`
     - Profile / Refresh: `queryBus.execute(new GetUserByIdQuery(userId))`

3. **`LicensesModule`**:
   - `UserCreatedEventHandler` catches `UserCreatedEvent` on `EventBus` and automatically generates a `FREE` license key (`SF-FREE-XXXX-XXXX-XXXX`).

4. **`StorageModule`**:
   - `GeneratePresignedUploadUrlHandler` signs direct upload URLs with S3 client.

5. **Documentation Synchronization**:
   - When adding new modules, commands, queries, events, DB models in `schema.prisma`, or API endpoints, immediately update this guide ([services/backend-api/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/AGENTS.md)), root [AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/AGENTS.md), [.agents/rules/rules.md](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/rules.md), and root [README.md](file:///Users/oleg/AQA/SmartFeedStudio/README.md).

---

## ⚡ Essential Commands

```bash
# Run NestJS API in watch mode (Port 4000)
pnpm dev:backend

# Build production bundle
pnpm build:backend

# Generate Prisma Client
pnpm prisma:generate

# Sync schema to DB (db push)
pnpm --filter @smartfeed/backend-api exec prisma db push

# Create and apply DB migration
pnpm prisma:migrate

# Seed initial admin & demo accounts
pnpm prisma:seed

# Open Prisma Studio GUI
pnpm prisma:studio

# Run E2E tests (requires Docker infra: pnpm docker:up)
pnpm --filter @smartfeed/backend-api test:e2e
```

---

## 🧪 Testing Policy & Coverage

### 📁 Test Location

All E2E tests live in `services/backend-api/test/` as `*.e2e-spec.ts` files.

### ⚠️ Mandatory Rule for Agents

> **Whenever a new `*.e2e-spec.ts` file is added to `services/backend-api/test/`, you MUST:**
>
> 1. Run the tests to verify they pass (`pnpm --filter @smartfeed/backend-api test:e2e`)
> 2. Update the coverage table below in this file (`services/backend-api/AGENTS.md`)
> 3. Update the coverage table in `services/backend-api/README.md`

### 📊 E2E Test Coverage

```bash
# Run all E2E tests
pnpm --filter @smartfeed/backend-api test:e2e
```

| `test/auth.e2e-spec.ts` | `POST /api/auth/register`, `POST /api/auth/login` | 12 | ✅ PASS |
| `test/password-recovery.e2e-spec.ts` | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | 8 | ✅ PASS |
| `test/licenses.e2e-spec.ts` | `GET /api/licenses/my`, `POST /api/licenses/select-plan`, dynamic duration, expiration checks & `RequireActiveLicenseGuard` | 7 | ✅ PASS |
| `test/organizations.e2e-spec.ts` | `GET /api/organizations`, `GET /api/organizations/:id`, `PATCH /api/organizations/:id`, `GET /api/organizations/:id/members`, `POST /api/organizations/:id/members` (Team Seats quota checks), `DELETE /api/organizations/:id/members/:memberId`, corporate license upgrade, inheritance for existing users, corporate expiration access blocks, and renewal | 13 | ✅ PASS |
| `test/users.e2e-spec.ts` | `GET /api/users`, `GET /api/users/stats`, `POST /api/auth/change-password` | 7 | ✅ PASS |
| `test/navigation.e2e-spec.ts` | `GET /api/navigation`, `GET /api/navigation/admin`, `POST /api/navigation`, `PATCH /api/navigation/:id`, `DELETE /api/navigation/:id` | 8 | ✅ PASS |
| `test/plans.e2e-spec.ts` | `GET /api/plans`, `GET /api/plans/admin`, `POST /api/plans`, `PATCH /api/plans/:id`, `DELETE /api/plans/:id`, `GET /api/licenses/admin` | 12 | ✅ PASS |

**Total: 67 tests — 67 passing**

### 🧹 Mandatory Test Data Teardown

Every `*.e2e-spec.ts` suite **MUST** implement complete database teardown in `afterAll`:

- Delete created users by IDs and created emails array
- Cascade deletes to related `License`, `Snapshot`, and `ProductImage` records
- Delete test navigation items (e.g. `analytics_*`)
- Never leave dirty records or side effects in the test database
