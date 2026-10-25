---
name: pw-api
description: >-
  Playwright API test engineer & refactoring skill. Use when creating new API tests (*.api.ts), refactoring or improving existing API tests, designing positive and negative API test scenarios, validating API contracts with AJV JSON schemas, automating multi-step API lead lifecycles (IBPM/CRM/EWA/AIWA/OTP), testing API error handling and status codes (200, 201, 400, 404, 409, 422, 500), generating or updating JSON schemas for requests/responses, or inspecting Swagger/OpenAPI specs.
---

# Playwright API Test Engineer (`pw-api`)

Core architectural specification for Playwright API test suites (`*.api.ts`) across all backend services (CRM, iBPM, Product Manager, OTP, ID Service, Baza GAI).

---

## 1. Core Architectural Invariants

1. Structural Separation:
   - `*.positive.api.ts`: E2E business lifecycles, tariff combinations, privileges, installment flows, status 200/201, and full data parity.
   - `*.negative.api.ts`: Full boundary matrix, session invalidation, method mismatch (405), 400, 401, 404, 409, 422.
   - Never merge positive and negative tests into a single file.

2. Zero Cross-Partner Coupling:
   - Minfin tests (`tests/api/ibpm/minfin/...`) must NEVER import helpers, data, or assertions from Finance (`tests/api/ibpm/finance/...`) and vice-versa.
   - Shared utilities belong in `@/tests/api/support/` or `@/utils/`.

3. Deterministic Status Codes:
   - Exact code matching: `expect(response.status).toBe(expectedCode)`.
   - Prohibited: Fuzzy arrays (`expect([422, 500]).toContain(status)`, `[401, 404]`, `[404, 405]`).
   - Crash Guard: HTTP 500 is an unhandled backend crash, never an acceptable alternate status.

4. Two-Layer Defense (Runtime Schema + Compile-time Typing):
   - Layer 1 (Runtime Contract): Validate response body via AJV: `validateWithSchema(data, SchemaPath.*)`.
   - Layer 2 (Compile-time Type Safety): Cast data to generated TypeScript models (`as LeadResponse`).
   - Single Source of Truth: JSON Schemas in `api/schemas/`. Types compiled via `npm run schemas:types`.
   - Every positive test checking `getLeadRaw` must execute Layer 1 schema validation.

5. Response Integrity (4-Layer Defense):
   - Use standard helpers from `@/tests/api/ibpm/support/boundary.helpers`:
     - Positive responses: `assertSuccessResponse(res, expectedStatus, context)`
     - Error responses: `assertBoundaryError(res, expectedStatus, context)`
   - Asserts: 1) `not.toBe(500)`, 2) `toBe(status)`, 3) `headers["content-type"]` matches JSON regex, 4) `body` is non-empty, 5) AJV error schema valid.

6. Business Lifecycle & State Parity:
   - Complete flows: Transition leads through actual business states (`draft` -> `kyc_pending` -> `submitted` -> `otp_verification` -> `payment_pending` -> `emitted`).
   - Parity with `.http` files: Every transition asserted in JetBrains `.http` files must be verified in `*.api.ts` via `expect.poll` or `pollLeadState`.

7. Financial Precision Invariants:
   - Prohibited: `expect(price).toBeGreaterThan(0)`.
   - Required: Exact match to selected tariff, `fullPayment - discount = appliedPayment`, installments sum matches total within 1 UAH tolerance. Use `assertPaymentInvariants(payments)`.

8. Structured Logging (`ApiLogger`):
   - Use `@/utils/apiLogger` exclusively:
     - `ApiLogger.test(id, name)`
     - `ApiLogger.step(current, total, description)`
     - `ApiLogger.request(method, endpoint, summary)`
     - `ApiLogger.status(actual, expected)`
     - `ApiLogger.schema(schemaPath, valid)`
     - `ApiLogger.state(leadId, state)`
     - `ApiLogger.assertion(description, value)`
     - `ApiLogger.success(message)` (Method `result()` does not exist)
     - `ApiLogger.failure(message, details)`
   - Prohibited: `console.log`, `console.warn`.

9. Modularity & Spec Line Limit:
   - Spec files must stay < 200-250 lines.
   - Orchestration logic goes to `support/flow.helpers.ts`.
   - Test data and parameterization arrays go to `support/flow.data.ts`.
   - DRY helper: If a suite has >1 positive test, extract Two-Layer verification into a typed helper (`verifyLeadContract`).

10. Teardown:
    - Every created lead must push its CRM key: `deletionLeads.push(leadKey)` (`osago_<leadId>`). Do not push raw UUIDs.

11. Anti-Testing Theater & Property Completeness:
    - Superficial tests (checking only `id`, `shortName`, `logo`) are strictly prohibited. Every property defined in schemas or required by the business domain (e.g. `avg_settlement_days`, `avg_settlement_days_description`, MTSBU metrics) must be explicitly asserted for presence (`"field" in item` and in JSON schema `required`), regardless of nullability.

12. Strict TypeScript Typing (No Weak Types):
    - Prohibited: `Record<string, unknown>`, `Record<string, any>`, `any`, `as unknown as ...`.
    - Required: Explicit typed interfaces and models exported from `flow.data.ts` or domain model files.

13. Dynamic Polling Timeouts:
    - Never hardcode short polling timeouts (10-15s). Always derive timeouts dynamically from backend contracts (`retryAfter`, minimum 45s for stage SMS OTP).

14. Title-to-Payload Parity:
    - When test title states `field = undefined`, `field = null`, or `field = ""`, the payload MUST explicitly declare `{ field: undefined }` or `{ field: null }`. Never pass `{}`.

15. Universal Active Plan Mandate:
    - Any API authoring, refactoring, or audit MUST create an active plan in `Plan/activ/<slug>.md` and register in `Plan/README.md` before applying changes.

---

## 2. Schema Lifecycle & Type Generation

```text
1. Inspect api/schemas/ and TypeScript models in api/**/models/generated/.
2. Generate schema from response sample (if missing):
   node .agents/skills/pw-api/scripts/generate-json-schema.js sample.json api/schemas/service/endpoint.schema.json --title="EndpointResponse"
3. Compile TypeScript interfaces:
   npm run schemas:types
4. Import compiled interfaces from api/ibpm/models/generated/ or api/index.ts.
```

---

## 3. Standard Test Suite Architecture

```text
tests/api/{domain}/{feature}/
├── {feature}.positive.api.ts      # Declarative test.step calls only (<200 lines)
├── {feature}.negative.api.ts      # Parameterized boundary matrix (<200 lines)
├── README.md                      # CLI commands, coverage description, test cases
└── support/
    ├── flow.helpers.ts            # Business actions, polling, verifyLeadContract
    ├── flow.data.ts               # Payload builders, boundary data arrays
    └── timeouts.ts                # Explicit timeout constants
```

---

## 4. Architectural JSDoc Header Template

Every `*.api.ts` file must begin before `test.describe` with this header:

```typescript
/**
 * @fileoverview {Suite Title}
 *
 * ARCHITECTURAL DEFENSE LAYERS:
 * 1. Status Code Defense: Deterministic status assertion on all steps; strict non-500 guard.
 * 2. Protocol Integrity: Content-Type application/json validation; non-empty body.
 * 3. Contract & Data Parity: AJV JSON Schema Draft-07 (Runtime) + TypeScript DTOs (Compile-time).
 * 4. Boundary Matrix: Full nullability and boundary matrix per pw-test-designer.
 * 5. Lifecycle Parity: Verification of lead state transitions and teardown cleanup.
 */
```
