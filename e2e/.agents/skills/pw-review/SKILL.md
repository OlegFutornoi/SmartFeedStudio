---
name: pw-review
description: Playwright QA code reviewer skill. Use when performing deep code reviews of Playwright test files (*.finance.ts, *.minfin.ts, *.api.ts) or Page Objects to detect flakiness risks, missing awaits, waitForTimeout abuse, CSS/XPath locators, type errors, or POM architectural violations.
---

# Playwright Static Code Reviewer (`pw-review`)

Automated static inspection rules for Playwright test files and Page Objects.

---

## 1. Static Audit Checklist

1. Asynchronous Execution:
   - Verify every Playwright API call and Locator action has `await`.
   - Prohibited: Floating promises, missing `await expect(...)`.

2. Control Flow & Conditionals:
   - Prohibited: `if / else`, `switch`, `try / catch` inside test bodies (`no-conditional-in-test`).
   - Exception: In-depth flow helpers with explicit `// eslint-disable-next-line playwright/no-conditional-in-test`.

3. Actionability & Waits:
   - Prohibited: `waitForTimeout()`, `setTimeout()`, `click({ force: true })`, `evaluate(el => el.click())`.
   - Required: `expect.poll()` for async state, `scrollIntoViewIfNeeded()` before clicking.

4. Selectors & Encapsulation:
   - Prohibited: XPath (`xpath=`, `//`), CSS class selectors, `input[placeholder*='...']`.
   - Required: `getByRole`, `getByLabel`, `getByTestId` (`data-state`).
   - POM: Locators must be `private readonly` inside Page/Component classes.

5. Type Safety & Linters:
   - Prohibited: `: any`, `as any`, `Record<string, any>`, `Record<string, unknown>`, `as unknown`.
   - Lines must not exceed 210 characters (ESLint v9).
   - Clean git diff: Zero `console.log` statements.

---

## 2. Automated Static Inspection Commands

```bash
# Check for unhandled timeouts and sleeps
git diff --name-only | grep -E '\.ts$' | xargs grep -n "waitForTimeout\|setTimeout" || true

# Check for banned locators and forced clicks
git diff --name-only | grep -E '\.ts$' | xargs grep -n "xpath=\|force:\s*true\|evaluate.*click" || true

# Check for weak typing
git diff --name-only | grep -E '\.ts$' | xargs grep -n -E "Record<string,\s*unknown>|:\s*any\b|\bas any\b" || true

# Typecheck and lint
npx tsc --noEmit && npm run lint
```
