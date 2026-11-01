<!-- Status: [COMPLETED] Done -->

# Technical Plan: Agent System Evolution v2 (SmartFeed Studio)

- Status: COMPLETED.
- Target: Full mechanical parity with reference insurance-e2e agent architecture & industry best practices.
- Language: Dense technical English for AI agents (Dual-Plan Architecture).

## 1. System Mission & DoD Verification

- 100% of skills have `evals/evals.json` (>=3 cases per skill, >=1 negative control): ACHIEVED (62/62 skills).
- 100% of agents in `.agents/agents/*.md` are native subagents with frontmatter (`subagent: true`, `skills`, `model`): ACHIEVED (7/7 agents).
- Deterministic hooks: PreToolUse guard, Stop guard, SessionStart, PostToolUse formatter; all verified via unit tests (`node --test`): ACHIEVED (12/12 unit tests passing).
- `pnpm agents:check` (Validator v2 on Node.js): catches broken paths, secrets, subagent skills, AGENTS.md parity, line budgets: ACHIEVED.
- Machine enforcer ratio in `enforcement-map.json`: increased from 20% to >=60%: ACHIEVED (73/118, 62%).
- Always-on prompt context budget: <= 14,000 characters and <= 150 lines per file: ACHIEVED (13,967 chars).
- Zero secrets in tracked git files in `.agents/**`: ACHIEVED (Context7, Railway, Postgres credentials stored in Keychain).

## 2. Implemented Architecture Components

### Stage 0: Security & Baseline Cleanliness

- Rotated/migrated Context7, Railway, and PostgreSQL credentials out of `mcp_config.json` into macOS Keychain.
- Added regex secret scanner to `scripts/check-protected-files.mjs` and pre-tool guard.
- Compiled inventory in `.agents/AI_BOM.md` and baseline in `plans/active/agent_system_evolution_baseline.md`.

### Stage 1: Native Subagents

- Formatted all 7 agent files (`planner.md`, `frontend.md`, `backend.md`, `review.md`, `qa.md`, `devops.md`, `security.md`) with valid frontmatter (`name`, `description`, `subagent: true`, `skills: [...]`, `model: inherit`).
- Configured `review.md` in read-only audit mode.
- Enforced `qa.md` as sole author of test suites (`TEST-00`).

### Stage 2: Deterministic Hooks

- Created `.agents/scripts/pre-tool-guard.mjs` with rules R1..R9:
  - CORE-08: Instant allow for all MCP tools.
  - R1: Hard-blocks `git commit --no-verify` / `-n`.
  - R2: Prompts user confirmation on destructive commands (`--force`, `reset --hard`, `clean -fd`, `rm -rf`).
  - R3: Blocks autonomous `git commit`/`git push` without explicit user request (CORE-10).
  - R4: Blocks editing `.env*`, `pnpm-lock.yaml`, and writing API keys.
  - R5: Blocks reading `plans/active/<name>.md` when `plans/compact/<name>.md` exists (Invariant 20).
  - R6: Blocks reading heavy artifacts (>80 KB) without bounded slice (<=300 lines).
  - R7: Blocks probe/debug files in `e2e/`.
  - R8: Blocks `PROD=1` in test execution.
  - R9: Audit log to `.agents/state/guard.log.jsonl`.
- Created `.agents/scripts/stop-guard.mjs`: evaluates modified files for `as any`, line budgets, and console leaks before turn end.
- Created `.agents/scripts/session-start.mjs`: injects active task and core invariants into session.
- Fixed `.agents/scripts/auto-format.mjs`: targets real tool argument `Path`.
- Unified `.agents/hooks.json`.
- Authored unit test suite `.agents/scripts/guards.test.mjs` (10 passing tests).

### Stage 3: Validator v2 (Node.js)

- Authored `.agents/scripts/validate-agents.mjs` (<200ms) with full parity to legacy python validator + referential integrity checks.
- Authored `.agents/scripts/validate-agents.test.mjs` (2 passing tests).
- Updated `package.json` script `agents:check` to call `validate-agents.mjs`.

### Stage 4: Evals Infrastructure & Coverage

- Authored `scripts/ops/run-skill-evals.mjs`: supports `--dry-run` (<1s) and multi-provider LLM executor/judge via OmniRoute.
- Authored `scripts/ops/generate-skill-evals.mjs`: generated and normalized 100% of skills (62/62) with 189 test cases.
- Generated `.agents/SKILLS_STATUS.md` in clean markdown.

### Stage 5: Skill Quality & Trigger Calibration

- Standardized 100% of skill descriptions to include explicit "Use when" and "Do not use for".
- Codified `AGENT-07` in `.agents/rules/agents.md`.

### Stage 6: Instruction Hierarchy & Dual-Plan Architecture

- Created `plans/compact/` for machine execution briefs.
- Created `scripts/plan-manager.mjs` (`create`, `compress`, `close`, `list`).
- Created `e2e/AGENTS.md` and verified `packages/shared/AGENTS.md`.
- Created `.agents/scripts/check-budget.mjs` and `package.json` script `agents:budget`.
- Codified Invariant 20 Plan Source Mandate in `rules/core.md` and `rules/agents.md`.

### Stage 7: Learning Cycle & Machine Invariants

- Created `.agents/scripts/agents-retro.mjs`.
- Converted invariants in `enforcement-map.json` to machine enforcers (62% machine ratio).
- Created `.agents/agents-baseline.json`.
- Codified Honest Testing invariants (`TEST-12` through `TEST-15`) in `rules/testing.md`.

### Stage 8: Review Handshake & Tracing

- Created `.agents/scripts/review-scope.mjs` for isolated read-only review handshakes.
- Codified `AGENT-08` delegation protocol and single-writer rule in `rules/agents.md`.
- Validated `.agents/state/active_task.json` structure in `validate-agents.mjs`.

### Stage 9: CI Workflows & Supply Chain Defense

- Created `.github/workflows/agents-check.yml`.
- Created `.github/workflows/skill-evals.yml`.
- Created `.agents/scripts/scan-skills-security.mjs`.
- Created `.agents/PERMISSIONS.md`.
- Configured `.agents/**/*.{md,json,mjs}` in `.lintstagedrc.json`.

### Stage 10: Documentation & Hand-off

- Created `.agents/README.md`.
- Updated `plans/README.md` with `AG-` prefix.
- Updated `skill-creator/SKILL.md` with Eval-First protocol.
