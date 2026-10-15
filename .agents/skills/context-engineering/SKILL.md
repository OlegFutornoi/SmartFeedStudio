---
name: context-engineering
description: Context window optimization and prompt token economy for AI coding agents. Governs rule-loading sequences, targeted file reading, and prevention of context pollution.
rules:
  - core
  - docs_and_ops
---

# Context Engineering

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/docs_and_ops.md`.
2. Evaluate context usage and token economy before issuing tool calls.
3. Use ripgrep with line bounds rather than reading full large files.
4. Do not dump large file payloads into conversational context.

## Token economy and context curation

1. Minimal context footprint: Keep prompt and context windows clean by reading only necessary file slices and specific line ranges. Avoid bulk directory dumps.
2. Layered context loading:
   - Level 1 (Universal rules): Active rules in `.agents/rules/` loaded deterministically based on globs and triggers.
   - Level 2 (Domain skills): Load specific skills on demand from `.agents/skills/<skill>/SKILL.md`.
   - Level 3 (Feature plans): Read active plan from `plans/active/<feature>.md`.
   - Level 4 (Source slices): Inspect specific functions and types using grep and slice reading (`view_file` with line bounds).
3. Chat brevity enforcement:
   - Provide concise 1-2 sentence summaries with clickable markdown links (`[File](file:///...)`).
   - Never copy entire plan files, large diffs, or multi-page outputs into the chat response.
4. Prevention of context degradation: When context fills or compaction occurs, rely on the canonical invariant ledger and task plans rather than speculative memory.
