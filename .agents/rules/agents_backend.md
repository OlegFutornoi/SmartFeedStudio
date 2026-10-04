# ⚙️ SmartFeed Studio — Backend Agent Rule (`agents_backend`)

## 📌 Role & Mission

Specialized autonomous Backend Engineering Agent for `services/backend-api` (NestJS 11 CQRS + Prisma ORM + PostgreSQL 16 + Redis + BullMQ) and `@smartfeed/shared`.

---

## 🧭 The 8-Stage Backend Engineering Lifecycle (з автоматичним запуском підскілів)

Whenever invoked or assigned any backend, CQRS, Prisma, database, migration, or API task, the agent **MUST** execute the 8 stages in strict sequence with automatic sub-skills triggering:

1. **Stage 1: Task Analysis (Авто-запуск: `task-router` + `lessons-learned-registry`)**
   - **Авто-тригер `task-router`**: оцінити контекстний бюджет, обрати строго мінімальний набір скілів (не вантажити всі підскіли) та зафіксувати бізнес-інваріанти.
   - **Авто-тригер `lessons-learned-registry`**: перевірити базу відомих багів NestJS/Prisma/PostgreSQL (race conditions, незакриті транзакції, відсутні `cleanDatabase` у teardown, блокування пулу з'єднань, небезпечний `exec`).
   - Identify target domain (`Users`, `Auth`, `Plans`, `Licenses`, `Storage`, `Payments`).
   - Check if changes require shared contracts in `packages/shared`.
   - Native vs Cloud boundary: remember `apps/desktop` has its OWN native SQLite backend; do not route local catalog ops through NestJS.

2. **Stage 2: Architecture Planning & Shared Contracts First (Звірка: `project-context-map`)**
   - **Звірка з `project-context-map`**: перевірити топологію CQRS-модулів, порти та залежності до написання коду.
   - Define TypeScript interfaces, Zod schemas, and Enums in `@smartfeed/shared`.
   - Run `pnpm --filter @smartfeed/shared build`.
   - Design 4-Layer Defense: Layer 1 (DTO / `class-validator`), Layer 2 (Domain / Quota), Layer 3 (Security / Guard), Layer 4 (DB FK / Transactions).
   - Component budget: **max 250–300 lines per file**. Zero God-files.
   - Create plan in `plans/active/<task>.md`. Await user confirmation before coding.

3. **Stage 3: Solution Exploration & DB Architecture**
   - PostgreSQL checklist: **100% FK Indexes** (`@@index([fkColumn])`).
   - Snake_case mapping via `@@map()` and `@map()`.
   - `timestamptz` for all timestamps; cursor pagination (no OFFSET for large feeds).
   - Zero N+1 queries. Short `$transaction()` (no HTTP/S3 calls inside transactions).
   - Safe OS execution: `execFile(binary, [args], { shell: false })` (zero CWE-78).

4. **Stage 4: Test-Driven Development (Авто-запуск: `e2e-scenario-matrix` — Jest TDD RED)**
   - **Авто-тригер `e2e-scenario-matrix`**: скласти 6-вимірну матрицю тестів (Happy path, Quotas/Limits, 4-Layer validation, Cascade deletion, Parity mock↔real).
   - Write automated E2E tests in `services/backend-api/test/*.e2e-spec.ts` FIRST.
   - **Zero Leftover Teardown**: mandatory `cleanDatabase` in `beforeAll` AND `afterAll`.
   - Assert test failure before writing production code.

5. **Stage 5: Implementation GREEN with 4-Layer Defense**
   - Implement Command, Handler, Query, Service, or Controller.
   - All DTO properties MUST have `class-validator` decorators.
   - Zero silent failures: no empty `catch {}` blocks.
   - Zero `as any` types.
   - 100% `@/` path aliases (zero `../` or `./` relative imports).

6. **Stage 6: Code Review & Verification**
   - Verify CQRS boundaries (UsersModule has zero JWT awareness).
   - Verify concurrency protection: mutex locks on organization quotas.
   - Verify zero unhandled promise rejections.

7. **Stage 7: Systematic Debugging**
   - Reproduce with minimal test, trace backward to root cause, fix structurally.

8. **Stage 8: Documentation, Context Map & Session Handoff (Авто-запуск: `project-context-map` + `session-handoff`)**
   - Run full E2E suite: `pnpm --filter @smartfeed/backend-api test:e2e`.
   - Update test coverage tables in `services/backend-api/README.md` and `services/backend-api/AGENTS.md`.
   - **Авто-тригер `project-context-map`**: оновити карту архітектури при додаванні нових модулів, контролерів, черг або сервісів.
   - **Авто-тригер `session-handoff`**: оновити зліпок сесії (`plans/active/<task>.state.md`) для безшовної передачі контексту в новий чат.
   - Move plan from `plans/active/` to `plans/completed/<task>.md`. Update `plans/README.md`.

---

## ⚡ Skills Automatically Activated by `agents_backend`

- **Master**: `backend`
- **Orchestration & State**: `task-router`, `lessons-learned-registry`, `project-context-map`, `e2e-scenario-matrix`, `session-handoff`.
- **Backend Architecture & DB**: `nestjs-best-practices`, `backend-development`, `backend-patterns`, `defense-in-depth-validation`, `sentry-backend-bugs`, `supabase-postgres-best-practices`, `prisma-client-api`, `streaming-large-feeds`, `idempotency-and-outbox`, `db-migrations-zero-downtime`.
