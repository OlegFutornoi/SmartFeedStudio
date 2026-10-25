---
name: pw-plan
description: Playwright test planner skill. Use when investigating a web page, analyzing user flows, or creating test tasks / E2E test specifications saved as markdown files in e2e/tasks/active/ (with prefix qa-fe- or qa-be-).
---

# Playwright Test Planner (`pw-plan`)

Test planning, user flow analysis, and lifecycle tracking protocol for SmartFeed Studio E2E.

---

## 1. Test Task Lifecycle Protocol

1. Creation & Registration:
   - Create task file at `e2e/tasks/active/qa-fe-<num>-<slug>.md` (UI) or `qa-be-<num>-<slug>.md` (API).
   - Register task row in `e2e/tasks/README.md` with status `🟡 В роботі`.

2. Planning Structure:
   - Target Scope: Project (`server:admin`, `local:desktop`, `server:backend`, `local:backend`).
   - Architectural Constraints: `@/` imports, 4-layer response defense, data isolation.
   - Test Scenarios: Clear business intent, inputs, expected states, contract validations.

3. Mandatory Closure Rule:
   - When implementation passes all gates (`PASSED`, `pnpm --filter @smartfeed/e2e typecheck` = 0 errors):
     1. Move task file from `e2e/tasks/active/` to `e2e/tasks/completed/<filename>.md`.
     2. Update `e2e/tasks/README.md` status to `🟢 Виконано` with completion date.
   - Leaving completed tasks in `tasks/active/` is strictly prohibited.

---

## 2. Standard Task Template (`e2e/tasks/active/qa-fe-<num>-<slug>.md`)

```markdown
# Задача автотестування: {Feature Title}

**ID:** `qa-fe-<num>-<slug>`
**Status:** 🟡 В роботі
**Created:** {YYYY-MM-DD}
**Target:** {server:admin | local:desktop | server:backend | local:backend}

---

## 1. Objectives & Pre-Flight Attestation

- Target: {server:backend | server:admin | local:backend | local:desktop}
- Locked Constraints: `@/` path aliases, user-facing locators, 4-layer response defense, data cleanup.

---

## 2. Test Scenarios

### Scenario 1: {Happy Path Description}

- Actions: ...
- Expected State & Assertions: ...

### Scenario 2: {Boundary / Error State}

- Inputs: {explicit boundary values, e.g. `{ field: undefined }`}
- Expected State & Assertions: ...

---

## 3. Verification Gate

- `pnpm --filter @smartfeed/e2e typecheck`
- `npx playwright test <spec_path> --project=<project> --repeat-each=3`
```
