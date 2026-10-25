---
name: pw-plan
description: Playwright test planner skill. Use when investigating a web page, analyzing user flows, or creating test plans / E2E test specifications saved as markdown files in Plan/activ/.
---

# Playwright Test Planner (`pw-plan`)

Test planning, user flow analysis, and lifecycle tracking protocol for `insurance-e2e`.

---

## 1. Test Plan Lifecycle Protocol

1. Creation & Registration:
   - Create plan file at `Plan/activ/<slug>.md`.
   - Register plan row in `Plan/README.md` with status `🟡 В роботі`.

2. Planning Structure:
   - Target Scope: Product, domain (`finance.ua` vs. `minfin.ua`), target environment (`stage` vs. `review2`).
   - Architectural Constraints: `@/` imports, non-500 status defense, lead teardown.
   - Test Scenarios: Clear business intent, inputs, expected states, parity validations.

3. Mandatory Closure Rule:
   - When implementation passes all gates (`PASSED`, `npx tsc --noEmit` = 0 errors, `npm run lint` = 0 errors):
     1. Move plan file from `Plan/activ/<slug>.md` to `Plan/close/<slug>.md`.
     2. Update `Plan/README.md` status to `🟢 Закрито` with completion date.
   - Leaving completed plans in `Plan/activ/` is strictly prohibited.

---

## 2. Standard Plan Template (`Plan/activ/<slug>.md`)

```markdown
# Plan: {Feature Title}

**Slug:** `{slug}`
**Status:** 🟡 В роботі
**Created:** {YYYY-MM-DD}
**Target:** {Domain & Product}

---

## 1. Objectives & Pre-Flight Attestation

- Domain: {finance | minfin | api}
- Environment: {stage | review2 | prod}
- Locked Constraints: `@/` path aliases, user-facing locators, non-500 response defense (4-layer), lead teardown in deletionLeads.

---

## 2. Requirements & Contract Traceability Matrix (RTM)

> Single source of truth. Every requirement must be explicitly listed so downstream agents do not drop it.

| REQ-ID | Category   | Source (JIRA/Swagger/Code) | Requirement Specification & Invariants       | Target Test / Assertion Gate |
| ------ | ---------- | -------------------------- | -------------------------------------------- | ---------------------------- |
| REQ-01 | Functional | INSDEV-XXXX                | Опис вимоги, вхідні дані та обмеження        | Scenario 1                   |
| REQ-02 | Contract   | Swagger `/api/...`         | Перелік обов'язкових полів відповіді         | Scenario 1 / Layer 4 AJV     |
| REQ-03 | Boundary   | Edge Case Matrix           | Граничні значення: `""`, `null`, `undefined` | Scenario 2                   |

### Contract Property Checklist (Anti-Testing Theater)

All fields below MUST be asserted for presence (`"field" in item`) and correct type:

- [ ] `field_1`: (type, nullable: false) — description
- [ ] `field_2`: (type, nullable: true) — description (e.g. MTSBU statistics)

---

## 3. Test Scenarios

### Scenario 1: {Happy Path Description}

- Actions: ...
- Expected State & Assertions: ...

### Scenario 2: {Boundary / Error State}

- Inputs: {explicit boundary values, e.g. `{ field: undefined }`}
- Expected State & Assertions: ...

---

## 4. Verification Gate

- `npx tsc --noEmit && npm run lint`
- `npx playwright test <spec_path> --repeat-each=3 --workers=4`
```

---

## 3. DOM Inspection Utility

Scan interactive elements and test IDs on unknown target pages:

```bash
npx ts-node .agents/skills/pw-plan/scripts/inspect-dom.ts [url] [env_name]
```
