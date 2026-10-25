---
name: test-author
description: >-
  Unified master QA test automation & lifecycle skill for insurance-e2e. Activate for: creating
  new Playwright UI tests (Finance, Minfin), Backend API tests (CRM, IBPM, Product Manager, OTP,
  Baza GAI), fixing broken or flaky tests, investigating and refactoring test suites, authoring
  test plans in Plan/activ/, running tests on target environments (stage, prod, dev, intg),
  reverse-engineering API flows via .http files, or DOM exploration of unknown pages. Autonomously
  determines task type via Decision Engine, activates necessary modular skills, and executes the
  full 6-phase lifecycle (DEFINE -> PLAN -> BUILD -> SELF-REVIEW -> VERIFY -> CLOSE) without user guidance.
---

# Master Test Engineering Pipeline Skill (`test-author`)

Single master orchestrator for the full development, authoring, fixing, and stabilization lifecycle of automated tests in `insurance-e2e`.

---

## 1. Autonomous Skill Selection (Decision Map)

- **Requirements Ambiguity:** `interview-me` (ask 1-2 focused questions if domain or environment is missing).
- **UI Tests & Page Objects:**
  - Pages & URLs: `pw-pom` + `playwright-e2e` + `pw-arch`
  - Components & Widgets: `pw-pom` + `playwright-e2e`
  - Forms & Inputs: `playwright-automation-fill-in-form` + `pw-pom`
  - Wizard Screens: `playwright-e2e` + `pw-pom` + `pw-data`
  - Payment Flow & Checkout: `pw-payment` + `pw-mock` + `pw-pom`
  - Accessibility & WCAG: `pw-a11y` + `playwright-best-practices`
  - Visual Snapshots: `pw-visual` + `pw-pom`
  - DOM Exploration: `playwright-explore-website` + `browser_snapshot`
- **API Tests & HTTP Flows:**
  - New API Tests: `pw-api` + `playwright-e2e` + `pw-data` + `pw-arch`
  - Positive E2E Flows: `pw-api` + `pw-schema-sync` + `pw-data`
  - Negative Scenarios & 4xx: `pw-api` (Negative Matrix)
  - AJV JSON Schemas: `pw-api` + `pw-schema-sync`
  - API Route Mocking: `pw-mock` + `playwright-e2e`
  - JetBrains HTTP Flows: `http-flow-builder`
- **Healing & Quality Assurance:**
  - Test Failures & Traces: `pw-heal` + `playwright-test-results` + `pw-debug-rca`
  - Flakiness & Races: `flakiness-detector` + `pw-heal` + `playwright-best-practices`
  - Code Review & Rules: `rules-enforcer` + `pw-review` + `code-review`
  - Title-to-Payload Parity: `doubt-driven-development`
  - Suite Simplification: `code-simplification` + `pw-codemod`

---

## 2. The 6-Phase Lifecycle

### Phase 1: DEFINE (Specification & Requirements)

- Active skills: `pw-test-designer`, `interview-me`, `playwright-explore-website`, `http-flow-builder`.
- Clarify domain (`finance.ua` vs `minfin.ua`) and environment if not specified.
- Update library docs via `context7` MCP (`playwright`, `@faker-js/faker`, `ajv`).
- Construct Lead Flow (7 stages: Lead -> Draft -> Offer -> OTP -> Payment -> Issuance -> Email).
- Define full Boundary & Nullability matrix (`""`, `"   "`, `null`, explicit `undefined`, string `"null"`, length bounds).

### Phase 2: PLAN & CONSTRAINTS (Architecture Guardrails)

- Active skills: `pw-plan`, `constraint-driven-development`, `karpathy-guidelines`.
- Generate active plan: `Plan/activ/<slug>.md` and register in `Plan/README.md`.
- Lock architectural invariants: `@/` path alias, user-facing locators (no XPath/CSS classes), no `force: true`, no `waitForTimeout`, mandatory `deletionLeads.push(lead.key)`, single deterministic HTTP status codes.

### Phase 3: BUILD (Implementation)

- Active skills: `pw-pom`, `pw-api`, `playwright-e2e`, `pw-data`, `pw-mock`, `pw-payment`, `pw-a11y`, `pw-visual`.
- UI: Encapsulate locators in POM (`private readonly`), implement `toBeLoaded()`, use `@step()`.
- API: 4-layer defense (`not.toBe(500)`, exact status, JSON content-type regex, AJV schema validation).
- Logging: Structured markers via `@/utils/apiLogger` (`ApiLogger.step`, `ApiLogger.boundaryCheck`, `ApiLogger.success`). No console.log or emojis.
- Line limits: Keep spec files < 200 lines. Extract orchestration to `support/flow.helpers.ts`.

### Phase 4: SELF-REVIEW & PARITY (Pre-Flight Audit)

- Active skills: `doubt-driven-development`, `rules-enforcer`.
- Execute static scans before running tests:
  ```bash
  node .agents/skills/rules-enforcer/scripts/scan-violations.cjs --changed
  npx tsc --noEmit && npm run lint
  ```
- Enforce Title-to-Payload Parity: If test title mentions `undefined`, `null`, or `""`, explicitly declare it in the payload (`field: undefined`). Never omit keys silently.

### Phase 5: VERIFY & CODE HEALTH (Execution & Stability Gate)

- Active skills: `playwright-cli`, `pw-debug-rca`, `pw-heal`, `playwright-test-results`, `code-simplification`.
- Run test:
  ```bash
  npx playwright test <spec_path> --project=<finance|minfin|api>
  ```
- Stability concurrency gate:
  ```bash
  npx playwright test <spec_path> --project=<project> --repeat-each=3 --workers=4
  ```
- If failed: diagnose root cause via trace (`parse-trace.js` / `extract-trace.py`). Classify `APP_BUG` vs `TEST_BUG`. Fix locators surgically without `waitForTimeout`.

### Phase 6: CLOSE & SHIP (Delivery)

- Active skills: `git-commit`, `pw-plan`.
- Move plan: `Plan/activ/<slug>.md` -> `Plan/close/<slug>.md`.
- Update `Plan/README.md` entry status to `🟢 Закрито`.
- Conventional Commit: `git commit -m "<type>(<scope>): <imperative summary>"`.
