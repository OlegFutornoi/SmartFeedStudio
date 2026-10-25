---
name: playwright-cli
description: CLI execution presets, environment configurations, and command flags for running Playwright tests in insurance-e2e. Use when executing tests locally, configuring parallel workers, running concurrency stability gates, switching target environments (stage, prod, review), or filtering test runs by tags.
---

# Playwright CLI Execution Guide (`playwright-cli`)

Repository-specific execution presets, environment switches, and concurrency configurations for `insurance-e2e`.

---

## 1. Project Presets

The framework defines 3 main Playwright projects in `playwright.config.ts`:

- `finance`: UI tests for Finance.ua (`*.finance.ts`, viewport 1440x900).
- `minfin`: UI tests for Minfin.ua (`*.minfin.ts`, viewport 1440x1200).
- `api`: Backend API tests (`*.api.ts`, no browser overhead).

Execute by project:

```bash
npx playwright test tests/finance/osago/pages/catalog.finance.ts --project=finance
npx playwright test tests/minfin/osago/home/home.minfin.ts --project=minfin
npx playwright test tests/api/ibpm/finance/osago/osago-ewa.positive.api.ts --project=api
```

---

## 2. Environment Selection Flags

Controlled via process environment variables in `config/env.helper.ts`:

- Stage / Integration (Default): `npx playwright test ...`
- Review Stand 1/2/3: `REVIEW=2 npx playwright test ...`
- Production Execution: `PROD=1 ALLOW_PROD_TESTS=1 npx playwright test ...` (Mandatory safety guard).

---

## 3. Concurrency & Stability Gate

Before approving tests or marking plans complete, run the concurrency gate:

```bash
npx playwright test <spec_path> --project=<project> --repeat-each=3 --workers=4
```

All iterations must pass (`100% PASSED`). Any failure indicates flakiness.

---

## 4. Debugging & Artifact Flags

- Run with full tracing enabled:
  ```bash
  npx playwright test <spec_path> --trace on
  ```
- Run with UI inspector:
  ```bash
  npx playwright test <spec_path> --debug
  ```
- Filter by tags:
  ```bash
  npx playwright test --grep "@osago"
  npx playwright test --grep "@boundary"
  npx playwright test --grep-invert "@flaky"
  ```

---

## 5. Standard CI Commands (`package.json`)

```bash
npm run finance:osago:pages:ci
npm run minfin:osago:pages:ci
npm run ibpm:lead:osago:stage:ci
npm run catalog:monitoring:prod:osago
```
