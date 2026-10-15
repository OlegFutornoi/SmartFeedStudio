# PLAN: Agents, Skills and Rules System Optimization

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 15.10.2026  
> **Метод:** /skill-creator (суха англійська мова для AI, zero tables, strict Step 0 rule-loading, lean always_on budget 7.7 KB).

---

## 0. EXECUTION CONTRACT FOR THE EXECUTING AGENT

- Execute phases strictly in order. Do not start phase N+1 until phase N verification passes.
- Before editing any file, snapshot it to `.agents/_backup/<YYYYMMDD>/<original-path>`. Delete the backup only after the user confirms the final result.
- Never delete a project invariant. Every invariant removed from one file MUST exist in exactly one canonical location after the edit. Track every move in `.agents/_backup/<date>/invariant_ledger.md` (format: `INV-ID | invariant text | old locations | new canonical location`).
- Write all rules, skills and playbooks in English. Keep Ukrainian only for literal UI strings, locale examples and test assertions (for example `'Постачальник'`, `'Оплачено'`).
- No tables, no ASCII diagrams, no mermaid, no emoji headings, no motivational prose, no quotes in rules and skills. Use plain imperative bullet lists.
- Report progress in chat with 1-2 sentences per phase and a file link. Do not paste file contents into chat.

---

## 1. AUDIT FINDINGS (VERIFIED ON 2026-10-15)

### 1.1 Context budget defects

- All 17 rule files declare `trigger: always_on`. Total ~120 KB (~30k tokens) is injected into every turn, regardless of task domain. A CSS fix loads PostgreSQL, Railway, pentest and QA benchmark rules.
- The six `agents_*.md` rules are always_on, so all six agent lifecycles load even when only one agent is active.
- Playbooks in `.agents/references/` total 332 KB. `agents_backend.md` is 78 KB, `agents_frontend.md` 68 KB, `agents_review.md` 62 KB. They restate rules and skills.
- Four skills exceed the 500-line skill-creator ceiling: `turborepo` 952, `emil-design-eng` 681, `skill-creator` 554, `backend` 531. Near the limit: `frontend` 478, `postgresql-optimization` 429, `code-review-and-quality` 422.

### 1.2 Duplication defects

- The same invariants (zero relative imports, zero empty catch, zero plan dumping, context7 research, MCP auto-approval, 250-line budget, cleanDatabase, solid sticky headers) are restated in 5-8 places: root `AGENTS.md`, `.agents/AGENTS.md`, multiple rules, agent rules, playbooks, master skills, sub-skills, global `~/.gemini` rules.
- MCP auto-approval is stated in: global `GEMINI.md` area rules, `~/.gemini/config/rules/mcp_policy.md`, root `AGENTS.md`, `.agents/AGENTS.md`, `commands.md`.
- The PostgreSQL 10-point checklist exists in `postgres_skills.md`, `agents_backend.md` (rule), `backend/SKILL.md`, `prisma-postgres-mastery`, `postgresql-optimization`, `code_review_and_skills.md`.
- Plan-lifecycle rules exist in `plans_lifecycle.md`, `planning-and-lifecycle` skill, `plans/README.md`, every agent rule.
- `code_review_and_skills.md` is a skills matrix that duplicates `.agents/AGENTS.md` catalog and master-skill matrices.

### 1.3 Rule-skill binding defects

- Only 8 of 52 skills reference any rule file (`backend`, `frontend`, `review`, `nestjs-best-practices`, `vercel-react-best-practices`, `context-engineering`, `lessons-learned-registry`, `skill-creator`). 44 skills write code without loading the governing rules.
- No skill has a mandatory "load rules first" step. Rules are referenced as optional "related reading".

### 1.4 Correctness defects (contradictions, dead references, broken tooling)

- Color contradiction: `frontend/SKILL.md` bans `emerald-*`; `testing_and_quality.md` requires success badges to have class `/emerald/`.
- `postgres_skills.md` requires skills that do not exist: `supabase-postgres-best-practices`, `prisma-cli`, `prisma-client-api`, `postgresql-code-review`.
- `frontend/SKILL.md` references non-existent skills: `design-taste-frontend`, `beautiful-design`, `frontend-design`, `modern-web-guidance`, `web-design-guidelines`, `integrate-backend`, `subagent-driven-development`, `dispatching-parallel-agents`, `requesting-code-review`, `code-review-reception`.
- `frontend/SKILL.md` context7 example uses wrong arguments (`context7CompatibleLibraryID`, `topic`). Real API: `resolve-library-id {libraryName, query}`, `query-docs {libraryId, query}`.
- `ui-ux-pro-max` invokes `${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max/scripts/search.py`. The variable is undefined in Antigravity; the call fails.
- `design_system_and_theming.md` has no YAML frontmatter (no trigger, no description).
- `postgres_skills.md` contains a stale "Verified Schema Status (Updated 2026-08-27)" snapshot; state data does not belong in rules.
- `emil-design-eng` contains a chatbot persona instruction ("respond only with: I'm ready to help...") that hijacks the agent response.
- Stage counts disagree: master skills describe a 7-stage lifecycle, agent rules describe 8 stages.
- `.agents/AGENTS.md` mixes Ukrainian and English; agent rules mix both.

### 1.5 Language defects (written for humans, not for the model)

- Narrative lectures, philosophy, user-facing explanations, "why this matters for the business" paragraphs.
- Decorative tables and ASCII boxes that consume tokens and parse poorly.
- Shouting style (ALL CAPS MUST, КАТЕГОРИЧНО) instead of a short directive plus a one-line reason.
- Missing explicit inputs, outputs, stop conditions and "do not use this skill when" boundaries.

---

## 2. TARGET ARCHITECTURE

### 2.1 Layer model (single source of truth per invariant)

- LAYER 1 CORE RULES (always_on, hard budget 12 KB total): only invariants that apply to every task in every domain.
- LAYER 2 DOMAIN RULES (`trigger: glob` or `model_decision`, budget 4 KB each): invariants for one domain (backend, database, frontend, testing, security, devops). Loaded only when the domain is touched.
- LAYER 3 SKILLS: procedures (how to execute). Skills never restate rule text. Skills reference rule IDs and load the rule file first.
- LAYER 4 REFERENCES (`skills/<skill>/references/*.md`): code templates, long examples, recipes. Loaded on demand.
- AGENT DEFINITIONS: one compact file per agent (budget 3 KB) listing stages, the skill to load at each stage, the domain rules to load, and the exit gate. Playbooks in `.agents/references/agents_*.md` are merged into skill references or deleted.

### 2.2 Invariant IDs

- Assign every invariant a stable ID with a domain prefix: `CORE-xx`, `ARCH-xx`, `BE-xx`, `DB-xx`, `FE-xx`, `UI-xx`, `I18N-xx`, `TEST-xx`, `SEC-xx`, `OPS-xx`, `PLAN-xx`.
- Rules define invariants by ID. Skills, agents, review checklists and lessons-learned cite IDs only. This removes text duplication and makes audits greppable.

### 2.3 Target rule set (17 files -> 9 files)

- `core.md` (always_on): CORE invariants. Merge from `rules.md` (architecture summary), `engineering_discipline_and_planning.md` (no any, no empty catch, no god-files, `@/` imports, execFile), `communication_and_research.md` (brevity, no plan dumping, context7-first), `plans_lifecycle.md` (approval gate), `testing_and_quality.md` (git commit only on explicit request, targeted tests only), `commands.md` (MCP auto-approval, browser_subagent ban).
- `agents.md` (always_on, compact): agent routing by domain, mention aliases, pointer to each agent file. Replaces six always_on agent rules.
- `backend.md` (glob `services/backend-api/**`, `packages/shared/**`): CQRS, DTO validation, guards, secrets fail-fast, 4-layer defense, native vs cloud boundary.
- `database.md` (glob `**/schema.prisma`, `**/migrations/**`, `**/*.repository.ts`, `**/*handler.ts`): replaces `postgres_skills.md`. FK indexes, timestamptz(6), snake_case, CUID, cascade, no N+1, cursor pagination, short transactions, expand/contract.
- `frontend.md` (glob `apps/desktop/src/**`, `apps/admin-portal/**`): merge `design_system_and_theming.md`, `frontend_network_dedup.md`, frontend parts of other rules. Modularity budgets, semantic tokens, solid sticky headers, no duplicate CTA, request dedup, no StrictMode.
- `i18n.md` (glob `**/locales/**`, `**/*.tsx`): bilingual parity, no raw keys, translated attributes, error mapping.
- `testing.md` (glob `**/*.spec.ts`, `**/*.e2e-spec.ts`, `**/e2e/**`, `**/test/**`): cleanDatabase, storage isolation, real-data assertions, single-request assertions, status color assertions.
- `security.md` (model_decision: auth, payments, secrets, uploads, URL fetch, IPC): secret masking, OWASP API4, SSRF pinning, CWE-78/798/400.
- `docs_and_ops.md` (model_decision: release, docker, railway, migration, wiki): wiki sync, coverage tables, SemVer, rollback runbook, ports and commands list.
- Delete after merge: `code_review_and_skills.md` (skills matrix moves to skill descriptions; the checklist moves to `code-review-and-quality` as ID list), the six `agents_*.md` rules (move to `.agents/agents/<name>.md`).

### 2.4 Mandatory skill template

Every `SKILL.md` MUST follow this exact structure and order:

```markdown
---
name: <kebab-name>
description: <What it does. When to use (concrete triggers, file paths, keywords). When NOT to use (near-miss domains and which skill to use instead).>
rules: [core, <domain rule files>]
---

# <Skill Name>

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/<file>.md` for each file in frontmatter `rules`.
2. List the invariant IDs relevant to the current task in your working notes.
3. If the task touches a library API, call context7: `resolve-library-id {libraryName, query}` then `query-docs {libraryId, query}`.
4. Do not write or edit code until steps 1-3 are complete.

## Inputs

- <what must exist before starting>

## Procedure

1. <imperative step> - <one-line reason>
2. ...

## Outputs

- <files, artifacts, reports produced; exact format>

## Gate (stop condition)

- <verifiable checks; commands to run; invariant IDs that must hold>

## Never

- <negative constraints specific to this skill, each with a one-line reason>

## References

- `references/<topic>.md` - read when <condition>.
```

Budgets: master skill body <= 250 lines; domain skill <= 150 lines; utility skill <= 80 lines; description <= 900 characters.

---

## 3. PHASED EXECUTION

### Phase 1 - Inventory and invariant ledger (no behavior change)

1. Parse all 17 rules, `.agents/AGENTS.md`, root `AGENTS.md`, six playbooks, 52 skills. Extract every normative statement (must, never, always, mandatory, prohibited, заборонено, зобов'язаний).
2. Deduplicate semantically. Assign IDs. Record every source location in `invariant_ledger.md`.
3. Flag contradictions (start with emerald vs semantic tokens; 7 vs 8 stages). Write each conflict with a proposed resolution into the ledger under `CONFLICTS`. Ask the user only about conflicts that change product behavior (emerald success color); resolve purely editorial conflicts autonomously.
4. Flag stale state data (schema status snapshots, dated audit results) for removal from rules.
5. Gate: ledger exists; every normative statement maps to exactly one ID; conflict list is reviewed.

### Phase 2 - Rule compression and re-layering

1. Write the 9 target rule files from the ledger. One bullet per invariant: `ID: directive. Reason: <one line>.`
2. Rewrite in English, dry imperative style. Remove tables, diagrams, emoji, duplicated explanations, example blocks longer than 5 lines (move them to skill references).
3. Set correct triggers: `always_on` only for `core.md` and `agents.md`; glob or model_decision for the rest. Verify the trigger syntax against the Antigravity customization docs (`agy-customizations` skill) before writing.
4. Remove references to non-existent skills (`supabase-postgres-best-practices`, `prisma-cli`, `prisma-client-api`, `postgresql-code-review`).
5. Remove stale snapshots (schema status table, dated verification claims).
6. Update root `AGENTS.md` to a short index: mission (3 lines), rule file list, agent list, key commands. No duplicated invariants.
7. Gate: always_on payload <= 12 KB (measure with `wc -c`); total rules <= 40 KB; every ledger ID present in exactly one rule file (grep check); zero tables (`grep -c '^|'` returns 0).

### Phase 3 - Agent definitions

1. Create `.agents/agents/{frontend,backend,review,qa,devops,security}.md`, each <= 3 KB, in English.
2. Each agent file contains: role (1 line), domain boundaries (what it owns, what it hands off), rules to load, eight stages where each stage lists: the skill to load, the action, the exit gate.
3. Unify the lifecycle to 8 stages across agents and master skills (remove the 7-stage variant).
4. Merge unique, still-valid content from `.agents/references/agents_*.md` into the relevant skill `references/`. Delete the playbooks. Rewrite `task_prompt_examples.md` as a compact English file or delete it if fully redundant.
5. Rewrite `.agents/AGENTS.md` as a dispatcher: routing keywords per agent and a one-line description per skill. No tables, no diagrams.
6. Gate: six agent files exist; old agent rules and playbooks removed; every skill referenced by an agent exists (scripted check).

### Phase 4 - Skill rewrite (per cluster, using the mandatory template)

Process in this order. For each skill: snapshot, rewrite to template, set `rules` frontmatter, move long content to `references/`, remove dead references, verify.

Cluster A - masters: `frontend`, `backend`, `review`, `git-commit`, `skill-creator`.

- `frontend`, `backend`: remove sub-skill matrices, Iron Laws lists (replace with rule ID citations), MCP tutorial blocks, ASCII self-evolution diagrams. Keep stage procedure and gates. Target <= 250 lines.
- `review`: define output contract: findings grouped by severity P0-P3, each with file:line, invariant ID, fix. Merge overlapping content with `code-review-and-quality`; `review` = process, `code-review-and-quality` = criteria.
- `skill-creator`: move eval workflow, description optimization and environment-specific sections (Claude.ai, Cowork) to `references/`. Add an Antigravity section. Add the mandatory template and the rule-binding requirement. Target <= 250 lines.
- `git-commit`: verify regular vs `--release` flows; cite CORE commit invariant.

Cluster B - frontend: `ui-ux-pro-max`, `emil-design-eng`, `vercel-react-best-practices`, `i18n-localization`, `image`, `playwright-automation`, `browser-debugging`, `mock-real-parity`.

- `emil-design-eng`: delete persona/greeting block and philosophy; keep concrete motion specs (durations, easings, transform origins, reduced-motion, active states) and the Before/After/Why review format. Target <= 200 lines; move catalog to references.
- `ui-ux-pro-max`: replace `${CLAUDE_PLUGIN_ROOT}` path with a workspace-relative path `.agents/skills/ui-ux-pro-max/scripts/search.py`; run the script once to verify. Keep SmartFeed invariants as rule ID citations only.
- `browser-debugging`, `playwright-automation`: keep browser_subagent ban as CORE ID citation; specify Playwright MCP tool sequence.

Cluster C - backend and data: `nestjs-best-practices`, `contract-first-api`, `prisma-postgres-mastery`, `postgresql-optimization`, `streaming-large-feeds`, `bullmq-jobs`, `idempotency-and-outbox`, `subscription-lifecycle`, `rust-native-backend`, `tauri-v2-security-and-ipc`.

- Split responsibility: `prisma-postgres-mastery` = schema, migrations, Prisma client usage; `postgresql-optimization` = query plans, indexes, search, pagination performance. Remove overlap.
- Translate Ukrainian bodies (`contract-first-api` and others) to English.

Cluster D - quality and process: `code-review-and-quality`, `code-simplification`, `test-driven-development`, `systematic-debugging`, `doubt-driven-development`, `performance-optimization`, `automated-guardrails-ci`, `planning-and-lifecycle`, `spec-driven-development`, `incremental-implementation`, `interview-me`, `documentation-and-adrs`, `lessons-learned-registry`, `project-context-map`, `source-driven-development`, `context-engineering`.

- `lessons-learned-registry`: convert entries to `L-xxx: symptom / root cause / invariant ID / guard (test or lint)`.
- `project-context-map`: keep live topology only; remove duplicated ports/commands that live in `docs_and_ops.md`.
- Merge candidates (decide during execution, record in ledger): `spec-driven-development` into `planning-and-lifecycle`; `source-driven-development` into `core.md` research invariant plus a short reference.

Cluster E - security: `security-and-hardening`, `secret-serialization`, `api-security-testing`, `web-app-penetration-testing`, `penetration-testing-with-strix`, `fix-security-vulnerabilities-with-strix`.

- Define non-overlapping scopes: `api-security-testing` = REST/OWASP API Top 10; `web-app-penetration-testing` = browser/portal surface; `penetration-testing-with-strix` = orchestrator; `fix-security-vulnerabilities-with-strix` = remediation and regression test. Remove duplicated OWASP descriptions; keep one in `security-and-hardening/references/owasp.md`.

Cluster F - tooling and infra: `turborepo`, `ci-cd-and-automation`, `release-and-rollback`, `observability-and-instrumentation`, `ai-sdk`, `firecrawl-parse`, `find-skills`.

- `turborepo`: keep core rules (package tasks over root tasks, dependsOn, outputs, caching, filter/affected); move recipes and long JSON to `references/`. Target <= 200 lines.
- `ci-cd-and-automation`: move workflow YAML samples to `references/`.
- `find-skills`: evaluate relevance; remove if unused in this project.

Gate per skill: template sections present in order; `rules` frontmatter non-empty and points to existing files; line budget met; zero tables; zero references to non-existent skills; zero `CLAUDE_PLUGIN_ROOT`; context7 calls use `{libraryName, query}` and `{libraryId, query}`.

### Phase 5 - Automated integrity checks

1. Create `.agents/scripts/validate_agents.py` (no external deps). Checks:
   - every SKILL.md has valid frontmatter with `name` equal to directory name, `description`, `rules`;
   - every path in `rules` exists;
   - every skill referenced from agents, rules, skills exists;
   - line budgets per skill class;
   - zero markdown tables and ASCII box characters in rules and SKILL.md;
   - always_on rule payload <= 12 KB;
   - every invariant ID is defined exactly once and every cited ID is defined;
   - no Cyrillic outside code spans and quoted examples in rules and SKILL.md.
2. Add `pnpm agents:check` script in root `package.json` that runs the validator.
3. Verify `.claude/skills/*` symlinks resolve for every skill (add missing, remove orphaned).
4. Gate: validator exits 0.

### Phase 6 - Behavioral verification (skill-creator eval loop, reduced scope)

1. Write `.agents/evals/trigger_evals.json` with 30 realistic prompts (5 per agent domain), each labeled with the expected agent and skills, including 10 near-miss negatives.
2. For each master skill (`frontend`, `backend`, `review`), run 2 realistic tasks against the old snapshot and the new version; compare: did the agent load rules first, cite invariant IDs, respect gates, token usage.
3. Record results in `.agents/evals/results_<date>.md`. Fix skills where rule loading or gates were skipped.
4. Gate: 100% of runs perform Step 0 rule loading; no regression in invariant compliance vs snapshot.

### Phase 7 - Documentation and closure

1. Update `wiki/` pages that describe the agent system; update `plans/README.md`.
2. Add new lessons to `lessons-learned-registry` (always_on bloat, dead skill references, undefined env vars in skill scripts).
3. Move this plan to `plans/completed/` with status header.
4. Delete `.agents/_backup/<date>/` only after explicit user confirmation.

---

## 4. DEFINITION OF DONE

- always_on rules <= 12 KB; total rules <= 40 KB (from ~148 KB on disk / ~120 KB always_on).
- Rule files: 9 (from 17). Agent definitions: 6 files <= 3 KB each. Playbooks (332 KB) removed or folded into skill references.
- 52/52 skills (or fewer after approved merges) follow the mandatory template, declare `rules`, and execute Step 0 rule loading before code.
- Every invariant has one ID and one canonical location; zero duplicated invariant text across rules, skills and agent files.
- Zero tables, ASCII diagrams, persona blocks, philosophy prose in rules and SKILL.md bodies.
- Zero contradictions; zero references to non-existent skills; zero broken script paths.
- `pnpm agents:check` passes.
- All content in English except literal UI and locale strings.

## 5. DECISIONS REQUIRED FROM USER BEFORE EXECUTION

1. Success status color: keep semantic tokens only (remove the emerald test assertion) or allow a dedicated semantic `success` token mapped to emerald (recommended: add `--success` token and assert `success` class).
2. Approve deletion of the six playbooks in `.agents/references/` after their unique content is folded into skill references.
3. Approve skill merges: `spec-driven-development` -> `planning-and-lifecycle`, `source-driven-development` -> core research invariant, removal of `find-skills` if unused.
4. Approve moving agent definitions from `.agents/rules/agents_*.md` to `.agents/agents/*.md` (removes them from always_on context).
