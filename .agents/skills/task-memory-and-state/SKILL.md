---
name: task-memory-and-state
description: Task context persistence, execution state checkpointing, session handoff, and prompt token optimization. Prevents agents from losing context, repeating work, or re-scanning the monorepo from scratch.
rules:
  - core
  - docs_and_ops
---

# Task Memory and Execution State Management

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/docs_and_ops.md`.
2. All runtime state resides strictly in `.agents/state/active_task.json`.
3. Never scan the repository or re-read full active plans before checking the active task state.
4. Keep the state file concise, structured, and strictly under 60-80 lines (<300 tokens).

## Core Mission: Token Economy and Zero Context Loss

Without deterministic state management, AI agents lose context across sessions, turns, or handoffs, resulting in:

- Wasted context tokens (re-reading 40KB+ plans or rescanning hundreds of files).
- Repetitive work (re-implementing already verified functions or undoing progress).
- Blind handoffs (reviewers or QA agents lacking knowledge of what was changed and why).

This skill enforces a single, authoritative runtime checkpoint: `.agents/state/active_task.json`.

## Active Task State Schema (`.agents/state/active_task.json`)

```json
{
  "taskId": "task-YYYY-MM-DD-NN",
  "activePlan": "plans/active/<name>.md",
  "title": "Concise Task Title",
  "currentStage": "Stage N - <Stage Name>",
  "currentTask": "Task M: <Task Name>",
  "currentStep": "Step K: <Action>",
  "status": "IN_PROGRESS | BLOCKED | AWAITING_REVIEW | COMPLETED",
  "assignedAgent": "@agents_<role>",
  "completedTasks": ["Task 1: ...", "Task 2: ..."],
  "modifiedFiles": ["services/backend-api/src/path/to/file.ts"],
  "contextSummary": {
    "goal": "Core objective in 1 sentence",
    "runtime": "cloud-backend | desktop-native | admin-web | shared",
    "decisions": [
      "Key decision 1 (e.g. Used S3 SDK v3 instead of legacy)",
      "Key decision 2 (e.g. Added local MinIO fallback)"
    ],
    "recentTestResults": "Targeted test pass rate (e.g. 4/4 passing)"
  },
  "nextAction": "Exact unblocked next step for the assigned agent",
  "updatedAt": "ISO-8601 Timestamp"
}
```

## Protocol for Incoming Agents (Stage 1 / Cold Start)

Whenever an agent is invoked or a new turn begins:

1. **Read Active State First**: Call `view_file` on `.agents/state/active_task.json`.
2. **Targeted Reading Only**:
   - Locate `activePlan` from the state JSON.
   - Use `grep_search` or line bounds in `view_file` to read **only** the section corresponding to `currentTask`.
   - Never load the entire multi-kilobyte plan into context.
3. **Inspect Modified Files Only**:
   - Read only the files listed in `modifiedFiles` using targeted line ranges.
   - Never run global file tree traversals or broad regex sweeps when files are already known.
4. **Instant Action**: Immediately execute the action specified in `nextAction`.

## Protocol for Outgoing Agents (Stage 8 / Checkpoint & Handoff)

Before concluding an execution turn or handing off to another agent:

1. **Update `modifiedFiles`**: Add any newly created or modified files.
2. **Update `completedTasks`**: Move finished tasks from pending to completed.
3. **Record Key Decisions & Tests**: Add architectural choices and test command results to `contextSummary`.
4. **Set `assignedAgent` and `nextAction`**:
   - If handing off to Code Review: set `assignedAgent: "@agents_review"`, `status: "AWAITING_REVIEW"`, `nextAction: "Audit diff and run targeted tests"`.
   - If handing off to QA: set `assignedAgent: "@agents_qa"`, `status: "IN_PROGRESS"`, `nextAction: "Execute concurrency and quota stress benchmarks"`.
   - If continuing work: set `nextAction: "Step N+1: <Next step>"`.
5. **Write Checkpoint**: Write updated state back to `.agents/state/active_task.json`.
6. **Chat Brevity**: Output strictly a 1-2 sentence summary with clickable links to the plan and modified files per `CORE-07`. Never dump the raw state JSON in chat.
