# Antigravity Workspace Guidelines & Skills Index — insurance-e2e

Central configuration and architectural reference for autonomous agents in the `insurance-e2e` repository.

---

## 1. Primary Agent Roster & Orchestration

Users invoke agents via `@agent-*` or by describing task intent. Agents autonomously activate required skills:

- `agent-planner` (Lead Systems Architect & Test Planning Specialist): Deep requirements analysis, architectural scoping, boundary condition modeling, risk assessment, and rigorous task decomposition in `Plan/activ/<slug>.md`.
  - Core Skills: `pw-plan`, `pw-test-designer`, `constraint-driven-development`, `karpathy-guidelines`, `interview-me`, `doubt-driven-development`, `find-docs`, `http-flow-builder`, `pw-arch`, `rules-enforcer`.

- `agent-author` (Senior QA Creator): Full lifecycle creation and stabilization of UI and API tests, and domain skills packaging.
  - Core Skills: `test-author`, `pw-test-designer`, `pw-plan`, `youtrack-reader`, `constraint-driven-development`, `karpathy-guidelines`, `pw-pom`, `pw-api`, `playwright-e2e`, `pw-data`, `http-flow-builder`, `pw-mock`, `pw-payment`, `pw-a11y`, `pw-visual`, `doubt-driven-development`, `rules-enforcer`, `playwright-cli`, `pw-debug-rca`, `pw-heal`, `code-simplification`, `skill-creator`, `git-commit`.

- `agent-reviewer` (QA Gatekeeper & Architect): Code review, PR auditing, static checks, flakiness detection, and pre-commit approval gates.
  - Core Skills: `rules-enforcer`, `pw-review`, `code-review`, `flakiness-detector`, `playwright-best-practices`, `doubt-driven-development`, `pw-test-designer`, `pw-api`, `review-feedback-loop`, `git-commit`.

- `agent-triage` (RCA & Incident Specialist): Triage of CI/local red runs, trace investigation, backend health checks, and failure classification without modifying tests during outages.
  - Core Skills: `playwright-test-results`, `pw-heal`, `pw-debug-rca`, `ibpm-error`, `pw-triage`, `pw-plan`.

- `agent-refactor` (Modernization Architect): Batch tech-debt cleanup, `@/` path alias migrations, eliminating `force: true` and XPath, spec file simplification (<200 lines), and skills modularization.
  - Core Skills: `rules-enforcer`, `pw-plan`, `karpathy-guidelines`, `pw-codemod`, `code-simplification`, `pw-arch`, `pw-pom`, `flakiness-detector`, `playwright-cli`, `skill-creator`, `git-commit`.

- `agent-skill` (Skill Architect & Optimizer): End-to-end authoring, evaluation, benchmarking, Progressive Disclosure restructuring (<500 lines, references/scripts extraction), and frontmatter description optimization for agent skills in `.agents/skills/`.
  - Core Skills: `skill-creator`, `pw-plan`, `karpathy-guidelines`, `interview-me`, `code-simplification`, `rules-enforcer`, `git-commit`.

---

## 2. Mandatory 6-Phase Lifecycle

1. Phase 1 (DEFINE): Analyze requirements, clarify ambiguities (`interview-me`), map Lead Flow (stages 1-7), define equivalence classes and full boundary matrix (`pw-test-designer`).
2. Phase 2 (PLAN): Create plan in `Plan/activ/<slug>.md`, register in `Plan/README.md`, lock architectural constraints (`pw-plan`, `constraint-driven-development`, `karpathy-guidelines`).
3. Phase 3 (BUILD): Implement Page Objects (`BasePage`, `BaseComponent`) or API controllers. Strict TypeScript typing, user-facing locators, structured logging, AJV validation (`pw-pom`, `pw-api`, `playwright-e2e`).
4. Phase 4 (SELF-REVIEW): Pre-flight terminal checks (`scan-violations.cjs`, `tsc --noEmit`, `npm run lint`). Enforce Title-to-Payload parity (`doubt-driven-development`, `rules-enforcer`).
5. Phase 5 (VERIFY): Run target test via Playwright CLI. Verify stability under concurrency (`--repeat-each=3 --workers=4`). Heal locators via traces if needed (`playwright-cli`, `pw-debug-rca`, `pw-heal`).
6. Phase 6 (CLOSE): Move plan to `Plan/close/<slug>.md`, mark `🟢 Закрито` in `Plan/README.md`, create Conventional Commit (`git-commit`).

---

## 3. Technology Stack & Directory Structure

- Stack: TypeScript (strict) · Playwright Test + `APIRequestContext` · `@faker-js/faker` · AJV (Draft-07) · ESLint v9 · Node 18+.
- Structure:
  - `api/{service}/controllers/`: Typed API controllers extending `BaseController.abstract.ts`.
  - `api/schemas/`: AJV JSON Schemas.
  - `app-finance/`, `app-minfin/`: Page Objects (`pages/`) and components (`components/`).
  - `client-wizard/`: Wizard step screens (`*.screen.ts`) and widgets.
  - `base/`: `BasePage`, `BaseComponent`, `PageHolder`, `Route`.
  - `fixtures/index.ts`: `e2eTest` (auto-cleans `deletionLeads`), `apiTest`.
  - `tests/{finance,minfin}/{product}/pages/`: UI tests (`*.finance.ts`, `*.minfin.ts`).
  - `tests/api/{service}/`: API tests (`*.api.ts`).
  - `config/`: `env.ts` (prod), `env.stage.ts` (stage/intg, default), `env.review.ts` (review1-3).
  - `utils/`: `apiLogger.ts`, `leadRandom.ts`, `validation.utils.ts`, `step.ts`.

---

## 4. Locator Priority

1. `getByRole("button", { name: /text/i })`
2. `getByLabel(/text/i)`
3. `getByText(/text/i)`
4. `getByTestId("value")` (attributes: `data-state` or `data-testid`)
5. Scoping & Nesting: `targetLocator.within(parentLocator)` (Playwright 1.64+) — preferred for scoping elements/columns inside cards, modals, or table rows.
6. Prohibited: XPath (`xpath=`, `//`), CSS class selectors, `input[placeholder*='...']`, `#react-select-*`.

---

## 5. Architectural Invariants (Zero Tolerance)

1. Import Aliases (`@/` Rule):
   - All imports from root modules (`fixtures`, `utils`, `api`, `config`, `base`, `services`, `appConstants`, `tests`) MUST use `@/` alias.
   - Relative imports (`./` or `../`) allowed only within the same local feature folder.

2. Actionability & Waits:
   - Prohibited: `force: true`, `evaluate(e => e.click())`, `page.mouse.click(0, 0)`, `page.waitForTimeout()`, `setTimeout()`.
   - Permitted: `expect.poll` with intervals/timeout, native auto-waiting, `scrollIntoViewIfNeeded()`.

3. Response Integrity (4-Layer Defense):
   - Layer 1: `not.toBe(500)` (Server crash guard).
   - Layer 2: Deterministic status (`toBe(200)`, `toBe(422)`). No fuzzy arrays (`[422, 500]`).
   - Layer 3: `headers["content-type"]` matches JSON regex (blocks proxy HTML).
   - Layer 4: Non-empty body + AJV schema validation (`validateWithSchema(res.body, SchemaPath.*)`).

4. Title-to-Payload Parity:
   - Test titles specifying `field = undefined`, `field = null`, or `field = ""` must explicitly declare the key in payload: `{ field: undefined }`. Never silently omit keys.

5. Lead Cleanup (Teardown):
   - All created leads must register their CRM key: `deletionLeads.push(leadKey)` (`osago_<leadId>`). Do not push raw UUIDs.

6. Logging:
   - Use `@/utils/apiLogger` (`ApiLogger.step`, `ApiLogger.request`, `ApiLogger.assertion`, `ApiLogger.success`).
   - Prohibited: `console.log` and `console.warn` in test specs and helpers.

7. Single Source of Truth for URLs:
   - Prohibited: Hardcoding URLs (`cms-stage`, `finance.ua`, `minfin.ua`).
   - Import base URLs from `@/config/env.helper` or `PagePrefix`.

8. Spec Size & SRP:
   - Spec files must stay < 200 lines. Extract business orchestration into `support/flow.helpers.ts` and test data into `support/flow.data.ts`.

9. Anti-Testing Theater, Unconditional Assertions & Full Property Parity:
   - Superficial tests (asserting only `id`, `shortName`, `logo`) are strictly prohibited. Every property defined in contracts/schemas (e.g. `company.*`, `legal.*`, `advantages`, `whoChooses`, `documentTypes`, `providerName`, MTSBU metrics) must be explicitly asserted for presence (`"field" in item` and in JSON schema `required`), regardless of nullability.
   - Prohibited: Wrapping assertions in `if (item.field) { expect(...) }` without unconditional presence checks.
   - Hit Counter Rule: When validating conditionally populated structures (`assistCompany`, `similarTariffs`, `timeFranchise`), maintain an explicit counter (`let hitCount = 0; hitCount++`) and assert `expect(hitCount).toBeGreaterThan(0)`.
   - Prohibited: Calling `ApiLogger.assertion()` without executing an actual Playwright `expect()`.
   - Strict Matchers: Prohibited loose regex alternatives (`/[€$]|EUR|USD/i`) when the contract specifies an exact format (e.g. symbol only `/[€$]/`).

10. Strict TypeScript Typing (No Weak Types):
    - Prohibited: `Record<string, unknown>`, `Record<string, any>`, `any`, `as unknown as ...`.
    - Required: Explicit typed interfaces and models exported from `flow.data.ts` or domain model files.

11. Dynamic Polling Timeouts:
    - Never hardcode short polling timeouts (10-15s). Always derive timeouts dynamically from backend headers or contracts (`retryAfter`, minimum 45s for stage SMS OTP).

12. Universal Active Plan Mandate for ALL Agents:
    - Any analysis, review, audit, test planning, refactoring, or failure triage by any agent MUST be recorded in `Plan/activ/<slug>.md` and registered in `Plan/README.md` (`🟡 В роботі`) before executing code changes. Analysis purely in chat is forbidden.

13. Clean Domain Models Invariant (Pure Business Contracts):
    - Domain models and request DTOs (`api/**/models/*.model.ts`) must purely represent valid business contracts (e.g. `extended?: boolean`). Never pollute domain models with dirty/negative testing types (`string | number | null`). Separate them into dedicated `*RawParams` interfaces for raw controller methods.

14. Business Delta Invariant for Positive Tests:
    - Prohibited: Feature-specific positive tests (e.g. active sport risk, work trip risk, locale translation, multivisa, privileges) that only assert `tariffs.length > 0` or `Array.isArray()`. Tests must explicitly assert the observable business outcome / delta (e.g. `sportPrice > basePrice`, localized vocabulary).

15. Full Contract Checklist Parity Gate:
    - When provided with a contract DTO snippet (in YouTrack AC or user prompt), 100% of declared properties must be declared in JSON schema (`required`), strongly typed in domain models, and explicitly validated in test specs/helpers.

---

## 6. Execution Commands

```bash
# Typecheck & Lint
npx tsc --noEmit && npm run lint

# Scan project architectural violations
node .agents/skills/rules-enforcer/scripts/scan-violations.cjs --changed

# Run tests
npx playwright test tests/finance/osago/pages/catalog.finance.ts --project=finance
npx playwright test tests/api/ibpm/finance/osago/osago-ewa.positive.api.ts --project=api

# Randomize test order to discover hidden inter-test dependencies
npx playwright test --shuffle

# Concurrency & stability gate
npx playwright test <spec_path> --project=<project> --repeat-each=3 --workers=4
```

---

## 7. Plan Management Protocol

- Active Plans: Written to `Plan/activ/<slug>.md` and registered in `Plan/README.md`.
- Code Reviews & Audits Mandate: ALL code reviews and quality audits (`agent-reviewer`, `pw-review`, `code-review`) MUST be recorded as an active plan in `Plan/activ/<slug>.md` and registered in `Plan/README.md` (`🟡 В роботі`) BEFORE conducting analysis or making changes. Conducting reviews solely in chat without an active plan is strictly prohibited.
- Completion Mandate: When implementation and verification pass (`PASSED`, 0 tsc errors, 0 lint errors), move file to `Plan/close/<slug>.md` and update `Plan/README.md` status to `🟢 Закрито`.
- Chat Communication Rule: Detailed reasoning, audit tables, and plans reside in plan files. Responses in chat remain concise.

---

## 8. Skills Architecture Index

### Master Orchestrators

- `test-author`: Autonomous orchestrator for full 6-phase test lifecycle (UI, API, HTTP).
- `code-review`: 5-axis code auditor (Standards, Spec, Coverage, Security, Architecture).
- `skill-creator`: Master creator, validator, benchmarker, and trigger optimizer for agent skills (`.agents/skills/skill-creator/SKILL.md`). Enforces Progressive Disclosure (<500 lines), eval-driven design, and frontmatter optimization.
- `git-commit`: Standardized Conventional Commit generator.

### Domain Modules

- Planning & Disciplines: `pw-plan`, `youtrack-reader`, `constraint-driven-development`, `karpathy-guidelines`, `doubt-driven-development`, `code-simplification`, `interview-me`.
- UI & POM: `pw-pom`, `playwright-e2e`, `playwright-best-practices`, `pw-payment`, `pw-a11y`, `pw-visual`, `playwright-explore-website`, `playwright-automation-fill-in-form`, `playwright-generate-test`.
- API & Network: `pw-api`, `pw-mock`, `pw-schema-sync`, `http-flow-builder`, `ibpm-error`.
- Test Data & Infrastructure: `pw-data`, `pw-arch`, `rules-enforcer`.
- Verification, Triage & Healing: `playwright-cli`, `playwright-test-results`, `pw-debug-rca`, `pw-heal`, `pw-triage`, `flakiness-detector`, `pw-codemod`, `review-feedback-loop`.
- Collaboration (Lark): `lark-im`, `lark-base`, `lark-doc`, `lark-drive`, `lark-approval`, `lark-calendar`, `lark-shared`.
