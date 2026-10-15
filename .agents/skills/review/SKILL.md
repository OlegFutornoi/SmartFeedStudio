---
name: review
description: Enterprise full-cycle code review and quality assurance audit orchestrator for SmartFeed Studio. Use when inspecting code quality, auditing architecture boundaries, detecting security flaws, verifying PostgreSQL indexing, checking component modularity, or reviewing pull requests. Do not use for writing production feature code; use frontend or backend instead.
rules: [core, backend, database, frontend, security, testing]
---

# Code Review & Quality Audit Master Orchestrator

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/backend.md`, `.agents/rules/database.md`, `.agents/rules/frontend.md`, `.agents/rules/security.md`, `.agents/rules/testing.md`.
2. Extract all invariant IDs relevant to the files under review.
3. If reviewing code using external libraries, verify API signatures via context7: `resolve-library-id {libraryName, query}` then `query-docs {libraryId, query}`.
4. Do not perform audit or generate findings until steps 1-3 are complete.

## Inputs

- Target branch, pull request, or modified file paths (`git diff origin/main...HEAD`).
- Governing rule files in `.agents/rules/`.
- Invariant ledger in `.agents/_backup/20261015/invariant_ledger.md`.

## Procedure

1. Stage 1 - Scope Discovery and Git Diff Mapping: inspect changed files (`git diff --stat origin/main`). Identify modified layers (client UI, CQRS handlers, Prisma schema, contracts, tests).
2. Stage 2 - CQRS and Module Boundary Audit: verify strict CQRS decoupling (`ARCH-04`). Confirm Command Handlers return `{ id }` or void. Verify UsersModule has zero JWT awareness (`ARCH-05`). Confirm controller files are under 250 lines (`CORE-04`).
3. Stage 3 - 4-Layer Defense and Security Audit: verify `class-validator` coverage on 100% of DTO fields (`BE-01`). Verify `@UseGuards(JwtAuthGuard)` on 100% of mutations (`BE-02`). Verify zero hardcoded fallback secrets via grep (`BE-04`). Verify secret masking on response DTOs (`SEC-03`). Check for CWE-78 command injection (`CORE-05`).
4. Stage 4 - Frontend, UX, and Theme Audit: verify 100% solid sticky headers (`UI-01`). Verify zero off-scheme arbitrary colors (`UI-02`). Verify zero duplicate CTA buttons (`UI-04`). Verify `useRef` network deduplication (`FE-01`). Verify 100% bilingual parity via `pnpm i18n:check` (`I18N-01`).
5. Stage 5 - Database and Schema Audit: verify 100% FK indexes (`DB-01`). Verify timestamptz(6) on all DateTime columns (`DB-02`). Verify snake_case mapping (`DB-03`). Verify CUID primary keys (`DB-04`). Verify cascade deletes (`DB-05`). Verify zero N+1 query loops (`DB-06`). Verify short `$transaction` blocks (`DB-08`).
6. Stage 6 - Adversarial Stress-Test: analyze concurrent mutation race conditions (`BE-07`). Verify mutex locks on quota checks. Verify `cleanDatabase` teardown in test suites (`TEST-01`). Verify behavioral parity between mock driver and real backend (`FE-08`).
7. Stage 7 - Remediation Plan Generation: if architectural, security, or quality defects are discovered, generate `plans/active/remediation_<target>.md`. Group findings by severity (P0 Critical, P1 High, P2 Medium, P3 Low) citing exact invariant IDs and file:line locations. Never silently modify production code during an audit.
8. Stage 8 - Final Review Report: format audit findings in the standardized report structure. Output a 1-2 sentence summary in chat with a link to the remediation plan or report artifact.

## Outputs

- Structured audit report or remediation plan in `plans/active/remediation_<target>.md`.
- Findings grouped by severity P0-P3, citing invariant IDs, file paths, and exact line numbers.
- Verification status for static typechecking (`tsc --noEmit`) and formatting (`pnpm format`).

## Gate (stop condition)

- 100% of modified lines inspected against invariant IDs.
- Findings categorized strictly by severity P0-P3 with reproduction steps.
- Remediation plan authored and linked in chat.

## Never

- Never silently modify production code during a code review pass without explicit user instruction.
- Never pass code with unindexed foreign keys in Prisma schemas (violates `DB-01`).
- Never pass mutations lacking JwtAuthGuard protection (violates `BE-02`).
- Never pass translucent sticky headers lacking solid backgrounds (violates `UI-01`).
- Never dump full review reports into chat (violates `CORE-07`).

## References

- `references/checklist.md` - read for the 15-point pre-commit review checklist.
- `references/5-axis-review.md` - read for detailed criteria across correctness, security, architecture, performance, and readability.
