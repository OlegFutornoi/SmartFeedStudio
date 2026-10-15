---
name: doubt-driven-development
description: Adversarial cross-examination of non-trivial architectural decisions, concurrency races, quota bypasses, and TOCTOU edge cases. Use when verifying critical security, database, or subscription logic.
rules:
  - core
  - testing
---

# Doubt-Driven Development

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/testing.md`.
2. Note all critical correctness and race-condition invariants in working notes.
3. If analyzing third-party integration behavior, query context7 or official specifications.
4. Do not validate assumptions without active adversarial probing.

## Adversarial cross-examination protocol

1. Identify high-stakes decisions: Trigger adversarial review whenever logic introduces new concurrency patterns, database transactions, quota enforcement, license gating, or authentication boundaries.
2. Formulate explicit claims: Formulate the architectural claim and why it matters (e.g., "Concurrent team invitations cannot exceed plan seat quotas").
3. Isolate artifact and contracts: Separate the proposal diff or function logic from prior conversational assumptions. Review the isolated unit against strict domain contracts.
4. Stress-test edge cases:
   - Race conditions: Probe TOCTOU (Time-Of-Check to Time-Of-Use) vulnerabilities under concurrent parallel mutations.
   - Boundary values: Check behavior at quota limits (count = limit, count = limit + 1, negative amounts).
   - Network interruptions: Check behavior during partial transaction rollbacks or Redis disconnects.
   - Authorization tampering: Check behavior when user IDs or organization IDs are swapped in request payloads.
5. Prove vulnerabilities with failing tests: Author automated tests reproducing potential race conditions or security holes before accepting a solution.
