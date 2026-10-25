---
name: review-feedback-loop
description: >-
  Standardized QA Gatekeeper and review feedback loop protocol between Test Author and Code Reviewer agents in SmartFeed Studio E2E. Dictates the structured format of review reports, classification of findings (Critical, Major, Minor), actionable diff proposals, surgical fix validation, and commit approval gates.
---

# QA Review Feedback Loop Protocol (`review-feedback-loop`)

Formal interaction protocol between Test Author and Code Reviewer agents in SmartFeed Studio E2E.

---

## 1. Review Request Protocol (Author -> Reviewer)

When authoring is complete and Phase 4 pre-flight checks pass:

1. Provide modified/created file paths.
2. Link to active task file (`e2e/tasks/active/qa-fe-<num>-<slug>.md` or `qa-be-...`).
3. State target environment and execution commands used.

---

## 2. Actionable Fix Report (Reviewer -> Author)

If defects (`CRITICAL` or `MAJOR`) are detected, the Reviewer must issue an Actionable Fix Report:

````markdown
### [Severity] {Rule Code}: {Brief Violation Title}

- **Location:** {file_path}:{line_number}
- **Rule Violated:** {rule_name_from_rules_enforcer}
- **Rationale:** {Exact technical failure or flakiness caused}
- **Before:**
  ```typescript
  {
    non_compliant_code;
  }
  ```
````

- **After (Fix):**
  ```typescript
  {
    compliant_code;
  }
  ```

```

---

## 3. Surgical Fix & Verification Protocol (Author)
1. Surgical Scope: Fix only lines identified in the report. Do not perform sweeping structural rewrites.
2. Typecheck Gate: Run `npx tsc --noEmit && npm run lint` immediately after applying fixes.
3. Concurrency Rerun: Re-execute `npx playwright test <spec> --repeat-each=3 --workers=4`.
4. Response: Notify Reviewer with fixed items and verification results.

---

## 4. Approval Gate & Iteration Limit
- Clean Audit: If zero CRITICAL/MAJOR issues remain, Reviewer issues `✅ APPROVED`.
- Commit Authorization: Conventional Commit (`git-commit`) is permitted exclusively after receiving `APPROVED`.
- Iteration Limit: Maximum 3 review rounds. If issues remain unresolved after round 3, escalate directly to the user with remaining blockers.
```
