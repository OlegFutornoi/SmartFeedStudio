---
trigger: always_on
---

## ANTI-PATTERNS & REQUIRED EQUIVALENTS

- ❌ CSS classes / XPath -> ✅ User-facing locators (`getByRole`, `getByTestId` with `data-state`, `getByLabel`, `getByText`).
- ❌ Public locators (`public btn=...`) -> ✅ `private readonly` locators with class encapsulation.
- ❌ `Promise<any>`, `as any`, `Record<string, any>`, `eslint-disable` -> ✅ Strict TypeScript typing in source models.
- ❌ Hardcoded URLs/hosts (`cms-stage`, `product-manager-stage`, `treeumapp.net`, `finance.ua`) -> ✅ `config.*` or `PagePrefix`.
- ❌ `page.waitForTimeout()` / `setTimeout` -> ✅ `expect.poll()` with explicit intervals and timeout.
- ❌ Tests without tags -> ✅ Mandatory `{ tag: ["@finance", "@osago"] }` / `{ tag: ["@api", "@crm"] }`.
- ❌ Deep relative imports (`../../../../`) -> ✅ Project root aliases `@/` (`@/fixtures`, `@/utils/apiLogger`, `@/api`, `@/appConstants`, `@/config`, `@/services`, `@/client-wizard`).
- ✅ Structure: use `// Actions` and `// Verify` comments, structured retry with `try/catch` (e.g. `Escape` before retry click).

## TEST STABILITY RULES

### 1. Import Standards (`@/` Path Alias Rule)

- ❌ **Deep relative imports (`../../../../`, `../../../../../`):** Never traverse 3+ parent directories for core modules (`fixtures/index`, `utils/apiLogger`, `api`).
- ✅ **Mandatory `@/` alias for root modules:** Always import via `@/`:
  - `import { apiTest, e2eTest } from "@/fixtures/index";`
  - `import { ApiLogger } from "@/utils/apiLogger";`
  - `import { Api } from "@/api";`
  - `import { SchemaPath, ApiVersion } from "@/api/ApiConstants";`
- ℹ️ **Local relative imports (`./support/...`, `../support/...`):** Allowed solely within the same local feature/test directory.

### 2. Prohibited Selectors

- ❌ `input[placeholder*='...']`: Placeholders shift on redesign/i18n. Use `getByLabel`, `getByRole("textbox")`, or `getByTestId`.
- ❌ `#react-select-N-input` or library-generated IDs (MUI, Radix): Unstable across renders. Use `data-state`, `data-testid`, or `getByRole`.
- ❌ XPath (`xpath=...`): Strictly forbidden.
- ❌ Selectors directly in spec files: All locators belong in locator maps (`*.locators.ts`) or POM/helper classes.
- ❌ Brittle `has-text('...')` with dynamic UI copy: Use `data-state` or `data-testid` instead of localized strings.

### 3. Actionability Checks

- ❌ `click({ force: true })`: Masks overlays and non-interactive DOM states. Use `await el.scrollIntoViewIfNeeded(); await el.click();`. Dismiss overlays (`Escape`, backdrop click) before clicking.
- ❌ `element.evaluate(el => el.click())`: Bypasses Playwright actionability checks. Prohibited as a click fallback.
- ❌ `page.mouse.click(0, 0)`: Has side effects on corner elements. Use `page.keyboard.press("Escape")` or click the body/backdrop.

### 4. Test Data Management

- ❌ Hardcoded data without env separation: Promo codes, phones, emails, and OTP must reside in `data/<env>/<area>/` or come from env vars.
- ❌ Backend-dependent data without runtime guards: Guard availability before use or document backend preconditions.

### 5. Business Verification

- ❌ Verifying page load instead of business outcome: E.g., promo code test must assert price changes or discount badges, not just catalog loading.
- ❌ Logging without assertions: Dead verifications. Any extracted value (`price`, `company`) must be validated via `expect()`.

### 6. UI Test Structure

- ❌ Duplicate test logic: Parameterize varying inputs via case arrays or `for...of`.
- ❌ Dead code in helpers: Unused `isVisible()` queries slow down polling. Remove or assert.
- ❌ Deprecated imports (`@deprecated`): Replace with current equivalents.
- ❌ Mixing SEO/analytics with business logic: Keep in separate single-responsibility files (SRP).

### 7. API Test Structure (E2E API Flows)

- ✅ **Logic Isolation:**
  - Business orchestration (endpoints, payloads, `expect.poll` status waits) goes to `support/flow.helpers.ts`.
  - Test data and parameterization go to `support/flow.data.ts` and `support/timeouts.ts`.
  - Spec files (`*.api.ts`) contain ONLY helper calls, final state assertions (`expect(result.finalState).toBe(...)`), and step logging.
- ❌ Inline business logic in specs: Never place 50-100 lines of sequential API calls or payload objects in `apiTest` bodies.
- ❌ Fuzzy status arrays: `expect([422, 500]).toContain(status)`, `[401, 404]`, `[201, 404, 422]` strictly forbidden. Deterministically assert ONE status: `expect(status).toBe(expectedCode)`. 500 is a backend crash, never mask it.
- ❌ Dead code / orphan builders: No unused builder files (e.g. `customer.builder.ts`).
- ❌ `any`, `unknown` records & linter suppressions: `Record<string, unknown>`, `Record<string, any>`, `as any`, `as unknown as ...`, and `// eslint-disable` prohibited. Define explicit typed interfaces in `flow.data.ts` or domain models.
- ❌ Anti-Testing Theater (Hollow assertions): Tests passing by checking only 2-3 superficial fields (`id`, `shortName`, `logo`) while backend drops contract fields.
- ✅ Full Contract Property Verification: Every property required by the contract or schema (e.g. `avg_settlement_days`, `avg_settlement_days_description`, MTSBU metrics) MUST be explicitly asserted for presence in response items (`"field" in item` and in JSON schema `required`), regardless of whether the value is null or populated.
- ❌ Hardcoded short polling timeouts (10s, 15s): Causes false negatives on stage throttling.
- ✅ Dynamic Timeouts: Polling durations must be derived dynamically from backend contracts (e.g. `retryAfter`, minimum 45s for stage SMS OTP).
- ✅ Helper 4-Layer Defense: API helper functions (`fetchOrganizations`, `fetchTariffs`) must NEVER return raw bodies without checking `not.toBe(500)` and JSON `content-type`.
- ✅ **DRY Two-Layer Defense Helper:** When spec has >1 positive test, extract raw lead verification (`getLeadRaw` + 200 + AJV + `LeadResponse` + Parity) into a typed helper (`verify*Lead`). Spec line limit: 200-250 lines.
- ✅ **Full Boundary & Nullability Matrix:** Field validation must cover:
  1. `""` (empty string)
  2. `"   "` (whitespace)
  3. `null` (JSON null)
  4. `undefined` (omitted key / explicit undefined)
  5. `"null"` and `"undefined"` (type confusion string literals)
  6. Length bounds: `min - 1`, `max + 1`, special symbols, forbidden charsets
  7. Numbers: `-1`, `0`, floats instead of integers
  8. Dates: past dates, invalid ISO strings (`"invalid-date"`)
- ✅ **Response Integrity 4-Layer Defense:**
  1. `expect(response.status).not.toBe(500)` (backend crash guard);
  2. `expect(response.status).toBe(expectedStatus)` (exact deterministic status);
  3. `expect(response.headers?.["content-type"]).toMatch(/application\/(?:problem\+)?json/)` (validates JSON, blocks Nginx/Cloudflare HTML errors);
  4. `expect(response.body).toBeTruthy()` (non-empty body);
  5. 422/400 validation: mandatory AJV schema check against error contracts;
  6. Log check via `ApiLogger.boundaryCheck` (`[CHECK] <context> -> HTTP <status> OK | Content-Type: <type>`).
- ✅ **Architectural JSDoc Header Rule:** Every spec file (`*.api.ts`, `*.finance.ts`, `*.minfin.ts`) must begin before `test.describe` with JSDoc detailing: 1) Status defense & non-500; 2) Protocol & Content-Type; 3) Two-layer AJV/TS contracts; 4) Boundary matrix or financial invariants.
- ❌ **No scratch probes in `tests/`:** Temporary inspection files (`probe-*.ts`) forbidden in `tests/`. Place exclusively in `.temp/` and delete after use.

### 8. HTTP Files (`tools/http/` JetBrains HTTP Client)

- ✅ Extract pre-request (`< {% ... %}`) and response scripts (`> {% ... %}`) into separate `.js` files in `scripts/`.
- ✅ Mandatory `/* eslint-disable */` as line 1 of script files due to global `client`, `response`, `request`.
- ✅ Environment variable mapping in file header: `@VAR={{HTTP_VAR}}` (e.g. `@CLIENT={{HTTP_OSAGO_CLIENT}}`).
- ✅ Mandatory status & lead state assertions in scripts: `client.test` / `client.assert` validating HTTP status (200/201/422/404), `lead.state` (`draft`/`kyc_pending`/`kyc_success`/`kyc_failed`/`submitted`), Diia link, doc data, and error details.
- ❌ Inline multi-line JS in `.http` files: Keep `.http` files declarative.

### 9. Fixtures & Async State

- ❌ Heavy fixtures when only `page` is needed: Use `baseTest` directly for smoke/monitoring without POM overhead.
- ⚠️ `Promise.race` across UI states: Allowed only when followed by `expect.poll()` confirming final state.
- ❌ `page.reload()` as primary retry: Poll first; reload is a last-resort fallback.

### 10. Mandatory Self-Review & Title-to-Payload Parity Rule

- ✅ **Strict Title-to-Payload Parity:** When a test case or step specifies `field = undefined`, `field = null`, `field = ""` or a boundary value, that value **MUST be explicitly and visibly declared in the payload** (`idCardNumber: undefined`, `document: null`).
- ❌ **Never omit fields instead of explicit `undefined`:** Omitting a key obscures test intent and causes silent test defects.
- ✅ **Mandatory Author Pre-Flight Self-Review:** Immediately after writing or modifying code, conduct line-by-line self-review for missing properties, copy-paste errors, and test-design parity before executing tests in terminal.
