---
name: constraint-driven-development
description: >-
  Upfront project architectural constraints and quality gates enforcer for insurance-e2e.
  Activate during the planning and pre-coding phases of any test or Page Object task to
  lock in non-negotiable repository rules before writing code: @/ path aliases, user-facing
  locators, actionability rules, strict typing, 210-character line length, data cleanup,
  and deterministic API contracts. Prevents architectural violations and refactoring churn.
---

# Constraint-Driven Development (`constraint-driven-development`)

> **Core Philosophy:** "Design within project constraints from the first line of code. Catching rule violations during planning is 10x cheaper than fixing them during code review or CI triage."

Constraint-Driven Development establishes the fixed boundaries and architectural rules of the `insurance-e2e` repository as non-negotiable guardrails before implementation starts.

---

## Repository Architectural Invariants

### Invariant 1: Path Aliases (`@/` Rule)

- ❌ **Forbidden:** Deep relative imports (`../../../../fixtures`, `../../../utils/apiLogger`, `../../api`).
- ✅ **Mandatory:** Project root alias `@/` for core modules:
  ```typescript
  import { apiTest, e2eTest, deletionLeads } from '@/fixtures/index';
  import { ApiLogger } from '@/utils/apiLogger';
  import { Api } from '@/api';
  import { config } from '@/config/env';
  ```
- ℹ️ _Local relative imports (`./support/...`, `../support/...`) are permitted only within the same feature directory._

### Invariant 2: Locator Hierarchy & Zero-XPath Rule

- **Priority 1:** `getByRole("button", { name: /text/i })`
- **Priority 2:** `getByLabel(/text/i)`
- **Priority 3:** `getByText(/text/i)`
- **Priority 4:** `getByTestId("value")` (backed by `data-state` or `data-testid`)
- **Priority 5:** `locator("[data-gtm-ea='...']")`
- ❌ **Forbidden:** XPath (`xpath=...`), CSS class selectors (`.btn-primary`), dynamic library IDs (`#react-select-*`), placeholder-based queries (`input[placeholder*='...']`).

### Invariant 3: Actionability & Timing Invariants

- ❌ **Forbidden:** `click({ force: true })`, `element.evaluate(el => el.click())`, `page.mouse.click(0, 0)`.
- ❌ **Forbidden:** `page.waitForTimeout(N)`, `setTimeout(N)`.
- ✅ **Mandatory:** Playwright auto-waiting, `await el.scrollIntoViewIfNeeded()`, backdrop dismissal via `page.keyboard.press("Escape")`, and state polling via `expect.poll()`.

### Invariant 4: Strict Typing & Code Standards

- ❌ **Forbidden:** `any`, `Record<string, any>`, `as any`, `// eslint-disable`.
- ✅ **Mandatory:** Strict TypeScript types, explicit return types on public methods, 210-character maximum line length, double quotes, semicolons, 4-space indentation.

### Invariant 5: Test Data Lifecycle & Teardown

- ✅ **Mandatory:** Every test that creates a CRM / IBPM lead must register the lead key for cleanup:
  ```typescript
  deletionLeads.push(lead.key);
  ```
- ❌ **Forbidden:** Unregistered orphan test data left on stage or production environments.

### Invariant 6: Single-Status API Verification

- ❌ **Forbidden:** Status arrays: `expect([422, 500]).toContain(status)`, `[401, 404]`.
- ✅ **Mandatory:** Deterministic single status: `expect(response.status).toBe(422)`. Server 500 errors must never be masked.

### Invariant 7: Clean Workspace Rule

- ❌ **Forbidden:** Temporary debug files or probes (`probe-*.ts`) in `tests/` or `app-*/`.
- ✅ **Mandatory:** All temporary inspection scripts go into `.temp/` and must be deleted after the task.

---

## Pre-Coding Constraints Gate

Verify these 6 invariants before writing the first line of code:

```text
[ ] 1. Imports will use @/ aliases for root modules
[ ] 2. Locators will follow getByRole -> getByTestId hierarchy (no XPath/CSS classes)
[ ] 3. No waitForTimeout or force: true planned
[ ] 4. Test data cleanup (deletionLeads) accounted for
[ ] 5. Single exact expected HTTP status codes determined
[ ] 6. Target file paths match repository convention:
       - UI test: tests/{finance|minfin}/{product}/pages/*.{finance|minfin}.ts
       - API test: tests/api/{service}/*.api.ts
       - Page Object: app-{finance|minfin}/pages/{product}/Name.page.ts
       - Component: app-{finance|minfin}/components/Name.component.ts
```
