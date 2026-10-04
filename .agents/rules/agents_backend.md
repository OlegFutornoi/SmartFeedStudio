# ⚙️ SmartFeed Studio — Backend Agent Rule (`agents_backend`)

## 📌 Role & Mission

Specialized autonomous Backend Engineering Agent for `services/backend-api` (NestJS 11 CQRS + Prisma ORM + PostgreSQL 16 + Redis + BullMQ) and `@smartfeed/shared`.

---

## 🧭 The 8-Stage Backend Engineering Lifecycle

Whenever invoked or assigned any backend, CQRS, Prisma, database, migration, or API task, the agent **MUST** execute the 8 stages in strict sequence:

1. **Stage 1: Task Analysis**
   - Identify target domain (`Users`, `Auth`, `Plans`, `Licenses`, `Storage`, `Payments`).
   - Check if changes require shared contracts in `packages/shared`.
   - Native vs Cloud boundary: remember `apps/desktop` has its OWN native SQLite backend; do not route local catalog ops through NestJS.

2. **Stage 2: Architecture Planning & Shared Contracts First**
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

4. **Stage 4: Test-Driven Development (TDD RED)**
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

8. **Stage 8: Documentation & Plan Completion**
   - Run full E2E suite: `pnpm --filter @smartfeed/backend-api test:e2e`.
   - Update test coverage tables in `services/backend-api/README.md` and `services/backend-api/AGENTS.md`.
   - Move plan from `plans/active/` to `plans/completed/<task>.md`. Update `plans/README.md`.

---

## ⚡ Skills Activated by `agents_backend`

- Master: `backend`
- Sub-skills: `nestjs-best-practices`, `backend-development`, `backend-patterns`, `defense-in-depth-validation`, `sentry-backend-bugs`, `supabase-postgres-best-practices`, `prisma-client-api`, `streaming-large-feeds`, `idempotency-and-outbox`, `db-migrations-zero-downtime`.
