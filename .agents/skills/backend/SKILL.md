---
name: backend
description: >-
  Enterprise full-cycle backend engineering skill for SmartFeed Studio (NestJS 11 CQRS, Prisma ORM, PostgreSQL, Redis, BullMQ). Guides and executes the complete 7-stage backend development lifecycle: 1. Task Analysis, 2. Architecture Planning, 3. Solution Exploration, 4. Test-Driven Development (TDD), 5. Implementation with 4-Layer Defense, 6. Code Review & Verification, 7. Systematic Debugging. Enforces zero-defect security, PostgreSQL indexing, 100% test isolation with cleanDatabase, zero God-files (<250-300 lines), and strict CQRS boundaries. Use whenever designing, implementing, refactoring, securing, testing, or reviewing backend services, controllers, handlers, database schemas, or background jobs.
---

# 🛡️ Enterprise Backend Engineering Lifecycle (SmartFeed Studio)

A comprehensive, full-cycle backend engineering skill for **SmartFeed Studio**. It orchestrates domain rules, security standards, reliability patterns, and architectural discipline across the 7-phase backend development lifecycle.

---

## 🧭 1. Orchestrated Skills & Rules Architecture

This skill synthesizes and enforces the project's backend rules and specialized skills:

```text
                               ┌────────────────────────────────┐
                               │       backend (Lifecycle)      │
                               └───────────────┬────────────────┘
          ┌───────────────────────────┬────────┴───────────────────┬───────────────────────────┐
          ▼                           ▼                            ▼                           ▼
┌───────────────────┐       ┌───────────────────┐        ┌───────────────────┐       ┌───────────────────┐
│ Architecture/CQRS │       │ Security & Valid  │        │ DB & Performance  │       │ QA & Debugging    │
├───────────────────┤       ├───────────────────┤        ├───────────────────┤       ├───────────────────┤
│ nestjs-best-pract │       │ defense-in-depth  │        │ supabase-postgres │       │ test-driven-dev   │
│ backend-patterns  │       │ backend-security  │        │ prisma-postgres   │       │ testing-anti-patt │
│ rules.md          │       │ sentry-backend    │        │ prisma-client-api │       │ systematic-debug  │
│ engineering-disc  │       │ OWASP Top 10      │        │ postgres_skills   │       │ teardown.helper   │
└───────────────────┘       └───────────────────┘        └───────────────────┘       └───────────────────┘
```

### 💎 Iron Laws of Backend Engineering

1. **Architecture & Scalability > Speed & Naive Simplicity**: "Working" is not enough. Modular design, CQRS separation, and concurrency safety are mandatory from day one.
2. **Zero God-Files**: Every file (controller, handler, service, DTO, repository) MUST stay under **250–300 lines**. Monoliths are strictly prohibited.
3. **No Code Without a Failing Test First (TDD)**: Always write the test first, observe it fail for the right reason (RED), then implement minimal code (GREEN).
4. **4-Layer Defense-in-Depth**: Every data operation must validate at DTO, Domain/Quota, Security/Guard, and DB Constraint layers.
5. **Zero Test Data Leftovers**: Every test MUST use `cleanDatabase` in `beforeAll` and `afterAll` with FK-safe teardown.
6. **Zero Silent Failures & Zero `as any`**: No empty `catch {}`, no unsafe `any` casts, no command injection (`execFile` only).

---

## 🔄 2. The 7-Stage Backend Development Workflow

```mermaid
flowchart TD
    S1[Phase 1: Task Analysis & Scope Discovery] --> S2[Phase 2: Task Planning & Shared Contracts]
    S2 --> S3[Phase 3: Solution & Architectural Design]
    S3 --> S4[Phase 4: TDD - Failing Automated Tests (RED)]
    S4 --> S5[Phase 5: Implementation & 4-Layer Defense (GREEN)]
    S5 --> S6[Phase 6: Rigorous Code Review & Verification]
    S6 --> S7[Phase 7: Systematic Debugging & Error Remediation]
```

---

### 🔍 Phase 1: Аналіз задачі (Task Analysis & Scope Discovery)

Before writing any code or modifying schemas, systematically analyze the domain requirements:

1. **Target Boundary & Runtime**:
   - Is this cloud backend (`services/backend-api` NestJS) or desktop local backend (`apps/desktop` Tauri/SQLite)?
   - _Never route local desktop catalog operations through cloud NestJS._
2. **Actor Scoping & RBAC**:
   - Who initiates the request? (`SUPER_ADMIN`, `ADMIN`, `USER`, or Public).
   - Tenant scoping: Does the operation require `organizationId` isolation?
3. **Data Flow & Resource Quotas**:
   - Map inputs, query params, expected responses, and side effects.
   - Check license quotas: team seats, catalog SKU counts, storage limits, export frequencies.
4. **Failure Modes & Edge Cases**:
   - Network timeouts, concurrent duplicate submissions, DB unique collisions, third-party service downtime.

> **Gate 1 Check**: Are actors, tenant boundaries, inputs, outputs, and failure modes fully clarified?

---

### 📋 Phase 2: Планування задачі (Task Planning & Shared Contracts)

_Refer to [.agents/rules/plans_lifecycle.md](file:///.agents/rules/plans_lifecycle.md) and [.agents/rules/engineering_discipline_and_planning.md](file:///.agents/rules/engineering_discipline_and_planning.md)_

1. **Shared Contracts First (`packages/shared`)**:
   - Define TypeScript interfaces, Zod schemas, and Enums in `packages/shared` BEFORE backend handlers.
   - Run `pnpm --filter @smartfeed/shared build` to verify contract integrity.
   - **Zero Inline Types**: Never create duplicate or ad-hoc DTO types in the backend.
2. **Component Modularity Budget**:
   - If a new feature requires multiple responsibilities, decompose immediately into distinct files (<250 lines):
     - `*.controller.ts` (Routing & Swagger only)
     - `*.dto.ts` (Class-validator decorators)
     - `*.command.ts` / `*.query.ts` (CQRS payloads)
     - `*.handler.ts` (Business execution)
     - `*.service.ts` / `*.repository.ts` (Prisma data queries)
3. **Plan Artifact Creation**:
   - Create plan in `plans/active/<feature_name>.md` with 4-layer defense details and verification steps.
   - **Strict Rule**: Await explicit user approval before proceeding to implementation.

> **Gate 2 Check**: Is the plan documented in `plans/active/`, contracts compiled in `@smartfeed/shared`, and user approval received?

---

### 🏗️ Phase 3: Пошук найкращого рішення (Architectural & Solution Design)

_Refer to [references/architecture-patterns.md](file:///references/architecture-patterns.md) and [.agents/rules/postgres_skills.md](file:///.agents/rules/postgres_skills.md)_

Select the optimal pattern based on scalability and system constraints:

1. **CQRS Boundaries & Decoupling**:
   - `UsersModule`: Pure data layer via `PrismaService`. Zero JWT/Passport/Auth controller imports.
   - `AuthModule`: Communicates with `UsersModule` strictly via `CommandBus` (`CreateUserCommand`) and `QueryBus`.
   - `LicensesModule`: Listens to `UserCreatedEvent` on `EventBus` for asynchronous license provisioning.
2. **Heavy Operations & Asynchronous Queues**:
   - Never run CPU/IO-heavy tasks (XML parsing, feed generation, image processing) synchronously in HTTP requests.
   - Offload to BullMQ background workers (`@nestjs/bullmq`) with Redis queues.
3. **Storage & S3 Uploads**:
   - Never stream multi-MB files through NestJS server RAM.
   - Use `StorageModule` to generate Presigned S3 PUT/GET URLs via `@aws-sdk/s3-request-presigner`.
4. **PostgreSQL & Prisma Design Checklist**:
   - **100% FK Indexes**: Every foreign key must have `@@index([fkColumn])`.
   - **Snake_case Mapping**: All tables use `@@map("snake_case")` and columns use `@map("column_name")`.
   - **Timezone Awareness**: All timestamps mapped to `timestamptz`.
   - **Cursor Pagination**: Use cursor-based (`WHERE createdAt < cursor LIMIT N`) for feeds and products. No `OFFSET`.
   - **Zero N+1 Queries**: Use `findMany({ where: { id: { in: ids } } })` or `include`.
   - **Short Transactions**: `$transaction` must only contain DB queries. Never wrap S3, emails, or HTTP calls in transactions.
   - **GIN Indexes**: Use `gin_trgm_ops` for `ILIKE '%term%'` text searches.
   - **Ordered PKs**: Use `@default(cuid())` for sequential B-tree indexing.
5. **Concurrency & Race Conditions**:
   - Sensitive shared state (refresh tokens, quota balances) must use mutex locks or atomic database updates (`increment`/`decrement`).
6. **REST API Design & OpenAPI Documentation**:
   - _Refer to [references/api-design-and-security.md](file:///references/api-design-and-security.md)_
   - **Endpoint Naming**: Plural nouns and lowercase kebab-case (`/api/catalogs`, `/api/tariff-plans`).
   - **Single Canonical Endpoint**: Exactly 1 authoritative endpoint per business process (e.g. `change-password` strictly in `AuthController`).
   - **HTTP Status Codes**: `200` (OK), `201` (Created), `400` (Validation), `401` (Auth), `403` (Quota/Role), `404` (Not Found), `409` (Conflict), `429` (Rate limit).
   - **OpenAPI / Swagger**: Every controller annotated with `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()`, and `@ApiBearerAuth()`.
   - **Zero Secret Leaks**: Never return raw entities with `passwordHash` or secrets; use explicit DTO mappers or `@Exclude()`.
   - **Rate Limiting**: Apply `ThrottlerGuard` on public authentication and recovery endpoints.

> **Gate 3 Check**: Does the architecture respect CQRS, BullMQ async processing, presigned S3, all PostgreSQL index rules, and REST API standards?

---

### 🧪 Phase 4: Написання автотесту для нового функціоналу (TDD - RED Phase)

_Refer to [.agents/skills/test-driven-development-tdd/SKILL.md](file:///.agents/skills/test-driven-development-tdd/SKILL.md) and [.agents/rules/testing_and_quality.md](file:///.agents/rules/testing_and_quality.md)_

1. **The Iron Law of TDD**:
   - **NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.**
   - Tests verify real behavior, not mock behavior.
2. **E2E / Integration Test Structure**:
   - Location: `services/backend-api/test/<feature>.e2e-spec.ts`.
   - Use Supertest with real NestJS app context and PostgreSQL/Redis test database.
3. **Mandatory Teardown with `cleanDatabase`**:
   - Import `cleanDatabase` from `test/utils/teardown.helper.ts`.
   - Call `await cleanDatabase(prisma)` in BOTH `beforeAll` and `afterAll`.
   - Teardown strictly follows FK-safe hierarchy:
     `Snapshot` / `ProductImage` → `OrganizationInvitation` → `OrganizationMember` → `License` → `Organization` → `User` → `TariffPlan` / `NavigationItem`.
4. **Testing Anti-Patterns Prevention**:
   - ❌ Never test mock behavior or mock existence.
   - ❌ Never add test-only methods to production classes.
   - ❌ Never use incomplete mocks; mirror real payload completely.
   - ❌ Never use arbitrary `sleep()`; use condition polling.
5. **Execute and Verify RED**:
   - Run: `pnpm --filter @smartfeed/backend-api test:e2e -- <feature>.e2e-spec.ts`.
   - **Verify**: The test fails with the expected assertion failure (not syntax errors or unhandled exceptions).

> **Gate 4 Check**: Has the failing test been written and executed, and does it fail for the exact expected functional reason?

---

### 💻 Phase 5: Написання коду під тести (Implementation & 4-Layer Defense - GREEN Phase)

_Refer to [.agents/skills/defense-in-depth-validation/SKILL.md](file:///.agents/skills/defense-in-depth-validation/SKILL.md) and [.agents/rules/engineering_discipline_and_planning.md](file:///.agents/rules/engineering_discipline_and_planning.md)_

Implement minimal code to turn tests green while enforcing the **4-Layer Defense Model**:

#### Layer 1: Entry Point & DTO Validation

- Every DTO property MUST have `class-validator` decorators (`@IsString()`, `@IsEnum()`, `@IsOptional()`, `@IsInt()`, `@Min()`).
- Controller pipe enforces `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.

#### Layer 2: Domain & Quota Validation

- Business logic validation in CQRS Command/Query Handlers.
- Explicit verification: license active, team seats not exceeded, SKU quota within plan limits.

#### Layer 3: Security, RBAC & Guards

- Guard protection: `@UseGuards(JwtAuthGuard, RequireActiveLicenseGuard, RolesGuard)`.
- Tenant scoping: verify `user.organizationId` matches requested resource.
- Safe execution: NEVER use `exec` with string interpolation. Always use `execFile(binary, args, { shell: false })`.
- Password security: Argon2id or bcrypt hashing.

#### Layer 4: Database Integrity & Forensics

- Foreign keys with `ON DELETE CASCADE` or `RESTRICT`.
- Unique composite constraints in Prisma schema.
- Short atomic transactions for multi-step mutations.
- Centralized exception handling via `GlobalHttpExceptionFilter`.
- Structured logging with context (`this.logger.error(...)`). Zero empty `catch {}`.

#### Verify GREEN:

- Run: `pnpm --filter @smartfeed/backend-api test:e2e -- <feature>.e2e-spec.ts`.
- Verify: Test passes, output is clean, no unhandled rejections.

> **Gate 5 Check**: Does all code pass tests, respect the 4-layer defense, and strictly avoid `as any` and empty `catch` blocks?

---

### 🔍 Phase 6: Рев'ю коду та верифікація (Rigorous Code Review & Pre-Commit Audit)

_Refer to [references/checklist.md](file:///references/checklist.md) and [.agents/rules/code_review_and_skills.md](file:///.agents/rules/code_review_and_skills.md)_

Execute the mandatory **11-Point Backend Quality Checklist**:

| #   | Check Item                      | Verification Method                                                                     |
| --- | ------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | **CQRS Boundaries**             | `UsersModule` isolated; Auth uses `CommandBus`/`QueryBus`; events for side effects.     |
| 2   | **4-Layer Defense**             | DTO validated with `class-validator`; domain quotas checked; guards active; FKs intact. |
| 3   | **Modularity (<250-300 lines)** | No God-files; controllers/handlers/services decomposed.                                 |
| 4   | **Zero Dead Code**              | No unused imports, variables, or unreferenced types.                                    |
| 5   | **Zero Silent Failures**        | 0 empty `catch {}`; structured logging or domain HTTP exceptions.                       |
| 6   | **Zero Type Bypasses**          | 0 `as any`; strict TypeScript types and type guards.                                    |
| 7   | **Zero Test Leftovers**         | `cleanDatabase` in `beforeAll` and `afterAll` in every test file.                       |
| 8   | **PostgreSQL Compliance**       | 100% FK indexes; snake_case; timestamptz; cursor pagination; short transactions.        |
| 9   | **Static Typecheck**            | `pnpm --filter @smartfeed/backend-api exec tsc --noEmit` exits with 0 errors.           |
| 10  | **Shared Contracts Build**      | `pnpm --filter @smartfeed/shared build` exits with 0 errors.                            |
| 11  | **Code Formatting**             | `pnpm format` executed cleanly.                                                         |

#### Complete Feature Lifecycle:

1. Run full E2E test suite: `pnpm --filter @smartfeed/backend-api test:e2e`.
2. Move plan from `plans/active/<feature>.md` to `plans/completed/<feature>.md` with status `✅ Реалізовано та протестовано`.
3. Update `plans/README.md` registry.
4. Update coverage tables in `services/backend-api/README.md` and `services/backend-api/AGENTS.md`.

> **Gate 6 Check**: Are all 11 checklist points verified, documentation synchronized, and plans updated?

---

### 🛠️ Phase 7: Виправлення помилок (Systematic Debugging & Error Remediation)

_Refer to [.agents/skills/systematic-debugging/SKILL.md](file:///.agents/skills/systematic-debugging/SKILL.md) and [.agents/skills/root-cause-tracing/SKILL.md](file:///.agents/skills/root-cause-tracing/SKILL.md)_

When any test fails, bug is discovered, or runtime error occurs, enforce the **Iron Law of Debugging**:

```text
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

#### The 4-Phase Debugging Process:

1. **Root Cause Investigation**:
   - Read full stack traces and NestJS error logs. Note exact line numbers and exception filters.
   - Reproduce reliably with a minimal failing test.
   - Trace data flow backward to find the origin of corrupted/invalid state.
2. **Pattern Analysis**:
   - Compare with working handlers or repositories in the codebase.
   - Identify exact behavioral or environmental differences.
3. **Hypothesis & Minimal Test**:
   - Formulate single clear hypothesis: _"I think X fails because Y."_
   - Test with smallest possible change.
4. **Implementation & Verification**:
   - Write failing test reproducing the bug.
   - Implement root-cause fix (never symptom patching).
   - Verify fix passes and causes no regressions.

#### 🚨 Circuit Breaker (3-Fix Rule):

- If **3 or more fixes fail**: STOP immediately.
- This signals an **architectural defect** (tight coupling, incorrect transaction scope, or invalid CQRS boundary).
- Question fundamentals and discuss architectural refactoring with the user.

---

## 📚 Bundled References

- [references/checklist.md](file:///references/checklist.md) — Comprehensive pre-commit & quality checklist.
- [references/architecture-patterns.md](file:///references/architecture-patterns.md) — CQRS, transactional boundaries, BullMQ, and security recipes.
- [references/api-design-and-security.md](file:///references/api-design-and-security.md) — REST conventions, HTTP status codes, OpenAPI/Swagger, and data sanitization.
