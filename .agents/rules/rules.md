---
trigger: always_on
glob: **/*
description: Core project information, architecture, tech stack, and coding standards for SmartFeed Studio monorepo.
---

# 🚀 SmartFeed Studio — Project Knowledge & Architecture Guide

## 📌 Project Overview

**SmartFeed Studio** is an enterprise-grade platform for managing, parsing, editing, and synchronizing large e-commerce XML/CSV product catalog feeds, featuring AI-assisted enhancements, encrypted local storage, and cloud synchronization.

---

## 🛠 Technology Stack

| Layer                | Technologies                                                                       | Description                                                      |
| :------------------- | :--------------------------------------------------------------------------------- | :--------------------------------------------------------------- |
| **Monorepo Engine**  | `pnpm workspaces`, `Turborepo`                                                     | Workspace management, parallel caching, task pipelines           |
| **Backend API**      | NestJS 11, `@nestjs/cqrs`, Prisma ORM (v6), BullMQ (Redis 7), `@aws-sdk/client-s3` | Central REST API with strict CQRS pattern                        |
| **Admin Web Portal** | Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui                         | Management dashboard for users, subscriptions & licenses         |
| **Desktop Client**   | Tauri v2 (Rust), React 18 + Vite, Tailwind CSS, Lucide                             | Native desktop client with encrypted SQLite & OS Keychain        |
| **Shared Contracts** | `@smartfeed/shared` (TypeScript, Zod)                                              | Centralized DTOs, Zod validation schemas, CQRS contracts & enums |
| **Infrastructure**   | Docker Compose (`PostgreSQL 16`, `Redis 7`, `MinIO S3`)                            | Local containerized microservices and object storage             |
| **Quality Control**  | ESLint 9 (Flat Config), Prettier, Husky, lint-staged                               | Automatic pre-commit linting and code formatting                 |

---

## 📂 Monorepo Structure

```text
.
├── apps/
│   ├── admin-portal/        # Next.js 14 App Router + Tailwind CSS (Port 3000)
│   └── desktop/             # Tauri v2 + React 18 + Vite + SQLCipher & Keychain (Port 1420)
├── services/
│   └── backend-api/         # NestJS 11 CQRS API + Prisma + BullMQ (Port 4000)
├── packages/
│   └── shared/              # @smartfeed/shared (Zod schemas, CQRS contracts, Enums)
├── .agents/
│   ├── rules/rules.md       # Core architectural guidelines (Always active)
│   ├── skills/              # Installed agent skills
│   ├── scripts/             # Lifecycle hook automation scripts
│   └── hooks.json           # Agent lifecycle hooks (auto-formatting on file edit)
├── docker-compose.yml       # Local infrastructure: PostgreSQL 16, Redis 7, MinIO
├── pnpm-workspace.yaml      # Monorepo workspaces definition
├── turbo.json               # Turborepo task pipeline config
├── eslint.config.mjs        # ESLint Flat Config
├── .prettierrc              # Single quotes, semicolons, printWidth: 100, tabWidth: 2
├── .lintstagedrc.json       # Pre-commit staged tasks
└── .husky/                  # Git pre-commit hooks
```

---

## 🏛 Core Architectural Rules & CQRS Design

### 1. Backend Module Decoupling (`services/backend-api`)

To eliminate circular dependencies and adhere to Single Responsibility Principle (SRP):

- **`UsersModule` (Data Persistence Layer)**:
  - Responsible **ONLY** for database operations via `PrismaService` for the `User` entity.
  - **Commands**: `CreateUserCommand` -> `CreateUserHandler` (hashes password with `bcrypt`, creates DB record, publishes `UserCreatedEvent` to `EventBus`).
  - **Queries**: `GetUserByEmailQuery` -> `GetUserByEmailHandler`, `GetUserByIdQuery` -> `GetUserByIdHandler`.
  - **Rule**: Has **zero** direct knowledge of JWT, tokens, Passport, or auth controllers.

- **`AuthModule` (Authentication & Token Authority)**:
  - Manages `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/me` endpoints.
  - Issues and validates Access (15m) and Refresh (7d) JWT tokens using Passport strategies.
  - **Communication with UsersModule**: Strictly through `CommandBus` and `QueryBus`.
    - Register: `commandBus.execute(new CreateUserCommand(email, password, fullName, role))`
    - Login: `queryBus.execute(new GetUserByEmailQuery(email))`
    - Refresh / Me: `queryBus.execute(new GetUserByIdQuery(userId))`

- **`LicensesModule` (License Quotas & Auto-Provisioning)**:
  - Listens to `UserCreatedEvent` on `EventBus` to automatically generate a `FREE` license key (`SF-FREE-XXXX-XXXX-XXXX`).
  - Manages plan tiers: `FREE` (1k items, 50 AI credits), `PRO` (50k items, 500 AI credits, cloud backup), `ENTERPRISE` (1M items, 5k AI credits).

- **`StorageModule` (Direct S3 / Presigned URLs)**:
  - `GeneratePresignedUploadUrlHandler` uses `@aws-sdk/s3-request-presigner` to issue direct PUT URLs for MinIO / Cloudflare R2.
  - Clients upload heavy binary/image files directly to S3 without burdening the API server.

---

### 2. Desktop Security & Storage (`apps/desktop`)

- **Refresh Token Storage**: Managed securely in native OS Keychain via Rust `keyring` crate (`store_refresh_token`, `get_refresh_token`, `delete_refresh_token`).
- **Offline Catalog Caching**: Local SQLite database encrypted with SQLCipher (`rusqlite` with AES-256).

---

### 3. Database Schema Entities (`services/backend-api/prisma/schema.prisma`)

- **`User`**: `id`, `email`, `passwordHash`, `fullName`, `role` (`SUPER_ADMIN`, `ADMIN`, `USER`), timestamps.
- **`License`**: `id`, `userId`, `licenseKey`, `planType` (`FREE`, `PRO`, `ENTERPRISE`), `canCloudBackup`, `maxXmlLimit`, `aiCredits`, `isActive`, `expiresAt`.
- **`Snapshot`**: `id`, `userId`, `snapshotName`, `s3Key`, `sizeBytes`, `createdAt`.
- **`ProductImage`**: `id`, `userId`, `originalUrl`, `cloudUrl`, `s3Key`, `createdAt`.

---

### 4. Mandatory Documentation & Architecture Synchronization

- **Rule**: Whenever any architectural change occurs (new modules, CQRS commands/queries/events, DB schema changes in `schema.prisma`, shared DTOs/enums in `@smartfeed/shared`, Tauri commands/services, API endpoints, or ports):
  - **Always update documentation immediately**:
    1. Root [AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/AGENTS.md) and [.agents/rules/rules.md](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/rules.md)
    2. Sub-project guides ([services/backend-api/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/AGENTS.md), [apps/admin-portal/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/AGENTS.md), [apps/desktop/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/AGENTS.md), [packages/shared/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/packages/shared/AGENTS.md))
    3. Root [README.md](file:///Users/oleg/AQA/SmartFeedStudio/README.md) (including Mermaid architecture diagrams, folder trees, and CQRS flow steps).
  - Outdated or drifting documentation is strictly prohibited.

---

## ⚡ Key Terminal Commands

- **Start Infrastructure**: `pnpm docker:up` (Postgres: 5432, Redis: 6379, MinIO: 9000/9001)
- **Start All Apps (Dev)**: `pnpm dev`
- **Build All Apps**: `pnpm build`
- **Lint & Format**: `pnpm lint:fix && pnpm format`
- **Prisma Schema Sync**: `pnpm --filter @smartfeed/backend-api exec prisma db push`
- **Prisma Studio**: `pnpm prisma:studio`
