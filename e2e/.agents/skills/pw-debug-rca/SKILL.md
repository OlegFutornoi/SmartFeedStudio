---
name: pw-debug-rca
description: >-
  Systematic Root Cause Analysis (RCA) and deep debugging skill for Playwright UI and API test failures in SmartFeed Studio E2E. Use when a test fails or is flaky to classify the root cause (UI/DOM overlay, API 4xx/5xx crash, environment downtime, async hydration race, or broken locator) using trace.zip, network dumps, and DOM inspection scripts. Delivers surgical fixes without adding waitForTimeout or masking errors.
---

# Playwright Root Cause Analysis (`pw-debug-rca`)

Systematic 4-level root cause analysis engine for Playwright test failures in `SmartFeed Studio E2E`.

---

## 1. 4-Level Diagnostic Tree

### Level 1: Environment & Availability

- Check if backend or external gateway is returning 502/503/504 or connection timeouts:
  ```bash
  npx ts-node .agents/skills/pw-heal/scripts/env-healthcheck.ts [osago|travel|greencard]
  ```
- If environment is unreachable -> classify as `ENV_DOWN` and halt.

### Level 2: Network & Contract Integrity

- Parse trace for failed HTTP requests (4xx/5xx):
  ```bash
  node .agents/skills/pw-heal/scripts/parse-trace.js test-results/**/trace.zip network
  ```
- Identify whether external services (EWA, AIWA, Portmone, SMS service) failed.

### Level 3: Async Hydration & DOM State

- Extract exact line and action where the timeout occurred:
  ```bash
  python3 .agents/skills/pw-heal/scripts/extract-trace.py test-results/**/trace.zip
  ```
- Inspect console errors:
  ```bash
  node .agents/skills/pw-heal/scripts/parse-trace.js test-results/**/trace.zip console
  ```
- Check for loader overlays, animation focus drops, or multiple buttons matching selector.

### Level 4: Locators & DOM Structure

- Inspect live DOM structure to identify modified `data-testid` or `data-state`:
  ```bash
  node .agents/skills/pw-heal/scripts/dump-osago-catalog-dom.js
  npx ts-node .agents/skills/pw-heal/scripts/dump-dropdown-options.ts
  ```

---

## 2. Investigation Protocol

1. Isolate test execution with full tracing:
   ```bash
   npx playwright test <path_to_spec> --trace on
   ```
2. Parse trace artifacts (`extract-trace.py`, `parse-trace.js`).
3. Classify root cause (`APP_BUG`, `TEST_BUG`, `ENV_DOWN`, `DATA_STALE`, `FLAKY`).
4. Apply surgical fix: Update Page Object locator or add `expect.poll` for async state. Never add `waitForTimeout` or `force: true`.
