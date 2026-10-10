---
trigger: always_on
description: Mandatory domain skills matrix, code writing best practices, and pre-commit self-review checklist.
---

# 🧠 SmartFeed Studio — Code Review, Error Prevention & Skills Matrix

## 📌 Core Directive: Zero-Defect Engineering & Rigorous Pre-Commit Review

Whenever writing, refactoring, reviewing, or testing code in this monorepo, the agent **MUST ALWAYS** apply the specialized skills matrix to structurally prevent errors at design time, compile time, runtime, and review time.

---

## 🛠 1. Mandatory Domain Skills Matrix by Layer

### ⚙️ A. Backend Architecture & CQRS Services (`services/backend-api`, Tauri `src-tauri`)

| Skill                         | Key Rules & Error Prevention Focus                                                                                                                                                                                   |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`backend`**                 | **Full-Cycle Lifecycle Master**: 7 stages (Analysis → Planning → Architecture → TDD RED → Implementation GREEN with 4-layer defense → Code Review & Audit → Debugging) with zero-defect security and zero God-files. |
| **`nestjs-best-practices`**   | Strict CQRS decoupling; zero circular imports; DI singletons; centralized exception filters (`GlobalHttpExceptionFilter`); validation pipes with `whitelist: true`.                                                  |
| **`contract-first-api`**      | Shared DTO contracts, Zod validation schemas, and enum types in `@smartfeed/shared`; zero inline types.                                                                                                              |
| **`rust-native-backend`**     | Tauri v2 Rust SQLCipher SQLite backend (`db.rs`), atomic transactions (`tx.commit()?`), `thiserror` mapping, cascade deletions, Clippy zero-warnings.                                                                |
| **`prisma-postgres-mastery`** | **100% Foreign Key Indexes**; `timestamptz` timestamps; snake_case DB mapping via `@@map()`; no OFFSET pagination; connection pooling via `@prisma/adapter-pg`; zero N+1 queries.                                    |
| **`postgresql-optimization`** | JSONB with GIN indexes; pg_trgm text search; cursor pagination; short transactions without external HTTP calls.                                                                                                      |
| **`streaming-large-feeds`**   | SAX XML/CSV streaming for 100k+ SKU catalogs with memory backpressure (chunked `bulkUpsert` in batches of 500-1000 items).                                                                                           |
| **`bullmq-jobs`**             | BullMQ async queue architecture; exponential backoff retries; Dead Letter Queue (DLQ); worker idempotency (`jobId`); memory backpressure.                                                                            |
| **`idempotency-and-outbox`**  | Redis idempotency keys; Prisma transactional outbox pattern for webhooks and payment events.                                                                                                                         |
| **`subscription-lifecycle`**  | Dynamic expiration calculations; grace periods; automatic downgrade fallbacks; quota enforcement across team seats, XML SKUs, AI credits, S3 storage.                                                                |
| **`security-and-hardening`**  | 4-Layer Defense: Layer 1 (DTO Zod/class-validator), Layer 2 (Domain/Quota), Layer 3 (RBAC/Tenant Guard), Layer 4 (DB FK/Transactions); CWE-78 prevention via `execFile`.                                             |
| **`systematic-debugging`**    | 4-Phase systematic debugging: 1. Reproduce with minimal test; 2. Trace root cause backward; 3. Implement structural fix; 4. Verify 100% test pass.                                                                   |

---

### 💻 B. Frontend & UI/UX Design (`apps/desktop`, `apps/admin-portal`)

| Skill                             | Key Rules & Error Prevention Focus                                                                                                                                                                        |
| :-------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`frontend`**                    | **Full-Cycle Lifecycle Master**: 7 stages (Task Analysis → Planning → Architecture → Playwright TDD RED → Implementation GREEN → DoD Review → Debugging) with 100% theme harmony and zero duplicate CTAs. |
| **`ui-ux-pro-max`**               | **100% Solid Sticky Headers** (`bg-card`, `bg-muted`, `bg-background`); semantic design tokens only; zero duplicate action buttons between toolbar and empty state; <250-300 lines modularity budget.     |
| **`vercel-react-best-practices`** | Eliminate redundant re-renders; no `React.StrictMode` double-mounting in dev; in-flight request deduplication via `useRef`; lean `useCallback` dependency arrays.                                         |
| **`i18n-localization`**           | **100% Bilingual Parity**: Zero hardcoded strings; all copy in both `uk` and `en` dictionaries; tooltips (`title={t('...')}`); error mapping via `getErrorMessage`; validated via `pnpm i18n:check`.      |
| **`emil-design-eng`**             | Editorial spring animations; refined micro-interactions; optimistic UI updates; smooth dialog/dropdown transitions.                                                                                       |
| **`image`**                       | Asset generation, Sharp WebP compression, lazy loading, and placeholder handling.                                                                                                                         |
| **`browser-debugging`**           | Playwright MCP interactive inspection of live DOM tree (`browser_snapshot`), console errors, network waterfalls, and screenshots.                                                                         |

---

### 🧪 C. Testing, Quality Assurance & Anti-Patterns

| Skill                         | Key Rules & Error Prevention Focus                                                                                                                                                          |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`playwright-automation`**   | Page Object Model (POM); resilient `data-testid` selectors; deterministic network idle waits; dedicated bilingual tests (UA ⇄ EN); single-request verification (`requestCount === 1`).      |
| **`test-driven-development`** | Strict RED → GREEN → REFACTOR cycle; 100% test isolation with centralized `cleanDatabase` teardown in `beforeAll` and `afterAll`; zero orphan DB records.                                   |
| **`mock-real-parity`**        | **100% Behavioral Parity**: Local in-memory mock (`mockDatabaseDriver`), Tauri SQLite, and NestJS PostgreSQL return identical data relations (`supplierName`), cascade deletes, and errors. |
| **`automated-guardrails-ci`** | ESLint zero-errors (`max-lines: 300`, `no-restricted-imports`); TypeScript strict typecheck (`tsc --noEmit`); contract builds.                                                              |

---

### 🔍 D. Code Review & Engineering Protocol

| Skill                                        | Key Rules & Error Prevention Focus                                                                                                                              |
| :------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`review`** & **`code-review-and-quality`** | **Master Reviewers**: 5-axis review (correctness, architecture, security, readability, performance) + CQRS boundaries, zero N+1, and 100% i18n.                 |
| **`doubt-driven-development`**               | Adversarial stress-testing of non-trivial architectural decisions, TOCTOU race conditions, and quota edge cases.                                                |
| **`planning-and-lifecycle`**                 | Create bite-sized, deterministic implementation plans in `plans/active/<feature>.md` with clear review checkpoints and explicit user approval before execution. |
| **`incremental-implementation`**             | Slice tasks into thin vertical slices (<250 lines budget per component) and verify each slice incrementally.                                                    |

---

## 🛡 2. Mandatory Pre-Commit Self-Review Checklist

Before reporting completion to the user or preparing any changes:

1. ✅ **Architectural Integrity**: Does backend code respect CQRS boundaries? Does frontend isolate UI state from data fetchers?
2. ✅ **Validation at Every Layer**: Is input validated at DTO boundary, service layer, and database constraints?
3. ✅ **Component Modularity**: Are React components clean and modular (max ~250–300 lines)? Monolithic components (700+ lines) are strictly prohibited.
4. ✅ **Zero Dead Code**: Are there any unused imports (e.g. from `lucide-react`, React hooks, DTOs), unused variables, or dead types?
5. ✅ **100% i18n Localization & Zero Untranslated Keys**: Are all labels, toasts, modals, errors, placeholders, and tooltips/titles (`title={t('...')}`) translated in both `uk` and `en` locale files?
6. ✅ **Zero Leftover Teardown**: Do all automated tests cleanly teardown their data using `cleanDatabase`?
7. ✅ **Static Typecheck Clean**: Does `tsc --noEmit` pass with **0 errors** across all packages?
8. ✅ **Auto-Formatting**: Has `pnpm format` been executed?
9. ✅ **Visual Testing & `ui-ux-pro-max` DoD**: Has the UI been visually tested and verified against all `ui-ux-pro-max` standards before marking the task complete?
10. ✅ **Zero Off-Scheme Palette Colors**: Strict semantic tokens (`primary`, `border`, `card`, `muted`, `background`). Hardcoded palette colors (`purple-*`, `violet-*`, `fuchsia-*`, `pink-*`) are strictly prohibited.
11. ✅ **Zero Duplicate CTA Buttons**: Eliminate duplicate buttons across toolbar/header/empty states.
12. ✅ **100% `@/` Path Aliases & Zero Relative Imports (`../`)**: All internal project imports strictly use `@/` or `@smartfeed/shared`. Relative imports (`../`, `./`) are strictly prohibited.
13. ✅ **Zero File Dumping in Chat**: Never dump or rewrite entire file contents in chat. Brief summary in chat, all full content into files/artifacts.
