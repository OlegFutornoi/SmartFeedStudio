---
name: incremental-implementation
description: Thin vertical slicing of multi-file features into independently verifiable, testable increments under 250 lines. Use when executing complex plans or multi-stage refactorings.
rules:
  - core
  - docs_and_ops
---

# Incremental Implementation

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/docs_and_ops.md`.
2. Note modularity limits (<250 lines per file) and slicing targets in working notes.
3. Verify test runner availability for targeted execution.
4. Do not write large multi-file diffs in a single pass without verification checkpoints.

## Vertical slicing protocol

1. Thin vertical slices: Decompose features into independent vertical slices delivering end-to-end functionality across contracts, database, backend handler, and UI component.
2. Increment execution sequence:
   - Slice step 1: Define shared contract in `@smartfeed/shared` and compile.
   - Slice step 2: Implement and verify backend command/query handler with clean teardown E2E test.
   - Slice step 3: Implement and verify UI sub-component with Playwright test.
   - Slice step 4: Run targeted test suite and verify clean build.
3. Modularity budgeting: Keep every newly created or modified component under 250 lines. Extract table rows, dialog containers, and form sections into dedicated child modules.
4. Continuous verification: Execute targeted feature tests after completing each vertical slice. Never advance to the next slice while existing slice tests fail.
