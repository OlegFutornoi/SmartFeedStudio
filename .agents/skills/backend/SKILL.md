---
name: backend
description: Enterprise full-cycle backend CQRS engineering lifecycle orchestrator for SmartFeed Studio (NestJS 11, Prisma ORM, PostgreSQL 16, Redis, BullMQ). Use when designing, building, refactoring, securing, or testing backend controllers, CQRS commands/queries, services, Prisma schemas, database migrations, and BullMQ workers. Do not use for frontend React views or Tauri client UI; use frontend instead.
rules: [core, backend, database, security, testing]
---

# Backend Engineering Master Orchestrator

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/backend.md`, `.agents/rules/database.md`, `.agents/rules/security.md`, `.agents/rules/testing.md`.
2. Follow `AGENT-05` reference hierarchy: use golden templates (`.agents/templates/controller-with-query-dto.ts.md`, `cqrs-query-handler.ts.md`, `singleton-upsert-handler.ts.md`) or `// @golden` files; never copy unverified legacy code.
3. Note all invariant IDs relevant to the task (e.g. `CORE-01`, `CORE-04`, `ARCH-01` through `ARCH-05`, `BE-01` through `BE-10`, `DB-01` through `DB-12`, `SEC-01` through `SEC-05`, `TEST-01`, `TEST-06`).
4. If touching any framework or ORM API, call context7: `resolve-library-id {libraryName, query}` then `query-docs {libraryId, query}`.
5. Do not write or edit backend code until steps 1-4 are complete.

## Inputs

- Feature task prompt or bug report.
- Existing database schema in `services/backend-api/prisma/schema.prisma`.
- Shared contracts in `packages/shared/src/`.

## Procedure

1. Stage 1 - Task Analysis and Upfront Research: verify the native vs cloud boundary (`ARCH-01`). Check known backend pitfalls in `lessons-learned-registry`. Query `context7` for authoritative library signatures.
2. Stage 2 - Architecture and Shared Contracts First: define TypeScript DTOs, Zod schemas, and enums in `packages/shared/src/`. Compile contracts with `pnpm --filter @smartfeed/shared build`. Design the 4-layer defense model (`SEC-01`). Write deterministic task in `plans/active/BE-<num>-<short-title>.md` (or `FR-BE-<num>-<short-title>.md` if joint). Await user confirmation before coding.
3. Stage 3 - Database and Prisma Schema Architecture: apply database checklist (`DB-01` through `DB-12`). Verify 100% FK indexes (`@@index([fk])`), timestamptz(6), snake_case mapping, CUID primary keys, cascade deletes (`onDelete: Cascade`), zero N+1 queries. If running migrations, follow Expand/Contract with `SET lock_timeout = '2s'`.
4. Stage 4 - Automated Test Design (Jest TDD RED - `BE-08`): write Supertest E2E test in `services/backend-api/test/*.e2e-spec.ts`. Never write handler or service code before this test exists. Enforce mandatory `cleanDatabase` in `beforeAll` and `afterAll` (`TEST-01`). Assert 401 unauthenticated, 403 unauthorized, real business validation, and fail-fast on missing secrets. Execute test to verify expected failure (RED).
5. Stage 5 - Implementation with 4-Layer Defense (GREEN): implement Command, Handler, Query, Service, or Controller to turn tests GREEN. Enforce 1 file = 1 handler (<120-150 lines, `ARCH-04`). Decorate 100% of `@Body()` and `@Query()` with `class-validator` (`BE-01`). Protect mutations with `@UseGuards(JwtAuthGuard)` (`BE-02`). Protect quota state with mutex locks (`BE-07`). Re-compile runtime bundle with `pnpm --filter @smartfeed/backend-api build` so `dist/` is never stale.
6. Stage 6 - Code Review and DoD Verification: verify zero fallback secrets via grep (`BE-04`), verify secret masking on settings endpoints (`SEC-03`), verify zero `as any` in Prisma queries (`DB-12`), verify short `$transaction` blocks (`DB-08`). Run `pnpm --filter @smartfeed/backend-api exec tsc --noEmit`.
7. Stage 7 - Systematic Debugging: if tests fail, trace root cause backward. Inspect query plans with PostgreSQL `EXPLAIN ANALYZE` or inspect BullMQ queue status. Apply structural fix.
8. Stage 8 - Documentation and Coverage Sync: verify targeted test passes. Build `dist/`. Update coverage tables in `README.md` and `AGENTS.md` (`OPS-02`). Move task to `plans/completed/<filename>.md` and update `plans/README.md`.

## Outputs

- CQRS handlers adhering to the 1 file = 1 handler rule (<150 lines).
- DTO classes with 100% `class-validator` decorator coverage.
- Prisma schema migrations with 100% FK indexes.
- Jest E2E tests with complete `cleanDatabase` teardown.
- Synchronized test coverage documentation.

## Gate (stop condition)

- Automated gates pass with 0 regressions: `pnpm verify:fast`.
- Targeted backend E2E test passes: `pnpm --filter @smartfeed/backend-api test:e2e -- test/<spec>.e2e-spec.ts`.
- Production bundle compiled with fresh changes: `pnpm --filter @smartfeed/backend-api build`.
- Static typechecking exits with 0 errors: `pnpm --filter @smartfeed/backend-api exec tsc --noEmit`.
- Automated domain invariants check passes with 0 violations: `pnpm invariants:check`.
- Shared package builds cleanly: `pnpm --filter @smartfeed/shared build`.
- Zero orphaned rows in database after test teardown.
- Formatting applied: `pnpm format`.

## Never

- Never write application/handler code before writing a failing test (violates `BE-08`).
- Never leave `dist/` uncompiled after modifying backend code (violates `BE-08`, `AGENT-04`).
- Never manipulate local desktop workspace filesystems from cloud backend (violates `ARCH-01`).
- Never spawn desktop OS GUI explorers from cloud server (violates `ARCH-02`).
- Never bundle multiple CQRS handlers into a single file (violates `ARCH-04`).
- Never use procedural `findFirst` + `create/update` for singleton settings; use atomic `prisma.<model>.upsert` (violates `BE-07`).
- Never accept untyped `@Body()` or raw `@Query()` without validation DTOs (violates `BE-01`).
- Never leave mutation endpoints without `@UseGuards(JwtAuthGuard)` unless `@Public()` (violates `BE-02`).
- Never use hardcoded fallback secrets like `|| 'default-secret'` (violates `BE-04`).
- Never return unmasked merchant secret keys in REST responses (violates `SEC-03`).
- Never wrap external HTTP, S3, or BullMQ calls inside `$transaction()` (violates `DB-08`).

## References

- `references/cqrs-architecture.md` - read when structuring new CQRS modules.
- `references/prisma-patterns.md` - read when designing complex Prisma relations and transactions.
