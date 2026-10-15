---
name: systematic-debugging
description: Four-phase systematic debugging methodology. Use when diagnosing test failures, production defects, performance bottlenecks, or unexpected behavior to locate root cause before proposing fixes.
rules:
  - core
  - testing
---

# Systematic Debugging

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/testing.md`.
2. Note all debugging invariants in working notes.
3. If investigating framework crashes, call context7 or inspect logs via Sentry / Playwright MCP.
4. Never implement fixes without completing root cause investigation.

## The four-phase debugging protocol

1. Phase 1 - Root cause investigation:
   - Read error messages, error codes, and full stack traces completely.
   - Note exact file paths and line numbers.
   - Reproduce the failure consistently with a minimal reproducible scenario or automated test.
   - Check recent git diffs, dependency changes, and environment variables.
   - In multi-component architectures, add boundary instrumentation logs to isolate which service fails.
2. Phase 2 - Hypothesis and root cause isolation:
   - Formulate a clear hypothesis explaining why the error occurs.
   - Test the hypothesis against the code path and live execution data.
   - Trace backward from the symptom to the underlying trigger.
3. Phase 3 - Structural remediation:
   - Fix the root cause structurally, not by suppressing symptoms or adding silent catch blocks.
   - Respect modularity limits (<250 lines) and architecture boundaries.
   - Ensure the fix preserves all existing contracts and does not bypass typing with `as any`.
4. Phase 4 - Verification and regression prevention:
   - Run the reproducing test and confirm it passes.
   - Run targeted feature suites to ensure zero regressions.
   - Verify that test data teardown leaves zero leftover rows in PostgreSQL or Redis.
