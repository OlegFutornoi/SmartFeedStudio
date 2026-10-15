---
name: playwright-automation
description: Playwright E2E and UI test automation for Desktop and Admin Portal in SmartFeed Studio. Use when writing, refactoring, or running Playwright test specs, designing Page Object Models, asserting network deduplication (requestCount === 1), verifying bilingual localization (UA <-> EN), or checking test isolation. Do not use for backend Jest unit/integration tests; use test-driven-development instead.
rules: [core, testing, frontend, i18n]
---

# Playwright E2E & UI Test Automation

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/testing.md`, `.agents/rules/frontend.md`, `.agents/rules/i18n.md`.
2. Verify invariant `CORE-09`: ban of `browser_subagent`. Use direct Playwright MCP tools or local test commands.
3. Verify invariant `TEST-02`: frontend test isolation (reset browser storage before/after tests).
4. Verify invariant `TEST-03`: real business data assertions (zero superficial smoke tests).
5. Verify invariant `TEST-05`: single-request performance assertions (`requestCount === 1`).
6. Do not write test specs until steps 1-5 are verified.

## Inputs

- Target page URL or component under test (`apps/desktop` or `apps/admin-portal`).
- Existing Page Object Models in `tests/e2e/pages/`.

## Procedure

1. Step 1 - Page Object Model Structuring: define Page Object classes with typed methods and resilient `data-testid` or role-based locators (`page.getByRole('button', { name: ... })`). Never use fragile CSS class chains.
2. Step 2 - Test Isolation Setup: in `beforeEach` and `afterEach`, clear browser `localStorage`, `sessionStorage`, cookies, and mock route interceptors (`TEST-02`).
3. Step 3 - Real Data and Business Invariants: assert actual entity names (e.g. `Brain Distribution`). Enforce negative assertion: `expect(name).not.toBe('Постачальник')` to prevent column header leakage (`TEST-03`).
4. Step 4 - Single-Request Network Verification: track request count via `page.on('request')`. Assert that endpoint calls execute strictly 1 time on initial load (`TEST-05`).
5. Step 5 - Dynamic Bilingual Switching: switch language between Ukrainian and English. Assert that all headers, buttons, placeholders, and status badges translate without raw keys leaking (`I18N-01`, `I18N-02`).
6. Step 6 - Condition-Based Waiting: use explicit waiting predicates (`expect(locator).toBeVisible()`, `page.waitForResponse(...)`, `expect.poll(...)`). Never use arbitrary `page.waitForTimeout()`.

## Outputs

- Resilient Playwright test specs in `tests/e2e/<feature>.spec.ts`.
- Page Object Models in `tests/e2e/pages/<feature>.page.ts`.

## Gate (stop condition)

- Targeted test suite passes cleanly: `pnpm --filter @smartfeed/desktop exec playwright test e2e/<feature>.spec.ts`.
- Zero flaky timeout retries.
- Single-request assertion verified.

## Never

- Never call `browser_subagent` or `open_browser_url` (violates `CORE-09`).
- Never use arbitrary `page.waitForTimeout(2000)` sleeps.
- Never write smoke-only tests without real data assertions (violates `TEST-03`).
- Never leave browser storage state un-cleared between test cases (violates `TEST-02`).

## References

- `references/playwright-testing.md` - read for POM templates and condition-based waiting examples.
