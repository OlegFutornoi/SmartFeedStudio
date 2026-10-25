# SmartFeed Studio — Autonomous E2E Test Suite & Agents Guide

Central configuration and architectural reference for autonomous test engineering agents in the `@smartfeed/e2e` package.

---

## 1. Primary Agent Roster & Orchestration

Users invoke agents via `@agent-*` or by describing task intent:

- `agent-planner` (Lead Systems Architect & Test Planning Specialist): Deep requirements analysis, architectural scoping, boundary condition modeling, and task authoring in `e2e/tasks/active/qa-fe-<num>-<slug>.md` or `qa-be-<num>-<slug>.md`.
  - Core Skills: `pw-plan`, `pw-test-designer`, `constraint-driven-development`, `karpathy-guidelines`, `interview-me`, `doubt-driven-development`, `find-docs`, `http-flow-builder`, `pw-arch`, `rules-enforcer`.

- `agent-author` (Senior QA Creator): Full lifecycle creation and stabilization of UI (Desktop/Admin) and API (Server/Local DB) tests.
  - Core Skills: `test-author`, `pw-test-designer`, `pw-plan`, `constraint-driven-development`, `karpathy-guidelines`, `pw-pom`, `pw-api`, `playwright-e2e`, `pw-data`, `http-flow-builder`, `pw-mock`, `pw-payment`, `pw-a11y`, `pw-visual`, `doubt-driven-development`, `rules-enforcer`, `playwright-cli`, `pw-debug-rca`, `pw-heal`, `code-simplification`, `skill-creator`, `git-commit`.

- `agent-reviewer` (QA Gatekeeper & Architect): Code review, PR auditing, static checks, flakiness detection, and pre-commit approval gates.
  - Core Skills: `rules-enforcer`, `pw-review`, `code-review`, `flakiness-detector`, `playwright-best-practices`, `doubt-driven-development`, `pw-test-designer`, `pw-api`, `review-feedback-loop`, `git-commit`.

- `agent-triage` (RCA & Incident Specialist): Triage of CI/local red runs, Playwright trace investigation, backend health checks, and failure classification.
  - Core Skills: `playwright-test-results`, `pw-heal`, `pw-debug-rca`, `pw-triage`, `pw-plan`.

- `agent-refactor` (Modernization Architect): Batch tech-debt cleanup, `@/` path alias migrations, eliminating `force: true` and XPath, spec file simplification (<200 lines), and skills modularization.
  - Core Skills: `rules-enforcer`, `pw-plan`, `karpathy-guidelines`, `pw-codemod`, `code-simplification`, `pw-arch`, `pw-pom`, `flakiness-detector`, `playwright-cli`, `skill-creator`, `git-commit`.

- `agent-skill` (Skill Architect & Optimizer): End-to-end authoring, evaluation, benchmarking, and frontmatter optimization for agent skills in `.agents/skills/`.
  - Core Skills: `skill-creator`, `pw-plan`, `karpathy-guidelines`, `interview-me`, `code-simplification`, `rules-enforcer`, `git-commit`.

---

## 2. Mandatory 6-Phase Lifecycle

1. Phase 1 (DEFINE): Analyze requirements, clarify ambiguities (`interview-me`), map feature flow, define equivalence classes and boundary matrix (`pw-test-designer`).
2. Phase 2 (PLAN): Create task in `e2e/tasks/active/qa-fe-<num>-<slug>.md` (UI) or `qa-be-<num>-<slug>.md` (API), register in `e2e/tasks/README.md` (`🟡 В роботі`), lock architectural constraints (`pw-plan`, `test-author`).
3. Phase 3 (BUILD): Implement Page Objects (`BasePage`, components) or API clients. Strict TypeScript typing, user-facing locators, structured logging, Zod contract validation (`pw-pom`, `pw-api`, `playwright-e2e`).
4. Phase 4 (SELF-REVIEW): Pre-flight terminal checks (`tsc --noEmit`, ESLint). Enforce Title-to-Payload parity and 4-layer response defense (`doubt-driven-development`, `rules-enforcer`).
5. Phase 5 (VERIFY): Run target test project. Verify stability under concurrency (`--repeat-each=3 --workers=2..4`). Heal locators via traces if needed (`playwright-cli`, `pw-debug-rca`, `pw-heal`).
6. Phase 6 (CLOSE): Move task to `e2e/tasks/completed/<filename>.md`, mark `🟢 Виконано` in `e2e/tasks/README.md`, record conventional commit (`git-commit`).

---

## 3. Technology Stack & Directory Structure

- Stack: TypeScript (strict) · Playwright Test `@playwright/test ^1.62.1` + `APIRequestContext` · Zod · pg · ESLint v9 · Node 22+.
- Structure:
  - `server/backend/`: Server NestJS API tests (`:4000/api`), DB cleanup (`smartfeed_test_db`), API clients.
  - `server/admin/`: Admin Portal UI tests (`:3000`), POM pages and components.
  - `local/backend/`: Local DB SQLite Docker container tests (`:5001`), `LocalDbClient` (`POST /api/invoke`).
  - `local/desktop/`: Desktop UI tests (`:1420`), desktop POM pages and components.
  - `core/`: Base fixtures (`test.extend`), API client wrapper, test data isolation, network counter, locale utils.
  - `config/`: Zod environment validation (`env.ts`), service URLs (`urls.ts`).
  - `tasks/`: Task management (`active/`, `completed/`, `README.md`).

---

## 4. Locator Priority

1. `getByRole("button", { name: /text/i })`
2. `getByLabel(/text/i)`
3. `getByText(/text/i)`
4. `getByTestId("value")` (attributes: `data-state` or `data-testid`)
5. Scoping & Nesting: `targetLocator.within(parentLocator)` — preferred for scoping elements/columns inside cards, modals, or table rows.
6. Prohibited: XPath (`xpath=`, `//`), arbitrary CSS class selectors, `input[placeholder*='...']`, `#react-select-*`.

---

## 5. Architectural Invariants (Zero Tolerance)

1. Import Aliases (`@/` Rule):
   - All imports within `e2e/` must use `@/` alias (e.g. `@/core/fixtures/base.fixture`, `@/config/urls`).
   - Deep relative imports (`../../../../`) across module boundaries are strictly prohibited.

2. Actionability & Waits:
   - Prohibited: `force: true`, `evaluate(e => e.click())`, `page.mouse.click(0, 0)`, `page.waitForTimeout()`, `setTimeout()`.
   - Permitted: `expect.poll()` with explicit intervals/timeout, web-first assertions (`toBeVisible()`), `scrollIntoViewIfNeeded()`.

3. Response Integrity (4-Layer Defense):
   - Layer 1: `expect(res.status).not.toBe(500)` (Server crash guard).
   - Layer 2: Deterministic status (`toBe(200)`, `toBe(400)`, `toBe(404)`). No fuzzy arrays (`[400, 500]`).
   - Layer 3: `headers["content-type"]` matches JSON regex (`/application\/(?:problem\+)?json/`).
   - Layer 4: Non-empty body + Zod/contract schema validation.

4. Title-to-Payload Parity:
   - Test titles specifying `field = undefined`, `field = null`, or `field = ""` must explicitly declare the key in payload: `{ field: undefined }`. Never silently omit keys.

5. Test Data Isolation & Clean Teardown:
   - Every test run uses isolated identifiers (`runId`, unique email `e2e.test+<timestamp>@smartfeed.local`).
   - Teardown: Server DB deletes scoped records in FK order without touching manual accounts (`qatest@gmail.com`, `shoplinkerxml@gmail.com`); Local DB resets via `POST /api/reset`.

6. Single Source of Truth for URLs:
   - Prohibited: Hardcoding URLs (`http://localhost:...`). Import URLs from `@/config/urls`.

7. Spec Size & SRP:
   - Spec files must stay < 250 lines. Extract business orchestration into helper clients and test data into factories.

8. Anti-Testing Theater & Full Property Parity:
   - Superficial tests (asserting only `id` or `name` and ignoring contract properties) are strictly prohibited.
   - Assert contract fields for presence, types, and business constraints.

9. Strict TypeScript Typing (Zero Weak Types):
   - Prohibited: `Record<string, any>`, `any`, `as unknown as ...`.
   - Required: Explicit typed interfaces and models.

10. Dynamic Polling Timeouts:
    - Never hardcode arbitrary timeouts (10-15s). Derive timeouts dynamically from backend contracts (`retryAfter` or polling options).

11. Universal Active Task Mandate in `e2e/tasks/`:
    - All E2E test tasks MUST be recorded in `e2e/tasks/active/qa-fe-<num>-<slug>.md` or `qa-be-<num>-<slug>.md` and registered in `e2e/tasks/README.md` (`🟡 В роботі`) before executing code changes.

---

## 6. Execution Commands

```bash
# Typecheck
pnpm --filter @smartfeed/e2e typecheck

# Run test suites by domain
pnpm e2e:server          # All server tests (backend API + admin UI)
pnpm e2e:server:backend  # NestJS backend API tests
pnpm e2e:server:admin    # Admin Portal UI tests
pnpm e2e:local           # All local tests (sqlite-dev + desktop UI)
pnpm e2e:local:backend   # Local SQLite dev container API tests
pnpm e2e:local:desktop   # Desktop UI tests

# Stability & concurrency check
npx playwright test <spec_path> --project=<project> --repeat-each=3 --workers=2
```

---

## 7. Task Management Protocol

- Active Tasks: Written to `e2e/tasks/active/qa-fe-<num>-<slug>.md` (UI) or `qa-be-<num>-<slug>.md` (API) and registered in `e2e/tasks/README.md`.
- Completion Mandate: When tests pass (`PASSED`, 0 tsc errors, 0 lint errors, 3 stable runs), move file to `e2e/tasks/completed/<filename>.md` and update status to `🟢 Виконано`.
- Management CLI: `node .agents/skills/test-author/scripts/plan-manager.js create|close|list`.

---

## 8. Skills Architecture Index

### Master Orchestrators

- `test-author`: Autonomous orchestrator for full 6-phase test lifecycle (UI, API).
- `code-review`: 5-axis code auditor (Standards, Spec, Coverage, Security, Architecture).
- `skill-creator`: Master creator, validator, and benchmarker for agent skills.
- `git-commit`: Standardized Conventional Commit generator.

### Domain Modules

- Planning & Disciplines: `pw-plan`, `constraint-driven-development`, `karpathy-guidelines`, `doubt-driven-development`, `code-simplification`, `interview-me`.
- UI & POM: `pw-pom`, `playwright-e2e`, `playwright-best-practices`, `pw-payment`, `pw-a11y`, `pw-visual`, `playwright-explore-website`, `playwright-automation-fill-in-form`, `playwright-generate-test`.
- API & Network: `pw-api`, `pw-mock`, `pw-schema-sync`, `http-flow-builder`.
- Test Data & Infrastructure: `pw-data`, `pw-arch`, `rules-enforcer`.
- Verification, Triage & Healing: `playwright-cli`, `playwright-test-results`, `pw-debug-rca`, `pw-heal`, `pw-triage`, `flakiness-detector`, `pw-codemod`, `review-feedback-loop`.
