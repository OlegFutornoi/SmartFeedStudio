---
name: code-review
description: >-
  Deep automated QA code review & fix cycle for SmartFeed Studio E2E. Use whenever the user wants to audit test files, Page Objects, API clients, or the whole test suite. Performs a 5-phase lifecycle: 1) Multi-axis deep analysis (Standards, Spec, Coverage, Security, Architecture), 2) Creates a structured audit task in e2e/tasks/active/qa-fe-review-<slug>.md, 3) Applies fixes, 4) Re-runs analysis, 5) Commits via git-commit.
---

# Deep QA Code Review & Quality Audit (`code-review`)

5-axis code audit protocol for Playwright UI and API tests in SmartFeed Studio E2E.

---

## 1. The 5 Review Axes

### Axis A: Architectural Standards & Linters

- Scanner execution: `node .agents/skills/rules-enforcer/scripts/scan-violations.cjs --changed`.
- Compilation: `npx tsc --noEmit && npm run lint`.
- Imports: Zero deep relative imports to root modules (`../../fixtures`). Strict `@/` alias.
- Locators: User-facing locators only (`getByRole`, `getByLabel`, `getByTestId`). Zero XPath or raw CSS.
- Waits: Zero `waitForTimeout` or `force: true`.

### Axis B: Specification & Title-to-Payload Parity

- Title Parity: Every value declared in test title (`undefined`, `null`, `""`) must be explicitly present in the payload object (`{ field: undefined }`).
- Lead Flow Compliance: Verification covers appropriate stages (1-7) of the Lead Flow schema.
- Anti-Testing Theater: Every test asserts actual business entities (policy numbers, prices), not just generic page load.

### Axis C: Coverage & Response Integrity

- Status Codes: Deterministic single status (`toBe(200)` or `toBe(422)`). No fuzzy arrays (`[422, 500]`).
- 4-Layer Defense: `not.toBe(500)` -> `toBe(status)` -> JSON Content-Type -> non-empty body -> AJV schema check.
- Boundary Matrix: Negative tests must cover empty strings, whitespace, null, explicit undefined, and boundary lengths.

### Axis D: Security & State Teardown

- Zero Secrets: Credentials loaded strictly via `config.*` from `config/env.helper.ts`. No hardcoded phone/passwords.
- Data Cleanup: Every created lead registered in `deletionLeads.push(leadKey)`.

### Axis E: Modularity & Code Health

- Spec Size: Test files must stay under 200 lines. Heavy logic extracted to `support/flow.helpers.ts`.
- Zero Dead Code: No unused helper functions, zombie builders, or `console.log` statements.
- Structured Logging: Uses `@/utils/apiLogger` exclusively.

---

## 2. Dynamic Concurrency Verification Gate

Before approving any pull request or commit, execute local stress verification:

```bash
npx playwright test <spec_path> --project=<finance|minfin|api> --repeat-each=3 --workers=4
```

Any failure during repeat runs indicates flakiness and triggers an immediate `REJECT`.

---

## 3. Actionable Fix Report Template

When issues are found, return structured feedback:

```markdown
### [Severity] Rule: {Violation Summary}

- **Location:** {file_path}:{line_number}
- **Rationale:** {Why this causes flakiness, type errors, or architectural drift}
- **Suggested Fix:**
  // Before
  {failing_code}
  // After
  {compliant_code}
```

Limit: Maximum 3 review rounds between Reviewer and Author before escalating.
