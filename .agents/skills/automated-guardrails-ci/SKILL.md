---
name: automated-guardrails-ci
description: Automated guardrails enforcement via ESLint rules, TypeScript strict flags, pre-commit hooks, and CI pipelines. Converts policy invariants into machine-enforced blocking checks.
rules:
  - core
  - testing
---

# Automated Guardrails and CI Enforcement

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/testing.md`.
2. Note all automated enforcement mechanisms and invariant IDs in working notes.
3. If modifying ESLint or TypeScript configurations, call context7 to check rule syntax.
4. Do not commit policy changes without validating automated guardrail checks.

## Guardrail principles and enforcement

1. Machine-verifiable rules: Rules must not exist solely in documentation. Every structural invariant must be enforced by automated tools (ESLint, TypeScript `tsc --noEmit`, automated scripts, or CI checks).
2. Two-phase rollout: When adding a new structural rule, first run in warning mode or audit mode to quantify existing violations. Upgrade to blocking error mode once existing codebase instances are resolved.
3. Path alias enforcement: Enforce `@/` import aliases and block relative imports (`../`) via ESLint `no-restricted-imports`.
4. File size limits: Enforce component and module size budgets (<250-300 lines) via ESLint `max-lines`.
5. Strict typing: Block `as any` and implicit any via TypeScript strict mode and lint rules.
6. Validation verification: Ensure automated checks pass locally (`pnpm build`, `tsc --noEmit`, `pnpm lint:fix && pnpm format`) before triggering git workflows.
