---
name: skill-creator
description: Meta-skill for authoring, auditing, optimizing, and benchmarking modular skills in SmartFeed Studio. Use when creating a new skill from scratch, refactoring an existing skill, enforcing the mandatory skill template, auditing skills for prompt efficiency and line budgets (<250 lines), optimizing triggering descriptions, or synthesizing recurring user corrections. Do not use for general application code edits; use frontend or backend instead.
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
- Logged friction events from `.agents/state/observations.jsonl` or direct user methodology corrections.

## Procedure

1. Stage 0 - Friction & Observation Discovery:
   Inspect `.agents/state/observations.jsonl` for recurring user corrections, repeated multi-step manual tasks, or failing invariants. If a rule was repeatedly violated, enforce structurally (via pre-commit hooks, linters, or CLI tools) rather than relying on louder prompt text.
2. Stage 1 - Intent Capture & Research:
   Identify what the skill enables an agent to do, its input/output artifacts, and negative constraints ("Never"). Query `context7` (`resolve-library-id`, `query-docs`) for any library APIs referenced by the skill.
3. Stage 2 - Progressive Disclosure Layout:
   - Level 1: YAML frontmatter with `name`, `description` (high-density triggers + negative boundaries), and `rules` array.
   - Level 2: `SKILL.md` body containing Step 0 rule loading, Inputs, Procedure, Outputs, Gate, Never, References.
   - Level 3: `references/<topic>.md` for long code samples, schemas, or recipes (>50 lines).
   - Level 4: `scripts/<script>.py` or `scripts/<script>.mjs` for deterministic automation.
4. Stage 3 - Mandatory Eval-First Suite Authoring:
   Before finalizing the skill body, create `.agents/skills/<skill-name>/evals/evals.json` with >=3 test cases:
   - Case 1: Core Positive task matching primary triggers.
   - Case 2: Invariant enforcement or edge case boundary.
   - Case 3: Negative Control (`should_trigger: false`) routing to adjacent domain skill.
   - Validate structure via `node scripts/ops/run-skill-evals.mjs --dry-run`.
5. Stage 4 - Imperative AI-Directive Authoring:
   Write strictly in dry imperative English. Remove conversational greetings, philosophy, quotes, and markdown tables. Each step must state an action and a one-line reason.
6. Stage 5 - Negative Constraints ("Never"):
   Declare explicit anti-patterns with rule ID citations.
7. Stage 6 - Trigger Calibration:
   Write a description including specific trigger keywords, file path globs, and explicit negative triggers ("Do not use for X; use Y instead").
8. Stage 7 - Integrity & Gate Verification:
   Verify that the skill body is under the line budget, has 0 markdown tables, points to valid rule files, has a valid eval suite, and passes `pnpm agents:check`.

## Outputs

- `.agents/skills/<skill-name>/SKILL.md` matching the mandatory template.
- `.agents/skills/<skill-name>/evals/evals.json` with >= 3 validated cases.
- Optional `references/*.md` for progressive disclosure.

## Gate (stop condition)

- `SKILL.md` adheres to the mandatory 7-section template.
- Frontmatter `rules` contains valid files from `.agents/rules/`.
- File length is within budget (<= 250 lines).
- Mandatory `evals/evals.json` present with >= 3 cases (validated by `node scripts/ops/run-skill-evals.mjs --dry-run`).
- Zero markdown tables in `SKILL.md` (`grep -c '^|' SKILL.md` returns 0).
- `pnpm agents:check` passes with 0 errors.

## Never

- Never author conversational roleplay prompts or chatbot greeting blocks.
- Never write skills exceeding 500 lines; use `references/` for progressive disclosure.
- Never duplicate rule text inside skills; cite invariant IDs from `.agents/rules/`.
- Never use environment-specific hardcoded paths like `${CLAUDE_PLUGIN_ROOT}`.
- Never author skills without a mandatory Step 0 rule loading section.
- Never make prompts "louder" with capital letters when structural hooks can enforce the rule.

## References

- `references/eval-loop.md` - read when setting up comparative benchmark evaluations.
- `references/description-optimization.md` - read when running description trigger optimization.
