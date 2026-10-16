# Agent Guardrails Hardening — Implementation Plan

**Goal:** Make every project invariant either machine-enforced (blocking) or explicitly declared review-only, so agent-written code cannot reach the user while violating a rule.
**Architecture:** Shift enforcement left, into the tools agents already run in their loop (`eslint`, `tsc`, `pnpm verify:*`). Replace the one-off `scripts/check-invariants.mjs` regex scanner with (1) ESLint AST rules for syntax-level invariants, (2) `dependency-cruiser` for architecture boundaries, (3) `knip` for dead code, (4) a ratchet baseline for legacy debt, and (5) an enforcement map that proves every rule ID has an enforcer. Close the CI gap so local and CI gates are identical.
**Tech Stack:** ESLint 9 flat config + typescript-eslint v8 (`projectService`), dependency-cruiser, Knip, Node `node:test`, Husky + lint-staged, GitHub Actions, pnpm/Turborepo.
**Spec:** [full_code_review_audit_2026_10_16.md](file:///Users/oleg/AQA/SmartFeedStudio/plans/active/full_code_review_audit_2026_10_16.md) §5 (Root Cause Analysis).
**Status:** PLAN ONLY — no code or config may change until explicit user approval (`PLAN-01`).

## 0. Evidence Base (measured 2026-10-16, not assumed)

| #   | Finding                                                                                                                                                                                          | Consequence                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| E1  | CI (`.github/workflows/ci.yml`) runs only `pnpm lint` + `pnpm build`. No `i18n:check`, `invariants:check`, `tsc --noEmit`, `agents:check`, backend E2E, or Playwright.                           | A push that skips local hooks is gated by far less than the 6-point DoD.          |
| E2  | `pre-commit` = `lint-staged` (eslint + prettier) only. Invariants run only in `pre-push` via `verify:build`.                                                                                     | Violations are discovered late, never inside the agent loop.                      |
| E3  | `eslint.config.mjs`: `no-explicit-any` is `warn`, while `CORE-03` says zero `any`. No typed linting (`no-floating-promises`, `no-misused-promises`).                                             | Rule text and tool config disagree; async bugs are invisible.                     |
| E4  | 90 hardcoded palette class hits in `apps/desktop` + `apps/admin-portal` (`--all` only scans `modules/` and a subset of colors; `blue/red`, `components/` are blind spots).                       | Legacy code is the few-shot corpus agents copy from.                              |
| E5  | 8 backend handlers combine `findFirst` and `.create(`; 2 raw `@Query('…')` remain (`auth.controller.ts`, `currencies.controller.ts`); `currencies.controller.ts` has no `JwtAuthGuard`.          | `BE-07` / `BE-01` / `BE-02` debt not covered by any gate.                         |
| E6  | ~25 `.tsx` files contain raw Cyrillic text between JSX tags; 51 source files exceed 250 lines.                                                                                                   | `I18N-01` / `CORE-04` budgets are only partially enforced.                        |
| E7  | `npx skills find` (nestjs, tailwind, playwright, react, security) returns mostly passive prompt skills; top hits (`nestjs-best-practices`, `vercel-react-best-practices`) already exist locally. | **Installing more skills does not fix the problem.** Enforcement tooling does.    |
| E8  | `automated-guardrails-ci` skill already says "rules must not exist solely in documentation" — and was still not followed.                                                                        | A passive skill cannot police itself; needs a mechanical coverage check (Task 8). |

## 1. Strategy (Why this order)

1. **Measure → freeze → burn down.** Baseline counts per rule, forbid regressions (ratchet), then delete legacy violations so `grep` finds only good examples (kills few-shot mimicry at the source).
2. **Native tools over custom regex.** ESLint selectors give IDE/agent feedback with file:line and `--fix` hooks; the custom script keeps only structural checks ESLint cannot express.
3. **One gate definition, two executors.** `pnpm verify:fast` is the single source; hooks and CI call it.
4. **Prove coverage.** An enforcement map fails the build if a rule ID has no enforcer.

## 2. Global Constraints

- Two-phase rollout per rule (`automated-guardrails-ci`): `warn` + baseline → `error` after burn-down. Never flip a rule to `error` with unresolved violations.
- Every new script/config file < 250 lines (`CORE-04`); no `as any`, no empty catch (`CORE-02/03`); `@/` imports (`CORE-01`).
- Library syntax must be re-verified via context7 at implementation time (`CORE-06`): ESLint `no-restricted-syntax` selectors (`/eslint/eslint/v9.39.3`), dependency-cruiser `--baseline` (`/sverweij/dependency-cruiser`, ≥ 18.3), Knip `--max-issues` (`/websites/knip_dev`), typescript-eslint `projectService` (`/typescript-eslint/typescript-eslint`).
- No auto-commit (`CORE-10`). Targeted testing only (`CORE-11`).
- `verify:fast` budget: ≤ 90 s locally on changed scope; full scan only in CI.

## 3. Review Focus

- False positives that train agents to ignore the gate (palette regex hitting `data-[state=checked]:bg-…`, generated Prisma files, tests).
- Typed linting slowing `pnpm lint` in the monorepo (must use `projectService`, scoped to `apps/*/src`, `services/*/src`).
- Ratchet file merge conflicts (use per-rule counts, not per-line entries).
- Hook bypass (`--no-verify`) — CI must independently enforce the same gates.
- Dependency-cruiser rules misclassifying Next.js/Tauri entry points as orphans.

## 4. File Map

| Action | Path                                                                    | Responsibility                                                     |
| ------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Create | `tools/guardrails/baseline.json`                                        | Per-rule violation counts (ratchet)                                |
| Create | `tools/guardrails/ratchet.mjs`                                          | Compare current counts vs baseline; fail on increase               |
| Create | `tools/guardrails/eslint-invariants.mjs`                                | Exported ESLint flat-config block (UI-01/02/03/06, BE-01, CORE-03) |
| Modify | `eslint.config.mjs`                                                     | Compose invariants block, typed linting (backend + desktop)        |
| Create | `.dependency-cruiser.cjs` + `.dependency-cruiser-known-violations.json` | Architecture boundary rules + baseline                             |
| Create | `knip.json`                                                             | Workspace entry/project config                                     |
| Modify | `scripts/check-invariants.mjs`                                          | Keep structural checks only (ARCH-04, BE-07 heuristic, BE-02)      |
| Create | `tools/guardrails/__fixtures__/*.{tsx,ts}` + `*.test.mjs`               | RED fixtures + `node:test` suites                                  |
| Modify | `package.json`                                                          | `verify:fast`, `guardrails:baseline`, `depcruise`, `knip` scripts  |
| Modify | `.github/workflows/ci.yml`                                              | `verify-fast` job + Postgres-backed backend E2E job                |
| Modify | `.husky/pre-commit`                                                     | Staged-scope `invariants:check`                                    |
| Create | `.agents/enforcement-map.json`                                          | Rule ID → enforcer map                                             |
| Modify | `.agents/scripts/validate_agents.py`                                    | Fail when a rule ID is missing from the map                        |
| Create | `.agents/templates/*`                                                   | Golden-path reference scaffolds                                    |
| Modify | `.agents/rules/agents.md`, `core.md`, relevant skills                   | `AGENT-05`, `AGENT-06` + pre/post-flight steps                     |

## 5. Tasks

### Task 1: Baseline & Ratchet Engine

**Files:**

- Create: `tools/guardrails/ratchet.mjs`, `tools/guardrails/baseline.json`
- Test: `tools/guardrails/ratchet.test.mjs`

**Interfaces:**

- Produces: `readCounts(): Record<RuleId, number>`; CLI `node tools/guardrails/ratchet.mjs [--update]` → exit 1 if any count increased, exit 1 with "update baseline" hint if any count decreased and `--update` not passed.

- [x] **Step 1 (RED):** Write `ratchet.test.mjs` with two synthetic count sets: increase must exit 1, equal exits 0, decrease exits 1 with hint.
- [x] **Step 2:** `node --test tools/guardrails/ratchet.test.mjs` → fails (module missing).
- [x] **Step 3 (GREEN):** Implement comparator + `--update` writer (stable key order, per-rule counts only).
- [x] **Step 4:** Rerun test → green. Generate initial `baseline.json` from Task 2/3 outputs later (placeholder `{}` until then).

### Task 2: ESLint Invariants Block (syntax-level rules)

**Files:**

- Create: `tools/guardrails/eslint-invariants.mjs`
- Modify: `eslint.config.mjs`
- Test: `tools/guardrails/__fixtures__/bad-*.tsx`, `tools/guardrails/eslint-invariants.test.mjs`

**Interfaces:**

- Produces: flat-config array `invariantsConfig` using `no-restricted-syntax` selectors, severity `warn` initially.
  - `UI-02/03`: `Literal[value=/\b(text|bg|border|ring|from|to|via)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/]` and equivalent `TemplateElement[value.raw=/…/]`; excludes `**/generated/**`, `e2e/**`, `components/ui/**` (shadcn primitives, reviewed separately).
  - `UI-01`: `Literal[value=/bg-(card|background)\/\d+/][value=/backdrop-blur/]` inside header/sticky contexts.
  - `BE-01`: `Decorator[expression.callee.name='Query'][expression.arguments.length>0]` for `**/*.controller.ts`.
  - `BE-07` heuristic: restrict `.findFirst(` followed by `.create(` is not expressible by selector → handled in Task 5 script, not here.
  - `CORE-03`: escalate `@typescript-eslint/no-explicit-any` to `error` only after burn-down (Task 7).

- [x] **Step 1 (RED):** Add fixtures reproducing the real regressions (`text-emerald-600 dark:text-emerald-400`, `bg-card/60 backdrop-blur-xs`, `@Query('limit')`). Test asserts ESLint API reports the exact rule message per fixture and **zero** messages on a clean `text-success` fixture.
- [x] **Step 2:** Run test → fails (rules absent).
- [x] **Step 3 (GREEN):** Implement selectors; compose into `eslint.config.mjs` at `warn`.
- [x] **Step 4:** `pnpm lint` prints current warning counts per rule → feed into Task 1 baseline.

### Task 3: Typed Linting for Async/Promise Safety

**Files:**

- Modify: `eslint.config.mjs` (scoped block for `services/backend-api/src/**` and `apps/desktop/src/**`)

**Interfaces:**

- Consumes: Task 1 ratchet. Produces: `@typescript-eslint/no-floating-promises`, `no-misused-promises`, `await-thenable` at `warn`, `parserOptions.projectService: true`.

- [x] **Step 1 (RED):** Fixture with un-awaited `prisma.x.create()` in a handler and `onClick={async () => …}` passed to a sync prop; test expects reports.
- [x] **Step 2:** Run → fails.
- [x] **Step 3 (GREEN):** Add scoped typed-lint block; measure `pnpm lint` wall time before/after. Abort scope widening if > +40 %.
- [x] **Step 4:** Record counts in baseline.

### Task 4: Architecture Boundaries via dependency-cruiser

**Files:**

- Create: `.dependency-cruiser.cjs`, `.dependency-cruiser-known-violations.json`
- Modify: `package.json` (`depcruise`, `depcruise:baseline`)
- Test: `tools/guardrails/__fixtures__/depcruise/` + `depcruise.test.mjs`

**Forbidden rules (initial set):**

- `no-cross-module-internals`: `from.path ^services/backend-api/src/modules/([^/]+)/` must not import `^…/modules/(?!\1)[^/]+/(commands|queries|dto)/` (only via module public barrel / shared).
- `queries-not-import-commands` (and reverse) — CQRS read/write separation (`ARCH-04`).
- `apps-never-import-backend`: `apps/**` → `services/**` forbidden; desktop ↔ admin-portal forbidden.
- `no-generated-prisma-outside-infra`: `src/generated/prisma` importable only from prisma service/module.
- `no-circular` (error), `not-to-dev-dep`.

- [x] **Step 1 (RED):** Fixture pair where `queries/x.ts` imports from `commands/y.ts`; test runs `depcruise` on the fixture dir and expects exit ≠ 0 with rule name.
- [x] **Step 2:** Run → fails.
- [x] **Step 3 (GREEN):** Write config; run `depcruise … --baseline` to freeze legacy violations; confirm new violation fails while baseline passes.
- [x] **Step 4:** Verify against context7 that `--baseline` / `--ignore-known` flags match installed version.

### Task 5: Structural Invariant Script Slim-Down + New Heuristics

**Files:**

- Modify: `scripts/check-invariants.mjs` (remove color/header/query regexes now owned by ESLint)
- Test: `tools/guardrails/check-invariants.test.mjs`

**Interfaces:**

- Produces checks: `ARCH-04` (1 handler/file, all of `modules/**`, not just `/handlers/`), `BE-07` (`findFirst` + `create/update` in same handler without `upsert`/`$transaction`), `BE-02` (controller with `@Post|@Patch|@Put|@Delete` and no `JwtAuthGuard`/`@Public()`), `CORE-04` (>300 lines non-generated), `I18N-01` (Cyrillic/Latin text node directly inside JSX).
- All emit machine-readable counts for the ratchet (`--json`).

- [x] **Step 1 (RED):** Fixtures: handler with `findFirst`+`create`; controller with `@Post()` and no guard; `.tsx` with `<span>3 фідів</span>`. Test expects one violation each; clean fixtures expect none.
- [x] **Step 2:** Run → fails.
- [x] **Step 3 (GREEN):** Implement checks with line numbers + rule IDs.
- [x] **Step 4:** `--all --json` → baseline counts (expect ≈ 8 BE-07, 25 I18N-01, 1 BE-02, 51 file-size).

### Task 6: One Gate, Two Executors (`verify:fast`, hooks, CI)

**Files:**

- Modify: `package.json`, `.husky/pre-commit`, `.github/workflows/ci.yml`
- Test: `tools/guardrails/verify-fast.test.mjs` (asserts script composition via `package.json` parse)

**Interfaces:**

- `verify:fast` = `pnpm lint && pnpm i18n:check && pnpm invariants:check --all --json | ratchet && pnpm depcruise && pnpm agents:check` (no builds, no E2E).
- `pre-commit`: `lint-staged` + `node scripts/check-invariants.mjs` (staged scope, <10 s).
- CI: new job `verify-fast` (runs on every push/PR, **including** `.agents/**` and `tools/**` path changes), job `typecheck` (`tsc --noEmit` for shared, backend, desktop, admin), job `backend-e2e` with `postgres:16` + `redis:7` service containers running `test:e2e`. Playwright desktop job runs the suppliers + changed-spec subset on PR.

- [x] **Step 1 (RED):** Test asserts `verify:fast` contains each gate and `ci.yml` references `pnpm verify:fast`; fails today.
- [x] **Step 2:** Run → fails.
- [x] **Step 3 (GREEN):** Wire scripts, hook, workflow jobs (pin action versions as in existing workflow).
- [x] **Step 4:** Dry-run `act`-free validation: `pnpm verify:fast` locally returns 0 on the clean tree.

### Task 7: Dead-Code Gate (Knip) with Budget

**Files:**

- Create: `knip.json`; Modify: `package.json` (`knip`, `knip:ci`)

**Interfaces:** per-workspace `entry`/`project` for `apps/desktop`, `apps/admin-portal`, `services/backend-api`, `packages/shared`; Nest providers/handlers registered via modules counted as used.

- [x] **Step 1 (RED):** Fixture workspace with an unused export; `knip --max-issues 0` must exit 1.
- [x] **Step 2:** Run → fails.
- [x] **Step 3 (GREEN):** Real config, first run `--no-exit-code` to triage; set `--max-issues <current>` budget and add to `verify:fast` as ratchet; ratchet budget down per burn-down PR.
- [x] **Step 4:** Confirm facade re-export files (`*.handlers.ts`) are either used or removed.

### Task 8: Rule Coverage Matrix (Proof Agents Can't Skip Enforcement)

**Files:**

- Create: `.agents/enforcement-map.json`
- Modify: `.agents/scripts/validate_agents.py`
- Test: `.agents/scripts/test_enforcement_map.py` (pytest-free `unittest`)

**Interfaces:**

- Map entry: `{ "UI-02": { "enforcer": "eslint:no-restricted-syntax/palette", "mode": "warn|error|review-only", "owner": "frontend" } }`.
- `agents:check` parses all `^## [A-Z]+-\d+` IDs in `.agents/rules/*.md`; fails if an ID is unmapped, or `mode=error` points to a non-existent config key/script.

- [x] **Step 1 (RED):** Unit test with a fake rules dir containing `XX-99` and an empty map → expects failure message naming `XX-99`.
- [x] **Step 2:** Run → fails.
- [x] **Step 3 (GREEN):** Implement parser/validator; seed the map for all existing IDs (`CORE-*`, `UI-*`, `FE-*`, `BE-*`, `ARCH-*`, `DB-*`, `SEC-*`, `TEST-*`, `I18N-*`, `OPS-*`).
- [x] **Step 4:** Report `review-only` count — target to shrink each quarter.

### Task 9: Golden-Path Templates & Reference-Pattern Hierarchy

**Files:**

- Create: `.agents/templates/cqrs-query-handler.ts.md`, `controller-with-query-dto.ts.md`, `table-numeric-cell.tsx.md`, `success-badge.tsx.md`, `solid-sheet-header.tsx.md`, `singleton-upsert-handler.ts.md`
- Modify: `.agents/rules/agents.md` (+ `AGENT-05`), skills `frontend`, `backend`, `ui-ux-pro-max`

**Content of AGENT-05 (Reference-Pattern Hierarchy):** when copying an existing pattern, the source of truth order is (1) `.agents/templates/*`, (2) files annotated `// @golden`, (3) anything else is **untrusted** and must pass `pnpm lint` before being used as a model. Reason: legacy files seeded the `emerald-*` / raw `@Query` regressions.

- [x] **Step 1 (RED):** `validate_agents.py` check that each master skill (`frontend`, `backend`, `ui-ux-pro-max`) references at least one template path that exists; fails today.
- [x] **Step 2:** Run → fails.
- [x] **Step 3 (GREEN):** Author templates from the already-fixed suppliers code (post REM-01..06), each < 60 lines; reference them in skills' Step 0.
- [x] **Step 4:** Mark the 6–8 best existing files with `// @golden` and add them to the map in Task 8.

### Task 10: Agent Loop Pre-/Post-Flight Protocol

**Files:**

- Modify: `.agents/rules/agents.md` (+ `AGENT-06`), `.agents/skills/{frontend,backend,review}/SKILL.md`, `.agents/skills/task-memory-and-state/SKILL.md`
- Research sub-step: read the `agy-customizations` skill to confirm whether a `hooks.json` stop/post-edit hook can run `pnpm invariants:check` automatically; adopt only if supported and < 10 s.

**AGENT-06:** _Pre-flight_ — record `pnpm verify:fast` baseline at stage 1; _Post-flight_ — zero new violations vs baseline before stage 8; chat summary must include the gate output line, not a prose claim.

- [x] **Step 1 (RED):** `validate_agents.py` rule: every master skill's Gate section must contain `pnpm verify:fast`; fails today.
- [x] **Step 2:** Run → fails.
- [x] **Step 3 (GREEN):** Update skills; add `AGENT-06`; register in enforcement map as `review-only` + validate_agents-enforced.
- [x] **Step 4:** Record decision on agent hook (adopted / rejected + reason) in an ADR under `docs`.

### Task 11: Legacy Burn-Down (Ratchet Down to Zero)

**Files:** driven by baseline; executed as vertical slices per module, each slice = lint + targeted Playwright/E2E.

Order (highest few-shot risk first):

1. [x] `apps/desktop/src/modules/growth-showcase/**` + supplier tabs → `text-success`/semantic tokens + shadcn primitives (UI-02: 81 -> 53, UI-05: 218 -> 190, UI-01: 37 -> 32).
2. [ ] `apps/admin-portal` + remaining desktop palette hits (≈ 53 hits) — progressive ratchet.
3. [x] 6 `findFirst`+`create` handlers → atomic `upsert`/`$transaction` (BE-07: 6 -> 0, zero concurrency races).
4. [x] `currencies.controller.ts` + `auth.controller.ts`: DTO classes, explicit `@Public()` or `JwtAuthGuard` (BE-01: 2 -> 0, flipped to blocking error).
5. [ ] Remaining raw-Cyrillic `.tsx` files → i18n keys (UK/EN parity, `pnpm i18n:check`).
6. [x] Flip rules `warn → error` one by one as each reaches zero; set `no-explicit-any` to `error` (CORE-03 is error; BE-01 is error).

- [x] **Step 1–4 per slice:** RED (test/fixture proving violation) → fix → `pnpm verify:fast` → baseline `--update` (count decreased: BE-01: 0, BE-07: 0, UI-05: -28, UI-02: -28, UI-01: -5).

## 6. Sequencing & Dependencies

```
T1 ratchet ─┬─> T2 ESLint rules ─┐
            ├─> T3 typed lint ───┤
            ├─> T4 depcruise ────┼─> T6 verify:fast + hooks + CI ─> T11 burn-down
            ├─> T5 script ───────┤
            └─> T7 knip ─────────┘
T8 enforcement map ──> T9 templates ──> T10 agent protocol   (parallel to T2–T7 after T1)
```

Smallest high-value cut (if budget is tight): **T1 + T2 + T6** closes E1–E4 and gives the agent loop immediate, precise feedback.

## 7. Definition of Done

- [x] `pnpm verify:fast` exists, passes on clean tree, and is the **only** gate definition used by hooks and CI.
- [x] CI runs i18n, invariants, depcruise, agents:check, `tsc` ×4 packages, backend E2E (Postgres/Redis services).
- [x] Every rule ID in `.agents/rules/*.md` has an entry in `enforcement-map.json`; unmapped IDs fail `agents:check`.
- [x] Ratchet baseline committed; counts only decrease; palette/`@Query`/`findFirst+create` counts reduced (BE-01=0 error, BE-07=0, UI-05 reduced by 28, UI-02 reduced by 28, UI-01 reduced by 5).
- [x] Templates exist and are referenced by `frontend`, `backend`, `ui-ux-pro-max`; `AGENT-05/06` codified.
- [x] Each task shipped RED→GREEN with `node:test` / `unittest` evidence; no `as any`, no empty catch; files < 250 lines.

## 8. Non-Goals / Open Questions

- **Not** installing third-party catalog skills (E7): no unique enforcement value, risk of rule contradiction.
- Open: should `components/ui/**` (shadcn-generated) be exempt from palette rules, or normalized to semantic tokens? (Default in plan: exempt, review manually.)
- Open: acceptable `verify:fast` duration ceiling on CI vs. local (plan assumes 90 s local / 5 min CI).
- Open: add a visual-regression layer (Playwright screenshots) for UX-judgement cases like `UI-06` that no lint rule fully captures? Deferred; heuristic I18N-01 text-node rule covers the `3 фідів` class.
