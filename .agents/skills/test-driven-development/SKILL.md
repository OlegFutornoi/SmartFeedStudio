---
name: test-driven-development
description: Test-driven development methodology enforcing the RED-GREEN-REFACTOR cycle, complete database teardown, targeted test execution, and real business invariant assertions. Use when implementing new features or fixing bugs.
rules:
  - core
  - testing
---

# Test-Driven Development

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/testing.md`.
2. Note all testing invariants in working notes (TEST-01 through TEST-07).
3. If designing Playwright or Jest suites, call context7 to verify test runner APIs.
4. Do not write production code before a failing test is written and executed.

## The RED-GREEN-REFACTOR cycle

1. RED phase: Write a minimal automated test representing the expected behavior or defect reproduction. Execute the targeted test and confirm it fails for the expected reason.
2. GREEN phase: Implement the minimal production code necessary to make the failing test pass. Avoid speculative features or unrequested complexity.
3. REFACTOR phase: Clean up the implementation. Enforce the <250 line budget, extract helpers, eliminate duplication, and verify the test remains green.

## Mandatory testing standards

1. Real business invariants: Tests must assert concrete domain data. Never write superficial smoke-only tests. In Playwright, verify actual entity names and assert `expect(name).not.toBe('Постачальник')`. Verify avatar rendering and semantic status colors (`emerald` for approved/active).
2. Complete data cleanup (zero leftovers): Backend E2E tests must call `cleanDatabase(prisma)` in both `beforeAll` and `afterAll` blocks. Frontend tests must reset `localStorage`, cookies, and route handlers.
3. Targeted feature execution: Run only the specific test file covering the active feature (e.g. `pnpm exec playwright test e2e/<feature>.spec.ts` or `pnpm test:e2e -- test/<feature>.e2e-spec.ts`). Full suite runs during feature development are prohibited.
4. Bilingual assertions: Verify dynamic language switching (`UA` to `EN`) across interactive UI elements and confirm absence of untranslated raw keys.
