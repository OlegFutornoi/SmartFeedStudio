---
name: code-simplification
description: Refactors code to reduce unnecessary complexity while preserving exact runtime behavior and contract invariants. Use after features are functioning to clean up bloated logic, eliminate nested branches, and improve maintainability.
rules:
  - core
  - testing
---

# Code Simplification

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/testing.md`.
2. Note all component modularity and behavior preservation invariants in working notes.
3. Verify existing tests pass before touching any code.
4. Do not alter external interfaces or contracts during simplification.

## Simplification principles

1. Preserve behavior exactly: Inputs, outputs, exceptions, side effects, and async execution order must remain identical. Do not modify test expectations during simplification.
2. Reduce cognitive load: Replace deep nested conditionals with early returns. Replace dense ternary expressions with clear branch statements or lookup objects.
3. Enforce modularity budgets: Break files exceeding 250 lines into focused, cohesive helper modules or domain subcomponents.
4. Remove dead code: Strip unused variables, dead imports, obsolete comments, and no-op wrapper functions.
5. Avoid over-simplification: Do not inline functions when inlining obscures business terminology. Do not combine unrelated duties into a single complex helper.
6. Verify against tests: Run targeted feature test suites (`pnpm exec playwright test ...` or `pnpm test:e2e ...`) after every refactoring step.
