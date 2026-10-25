---
name: interview-me
description: >-
  Interactive requirement clarification and ambiguity resolution skill for test tasks.
  Activate whenever a user request is underspecified, missing key environment parameters
  (finance vs minfin, stage vs review vs prod, vehicle category, API vs UI), or contains
  conflicting constraints. Asks 1-2 focused, structured multiple-choice questions to align
  on intent before investing effort in planning or coding. Prevents false assumptions.
---

# Interview Me (`interview-me`)

Discipline for resolving ambiguous requirements upfront before committing effort to planning or implementation.

---

## 1. When to Clarify

Trigger clarification strictly when essential parameters cannot be safely inferred:

1. Domain Ambiguity: Request does not specify `finance.ua` (`finance`) vs. `minfin.ua` (`minfin`).
2. Environment Ambiguity: Request mentions review environments without stand number (`review1`, `review2`, `review3`), or mentions production without `PROD=1` confirmation.
3. Flow Scope Ambiguity: Unclear whether task targets UI browser tests, backend API (`*.api.ts`), or JetBrains HTTP flows (`.http`).
4. Category / Rule Ambiguity: Multiple distinct business rules apply based on unspecified vehicle or policy variants.

---

## 2. Clarification Invariants

- Limit: Maximum 1–2 concise questions.
- Defaults: Always label the primary option as `(Recommended)`.
- Never Ask Trivial Questions: Never ask user about tool/skill selection or repository standards; the agent decides autonomously.

---

## 3. Clarification Patterns

### Pattern 1: Domain Selection

```text
Target platform for this scenario?
1. (Recommended) Finance.ua (tests/finance/osago/)
2. Minfin.ua (tests/minfin/osago/)
```

### Pattern 2: Target Environment

```text
Target test environment?
1. (Recommended) Stage (Default non-prod environment)
2. Review Stand (REVIEW=1, 2, or 3)
3. Production (Requires ALLOW_PROD_TESTS=1)
```
