---
name: interview-me
description: Structured clarification skill for underspecified QA task parameters in SmartFeed Studio E2E. Use when the user request lacks the target test project (server:backend, server:admin, local:backend, local:desktop) or testing layer (UI vs API).
---

# Interview Me (`interview-me`)

Structured requirements elicitation protocol for SmartFeed Studio E2E.

---

## 1. When to Clarify

Trigger clarification strictly when essential parameters cannot be safely inferred:

1. Project Ambiguity: Request does not specify which of the 4 test projects is targeted (`server:admin`, `local:desktop`, `server:backend`, `local:backend`).
2. Scope Ambiguity: Unclear whether task targets browser UI automation or API/database contract tests.
3. Test Data Ambiguity: Specific supplier type (XML vs CSV) or catalog volume (small vs 100k+ SKU) is unspecified and alters the test approach.

---

## 2. Clarification Invariants

- Limit: Maximum 1–2 concise questions.
- Defaults: Always label the primary option as `(Recommended)`.
- Never Ask Trivial Questions: Never ask user about tool/skill selection or repository standards; the agent decides autonomously.

---

## 3. Clarification Patterns

### Pattern 1: Project Selection

```text
Який напрямок тестування для цього сценарію?
1. (Recommended) Server Admin Portal (e2e/server/admin)
2. Local Desktop Client (e2e/local/desktop)
3. Server Backend API (e2e/server/backend)
4. Local SQLite Dev DB (e2e/local/backend)
```
