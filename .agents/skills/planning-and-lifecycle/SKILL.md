---
name: planning-and-lifecycle
description: Deterministic implementation planning, specification drafting, architectural invariant validation, and plan lifecycle management. Governs plans in plans/active/, plans/backlog/, and plans/completed/.
rules:
  - core
  - docs_and_ops
---

# Planning and Lifecycle Management

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/docs_and_ops.md`.
2. Note all planning invariants (PLAN-01, PLAN-02, PLAN-03).
3. If planning integration of external libraries, call context7 to verify current APIs and recommendations.
4. Do not write or modify code or database schemas until the plan is approved by the user.

## Three-directory plan lifecycle

1. `plans/active/`: Contains the currently active task under planning or implementation. Only one active plan should be in flight at a time.
2. `plans/backlog/`: Strategic roadmaps, future architectural proposals, and deferred feature plans.
3. `plans/completed/`: Finished and verified implementation plans (100% test pass).
4. `plans/README.md`: Central registry of all plans categorized by active, backlog, and completed.

## Mandatory plan structure and invariants

Every plan authored in `plans/active/<feature>.md` must follow the standardized specification structure:

1. Metadata & Runtime Scope:
   - State Target Runtime: Web Portal (`apps/admin-portal`), Desktop Client (`apps/desktop` Tauri v2/SQLite), or Cloud Backend (`services/backend-api`).
   - If touches catalog data, verify `mockDatabaseDriver` behavioral parity (`mock-real-parity`).
2. Shared contracts first:
   - Explicitly define DTOs, Zod schemas, and TypeScript interfaces in `@smartfeed/shared` before creating UI or backend services. Never use `any`.
3. Four-layer defense model:
   - Layer 1 (DTO): `class-validator` on backend and Zod on client.
   - Layer 2 (Domain/Quota): Subscription limits, SKU quotas, team seat checks (`subscription-lifecycle`).
   - Layer 3 (Security/RBAC): Tenant scoping, JWT guards, permissions.
   - Layer 4 (Database): Foreign key indexes (`@@index([fk])`), unique constraints, atomic transactions.
4. Tracer-Bullet Vertical Slices:
   - Decompose tasks into tracer-bullet vertical slices cutting through DB -> API -> Shared -> UI -> Tests.
   - Each slice must be demoable or verifiable on its own and sized to fit in a single context window (<250 lines).
   - Wide refactors must be sequenced via Expand-Contract (add new -> migrate callers -> contract old).
   - Declare blocking edges (`Blocked by: Task X`) for every slice.
5. Task Step Structure (TDD RED -> GREEN):
   - For every task, define:
     - Exact file paths: `Create: ...`, `Modify: ...`, `Test: ...`
     - Interfaces: `Consumes: ...`, `Produces: ...`
     - Step 1: Write failing test with exact assertions (RED).
     - Step 2: Run test command and verify expected failure output.
     - Step 3: Implement minimal code to satisfy test (GREEN).
     - Step 4: Run targeted test and verify clean PASS.
6. Modularity budgets & CQRS standards:
   - Keep files under 250 lines (`CORE-04`). Split backend into 1 handler per file (<120 lines).
   - Decompose complex React views into focused sub-components with solid sticky headers.
7. Failure modes, bilingual localization & edge cases:
   - Define offline behaviors, network drops, and translations in both `uk` and `en` (`i18n-localization`).
   - Adversarially stress-test TOCTOU concurrency races and payment webhook idempotency (`doubt-driven-development`).
8. Zero plan dumping in chat:
   - The complete plan text must be written directly to `plans/active/<feature>.md`.
   - The chat response must contain only a 1-2 sentence summary and clickable markdown link (`[План](file:///...)`) with the recommended executing agent.

## Plan completion and transition to completed

1. Upon completing implementation and verifying 100% test pass across targeted suites:
   - Move plan file from `plans/active/<feature>.md` to `plans/completed/<feature>.md`.
   - Update header metadata with completed status and completion date.
   - Update `plans/README.md` to reflect the completed state.
