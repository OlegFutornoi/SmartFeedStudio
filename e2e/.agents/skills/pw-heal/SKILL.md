---
name: pw-heal
description: Playwright test healer skill. Use when diagnosing and fixing broken or flaky tests, resolving locator timeouts, fixing broken assertions, or investigating test failures from terminal logs.
---

# Playwright Test Healer (`pw-heal`)

Targeted remediation workflow and diagnostic scripts for failing or flaky Playwright tests in `SmartFeed Studio E2E`.

---

## 1. Remediation Workflow

1. Diagnose Failure from Trace:
   - Extract exact failing step from `trace.zip`:
     ```bash
     python3 .agents/skills/pw-heal/scripts/extract-trace.py path/to/trace.zip
     ```

2. Classify and Apply Surgical Remediation:
   - Stale / Missing Locator: Update to robust user-facing locator (`getByRole`, `getByLabel`, `getByTestId` with `data-state`).
   - Async Timing / Race Condition: Replace static waits with `expect.poll` or web-first assertions. Prohibited: `waitForTimeout`.
   - Application Defect: If the backend fails (500 or broken business logic), mark test with `e2eTest.fixme(...)` and reference bug ticket. Do not alter working locators.

3. Verify Stability:
   - Re-run test spec locally:
     ```bash
     npx playwright test <path_to_spec> --repeat-each=3 --workers=4
     ```

---

## 2. Utility Scripts Catalog

- Trace Parser (Network/Console/Action):
  ```bash
  node .agents/skills/pw-heal/scripts/parse-trace.js <path/to/trace.zip> [network|console|action]
  ```
- Environment Healthcheck:
  ```bash
  npx ts-node .agents/skills/pw-heal/scripts/env-healthcheck.ts [osago|travel|greencard]
  ```
- Fast UI Flow Verifier (Stage vs. Prod):
  ```bash
  npx ts-node .agents/skills/pw-heal/scripts/verify-flow.ts [stage|prod|both]
  ```
- DOM Dump Utility (OSAGO Catalog):
  ```bash
  node .agents/skills/pw-heal/scripts/dump-osago-catalog-dom.js
  ```
- Dropdown Options Parser:
  ```bash
  npx ts-node .agents/skills/pw-heal/scripts/dump-dropdown-options.ts
  ```
- Minfin V3 Flow Inspector:
  ```bash
  npx ts-node .agents/skills/pw-heal/scripts/dump-minfin-v3-flow.ts [URL]
  ```
