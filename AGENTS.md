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
├── wiki/                    # Central Documentation & Knowledge Base (WIKI)
├── .agents/
│   ├── rules/               # Agent architectural rules (rules.md, wiki_and_documentation.md)
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
   - `PlansModule` manages dynamic tariff plans, quotas, pricing, and localized feature lists (`/api/plans`).
   - `LicensesModule` listens to `UserCreatedEvent` on `EventBus` to auto-provision default `FREE` licenses (`SF-FREE-XXXX-XXXX-XXXX`) linked to DB `TariffPlan`, and handles admin license queries (`GetAdminLicensesQuery`).
   - `StorageModule` generates S3 Presigned URLs using `@aws-sdk/s3-request-presigner`. Clients upload binaries directly to S3 without burdening the API server.

2. **UI & Design System (shadcn/ui & Tailwind CSS)**:
   - Both `apps/admin-portal` and `apps/desktop` follow **shadcn/ui** design patterns.
   - Use CSS variables (`--background`, `--foreground`, `--primary`, `--card`, `--border`, etc.) with HSL tokens.
   - Reuse components from `src/components/ui/` (`card`, `button`, `badge`) and merge classes via `cn` helper (`clsx` + `tailwind-merge`).

3. **Shared Contracts Single Source of Truth (`packages/shared`)**:
   - Always place shared DTOs, Zod validation schemas, CQRS interfaces, and enums in `@smartfeed/shared`.
   - Re-run `pnpm build:shared` whenever `@smartfeed/shared` is modified.

4. **Mandatory Documentation & WIKI Synchronization**:
   - Whenever any architectural change, new module, CQRS command/query/event, database schema change (`schema.prisma`), shared DTO/enum in `@smartfeed/shared`, or environment/port configuration is introduced or modified, you **MUST** update all corresponding documentation files:
     - Central Knowledge Base: [wiki/README.md](file:///Users/oleg/AQA/SmartFeedStudio/wiki/README.md) and all relevant sub-articles in `wiki/`
     - Root [AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/AGENTS.md) and [.agents/rules/rules.md](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/rules.md)
     - Relevant sub-package guides ([services/backend-api/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/AGENTS.md), [apps/admin-portal/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/AGENTS.md), [apps/desktop/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/AGENTS.md), [packages/shared/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/packages/shared/AGENTS.md))
     - Root [README.md](file:///Users/oleg/AQA/SmartFeedStudio/README.md) (Mermaid architecture diagrams, folder trees, CQRS flow references, and command cheat sheets)
   - Never leave documentation out of sync with actual code implementations.

4b. **Mandatory Test Coverage Documentation (`services/backend-api/test/`)**:

- Whenever a new `*.e2e-spec.ts` file is **added or modified** in `services/backend-api/test/`, you **MUST**:
  1.  Run the full E2E suite to confirm all tests pass: `pnpm --filter @smartfeed/backend-api test:e2e`
  2.  Update the coverage table in [services/backend-api/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/AGENTS.md) (section `🧪 Testing Policy & Coverage`)
  3.  Update the coverage table in [services/backend-api/README.md](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/README.md) (section `📊 E2E Test Coverage`)
- The **very first line** of `services/backend-api/README.md` section must always show the test run command:
  ```bash
  pnpm --filter @smartfeed/backend-api test:e2e
  ```

5. **Git Commit & Push Policy (Explicit User Trigger Only)**:
   - **NEVER** automatically perform `git commit` or `git push` immediately after making changes.
   - All code edits must be prepared, formatted, and verified locally first.
   - You MUST wait for the USER's explicit command (e.g., `/git-commit`, `/commit`, "вивантаж", "закоміть") before staging, committing, or pushing to remote repositories.

6. **Mandatory Post-Code-Writing Protocol (Self-Review, Error Checks, Skills & Formatting)**:
   - **Step 1 — Mandatory Domain Skills**: When writing or refactoring code, **ALWAYS** actively apply relevant best-practice skills (`vercel-react-best-practices` for React/Next.js, `nestjs-best-practices` for NestJS CQRS, `shadcn` for UI design systems, `playwright-best-practices` for E2E tests, `frontend-desing` for visual identity, `prisma-postgres` for database queries, `systematic-debugging` when resolving issues).
   - **Step 2 — Immediate Self-Code Review, Dead Code Elimination & Component Modularity**: Immediately after writing or modifying code, **automatically perform a rigorous architectural self-code review** validating:
     - **Component Size Limit & Single Responsibility**: React components must remain compact, clean, and modular (recommended max ~250–300 lines). Monolithic components (e.g. 700–1000+ lines) are **strictly prohibited**. Always decompose complex views into dedicated subcomponents (`*Dialog.tsx`, `*List.tsx`, `*Row.tsx`, `*Header.tsx`, `*Preview.tsx`, custom hooks).
     - **Zero Unused Imports & Dead Code**: Eliminate all unreferenced imports (e.g. from `lucide-react`, DTOs, or React hooks), unused variables, types, and unreachable code. Actively inspect IDE diagnostics and fix all unused items immediately.
     - **Architectural Integrity & Zero Gaps**: Strictly adhere to CQRS module boundaries, minimal React re-renders (`vercel-react-best-practices`), proper design token usage (`shadcn`), bundle efficiency, accessibility, type safety, and test isolation.
   - **Step 3 — Mandatory Typecheck, Diagnostics & Immediate Error Fixes**:
     - Immediately after writing or modifying code in ANY package (`services/backend-api`, `packages/shared`, `apps/desktop`, `apps/admin-portal`), the agent **MUST ALWAYS** execute static typechecking (`tsc --noEmit`, `pnpm build:shared`, `prisma generate` when schema changes).
     - **Zero Error Tolerance & Immediate Fixes**: If `tsc --noEmit` or IDE diagnostics report ANY errors (type mismatches, missing DTO fields, outdated Prisma types, enum conflicts, unhandled properties), the agent **MUST NOT leave them or report completion to the user**. The agent **MUST IMMEDIATELY investigate and fix every single error** until all packages compile with exit code 0.
     - **Mandatory Verification Commands**:
       - Backend API: `pnpm --filter @smartfeed/backend-api exec tsc --noEmit`
       - Shared contracts: `pnpm --filter @smartfeed/shared build`
       - Prisma schema changes: `pnpm --filter @smartfeed/backend-api exec prisma generate`
       - Desktop App: `pnpm --filter @smartfeed/desktop exec tsc --noEmit`
       - Admin Web Portal: `pnpm --filter admin-portal exec tsc --noEmit`
     - **Automated Tests**: Run relevant tests (`pnpm --filter @smartfeed/backend-api test:e2e` for backend, `pnpm test:desktop` for desktop, `pnpm test:admin` for admin portal). Guard against dev-cache overlap collisions (never run `next build` while `next dev` is running without proper cleanup).
   - **Step 4 — Mandatory Auto-Formatting**: **ALWAYS** execute `pnpm format` (Prettier) on all affected files to ensure zero formatting errors or style drift across the codebase.

7. **Mandatory Test Isolation & Complete Data Cleanup Policy (Zero Leftovers)**:
   - **Zero Test Data Leftovers**: Every automated test (Backend Jest E2E, Integration, Desktop/Admin Playwright E2E) that creates, modifies, or stores records (database users, licenses, navigation items, snapshots, files in object storage, localStorage, cookies) **MUST** guarantee 100% complete deletion and teardown of all test-generated data.
   - **Backend Database Teardown**: In all `*.e2e-spec.ts` files, `afterAll` (and `afterEach` where applicable) hooks must explicitly delete all created entities using stored IDs, created emails, and scoped wildcard matching (e.g. `e2e.test+*`, `admintest-*`, `analytics_*`, `nav.admin+*`, `nav.user+*`). Never leave orphaned rows in PostgreSQL or Redis.
   - **Frontend Test Isolation**: In Playwright E2E tests (`*.spec.ts`), always clear browser `localStorage`, `sessionStorage`, cookies, and route mocks before and after each test case to prevent state leakage and test cross-contamination.

8. **Mandatory 100% Internationalization (i18n) & Dedicated UI Localization Tests Policy**:
   - **Zero Hardcoded Strings & Zero Untranslated Backend Errors**: Whenever any new feature, UI screen, dialog, form, button, label, alert, placeholder, toast, or backend error message is created or modified:
     - **All user-facing text MUST be translated immediately**: Define all keys in both `uk` (Ukrainian) and `en` (English) locale dictionaries (`locales/uk/*.json`, `locales/en/*.json`).
     - **Backend Error Localization**: All error responses from the API must be intercepted, mapped, and translated via `getErrorMessage` or localized error helpers so that no raw English backend strings leak into the Ukrainian UI.
   - **Mandatory UI Localization Tests**: Every new or updated frontend feature/view **MUST** include dedicated Playwright UI tests explicitly asserting that all interactive elements, titles, descriptions, placeholders, and error/success alerts dynamically update and correctly translate when switching languages (`UA` ⇄ `EN`).

9. **Rule Files Size Limit & Continuous Modularization Policy (Max 12,000 Chars)**:
   - Every rule file in `.agents/rules/*.md` **MUST NEVER exceed 12,000 characters** (Antigravity IDE hard limit).
   - Whenever any rule file reaches ~10,000–11,000 characters, the agent **MUST** split the rules or create a new dedicated `.md` file in `.agents/rules/` with `trigger: always_on` (e.g. `testing_and_quality.md`, `commands.md`, etc.).
   - The agent **MUST ALWAYS** discover, read, and strictly follow all rule files located in `.agents/rules/` without exception.

10. **Mandatory Plan Review & Explicit User Command Before Execution Policy**:

- **Plans Location**: Whenever a new feature plan, architectural strategy, pricing matrix, or roadmap is requested or developed, the agent **MUST ALWAYS** save the full document in the repository folder `plans/<feature_name>.md` and register it in `plans/README.md`.
- **Strict Prohibition of Premature Execution**: The agent **MUST NEVER** automatically start modifying code, altering database schemas (`schema.prisma`), running seeders, or implementing features immediately after creating a plan.
- **Explicit User Trigger Only**: The agent **MUST STOP, present the plan path to the user, and WAIT** for the user to read, review, and issue an explicit command to begin implementation (e.g., "виконуй", "починай", "реалізуй план", "роби"). Any unauthorized, premature code execution without this trigger is strictly prohibited.

---

## ⚡ Essential Commands Cheat Sheet

| Task                            | Command                                                    |
| :------------------------------ | :--------------------------------------------------------- |
| **Start All (Docker + Apps)**   | `pnpm dev:all` _(або `pnpm start:dev`)_                    |
| **Start Docker Infrastructure** | `pnpm docker:up`                                           |
| **Stop Docker Infrastructure**  | `pnpm docker:down`                                         |
| **Run All Apps (Dev)**          | `pnpm dev`                                                 |
| **Run Backend API**             | `pnpm dev:backend`                                         |
| **Run Admin Portal**            | `pnpm dev:admin`                                           |
| **Run Desktop Vite**            | `pnpm dev:desktop`                                         |
| **Build Everything (Turbo)**    | `pnpm build`                                               |
| **Run Backend E2E Tests**       | `pnpm --filter @smartfeed/backend-api test:e2e`            |
| **Run Desktop E2E Tests**       | `pnpm test:desktop`                                        |
| **Run Desktop Tests (Headed)**  | `pnpm test:desktop:headed`                                 |
| **Run Desktop Tests (UI Mode)** | `pnpm test:desktop:ui`                                     |
| **Run Admin E2E Tests**         | `pnpm test:admin`                                          |
| **Run Admin Tests (Headed)**    | `pnpm test:admin:headed`                                   |
| **Run Admin Tests (UI Mode)**   | `pnpm test:admin:ui`                                       |
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
