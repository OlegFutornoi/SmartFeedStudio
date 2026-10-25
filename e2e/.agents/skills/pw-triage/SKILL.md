---
name: pw-triage
description: >-
  CI & Test Failure Triage skill for insurance-e2e. Analyzes failed test runs from GitHub Actions, terminal logs, or test-results/ directory. Classifies root causes into APP_BUG, TEST_BUG, ENV_DOWN, DATA_STALE, or FLAKY using network traces, console logs, and healthcheck scripts. Produces structured triage reports in Plan/activ/ and prevents accidental test modification when the application backend or 3rd-party provider fails.
---

# CI & Test Failure Triage (`pw-triage`)

Systematic triage and classification engine for automated test failures in `insurance-e2e`.

---

## 1. Golden Rule of Triage

Never modify test locators or assertions when the failure is caused by an application defect (`APP_BUG`) or infrastructure downtime (`ENV_DOWN`).

---

## 2. 5 Failure Classifications

1. `APP_BUG`:
   - Symptoms: HTTP 500/502 from insurance APIs (EWA, AIWA, iBPM, Portmone), server-side validation rejecting valid data, unhandled React runtime exceptions.
   - Action: Annotate test with `e2eTest.fixme("APP_BUG: <defect summary>")`. Do NOT edit locators. Log bug report.

2. `ENV_DOWN`:
   - Symptoms: 504 Gateway Timeout, 503 Service Unavailable, Cloudflare connection refused, external MTIBU gateway offline.
   - Action: Run `env-healthcheck.ts`. Notify DevOps/backend team. Do not modify test code.

3. `DATA_STALE`:
   - Symptoms: 409 Conflict ("Contract already exists for vehicle"), blacklisted test phone, expired test certificate.
   - Action: Rotate test data via `data/*.data.ts` or `@/utils/leadRandom`.

4. `FLAKY`:
   - Symptoms: Intermittent pass/fail, actionability timeout due to loader overlay, focus drop during animation, unpolled `Promise.race`.
   - Action: Apply `flakiness-detector` rules (visibility filter, readiness polling).

5. `TEST_BUG`:
   - Symptoms: Outdated locator following intentional UI redesign, altered DTO schema contract, missing `await`.
   - Action: Update Page Object locators via `pw-pom` or sync schemas via `pw-schema-sync`.

---

## 3. Diagnostic Pipeline

```bash
# 1. Verify environment availability
npx ts-node .agents/skills/pw-heal/scripts/env-healthcheck.ts [osago|travel|greencard]

# 2. Extract network failures from trace
node .agents/skills/pw-heal/scripts/parse-trace.js test-results/<test>/trace.zip network

# 3. Extract browser console errors from trace
node .agents/skills/pw-heal/scripts/parse-trace.js test-results/<test>/trace.zip console

# 4. Extract exact failing line
python3 .agents/skills/pw-heal/scripts/extract-trace.py test-results/<test>/trace.zip
```

---

## 4. Triage Report Format (`Plan/activ/triage-<slug>.md`)

```markdown
# Triage Report: {Test Suite Name}

- **Date:** {YYYY-MM-DD}
- **Environment:** STAGE / PROD / REVIEW
- **Verdict:** APP_BUG | ENV_DOWN | DATA_STALE | FLAKY | TEST_BUG

## 1. Incident Details

- **Location:** {file_path}:{line_number}
- **Error:** {exact error string}
- **Network Trace:** {HTTP method, endpoint, status, error payload}

## 2. Root Cause Analysis

{Detailed explanation of why the failure occurred based on logs/trace}

## 3. Action Items

- {e2eTest.fixme annotation or assigned team notification}
```
