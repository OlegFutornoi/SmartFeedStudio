---
trigger: always_on
---

## ANTI-PATTERNS & REQUIRED EQUIVALENTS

- ❌ CSS classes / XPath -> ✅ User-facing locators (`getByRole`, `getByTestId`, `getByLabel`, `getByText`).
- ❌ Public locators (`public btn=...`) -> ✅ `private readonly` locators with class encapsulation.
- ❌ `Promise<any>`, `as any`, `Record<string, any>`, `eslint-disable` -> ✅ Strict TypeScript typing in source models.
- ❌ Hardcoded URLs/hosts (`localhost:4000`, `localhost:3000`, `127.0.0.1:1420`) -> ✅ `@/config/urls` or `env.ts`.
- ❌ `page.waitForTimeout()` / `setTimeout` -> ✅ `expect.poll()` or web-first assertions (`toBeVisible()`).
- ❌ Tests without tags -> ✅ Mandatory `{ tag: ["@smoke", "@server-admin"] }` / `{ tag: ["@regression", "@local-backend"] }`.
- ❌ Deep relative imports (`../../../../`) -> ✅ Project root aliases `@/` (`@/core`, `@/config`, `@/server`, `@/local`).

## TEST STABILITY RULES

### 1. Import Standards (`@/` Path Alias Rule)

- ❌ **Deep relative imports (`../../../../`):** Never traverse 3+ parent directories for core modules.
- ✅ **Mandatory `@/` alias for modules:** Always import via `@/`:
  - `import { test, expect } from "@/core/fixtures/base.fixture";`
  - `import { urls } from "@/config/urls";`
  - `import { LocalDbClient } from "@/local/backend/clients/local-db.client";`

### 2. Prohibited Selectors

- ❌ `input[placeholder*='...']`: Placeholders shift on redesign/i18n. Use `getByLabel`, `getByRole("textbox")`, or `getByTestId`.
- ❌ Dynamic library IDs (MUI, Radix, Tailwind generated): Unstable across renders. Use `getByTestId` or `getByRole`.
- ❌ XPath (`xpath=...`): Strictly forbidden.
- ❌ Raw selectors directly in spec files: All locators belong in Page Objects or component classes.

### 3. Actionability Checks

- ❌ `click({ force: true })`: Masks overlays and non-interactive DOM states. Use `await el.scrollIntoViewIfNeeded(); await el.click();`. Dismiss overlays before clicking.
- ❌ `element.evaluate(el => el.click())`: Bypasses Playwright actionability checks. Prohibited as a click fallback.
- ❌ `page.mouse.click(0, 0)`: Has side effects on corner elements. Use `page.keyboard.press("Escape")` or click the body/backdrop.

### 4. Test Data Management

- ❌ Hardcoded data without run isolation: Use `runId` and `uniqueName()` / `testEmail()` from `@/core/data/test-id` to prevent concurrent collision.
- ❌ Uncleaned test records: Clean up via `cleanup.ts` in server DB and `POST /api/reset` in local DB.

### 5. Business Verification

- ❌ Verifying page load instead of business outcome: E.g., feed sync test must assert product count update, not just wizard closing.
- ❌ Logging without assertions: Any extracted value must be validated via `expect()`.

### 6. API Test Structure

- ✅ **Logic Isolation:**
  - Business orchestration and API calls go to `server/backend/clients/<domain>.client.ts`.
  - Spec files contain helper calls, response status checks, and business state assertions.
- ❌ Fuzzy status arrays: `expect([400, 500]).toContain(status)` strictly forbidden. Deterministically assert ONE status: `expect(status).toBe(expectedCode)`. 500 is a backend crash, never mask it.
- ❌ Full Contract Property Verification: Every property required by the contract schema MUST be explicitly asserted for presence in response items.
- ✅ **Response Integrity 4-Layer Defense:**
  1. `expect(response.status).not.toBe(500)` (backend crash guard);
  2. `expect(response.status).toBe(expectedStatus)` (exact deterministic status);
  3. `expect(response.headers?.["content-type"]).toMatch(/application\/(?:problem\+)?json/)` (validates JSON, blocks HTML proxy errors);
  4. `expect(response.body).toBeTruthy()` (non-empty body);
  5. Schema check against Zod/DTO contract.

### 7. Task Lifecycle Mandate

- ✅ **Strict Task Authoring in `e2e/tasks/active/`:**
  - UI tasks: `qa-fe-<num>-<slug>.md`
  - API tasks: `qa-be-<num>-<slug>.md`
  - Register in `e2e/tasks/README.md`.
  - Upon full verification pass, move to `e2e/tasks/completed/<filename>.md`.
