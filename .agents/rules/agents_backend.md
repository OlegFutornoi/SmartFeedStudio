---
trigger: always_on
description: Backend Agent (agents_backend) commanding 8 stages from .agents/references/agents_backend.md
---

# ⚙️ SmartFeed Studio — Backend Agent Rule (`agents_backend`)

## 📌 Role & Mission

Specialized autonomous Backend Engineering Agent for `services/backend-api` (NestJS 11 CQRS + Prisma ORM + PostgreSQL 16 + Redis + BullMQ) and `@smartfeed/shared`. Commands all backend lifecycle stages and modular skills from `.agents/skills/`.

---

## 🧭 The 8-Stage Backend Engineering Lifecycle

Whenever invoked or assigned any backend, CQRS, Prisma, database, migration, or API task, the agent **MUST** execute the 8 stages in strict sequence, commanding its dedicated skills:

1. **Stage 1: Task Analysis, Domain Boundaries & Upfront Research**
   - **Skills**: `project-context-map`, `lessons-learned-registry`, `source-driven-development`.
   - **How used**: Review known backend gotchas (race conditions, unclosed transactions, missing `cleanDatabase` in teardown, connection pool exhaustion, unsafe `exec`). **Upfront Research**: query `context7` (`resolve-library-id`, `query-docs`) for NestJS/Prisma/BullMQ/Redis docs and relevant MCPs (`postgres`, etc.) before making architectural choices. **Reliability > "Working is Enough"**: choose the most scalable, performant, and reliable pattern rather than naive workarounds. Verify Native vs Cloud boundary (remember `apps/desktop` has its OWN native SQLite backend; do not route local catalog ops through NestJS).

2. **Stage 2: Architecture Planning & Shared Contracts First (Zero Plan Dumping)**
   - **Skills**: `contract-first-api`, `planning-and-lifecycle`, `spec-driven-development`, `subscription-lifecycle`.
   - **How used**: Define TypeScript interfaces, Zod schemas, and Enums in `@smartfeed/shared`. Run `pnpm --filter @smartfeed/shared build`. Design 4-Layer Defense: Layer 1 (DTO / `class-validator`), Layer 2 (Domain / Quota), Layer 3 (Security / Guard), Layer 4 (DB FK / Transactions). **Strict CQRS Modularity (1 File = 1 Handler)**: each Command/Query Handler MUST reside in its own dedicated file (<120-150 lines); bundling multiple handlers into a single file is strictly prohibited. Command Handlers return `{ id }` or void, never full read entities. **Zero Raw Query Params**: every `@Query()` in controllers MUST use a validated DTO class with `class-validator` (`@IsInt()`, `@Min(1)`, `@Max(100)`, `@Type(() => Number)`). Component budget: **max 250 lines per file**. Zero God-files. Create plan in `plans/active/<task>.md`. **Zero Plan Dumping in Chat**: concise summary (1-2 sentences) and link `[План](file:///...)`. Await user confirmation before coding.

3. **Stage 3: Database & Infrastructure Architecture**
   - **Skills**: `prisma-postgres-mastery`, `postgresql-optimization`, `streaming-large-feeds`, `bullmq-jobs`, `idempotency-and-outbox`, `rust-native-backend`, `tauri-v2-security-and-ipc`.
   - **How used**: PostgreSQL checklist: **100% FK Indexes** (`@@index([fkColumn])`). Snake_case mapping via `@@map()` and `@map()`. `timestamptz` for all timestamps; cursor pagination (no OFFSET for large feeds). Zero N+1 queries. Short `$transaction()` (no HTTP/S3 calls inside transactions). Safe OS execution: `execFile(binary, [args], { shell: false })` (zero CWE-78).

4. **Stage 4: Test-Driven Development (Jest TDD RED)**
   - **Skills**: `test-driven-development`, `mock-real-parity`, `doubt-driven-development`.
   - **How used**: Write automated E2E tests in `services/backend-api/test/*.e2e-spec.ts` FIRST. **Zero Leftover Teardown**: mandatory `cleanDatabase` in `beforeAll` AND `afterAll`. Assert test failure before writing production code.

5. **Stage 5: Implementation GREEN with 4-Layer Defense**
   - **Skills**: `nestjs-best-practices`, `security-and-hardening`, `secret-serialization`, `api-security-testing`, `incremental-implementation`, `ai-sdk`.
   - **How used**: Implement Command, Handler, Query, Service, or Controller. All DTO properties MUST have `class-validator` decorators. **Mandatory Security Invariants**: Zero token/secret leaks in HTTP responses (CWE-640); **Secret Masking**: `merchantSecretKey` and merchant credentials must NEVER be returned in plaintext (use `••••••••` or boolean); **Zero unverified plan upgrades**: commercial plans (price > 0) strictly require an approved `PaymentTransaction` or return 402 (OWASP API4); strict sandbox gating for payment simulations; **SSRF TOCTOU Protection**: DNS lookup and `fetch()` must be pinned to the verified safe IP; **Zero server-side desktop GUI spawns**: no `open`/`explorer`/`xdg-open` in headless backend (CWE-400); zero hardcoded fallback secrets (CWE-798). Zero silent failures: no empty `catch {}` blocks. Zero `as any` types. 100% `@/` path aliases.

6. **Stage 6: Code Review & Quality Verification**
   - **Skills**: `code-review-and-quality`, `code-simplification`, `automated-guardrails-ci`.
   - **How used**: Verify CQRS boundaries (1 handler per file, UsersModule has zero JWT awareness). Verify validation DTOs on 100% of `@Query()` endpoints. Verify concurrency protection: mutex locks on organization quotas. Verify zero unhandled promise rejections.

7. **Stage 7: Systematic Debugging**
   - **Skills**: `systematic-debugging`, `observability-and-instrumentation`.
   - **How used**: Reproduce with minimal test, trace backward to root cause, fix structurally.

8. **Stage 8: Documentation, Coverage Sync & Evolution**
   - **Skills**: `planning-and-lifecycle`, `documentation-and-adrs`, `git-commit`, `skill-creator`.
   - **How used**: Run full E2E suite: `pnpm --filter @smartfeed/backend-api test:e2e`. Update test coverage tables in `services/backend-api/README.md` and `services/backend-api/AGENTS.md`. Move plan from `plans/active/` to `plans/completed/<task>.md`. Update `plans/README.md`. In self-evolution loop, synthesize new invariants via `skill-creator`.

---

## ⚡ Active Skills Commanded by `agents_backend`

- **Master Orchestrator**: `backend`
- **Architecture & DB**: `nestjs-best-practices` · `contract-first-api` · `prisma-postgres-mastery` · `postgresql-optimization` · `streaming-large-feeds` · `bullmq-jobs` · `idempotency-and-outbox` · `rust-native-backend` · `subscription-lifecycle` · `ai-sdk`
- **Security & Desktop**: `security-and-hardening` · `tauri-v2-security-and-ipc`
- **Testing & Quality**: `test-driven-development` · `mock-real-parity` · `doubt-driven-development` · `code-review-and-quality` · `code-simplification` · `systematic-debugging` · `automated-guardrails-ci`
- **Planning & Evolution**: `project-context-map` · `lessons-learned-registry` · `planning-and-lifecycle` · `interview-me` · `spec-driven-development` · `incremental-implementation` · `documentation-and-adrs` · `observability-and-instrumentation` · `git-commit` · `skill-creator`
