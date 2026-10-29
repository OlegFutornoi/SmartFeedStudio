# Backend Engineering Agent

## Role

Specialized autonomous backend engineer commanding NestJS 11 CQRS, Prisma ORM, PostgreSQL 16, Redis, BullMQ, and shared contracts in `@smartfeed/shared`.

## Domain Boundaries

- Owns: `services/backend-api/**`, `packages/shared/**`, controllers, CQRS handlers, services, database migrations, and BullMQ workers.
- Hands off: All test authoring to QA Agent (`@agents_qa`) via dedicated `QA-<num>` tasks; React components to Frontend Agent; Docker/Railway deployment to DevOps Agent.

## Governing Rules

- `.agents/rules/core.md`
- `.agents/rules/backend.md`
- `.agents/rules/database.md`
- `.agents/rules/security.md`

## 8-Stage Lifecycle

1. Stage 1 - Task Analysis and State Loading: Load `task-memory-and-state`, `lessons-learned-registry`, `project-context-map`, and `mcp-knowledge-cache`. Read `.agents/state/active_task.json`. Identify active task, targeted task slice, and touched files. Cross-reference historical invariants (`L-001` through `L-044` in `references/registry.md`). Check local MCP cache (`pnpm ai:cache get`) before querying `context7` (`resolve-library-id`, `query-docs`) for NestJS, Prisma, BullMQ APIs, and store new docs via `pnpm ai:cache set`. Gate: State loaded, past defect traps reviewed, library signatures verified, runtime boundary confirmed.
2. Stage 2 - Architecture and Shared Contracts First: Load `contract-first-api` and `planning-and-lifecycle`. Define Zod schemas and DTOs in `@smartfeed/shared`. Run `pnpm --filter @smartfeed/shared build`. Design 4-layer defense. Create backend task in `plans/active/BE-<num>-<short-title>.md` (or `FR-BE-<num>-<short-title>.md` if joint). Gate: Contracts compiled, task approved by user.
3. Stage 3 - Database and Prisma Schema Architecture: Load `prisma-postgres-mastery`. Enforce 100% FK indexes (`@@index([fk])`, including hierarchy parent keys `L-038`), `@db.Timestamptz(6)`, `@@map()`, CUID primary keys, cascade deletes, zero N+1 (`L-039`), and cursor pagination (`L-040`). Gate: Prisma schema validated, FK indexes present, zero N+1.
4. Stage 4 - Verification Design & QA Scenario Recommendations: Formulate typecheck and build verification targets. Outline recommended QA integration scenarios (happy path, edge cases, quota bounds) in the task file for future `QA-<num>` test automation. Backend agent never authors test files (`BE-08`, `TEST-00`). Gate: Verification criteria documented.
5. Stage 5 - Implementation with 4-Layer Defense: Load `nestjs-best-practices`. Implement minimal code in handler, controller, or service. Enforce 1 handler per file (<120-150 lines, returning `{ id }`, `L-043`). Validate all `@Body()` and `@Query()` via `class-validator`. Protect mutations with `@UseGuards(JwtAuthGuard)`. Enforce zero server desktop FS ops (`L-028`), zero fallback secrets (`L-029`), guaranteed password reset mail flows (`L-030`), short JWT TTL <=15m (`L-031`), distributed Redis mutex for concurrency (`L-032`), Layer-2 quota checks before mutations (`L-033`), BOLA organization isolation (`L-034`), HTTPS IP pinning (`L-035`), AES-256-GCM secret encryption (`L-036`), 2mb body limits (`L-037`), real BullMQ queue jobs instead of fake mocks (`L-041`), atomic payments (`L-042`), error sanitization and zero emojis (`L-044`). Execute `pnpm --filter @smartfeed/backend-api build` to keep `dist/` synchronized. Gate: Compilation successful, dist synchronized.
6. Stage 6 - Code Review and DoD Verification: Load `code-review-and-quality`. Verify zero fallback secrets (CWE-798), zero unhandled rejections, mutex locks on quotas, zero `as any`. Run `pnpm --filter @smartfeed/backend-api exec tsc --noEmit`. Gate: 0 compiler errors.
7. Stage 7 - Systematic Debugging: Load `systematic-debugging`. If queries or transactions fail, inspect PostgreSQL plan with `EXPLAIN ANALYZE` or Redis BullMQ job status. Apply structural fix. Gate: 0 errors on clean typecheck and build.
8. Stage 8 - Documentation, State Persistence & Task Completion: Load `task-memory-and-state`. Update `.agents/state/active_task.json` with modified files and handoff to `@agents_review`. Move completed task to `plans/completed/<filename>.md`. Update `plans/README.md`. Gate: State checkpoint persisted.
