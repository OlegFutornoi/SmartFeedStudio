<!-- Status: [COMPLETED] Done -->

# AG-02 Agent System Audit and Hardening (compressed)

- Status: awaiting approval. Human plan: `plans/active/AG-02-agent-system-audit-and-hardening.md`. Executor: `@agents_devops` (single-writer), reviewer `@agents_review`.
- Scope: main project only — `.agents/**`, root `AGENTS.md`, nested `AGENTS.md` in `apps/*`, `services/*`, `packages/*`, agent-system CI workflows. OUT OF SCOPE: `e2e/` (incl. `e2e/.agents/`, `e2e/AGENTS.md`) — configured separately later; do not modify, validators must not scan it.
- Score 6.4/10. Weakest: skill verification 4.0, duplication 5.5.

## Evidence

- 0/62 evals have `should_trigger:false`; dry-run requires >=2 cases (docs say >=3 + negative); no routing eval; no baseline; CI runs 4/62 skills with `|| echo` (never fails); same-provider judge; vendored `skill-creator/agents/{grader,comparator,analyzer}.md` unused.
- Overlap clusters: planning(7), security(6), review(2), docs(3+global context7-mcp/find-docs), state(3), ci(2), db(2). `spec-driven-development` self-declares absorbed.
- `.agents/AGENTS.md` 11152B duplicates harness skill list. `vercel-react-best-practices/AGENTS.md` 108KB duplicates its `rules/`. frontend SKILL restates UI-08..13; headroom/omniroute restate CORE-04/08/13; Step 0 duplicates `rules:` frontmatter; agents hardcode L-028..L-044.
- Orphans: `ui-ux-pro-max/{data,scripts}` 3.5MB unreferenced; `prisma-postgres-mastery/references` 34 unreferenced; upstream `_template/_contributing/_sections.md`. MCP cache 2 entries, 0% savings. Rules 13807/14000; chain 28952/32768.
- Cyrillic: 26 skill reference files, `skills/git-commit/README.md`, `.agents/references/*`, `.agents/commands/README.md`.
- Contradictions: backend/frontend SKILL Stage 8 "move to plans/completed" vs CORE-14; `TEST-07.mode="error"`; hooks notes cite `plans/compact/`; TDD skill vs TEST-00.
- Dead: `validate_agents.py`, `allow-playwright.mjs`, `review-scope.mjs` (unwired), `.DS_Store` in `.agents/`; 36 validator warnings (missing scripts, nonexistent `pnpm test:*`).

## Phases

- P0 hygiene: fix Stage 8 -> `plan-manager close`; TEST-07 -> blocking + validator enum check; update hooks notes; delete dead scripts; fix 36 warnings; gitignore .DS_Store; scope TDD to QA. DoD: agents:check 0/0.
- P1 verification: `evals/triggers.json` >=10 queries (>=5 pos incl >=2 uk + >=2 en, >=5 neg incl >=2 adjacent with `expected_skill`, `split` 60/40); validator enforces; `run-skill-routing-evals.mjs` (all name+description, 3 runs, precision/recall/confusion, top-1); `--baseline` delta; cross-provider judge via grader.md; CI option A (user decision): on push/PR with paths .agents/skills/** run behavioral (baseline, 3 runs) + routing evals only for changed skills; weekly schedule = full routing eval, 1 run (~400 calls), no behavioral; workflow_dispatch for pre-release full run; rate-limit errors retried with backoff; fail on top-1<90% or recall<80%, exit 2 = skipped; SKILLS_STATUS from real metrics; description optimization <=5 iters, accept on test split only.
- P2 dedup: consolidate to ~40 (drop spec-driven-development, source-driven-development; merge writing-plans+to-tickets->planning refs; code-review-and-quality->review; strix x2+web pentest->security-pentest; handoff+context-engineering->task-memory refs; guardrails+ci->ci-guardrails); verify each with routing eval; replace restated invariants by IDs + validator dup-line warning; Step 0 generated from `rules:`; remove hardcoded L-ranges.
- P3 compression: AGENTS.md compressed index <=4000B; descriptions <=350 chars (sum <=14KB); rules <=11000; delete orphans (user decision: delete ui-ux-pro-max/data and ui-ux-pro-max/scripts incl tests, update AI_BOM.md) + nested AGENTS.md in skills; index prisma refs; validator errors on orphans and nested AGENTS.md in skills; fix MCP cache compression + test. DoD: chain <=75%, .agents <=2MB.
- P4 language: translate listed files to English (OmniRoute + spot check); move human docs out; validator error on Cyrillic in `.agents/skills/**`, `.agents/agents/**` except eval prompts + allowlist (SKILLS_STATUS.md); `e2e/` not scanned.
- P5 enforcement: manual 45 -> <=25 (DB-04,06-12 Prisma lint; FE-02-14 ESLint; I18N-05/06; SEC-04/08/09; OPS-01-05); auto agents-retro.
- P6 standards: agentskills.io checks (name regex, desc<=1024, metadata.version, allowed-tools), `skills-ref validate` in CI if available; `tools:` allowlist in agents (review/security without write tools); skill versioning triggers eval rerun.

## Target

- 9.0-9.5/10; routing top-1 >=90%, per-skill recall >=80%, baseline delta >0, ~40 non-overlapping skills, 0 Cyrillic in machine instructions, 0 validator warnings, failing CI on regression.
