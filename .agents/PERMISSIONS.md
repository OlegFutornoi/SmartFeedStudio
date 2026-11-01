# Permissions Policy & Execution Boundaries (SmartFeed Studio)

Defines deterministic authorization tiers, guardrail rules, and permission policies for autonomous agents and tools.

## 1. Auto-Approved Operations (100% Autonomous)

- MCP Tool Invocations (CORE-08):
  - `context7`: Library documentation and API signatures.
  - `playwright`: DOM inspection, console logs, network waterfall, screenshots.
  - `api-anything`: Reverse-engineered marketplace JSON queries.
  - `postgres`: Read-only queries and restricted local development schema analysis.
  - `redis`: BullMQ job queues and local cache inspection.
  - `firecrawl`: Catalog and documentation parsing.
  - `headroom`: Context compression (CCR) and token optimization.
  - `shadcn`: Design system component discovery.
- File Reading & Analysis:
  - Reading source files, documentation, and configuration files.
  - Reading compact execution briefs from `plans/compact/`.
- Local Development & Verification:
  - `pnpm dev`, `pnpm build`, `pnpm verify:fast`, `pnpm agents:check`.
  - Typechecks (`tsc --noEmit`), linting (`eslint`), formatting (`prettier`).
  - Unit and integration tests (`pnpm e2e:server`, `pnpm e2e:local`).

## 2. Operations Requiring User Confirmation (Interactive Ask Tier)

- Destructive Shell & Git Commands (Rule R2):
  - `git push --force` or force-pushing to remote branches.
  - `git reset --hard` destroying uncommitted workspace state.
  - `git clean -fd` wiping untracked files.
  - `rm -rf` targeting directories outside `.temp/` or `.cache/`.
- Autonomous Git Commits (Rule R3 / CORE-10):
  - Any `git commit` or `git push` executed without an explicit user instruction in `lastUserInput` (e.g. "закоміть", "commit", "/git-commit").

## 3. Strictly Prohibited & Blocked Operations (Hard Deny Tier)

- Bypass of Pre-Commit Hooks (Rule R1):
  - `git commit --no-verify` or `git commit -n` (bypassing Husky security gates).
- Protected Files & Credentials (Rule R4 / SEC-10):
  - Direct modification of `.env*` environment files (except `.example` or `.template`).
  - Direct manual modification of `pnpm-lock.yaml`.
  - Writing raw API keys (`pplx-`, `ctx7sk-`, `fc-`, `ghp_`, `AIzaSy`, `gsk_`, `sk-`, raw JWTs) into tracked repository files.
- Human Plan Direct Execution (Rule R5 / Invariant 20):
  - Reading `plans/active/<name>.md` when `plans/compact/<name>.md` exists. Models are strictly directed to read the compact machine brief.
- Unbounded Heavy Artifact Inspection (Rule R6):
  - Reading heavy logs, reports, or caches (>80 KB) without bounded slices (<=300 lines) or Headroom compression.
- Test Pollution (Rule R7):
  - Creating temporary probe, debug, or scratch files inside `e2e/`.
- Production Test Runs (Rule R8):
  - Executing automated test suites with production flags (`PROD=1`) without explicit `ALLOW_PROD_TESTS=1`.
