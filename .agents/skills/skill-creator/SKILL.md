---
name: skill-creator
description: Meta-skill for authoring, auditing, optimizing, and benchmarking modular skills in SmartFeed Studio. Use when creating a new skill from scratch, refactoring an existing skill, enforcing the mandatory skill template, auditing skills for prompt efficiency and line budgets (<250 lines), optimizing triggering descriptions, or running skill evaluation benchmarks. Do not use for general application code edits; use frontend or backend instead.
rules: [core, docs_and_ops]
---

# Skill Creator Meta-Skill

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/docs_and_ops.md`.
2. Verify invariant `CORE-04`: skill body budget is <= 250 lines for domain skills, <= 150 lines for utilities.
3. Verify invariant `CORE-06`: library APIs mentioned in skills must be grounded via context7.
4. Do not author or edit skills until steps 1-3 are complete.

## Inputs

- Skill name (kebab-case) and intended domain.
- Trigger requirements (when to use, when NOT to use).
- Governing rule files in `.agents/rules/`.

## Procedure

1. Stage 1 - Intent Capture & Research: identify what the skill enables an agent to do, its input/output artifacts, and negative constraints ("Never"). Query `context7` (`resolve-library-id`, `query-docs`) for any library APIs referenced by the skill.
2. Stage 2 - Progressive Disclosure Layout:
   - Level 1: YAML frontmatter with `name`, `description` (high-density triggers + negative boundaries), and `rules` array.
   - Level 2: `SKILL.md` body containing Step 0 rule loading, Inputs, Procedure, Outputs, Gate, Never, References.
   - Level 3: `references/<topic>.md` for long code samples, schemas, or recipes (>50 lines).
   - Level 4: `scripts/<script>.py` for deterministic automation.
3. Stage 3 - Imperative AI-Directive Authoring: write strictly in dry imperative English. Remove conversational greetings, philosophy, quotes, and markdown tables. Each step must state an action and a one-line reason.
4. Stage 4 - Negative Constraints ("Never"): declare explicit anti-patterns with rule ID citations.
5. Stage 5 - Trigger Calibration: write a description including specific trigger keywords, file path globs, and explicit negative triggers ("Do not use for X; use Y instead").
6. Stage 6 - Integrity Verification: verify that the skill body is under the line budget, has 0 markdown tables, points to valid rule files, and has a corresponding symlink in `.claude/skills/`.

## Outputs

- `.agents/skills/<skill-name>/SKILL.md` matching the mandatory template.
- Optional `references/*.md` for progressive disclosure.
- Symlink in `.claude/skills/<skill-name>`.

## Gate (stop condition)

- `SKILL.md` adheres to the mandatory 7-section template.
- Frontmatter `rules` contains valid files from `.agents/rules/`.
- File length is within budget (<= 250 lines).
- Zero markdown tables in `SKILL.md` (`grep -c '^|' SKILL.md` returns 0).
- Symlink resolves cleanly in `.claude/skills/`.

## Never

- Never author conversational roleplay prompts or chatbot greeting blocks.
- Never write skills exceeding 500 lines; use `references/` for progressive disclosure.
- Never duplicate rule text inside skills; cite invariant IDs from `.agents/rules/`.
- Never use environment-specific hardcoded paths like `${CLAUDE_PLUGIN_ROOT}`.
- Never author skills without a mandatory Step 0 rule loading section.

## References

- `references/eval-loop.md` - read when setting up comparative benchmark evaluations.
- `references/description-optimization.md` - read when running description trigger optimization.
