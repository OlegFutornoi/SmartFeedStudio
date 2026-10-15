---
name: lessons-learned-registry
description: Historical registry of solved error classes, known project gotchas, and architectural invariants. Use at the start of tasks to review known pitfalls and after bug fixes to codify new invariants.
rules:
  - core
  - docs_and_ops
---

# Lessons Learned Registry

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/docs_and_ops.md`.
2. Search `references/registry.md` for task domain keywords before designing architecture.
3. If an invariant is discovered or updated, record it in `references/registry.md`.
4. Do not commit bug fixes without recording the structural prevention mechanism.

## Operating protocol

1. Pre-task inspection: Run ripgrep (`grep_search`) against `references/registry.md` using terms relevant to the task (e.g. `cascade`, `foreign key`, `sticky`, `dedup`, `import`, `quota`).
2. Post-fix recording: Whenever a bug is remediated or a user corrects an agent mistake:
   - Append a new invariant entry to `references/registry.md` using the record template.
   - Specify: Invariant ID, Problem statement, Structural root cause, Automated prevention mechanism (test or lint rule).
3. Zero duplicate records: Search existing registry entries and `.agents/rules/` before authoring new entries.
4. File size limits: Maintain modular sub-registries (`registry-backend.md`, `registry-frontend.md`) if `references/registry.md` approaches 250 lines.
