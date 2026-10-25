---
name: rules-enforcer
description: >-
  Strict automated compliance and rule-enforcement auditor for insurance-e2e. Validates test files (*.finance.ts, *.minfin.ts, *.api.ts), Page Objects, components, controllers, and HTTP scripts against all rules in .agents/rules/ (gemini-context.md, gemini-context2.md, gemini-pravel.md, gemini-rules.md). Use during code review or before running tests to catch prohibited selectors, import violations, actionability bypasses, fuzzy status codes, and architecture anti-patterns.
---

# Project Rules Enforcer (`rules-enforcer`)

Automated compliance validator enforcing the architectural invariants of the `insurance-e2e` repository.

---

## 1. Automated Violation Scanner

Run the built-in scanner to audit modified files before committing or reviewing:

```bash
# Scan changed files (Exit code 1 = CRITICAL violations present)
node .agents/skills/rules-enforcer/scripts/scan-violations.cjs --changed

# Scan entire repository
node .agents/skills/rules-enforcer/scripts/scan-violations.cjs
```

---

## 2. Rule Catalog

### CRITICAL Violations (Blocks Commit & Merge)

- C1 (Path Aliases): Relative paths (`../..`) to root modules forbidden. Must use `@/` alias (`@/fixtures`, `@/utils`, `@/api`, `@/config`, `@/tests`). Relative paths allowed only for local sibling files.
- C2 (Hardcoded Delays): `page.waitForTimeout()` and `setTimeout()` prohibited. Use `expect.poll()` or web-first assertions.
- C3 (Prohibited Selectors): `xpath=`, CSS classes as primary locators, `input[placeholder*='...']`, `#react-select-*` prohibited. Use `getByRole`, `getByLabel`, `getByTestId` (`data-state`).
- C4 (Actionability Bypasses): `click({ force: true })`, `el.evaluate(e => e.click())`, `mouse.click(0, 0)` prohibited. Use `scrollIntoViewIfNeeded()` and dismiss overlays via `page.keyboard.press("Escape")`.
- C5 (Deterministic Status Codes): Fuzzy status arrays (`expect([422, 500]).toContain(status)`) prohibited. Assert exact expected status. 500 is an unhandled backend crash.
- C6 (Strict Typing): `any`, `as any`, `Record<string, any>`, `Record<string, unknown>`, `// eslint-disable` prohibited. Use explicit DTO interfaces.
- C7 (POM Encapsulation): Public locators (`public btn = ...`) prohibited. Locators must be `private readonly`. Access to `po.page` outside POM prohibited.
- C8 (SSOT URLs): Hardcoded environment domains (`cms-stage.finance.ua`, `finance.ua`, `minfin.ua`) prohibited. Use `config.*` from `@/config/env.helper` or `PagePrefix`.
- C9 (JetBrains HTTP Scripts): Inline JavaScript blocks `< {% ... %}` or `> {% ... %}` in `.http` files prohibited. Extract to `scripts/*.js` with `/* eslint-disable */` header.
- C10 (Missing Awaits): Missing `await` on asynchronous Playwright Locator or API promises prohibited.
- C11 (Boundary Completeness): Testing payload fields with only 1-2 happy values prohibited. Cover full boundary matrix per `pw-test-designer`.
- C12 (Response Integrity): Naked `toBe(422)` or `toBe(200)` checks without 4-layer defense (`not.toBe(500)`, exact status, JSON Content-Type, non-empty body, AJV validation) prohibited. Use `assertSuccessResponse()` / `assertBoundaryError()`.
- C13 (Scratch Probes in Tests): Test probes (`probe-*.ts`) in `tests/` prohibited. Store strictly in `.temp/` and delete after use.

### MAJOR Violations (Mandatory Remediation)

- M1 (Test Tags): Missing `tag` property in `e2eTest` or `apiTest` calls. Mandatory: `{ tag: ["@finance", "@osago"] }` or `{ tag: ["@api", "@crm"] }`.
- M2 (Lead Teardown): Creating leads without registering in teardown. Mandatory: `deletionLeads.push(leadKey)` (`osago_<leadId>`).
- M3 (Hardcoded Test Data): Hardcoded phones, VINs, promo codes, and emails in spec bodies. Use `data/*.data.ts` or Faker generators in `@/utils/leadRandom`.
- M4 (Magic Timeouts): Raw numbers (`15000`, `60000`) in waits. Use named constants from `support/timeouts.ts`.
- M5 (Dead Verifications): Extracting values (`price`, `company`) without verifying via `expect()`.
- M6 (Brittle Fallback Chains): Chains like `locator(A).or(locator(B)).or(locator(C))` prohibited. Max 1 fallback with logging.
- M7 (Monolithic Specs): Test spec files exceeding 200 lines. Extract orchestration to `support/flow.helpers.ts`.
- M8 (Line Length): Lines exceeding 210 characters (ESLint v9 limit).
- M9 (Architectural JSDoc): Missing architectural defense header before `test.describe` in `*.api.ts` files.
