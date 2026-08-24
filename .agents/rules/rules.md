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
│   ├── hooks.json           # Agent lifecycle hooks (auto-formatting on file edit)
│   └── mcp_config.json      # Workspace MCP server integrations (Playwright)
├── .github/
│   └── workflows/           # CI/CD pipelines (ci.yml, release.yml, docker.yml)
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

### 4b. Mandatory Test Coverage Documentation (`services/backend-api/test/`)

- **Rule**: Whenever a new or modified `*.e2e-spec.ts` file appears in `services/backend-api/test/`:
  1. **Run the full E2E suite** to confirm all tests pass:
     ```bash
     pnpm --filter @smartfeed/backend-api test:e2e
     ```
  2. **Update the coverage table** in [services/backend-api/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/AGENTS.md) under section `🧪 Testing Policy & Coverage`.
  3. **Update the coverage table** in [services/backend-api/README.md](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/README.md) under section `📊 E2E Test Coverage`.
- The `services/backend-api/README.md` must **always begin** with the test run command as its first code block.
- Never let coverage tables drift from actual test files.

---

### 5. Git Commit & Push Policy (Explicit User Trigger Only)

- **Rule**: The agent must **NEVER** automatically perform `git commit` or `git push` immediately after making changes or fixes.
- All changes must be tested and verified locally, and presented to the user.
- Staging, committing, and pushing must occur **strictly** upon the user's explicit request (e.g., `/git-commit`, `/commit`, "вивантаж", "закоміть").

---

### 6. Mandatory Post-Code-Writing Protocol (Self-Review, Error Checks, Skills & Formatting)

- **Rule (Step 1 — Mandatory Domain Skills)**: When writing or refactoring code, the agent must **ALWAYS** actively apply relevant best-practice skills (`vercel-react-best-practices` for React/Next.js, `nestjs-best-practices` for NestJS CQRS, `shadcn` for UI design systems, `playwright-best-practices` for E2E tests, `frontend-desing` for visual standards, `prisma-postgres` for database operations, `systematic-debugging` for debugging).
- **Rule (Step 2 — Immediate Self-Code Review & Dead Code Elimination)**: Immediately after writing or modifying code, the agent must **automatically perform a self-code review** against these best practices (validating: **zero unused imports** such as unreferenced icons or types, no unused variables, performance, minimal re-renders, bundle efficiency, accessibility, type safety, test isolation, and formatting) before finalizing work.
- **Rule (Step 3 — Error, Lint & Type Checking)**: Check for syntax errors, compile errors, linting warnings (`pnpm lint` / `pnpm lint:fix`), and run relevant automated tests (`pnpm --filter @smartfeed/backend-api test:e2e` for backend, `pnpm test:desktop` for desktop). Guard against dev-cache overlap collisions (never run `next build` while `next dev` is running without proper cleanup).
- **Rule (Step 4 — Mandatory Auto-Formatting)**: The agent must **ALWAYS** execute `pnpm format` (Prettier) to verify that no formatting errors or style inconsistencies exist.

---

## ⚡ Key Terminal Commands

- **Start Infrastructure**: `pnpm docker:up` (Postgres: 5432, Redis: 6379, MinIO: 9000/9001)
- **Start All Apps (Dev)**: `pnpm dev`
- **Build All Apps**: `pnpm build`
- **Run Backend E2E Tests**: `pnpm --filter @smartfeed/backend-api test:e2e`
- **Run Desktop E2E Tests**: `pnpm test:desktop`
- **Run Desktop Tests (Headed)**: `pnpm test:desktop:headed`
- **Run Desktop Tests (UI Mode)**: `pnpm test:desktop:ui`
- **Lint & Format**: `pnpm lint:fix && pnpm format`
- **Prisma Schema Sync**: `pnpm --filter @smartfeed/backend-api exec prisma db push`
- **Prisma Studio**: `pnpm prisma:studio`
