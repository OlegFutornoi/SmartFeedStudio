---
name: playwright-test-results
description: Playwright test failure triage, root-cause diagnosis, and automated remediation planner. Use whenever inspecting, parsing, or debugging failed test runs in the test-results/ directory, analyzing trace.zip or error-context.md, distinguishing between site/backend bugs vs test automation bugs, generating structured remediation plans, and routing fixes to the appropriate specialized skills (pw-pom, pw-heal, pw-mock, pw-data, pw-payment, pw-a11y, pw-visual, pw-review).
---

# Playwright Test Results Analyzer (`playwright-test-results`)

Automated parser and diagnostic triage engine for failure artifacts in `test-results/` and `playwright-report/`.

---

## 1. Automated Failure Ingestion

Execute the built-in triage scanner to parse all error contexts and traces:

```bash
node .agents/skills/playwright-test-results/scripts/triage-results.js
```

The script scans `test-results/`, extracts console and network 4xx/5xx logs from `trace.zip`, and classifies root causes.

---

## 2. Failure Signature Mapping

- Infrastructure & Gateway Outages (`ENV_DOWN` / `APP_BUG`):
  - Signature: 500, 502, 503, 504, 524 Cloudflare / Varnish / MTIBU Gateway Timeout.
  - Action: Do NOT change test locators. Mark `e2eTest.fixme(...)` and notify backend team.

- Backend Rejection / Unavailable Offers (`APP_BUG`):
  - Signature: "Тимчасово не вдалося завантажити" / Empty offers array from rate calculation.
  - Action: Log defect; do not modify tests.

- Global Test Timeout (`APP_BUG` / `ENV_DOWN`):
  - Signature: `Net::ERR_ABORTED` during retry cycle at 150s mark.
  - Action: Verify backend response times.

- Strict Mode Violations (`TEST_BUG`):
  - Signature: `Error: strict mode violation: locator resolved to N elements`.
  - Action: Narrow locator using `.getByRole()`, `:visible`, or `data-testid`.

- DOM Timeout / Outdated Selectors (`TEST_BUG`):
  - Signature: `Waiting for locator '...' to be visible (30_000ms)`.
  - Action: Inspect updated DOM via `dump-osago-catalog-dom.js` and update POM locators via `pw-pom`.

- Assertion Value Mismatches (`TEST_BUG`):
  - Signature: `Expected received value to equal expected`.
  - Action: Verify if price formatting or whitespace normalization is required.

- Unhandled Async / Missing Await (`TEST_BUG`):
  - Signature: `UnhandledPromiseRejection` or floating locator promise.
  - Action: Add missing `await` before Playwright action.

- Authentication Failures (`ENV_DOWN`):
  - Signature: 401 Unauthorized / 403 Forbidden on CRM or iBPM API requests.
  - Action: Verify credentials in `config/env.*.ts` and auth tokens.
