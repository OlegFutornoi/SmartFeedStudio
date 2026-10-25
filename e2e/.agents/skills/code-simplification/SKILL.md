---
name: code-simplification
description: >-
  Test and framework simplification skill for reducing test bloat, eliminating duplication,
  and streamlining Playwright specs and Page Objects. Activate when refactoring test suites,
  simplifying complex POMs, parameterizing repeated test cases, extracting orchestrations
  into typed helpers, or when test files exceed the 200-250 line limit. Enforces KISS and DRY.
---

# Code Simplification (`code-simplification`)

Standards for reducing test complexity, eliminating duplication, and maintaining concise, maintainable Playwright suites.

---

## 1. The 200-Line Spec File Limit

- Test spec files (`*.finance.ts`, `*.minfin.ts`, `*.api.ts`) must stay under 200 lines.
- When approaching the limit:
  - Extract multi-step UI/API orchestrations into `support/flow.helpers.ts`.
  - Extract test datasets and parameter arrays into `support/flow.data.ts`.
  - Extract semantic timeout constants into `support/timeouts.ts`.

---

## 2. Parameterization Over Copy-Paste

Do not copy-paste sequential test blocks for varying values. Iterate over typed configuration arrays:

```typescript
const boundaryCases = [
  { field: 'taxId', value: '', expectedStatus: 422, desc: 'empty string' },
  { field: 'taxId', value: '123', expectedStatus: 422, desc: 'too short' },
  { field: 'taxId', value: '9999999999', expectedStatus: 422, desc: 'invalid checksum' },
];

for (const { field, value, expectedStatus, desc } of boundaryCases) {
  apiTest(`[POST /lead] returns ${expectedStatus} when ${field} is ${desc}`, async ({ api }) => {
    const res = await api.crm.lead.createLead({ [field]: value });
    expect(res.status).toBe(expectedStatus);
  });
}
```

---

## 3. Elimination of Intermediate Variable Clutter

Avoid single-use intermediate variables that add cognitive overhead:

```typescript
// Prohibited:
const submitButton = page.getByRole('button', { name: 'Submit' });
await submitButton.scrollIntoViewIfNeeded();
await submitButton.click();

// Required:
await page.getByRole('button', { name: 'Submit' }).click();
```

---

## 4. Encapsulation in POM

Spec files must contain declarative business assertions, not DOM queries:

- Prohibited in spec: `page.locator(".some-class > div:nth-child(2)")`
- Required in spec: `await landingPage.selectCarCategory("B2");`
- All locators belong inside POM classes as `private readonly` fields.

---

## 5. Dead Code & Zombie Helper Elimination

- Delete unused functions in `support/` immediately.
- Remove `console.log` and commented-out code blocks.
- Remove redundant `isVisible()` queries preceding `click()` — Playwright auto-waits for actionability.
