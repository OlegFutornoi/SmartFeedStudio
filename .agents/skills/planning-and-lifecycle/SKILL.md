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

Every plan authored in `plans/active/<feature>.md` must include:

1. Shared contracts: Explicitly define DTOs, Zod schemas, and TypeScript interfaces in `@smartfeed/shared` before creating UI or backend services. Never use `any`.
2. Four-layer defense model:
   - Layer 1 (DTO): class-validator on backend and Zod on client.
   - Layer 2 (Domain/Quota): Subscription limits, SKU quotas, team seat checks.
   - Layer 3 (Security/RBAC): Tenant scoping, JWT guards, permissions.
   - Layer 4 (Database): Foreign key indexes, unique constraints, atomic transactions.
3. Modularity budgets: Decompose components and files expected to exceed 250 lines into focused sub-modules.
4. Failure modes and bilingual localization: Define offline behaviors, network drops, and translations in both `uk` and `en`.
5. Upfront research: Document API signatures confirmed via context7.
6. Zero plan dumping in chat: The complete plan text must be written directly to `plans/active/<feature>.md`. The chat response must contain only a 1-2 sentence summary and clickable markdown link (`[План](file:///...)`).

## Plan completion and transition to completed

1. Upon completing implementation and verifying 100% test pass across targeted suites:
   - Move plan file from `plans/active/<feature>.md` to `plans/completed/<feature>.md`.
   - Update header metadata with completed status and completion date.
   - Update `plans/README.md` to reflect the completed state.
