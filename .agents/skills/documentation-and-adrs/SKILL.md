---
name: documentation-and-adrs
description: Architecture Decision Records (ADRs) and continuous knowledge base documentation. Governs wiki synchronization, architectural trade-off recording, and API reference accuracy.
rules:
  - core
  - docs_and_ops
---

# Documentation and Architecture Decision Records

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/docs_and_ops.md`.
2. Note all documentation and wiki invariants in working notes (DOC-01, DOC-02, DOC-03).
3. Check `wiki/` directory and relevant sub-project `AGENTS.md` before making architectural updates.
4. Do not let code and documentation drift.

## Continuous documentation synchronization

1. Mandatory architecture synchronization: Whenever introducing new modules, CQRS commands/queries/events, database schema migrations in `schema.prisma`, or shared DTOs in `@smartfeed/shared`:
   - Update `wiki/` sub-articles and maintain `wiki/README.md` table of contents.
   - Update sub-project guides: `services/backend-api/AGENTS.md`, `apps/admin-portal/AGENTS.md`, `apps/desktop/AGENTS.md`, and `packages/shared/AGENTS.md`.
   - Update root `README.md` if high-level system topology, ports, or credentials change.
2. Backend E2E test coverage synchronization: Whenever a new `*.e2e-spec.ts` test file is added or modified in `services/backend-api/test/`:
   - Run full E2E test suite: `pnpm --filter @smartfeed/backend-api test:e2e`.
   - Update coverage tables in `services/backend-api/README.md` and `services/backend-api/AGENTS.md`.
3. Architecture Decision Records (ADRs):
   - Document significant, hard-to-reverse architectural decisions (database selection, auth model, runtime boundaries).
   - Structure: Status, Date, Context, Decision, Alternatives Considered, Consequences.
   - Maintain sequential numbering without skipping indices.
