---
name: doubt-driven-development
description: >-
  Pre-flight test validity, Title-to-Payload parity, and anti-testing-theater audit skill.
  Activate whenever authoring, modifying, or reviewing automated tests to ensure tests fail
  when they should, assertions are meaningful, all fields declared in titles or steps are
  explicitly present in the payload (explicit undefined/null/empty), and no false positives
  exist. Prevents silent test defects, copy-paste omissions, and 200 OK masks for backend failures.
---

# Doubt-Driven Development (`doubt-driven-development`)

Pre-flight verification discipline to eliminate "Testing Theater" (tests that appear green but fail to validate actual business logic).

---

## 1. Title-to-Payload Parity Rule

When a test title or step states that a field is `undefined`, `null`, `""`, or a boundary value:

- Prohibited: Silently omitting the key from the request payload. Omitting a key obscures test intent and tests default fallback rather than boundary handling.
- Mandatory: The value MUST be explicitly declared in the payload object:
  ```typescript
  // Title: "should return 422 when idCardNumber is undefined"
  const payload = { ...validLead, idCardNumber: undefined };

  // Title: "should return 422 when document is null"
  const payload = { ...validLead, document: null };

  // Title: "should return 422 when taxId is empty string"
  const payload = { ...validLead, taxId: '' };
  ```

---

## 2. Anti-"Testing Theater" Invariants

A test is "theater" if it passes regardless of backend behavior:

- Asserting page load state (`networkidle`, title) without asserting business outcomes (policy number, tariffs, cards).
- Masking server crashes behind fuzzy status codes (`expect([422, 500]).toContain(status)`).
- Asserting `status === 200` when the response body contains `{ error: "Service unavailable" }`.
- Asserting only 2-3 superficial fields (`id`, `shortName`, `logo`) while ignoring critical contract fields (`avg_settlement_days`, `avg_settlement_days_description`, MTSBU metrics, `company.*`, `legal.*`, `advantages`).
- Wrapping assertions in `if (item.field) { expect(...) }` without unconditional existence checks (`"field" in item`) or without verifying a minimum Hit Counter (`expect(hitCount).toBeGreaterThan(0)`).
- Using loose regex matchers (e.g. `/[€$]|EUR|USD/i` when contract specifies symbol only `[€$]`).
- Positive tests for specific features (sport risk, work trip, locale, multivisa) passing solely on `tariffs.length > 0` without asserting the feature's observable business delta (price increase, translated text).
- Omitting contract fields from schema `required` array when they are nullable (e.g. `avg_settlement_days` can be null, but the property itself MUST exist).
- Using weak types (`Record<string, unknown>`, `any`) that blind the compiler to missing or misspelled properties.
- Calling `ApiLogger.assertion()` without executing a corresponding Playwright `expect()`.
- Every positive UI test must assert actual prices, tariffs, and policy creation.
- Every API test must validate deterministic response schemas via AJV (`validateWithSchema`).

---

## 3. Pre-Flight Self-Review Checklist

Before executing CLI runs or submitting code for review, verify:

1. Title Parity: Does every boundary value declared in the test title exist explicitly in the payload object?
2. Deterministic Status: Is the expected HTTP status exact (422, 200, 201) rather than an array?
3. Non-500 Guard: Is `expect(status).not.toBe(500)` verified before checking specific status?
4. Content-Type: Is `headers["content-type"]` verified against JSON regex?
5. Full Property Parity: Are all contract/schema fields asserted for presence in response items (`"field" in item` and in `required`), even if null?
6. Zero Testing Theater: Are there any `if (item.field)` blocks skipping assertions? Is every conditional check guarded by a Hit Counter?
7. Strict Matchers: Are regex and matchers exact without loose fallback alternatives that mask regressions?
8. Business Delta: Does every positive feature test assert the actual business outcome (delta/price/text), not merely `length > 0`?
9. Weak Types: Is the code 100% free of `Record<string, unknown>`, `Record<string, any>`, and `any`?
10. Dynamic Timeouts: Are async polling intervals and timeouts derived dynamically from backend headers (`retryAfter`, >=45s for stage SMS)?
11. Teardown: Is test data scoped via `runId` and cleaned up via `cleanup.ts` (Server DB) or `POST /api/reset` (Local DB)?
12. Actionability: Is the test free of `force: true` and `waitForTimeout`?
13. Universal Active Task: Is the task tracked in `e2e/tasks/active/qa-fe-<num>-<slug>.md` (or `qa-be-`) and registered in `e2e/tasks/README.md`?
