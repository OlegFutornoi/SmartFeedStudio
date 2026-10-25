---
name: test-author
description: Unified master QA test automation & lifecycle skill for SmartFeed Studio E2E. Activate for creating new Playwright UI or API tests, end-to-end test implementation, task plans in e2e/tasks/active/, running tests on target projects (server:backend, server:admin, local:backend, local:desktop), self-reviewing test code, healing failing tests, or packaging domain workflows.
---

# Test Author (`test-author`)

Single master orchestrator for the full development, authoring, fixing, and stabilization lifecycle of automated tests in SmartFeed Studio E2E.

---

## 1. Operating Rules & Core Constraints

- Zero Tolerance: Always read `.agents/rules/` before writing tests.
- Path Aliases: Use `@/` for all imports within `e2e/`.
- User-Facing Locators: `getByRole`, `getByLabel`, `getByTestId` with `data-testid` / `data-state`. Never use XPath or arbitrary CSS classes.
- Waits: Use `expect.poll` or web-first assertions (`toBeVisible`). Never use `page.waitForTimeout` or `setTimeout`.
- Data Isolation & Cleanup: Use `runId` and clean up server DB via `cleanup.ts` or reset local DB via `POST /api/reset`.
- Response 4-Layer Defense: `not.toBe(500)` -> deterministic code -> JSON content-type -> contract schema check.
- Title-to-Payload Parity: Match payload keys to test names explicitly (`field: undefined`).

---

## 2. Mandatory 6-Phase Lifecycle

### Phase 1: DEFINE (Test Design & Analysis)

- Active skills: `pw-test-designer`, `interview-me`, `playwright-explore-website`, `http-flow-builder`.
- Identify target project (`server-admin`, `local-desktop`, `server-backend`, `local-backend`).
- Define boundary matrix (`""`, `"   "`, `null`, explicit `undefined`, numbers, boundary lengths).

### Phase 2: PLAN & CONSTRAINTS (Architecture Guardrails)

- Active skills: `pw-plan`, `constraint-driven-development`, `karpathy-guidelines`.
- Generate active task: `e2e/tasks/active/qa-fe-<num>-<slug>.md` (UI) or `qa-be-<num>-<slug>.md` (API) and register in `e2e/tasks/README.md`.
- Lock architectural invariants: `@/` path alias, user-facing locators, no `waitForTimeout`, deterministic HTTP status codes.

### Phase 3: BUILD (Implementation)

- Active skills: `pw-pom`, `pw-api`, `playwright-e2e`, `pw-data`, `pw-mock`, `pw-payment`, `pw-a11y`, `pw-visual`.
- UI: Encapsulate locators in POM (`private readonly`), implement `toBeLoaded()`.
- API: 4-layer defense (`not.toBe(500)`, exact status, JSON content-type regex, contract validation).
- Line limits: Keep spec files < 250 lines.

### Phase 4: SELF-REVIEW & PARITY (Pre-Flight Audit)

- Active skills: `doubt-driven-development`, `rules-enforcer`.
- Execute static check:
  ```bash
  pnpm --filter @smartfeed/e2e typecheck
  ```
- Enforce Title-to-Payload Parity: If test title mentions `undefined`, `null`, or `""`, explicitly declare it in the payload (`field: undefined`). Never omit keys silently.

### Phase 5: VERIFY & CODE HEALTH (Execution & Stability Gate)

- Active skills: `playwright-cli`, `pw-debug-rca`, `pw-heal`, `playwright-test-results`, `code-simplification`.
- Run test:
  ```bash
  npx playwright test <spec_path> --project=<project>
  ```
- Stability concurrency gate:
  ```bash
  npx playwright test <spec_path> --project=<project> --repeat-each=3 --workers=2
  ```

### Phase 6: CLOSE & SHIP (Delivery)

- Active skills: `git-commit`, `pw-plan`.
- Move task: `e2e/tasks/active/<slug>.md` -> `e2e/tasks/completed/<slug>.md`.
- Update `e2e/tasks/README.md` entry status to `🟢 Виконано`.
- Record Conventional Commit.
