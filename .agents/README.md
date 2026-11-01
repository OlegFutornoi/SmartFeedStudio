# SmartFeed Studio Agent System Architecture Guide

Comprehensive architecture and operational guide for the autonomous engineering agent ecosystem in SmartFeed Studio.

## 1. System Architecture Tiers (L0 - L7)

- Level 0 (Instructions): Root and nested `AGENTS.md` hierarchy, strictly budgeted prompt token limits (Codex <= 32 KiB chain, Antigravity <= 24 KB per file).
- Level 1 (Rules): Domain invariants in `.agents/rules/*.md` indexed by unique IDs (`CORE-*`, `AGENT-*`, `BE-*`, `FE-*`, `UI-*`, `TEST-*`, `SEC-*`).
- Level 2 (Skills): Modular capabilities in `.agents/skills/<skill>/` with frontmatter, strict line budgets, and mandatory `evals/evals.json`.
- Level 3 (Native Subagents): 7 specialized autonomous agents in `.agents/agents/*.md` registered with frontmatter (`subagent: true`, `model: inherit`, `skills:`).
- Level 4 (Lifecycle Hooks): Deterministic safety gates in `.agents/hooks.json` (`PreToolUse`, `PostToolUse`, `SessionStart`, `Stop`).
- Level 5 (Verification & Guardrails): High-speed automated validation (`pnpm agents:check`, `pnpm agents:budget`, `run-skill-evals.mjs --dry-run`, `pnpm invariants:check`).
- Level 6 (State & Retrospective): Execution state in `.agents/state/active_task.json`, friction logs in `observations.jsonl`, and `agents:retro`.
- Level 7 (Security & Supply Chain): AI-BOM in `.agents/AI_BOM.md`, permissions in `.agents/PERMISSIONS.md`, and malicious skill scanner (`scan-skills-security.mjs`).

## 2. Specialized Autonomous Agents

- `planner` (`.agents/agents/planner.md`): System architecture, contract design, vertical tracer slicing, and Dual-Plan authoring.
- `frontend` (`.agents/agents/frontend.md`): React 18, Next.js 14, Tauri v2 desktop UI, Tailwind CSS, and official shadcn components.
- `backend` (`.agents/agents/backend.md`): NestJS 11 CQRS, Prisma ORM, PostgreSQL 16, Redis, BullMQ, and shared contracts.
- `review` (`.agents/agents/review.md`): Strictly read-only 5-axis code reviewer and architecture auditor.
- `qa` (`.agents/agents/qa.md`): Sole author of automated test suites in `e2e/` (`TEST-00`).
- `devops` (`.agents/agents/devops.md`): Docker Compose, Expand/Contract PostgreSQL migrations, Railway deployments, and SemVer releases.
- `security` (`.agents/agents/security.md`): AppSec red team and blue team, OWASP Top 10 pentesting, and remediation plans.

## 3. How to Add or Modify Components

- Adding a Skill:
  - Create directory `.agents/skills/<name>/`.
  - Create `SKILL.md` (<160-250 lines) with frontmatter: `name`, `description` (must contain "Use when" and "Do not use for"), and `rules: [...]`.
  - Mandatory `Step 0 - Load rules` section at the start of the file.
  - Create `evals/evals.json` containing >= 3 test cases (minimum 1 negative control `should_trigger: false`).
  - Register the skill in `.agents/AGENTS.md`.
  - Run `node scripts/ops/run-skill-evals.mjs --dry-run` and `pnpm agents:check`.

- Adding an Invariant Rule:
  - Add the rule to the appropriate `.agents/rules/<domain>.md` with unique ID (e.g. `BE-15`).
  - Map the rule in `.agents/enforcement-map.json` with `title`, `domain`, `enforcer`, and `mode` (`blocking` or `manual`).
  - If possible, convert to a machine enforcer in `tools/guardrails/structural.mjs`, `eslint-invariants.mjs`, or `pre-tool-guard.mjs`.

## 4. Verification & Testing Commands

- Fast Agent System Check: `pnpm agents:check` (<200ms)
- Context Token Budget Verification: `pnpm agents:budget`
- Skill Evals Dry-Run: `node scripts/ops/run-skill-evals.mjs --dry-run`
- Real LLM Skill Evaluation: `node scripts/ops/run-skill-evals.mjs --skill=<name> --runs=3`
- Retrospective & Friction Analysis: `node .agents/scripts/agents-retro.mjs`
- Supply Chain Skill Scanner: `node .agents/scripts/scan-skills-security.mjs`
- Full Monorepo Fast Verification: `pnpm verify:fast`
