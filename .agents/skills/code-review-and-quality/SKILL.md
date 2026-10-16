---
name: code-review-and-quality
description: Comprehensive 5-axis code review and quality gating. Use when reviewing pull requests, inspecting diffs, validating changes against architectural invariants, or verifying pre-commit quality gates.
rules:
  - core
  - backend
  - database
  - frontend
  - security
  - testing
---

# Code Review and Quality

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/backend.md`, `.agents/rules/database.md`, `.agents/rules/frontend.md`, `.agents/rules/security.md`, and `.agents/rules/testing.md`.
2. Note all project invariants in working notes.
3. If reviewing external library usage, call context7 to check current official documentation.
4. Do not complete a review until all 5 axes are evaluated.

## Five-axis evaluation protocol

1. Axis 1 - Correctness: Verify code fulfills requirements without regressions. Check edge cases, boundary numbers, nullability, and race conditions. Assert real business invariants in tests (`expect(name).not.toBe('Постачальник')`).
2. Axis 2 - Readability and Modularity: Enforce component and file budget (<250 lines). Reject monolithic files. Eliminate dead code, unused imports, and nested ternaries. Confirm 100% `@/` path aliases (zero `../` relative imports). Enforce semantic design tokens (`UI-02`, `UI-07`): zero off-scheme palette colors (`blue-*`, `amber-*`, `yellow-*`, `purple-*`), zero rainbow decorative icon styling on forms/cards.
3. Axis 3 - Architecture and Boundaries: Enforce CQRS separation (1 handler per file, <120-150 lines). Ensure Cloud API never manipulates desktop client local workspace files. Confirm 100% bilingual i18n parity (`uk` and `en`).
4. Axis 4 - Security: Verify 4-layer defense. Confirm all mutation routes have `@UseGuards()`. Ensure zero fallback secrets (`|| 'default-secret'`) and zero secret exposure in responses or logs. Verify `execFile` with argument arrays (zero CWE-78).
5. Axis 5 - Performance and Database: Confirm 100% foreign key indexes (`@@index([fk])`), CUID primary keys, and snake_case mapping. Eliminate N+1 queries. Verify cursor pagination on catalog endpoints and `useRef` request deduplication in React.

## Review gating and report format

1. Automated invariant verification: Run `pnpm invariants:check` before signing off on any review. Must exit with 0 violations.
2. Critical findings: Block merge on architectural violations, security holes, unindexed FKs, relative imports, missing test teardown, hardcoded palette colors, or missing DTOs.
3. Non-blocking suggestions: Note minor readability improvements without delaying delivery.
4. For the complete rubric, see `references/5-axis-review.md`.
