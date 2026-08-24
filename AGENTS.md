# 🤖 Antigravity Agent Guide — SmartFeed Studio Monorepo

Welcome, AI Agent! This guide serves as your primary context and operating playbook for working within the **SmartFeed Studio** monorepo.

---

## 📌 Project Mission

**SmartFeed Studio** is an enterprise-grade platform for parsing, editing, enriching (AI), and synchronizing large e-commerce XML/CSV product catalog feeds, featuring encrypted local database storage, OS Keychain security, and direct S3/MinIO cloud backup.

---

## 📂 Workspace Map & Architecture

```text
SmartFeed Studio (Monorepo root)
├── apps/
│   ├── admin-portal/        # Next.js 14 (App Router) + Tailwind CSS + shadcn/ui (Port 3000)
│   └── desktop/             # Tauri v2 (Rust) + React 18 + Vite + SQLCipher & Keychain (Port 1420)
├── services/
│   └── backend-api/         # NestJS 11 CQRS API + Prisma + BullMQ (Port 4000)
├── packages/
│   └── shared/              # @smartfeed/shared (Zod schemas, CQRS contracts, Enums)
├── .agents/
│   ├── rules/               # Agent architectural rules (rules.md)
│   ├── skills/              # Agent skills
│   ├── scripts/             # Auto-formatting and lifecycle scripts
│   ├── hooks.json           # Antigravity lifecycle hooks (PostToolUse auto-format)
│   └── mcp_config.json      # Workspace MCP server integrations (Playwright)
├── .github/
│   └── workflows/           # CI/CD pipelines (ci.yml, release.yml, docker.yml)
├── docker-compose.yml       # Local infrastructure: PostgreSQL 16, Redis 7, MinIO
├── pnpm-workspace.yaml      # Monorepo workspaces definition
├── turbo.json               # Turborepo task pipeline config
├── eslint.config.mjs        # ESLint 9 Flat Config
├── .prettierrc              # Single quotes, semicolons, printWidth: 100, tabWidth: 2
├── .lintstagedrc.json       # Pre-commit staged tasks
└── .husky/                  # Git pre-commit hooks
```

---

## 🏛 Core Architectural Directives (Must Follow)

1. **Strict CQRS Decoupling on Backend (`services/backend-api`)**:
   - `UsersModule` handles **ONLY** database operations via Prisma. Never import JWT, tokens, or auth controllers into `UsersModule`.
   - `AuthModule` coordinates authentication endpoints (`/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/me`). It interacts with `UsersModule` **strictly** via `CommandBus` (`CreateUserCommand`) and `QueryBus` (`GetUserByEmailQuery`, `GetUserByIdQuery`).
   - `LicensesModule` listens to `UserCreatedEvent` on `EventBus` to auto-provision default `FREE` licenses (`SF-FREE-XXXX-XXXX-XXXX`).
   - `StorageModule` generates S3 Presigned URLs using `@aws-sdk/s3-request-presigner`. Clients upload binaries directly to S3 without burdening the API server.

2. **UI & Design System (shadcn/ui & Tailwind CSS)**:
   - Both `apps/admin-portal` and `apps/desktop` follow **shadcn/ui** design patterns.
   - Use CSS variables (`--background`, `--foreground`, `--primary`, `--card`, `--border`, etc.) with HSL tokens.
   - Reuse components from `src/components/ui/` (`card`, `button`, `badge`) and merge classes via `cn` helper (`clsx` + `tailwind-merge`).

3. **Shared Contracts Single Source of Truth (`packages/shared`)**:
   - Always place shared DTOs, Zod validation schemas, CQRS interfaces, and enums in `@smartfeed/shared`.
   - Re-run `pnpm build:shared` whenever `@smartfeed/shared` is modified.

4. **Mandatory Documentation Synchronization**:
   - Whenever any architectural change, new module, CQRS command/query/event, database schema change (`schema.prisma`), shared DTO/enum in `@smartfeed/shared`, or environment/port configuration is introduced or modified, you **MUST** update all corresponding documentation files:
     - Root [AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/AGENTS.md) and [.agents/rules/rules.md](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/rules.md)
     - Relevant sub-package guides ([services/backend-api/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/AGENTS.md), [apps/admin-portal/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/AGENTS.md), [apps/desktop/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/AGENTS.md), [packages/shared/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/packages/shared/AGENTS.md))
     - Root [README.md](file:///Users/oleg/AQA/SmartFeedStudio/README.md) (Mermaid architecture diagrams, folder trees, CQRS flow references, and command cheat sheets)
   - Never leave documentation out of sync with actual code implementations.

---

## ⚡ Essential Commands Cheat Sheet

| Task                            | Command                                                    |
| :------------------------------ | :--------------------------------------------------------- |
| **Start Docker Infrastructure** | `pnpm docker:up`                                           |
| **Stop Docker Infrastructure**  | `pnpm docker:down`                                         |
| **Run All Apps (Dev)**          | `pnpm dev`                                                 |
| **Run Backend API**             | `pnpm dev:backend`                                         |
| **Run Admin Portal**            | `pnpm dev:admin`                                           |
| **Run Desktop Vite**            | `pnpm dev:desktop`                                         |
| **Build Everything (Turbo)**    | `pnpm build`                                               |
| **Sync Database Schema**        | `pnpm --filter @smartfeed/backend-api exec prisma db push` |
| **Run Database Seeder**         | `pnpm prisma:seed`                                         |
| **Open Prisma Studio**          | `pnpm prisma:studio`                                       |
| **Lint & Fix**                  | `pnpm lint:fix`                                            |
| **Format Code**                 | `pnpm format`                                              |

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
