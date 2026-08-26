---
trigger: always_on
description: Quality assurance, documentation synchronization, git commit policy, self-review protocol, and test isolation teardown rules.
---

# 🛡️ SmartFeed Studio — Testing, Quality & Operational Rules

## 4. Mandatory Documentation & Architecture Synchronization

- **Rule**: Whenever any architectural change occurs (new modules, CQRS commands/queries/events, DB schema changes in `schema.prisma`, shared DTOs/enums in `@smartfeed/shared`, Tauri commands/services, API endpoints, or ports):
  - **Always update documentation immediately**:
    1. Root [AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/AGENTS.md) and [.agents/rules/rules.md](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/rules.md)
    2. Sub-project guides ([services/backend-api/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/AGENTS.md), [apps/admin-portal/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/AGENTS.md), [apps/desktop/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/AGENTS.md), [packages/shared/AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/packages/shared/AGENTS.md))
    3. Root [README.md](file:///Users/oleg/AQA/SmartFeedStudio/README.md) (including Mermaid architecture diagrams, folder trees, and CQRS flow steps).
  - Outdated or drifting documentation is strictly prohibited.

---

## 4b. Mandatory Test Coverage Documentation (`services/backend-api/test/`)

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

## 5. Git Commit & Push Policy (Explicit User Trigger Only)

- **Rule**: The agent must **NEVER** automatically perform `git commit` or `git push` immediately after making changes or fixes.
- All changes must be tested and verified locally, and presented to the user.
- Staging, committing, and pushing must occur **strictly** upon the user's explicit request (e.g., `/git-commit`, `/commit`, "вивантаж", "закоміть").

---

## 6. Mandatory Post-Code-Writing Protocol (Self-Review, Error Checks, Skills & Formatting)

- **Rule (Step 1 — Mandatory Domain Skills)**: When writing or refactoring code, the agent must **ALWAYS** actively apply relevant best-practice skills (`vercel-react-best-practices` for React/Next.js, `nestjs-best-practices` for NestJS CQRS, `shadcn` for UI design systems, `playwright-best-practices` for E2E tests, `frontend-desing` for visual standards, `prisma-postgres` for database operations, `systematic-debugging` for debugging).
- **Rule (Step 2 — Immediate Self-Code Review, Dead Code Elimination & Component Modularity)**: Immediately after writing or modifying code, the agent must **automatically perform a rigorous architectural self-code review** against these best practices:
  - **Component Size Limit & Single Responsibility**: React components must remain compact, clean, and modular (recommended max ~250–300 lines). Monolithic components (e.g. 700–1000+ lines) are **strictly prohibited**. Always decompose complex views into dedicated subcomponents (`*Dialog.tsx`, `*List.tsx`, `*Row.tsx`, `*Header.tsx`, `*Preview.tsx`, custom hooks).
  - **Zero Unused Imports & Dead Code**: Eliminate all unreferenced imports (e.g. from `lucide-react`, DTOs, or React hooks), unused variables, types, and unreachable code. Actively inspect IDE diagnostics and fix all unused items immediately.
  - **Architectural Integrity & Zero Gaps**: Strictly adhere to CQRS module boundaries, minimal React re-renders (`vercel-react-best-practices`), proper design token usage (`shadcn`), bundle efficiency, accessibility, type safety, and test isolation.
- **Rule (Step 3 — Mandatory Typecheck, Diagnostics & Immediate Error Fixes)**:
  - Immediately after writing or modifying code in ANY package (`services/backend-api`, `packages/shared`, `apps/desktop`, `apps/admin-portal`), the agent **MUST ALWAYS** execute static typechecking (`tsc --noEmit`, `pnpm build:shared`, `prisma generate` when schema changes).
  - **Zero Error Tolerance & Immediate Fixes**: If `tsc --noEmit` or IDE diagnostics report ANY errors (type mismatches, missing DTO fields, outdated Prisma types, enum conflicts, unhandled properties), the agent **MUST NOT leave them or report completion to the user**. The agent **MUST IMMEDIATELY investigate and fix every single error** until all packages compile with exit code 0.
  - **Mandatory Verification Commands**:
    - Backend API: `pnpm --filter @smartfeed/backend-api exec tsc --noEmit`
    - Shared contracts: `pnpm --filter @smartfeed/shared build`
    - Prisma schema changes: `pnpm --filter @smartfeed/backend-api exec prisma generate`
    - Desktop App: `pnpm --filter @smartfeed/desktop exec tsc --noEmit`
    - Admin Web Portal: `pnpm --filter admin-portal exec tsc --noEmit`
  - **Automated Tests**: Run relevant tests (`pnpm --filter @smartfeed/backend-api test:e2e` for backend, `pnpm test:desktop` for desktop, `pnpm test:admin` for admin portal). Guard against dev-cache overlap collisions (never run `next build` while `next dev` is running without proper cleanup).
- **Rule (Step 4 — Mandatory Auto-Formatting)**: The agent must **ALWAYS** execute `pnpm format` (Prettier) to verify that no formatting errors or style inconsistencies exist.

---

## 7. Mandatory Test Isolation & Complete Data Cleanup Policy (Zero Leftovers)

- **Rule**: Every automated test (Backend Jest E2E, Integration, Desktop/Admin Playwright E2E) that creates, modifies, or stores records (database users, licenses, navigation items, snapshots, files in object storage, localStorage, cookies) **MUST** guarantee 100% complete deletion and teardown of all test-generated data:
  - **Backend Database Teardown**: In all `*.e2e-spec.ts` files, `afterAll` (and `afterEach` where applicable) hooks must explicitly delete all created entities using stored IDs, created emails, and scoped wildcard matching (e.g. `e2e.test+*`, `admintest-*`, `analytics_*`, `nav.admin+*`, `nav.user+*`). Never leave orphaned rows in PostgreSQL or Redis.
  - **Frontend Test Isolation**: In Playwright E2E tests (`*.spec.ts`), always clear browser `localStorage`, `sessionStorage`, cookies, and route mocks before and after each test case to prevent state leakage and test cross-contamination.

---

## 8. Mandatory 100% Internationalization (i18n) & Dedicated UI Localization Tests Policy

- **Rule (Zero Untranslated Strings & Errors)**: Whenever any new feature, UI screen, dialog, form, button, label, alert, placeholder, toast, or backend error message is created or modified:
  - **Immediate Bilingual Translation**: Define all keys in both `uk` (Ukrainian) and `en` (English) locale dictionaries (`locales/uk/*.json`, `locales/en/*.json`).
  - **Backend Error Mapping**: All error responses from the API must be intercepted, mapped, and translated via `getErrorMessage` or localized error helpers so that no raw English backend strings leak into the Ukrainian UI.
- **Rule (Mandatory UI Localization Tests)**: Every new or updated frontend feature/view **MUST** include dedicated Playwright UI tests explicitly asserting that all interactive elements, titles, descriptions, placeholders, and error/success alerts dynamically update and correctly translate when switching languages (`UA` ⇄ `EN`).

---

## 9. Rule Files Size Limit & Continuous Modularization Policy (Max 12,000 Chars)

- **Rule**: Every rule file in `.agents/rules/*.md` **MUST NEVER exceed 12,000 characters** (Antigravity IDE hard limit).
- Whenever any rule file reaches ~10,000–11,000 characters, the agent **MUST** split the rules or create a new dedicated `.md` file in `.agents/rules/` with `trigger: always_on` (e.g. `testing_and_quality.md`, `commands.md`, etc.).
- The agent **MUST ALWAYS** discover, read, and strictly follow all rule files located in `.agents/rules/` without exception.

---

## 10. Mandatory Plan Review & Explicit User Command Before Execution Policy

- **Rule (Plans Location)**: Whenever a new feature plan, architectural strategy, pricing matrix, or roadmap is requested or developed, the agent **MUST ALWAYS** save the full document in the repository folder `plans/<feature_name>.md` and register it in `plans/README.md`.
- **Rule (Strict Prohibition of Premature Execution)**: The agent **MUST NEVER** automatically start modifying code, altering database schemas (`schema.prisma`), running seeders, or implementing features immediately after creating a plan.
- **Rule (Explicit User Trigger Only)**: The agent **MUST STOP, present the plan path to the user, and WAIT** for the user to read, review, and issue an explicit command to begin implementation (e.g., "виконуй", "починай", "реалізуй план", "роби"). Any unauthorized, premature code execution without this trigger is strictly prohibited.
