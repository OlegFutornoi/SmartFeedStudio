# Agent References Directory

This directory contains on-demand reference playbooks and technical contracts for SmartFeed Studio autonomous agents.

## Architectural Purpose

- Files in `references/` are loaded on-demand rather than in the always-on system prompt, conserving prompt tokens for active tasks.
- Detailed procedures, schemas, and historical defect ledgers live here and are referenced by specific rule IDs or skills.

## Directory Contents

- `rules-rationale.md`: Architectural justifications for universal `CORE` and `AGENT` invariants.
- `hooks-contract-notes.md`: Antigravity lifecycle hooks specification (PreToolUse, PostToolUse, SessionStart, Stop).
- `task_prompt_examples.md`: Reference prompt formulations for invoking specialized engineering subagents.
