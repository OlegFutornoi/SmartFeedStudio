---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
rules:
  - core
  - docs_and_ops
---

# Writing Plans

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/docs_and_ops.md`.
2. Tasks are strictly saved to `plans/active/FR-<num>-<title>.md`, `BE-<num>-<title>.md`, or `FR-BE-<num>-<title>.md` per `PLAN-01`.
3. Do not auto-commit during task execution (`CORE-10`). Git commits occur strictly on explicit user request.
4. Output strictly a 1-2 sentence summary with clickable file link in chat (`CORE-07`).

## Overview

Author deterministic implementation tasks for engineers who know the tech stack but need explicit file paths, signatures, tests, and boundaries. Provide the task as bite-sized steps (2-5 min each) following TDD RED -> GREEN.

## File Boundaries & Modularity

- Map which files will be created or modified upfront.
- Each file must have one clear responsibility and stay under 250 lines (`CORE-04`).
- Group files by domain responsibility, not arbitrary technical layers.

## Task Document Header

Every task in `plans/active/` (`FR-...`, `BE-...`, `FR-BE-...`) begins with:

```markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence describing what this builds]
**Architecture:** [2-3 sentences about approach and 4-layer defense]
**Tech Stack:** [NestJS, Prisma, BullMQ, Next.js, Tauri, etc.]
**Spec:** [Path to spec or requirement reference]

## Global Constraints

- [Constraint 1: version floors, dependency limits, naming rules]
- [Constraint 2: zero `any`, timestamptz(6), 100% FK indexes]

## Review Focus

- [Five critical input classes or failure modes most likely to break in production]
```

## Task Structure

```markdown
### Task N: [Component or Module Name]

**Files:**

- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts:120-150`
- Test: `services/backend-api/test/exact.e2e-spec.ts`

**Interfaces:**

- Consumes: [Signatures and types from previous tasks]
- Produces: [Exported types, DTOs, functions for subsequent tasks]

- [ ] **Step 1: Write failing test (RED)**
      Define test name, exact input, and expected assertions.
- [ ] **Step 2: Run test to verify failure**
      Run targeted test command and assert expected failure reason.
- [ ] **Step 3: Implement minimal code to pass (GREEN)**
      Write minimal function body or component satisfying test.
- [ ] **Step 4: Run test to verify clean pass**
      Run targeted command and assert green exit code.
```

## Self-Review Checklist

Before finalizing, verify:

1. Spec coverage: Every requirement maps to a concrete task.
2. Step scan: Every step is unambiguous and carries a verifiable result.
3. Type consistency: Signatures match across neighboring tasks.
4. Failure modes: Edge cases, quotas, and network timeouts are explicitly tested.
5. Proportion & Hygiene (`CORE-14`): The plan provides concise architecture decisions without redundant repetition, uses bullet lists instead of Markdown tables (`| col | col |`), starts with `# Heading` on line 1, passes `npx prettier --write`, and when compressed via Headroom leaves strictly a single `.compressed.md` file on disk without duplicate `.md` files.

## Handoff

Save the task to `plans/active/` (`FR-...`, `BE-...`, `FR-BE-...`). If compressed via `scripts/headroom-compress.mjs --save`, keep strictly the single `.compressed.md` file (`CORE-14`). Update `.agents/state/active_task.json` via `task-memory-and-state` and provide a 1-2 sentence status summary with a clickable link in chat.
