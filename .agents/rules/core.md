---
trigger: always_on
description: Core universal engineering invariants applied across all tasks and domains in SmartFeed Studio.
---

# Core Universal Invariants

## CORE-01: Path Aliases and Import Boundaries

- All internal package imports must strictly use `@/` path alias or `@smartfeed/shared` contracts.
- Relative imports across directory levels (`../` or `./` across packages) are strictly prohibited.
- Reason: Relative imports break refactoring and leak module internals.

## CORE-02: Zero Silent Failures

- Catch blocks must never be empty or contain only comments.
- Every catch block must log a structured warning (`this.logger.warn(...)` or `console.warn(...)`) or throw an explicit domain `HttpException`.
- Reason: Swallowed exceptions mask operational errors and corrupt state.

## CORE-03: Zero `as any` Type Bypasses

- Never use `as any` or explicit `any` in application logic, controllers, Prisma clauses, or DTOs.
- Use generated Prisma types (`Prisma.UserWhereInput`), Zod `.parse()`, type guards, or `unknown` with validation.
- Reason: `any` destroys compile-time safety and propagates runtime crashes.

## CORE-04: File Size Budget (<250-300 Lines)

- Every file (component, controller, CQRS handler, service, utility, hook) must stay under 250-300 lines.
- Decompose complex screens into sub-components (`*Header.tsx`, `*TableRow.tsx`, `*DialogsContainer.tsx`, `use*PageState.ts`).
- Reason: Monolithic files degrade review quality and maximize merge conflicts.

## CORE-05: Safe OS Execution

- Never execute shell commands with string interpolation or concatenation (`exec(...)`).
- Use `execFile(binary, [arg1, arg2], { shell: false })` or Tauri `Command` with discrete arguments and `path.normalize()`.
- Reason: String concatenation in shell commands introduces CWE-78 command injection.

## CORE-06: Upfront Research via context7, Project MCPs, and MCP Knowledge Cache

- Always check the local MCP Knowledge Cache first via `pnpm ai:cache get <key>` or `pnpm ai:cache search <term>` (`.agents/cache/mcp/`).
- On cache miss or refresh, query `context7`, `perplexity-agent-api`, or project MCPs, and persist via `cat << 'EOF' | pnpm ai:cache set <key> ...` or delegate synthesis to OmniRoute via `pnpm ai:cache refresh` (with automatic Headroom compression).
- Reason: Verified docs prevent broken builds while local compressed caching eliminates redundant MCP latency and token burn.

## CORE-07: Strict Chat Brevity and Zero Plan Dumping

- Never duplicate or dump full plans or file contents into chat; write detailed tasks strictly to `plans/active/`.
- Chat responses must contain only a 1-2 sentence status summary and a clickable file link (`[Plan](file:///...)`).
- Reason: Dumping large plans into chat burns context tokens without operational value.

## CORE-08: 100% MCP Auto-Approval

- Never ask confirmation questions before or during calling any MCP tool (`playwright`, `sentry`, `shadcn`, `railway`, `postgres`, `redis`, `firecrawl`, `context7`, `github`, `api-anything`).
- Reason: Confirmation prompts block autonomous execution.

## CORE-09: Ban of `browser_subagent`

- Never call `browser_subagent` or `open_browser_url`; use Playwright MCP tools directly (`browser_navigate`, `browser_snapshot`, `browser_take_screenshot`).
- Reason: Built-in subagent fails with a 404 binary download error on macOS ARM64.

## CORE-10: Git Operations on Explicit Request Only

- Never automatically execute `git commit` or `git push`; commit strictly on explicit user command (`/git-commit`, `commit`).
- Regular commits append `[skip ci]` and push without tags; release commits (`/git-commit -r`) omit `[skip ci]`, bump versions, and push ONLY the release tag (`refs/tags/vX.Y.Z`).
- Reason: Autonomous commits bypass review; skipping CI on regular commits saves runner minutes.

## CORE-11: Targeted QA-Scoped Testing

- Run strictly tests covering the targeted domain or feature slice (`--project`, `--grep`); full global suites run only on explicit user request.
- Reason: Exhaustive multi-app suites on targeted validations slow down feedback loops.

## CORE-12: Quality and Reliability Over "Working is Enough"

- Never accept quick hacks, fake stubs, or ignore edge cases and failure modes; prioritize scalability, type safety, and concurrent reliability.
- Reason: Superficial quick fixes compound into systemic instability.

## CORE-13: Absolute Ban on Emojis

- Emojis are strictly forbidden across test code, logs, console output, markdown files, plans, commit messages, and chat responses; use ASCII badges (`[PASS]`, `[FAIL]`, `[WARN]`).
- Reason: Emojis degrade log readability in CI/CD terminals.

## CORE-14: Dual-Plan Model Isolation & Markdown Hygiene

- Dual-Plan Isolation: Human plans in `plans/active/<name>.md` are in Ukrainian (`PLAN-02`). Model compressed plans are saved to `plans/completed/<name>.compressed.md` in dense technical English. Models execute ONLY the compressed version from `plans/completed/`, even if uncompressed plans are given in prompt. On task completion, delete `plans/active/<name>.md`; the compressed version remains permanently.
- Single-File MCP Cache: MCP cache entries (`.agents/cache/mcp/`) are strictly single `.compressed.md` files.
- Never use Markdown tables (`| col |`) in plans/cache (use bullets). Start files with `# Heading` on line 1 (`MD041`), omit outer code fences, and run `npx prettier --write`.
- Reason: Enforces 70% token savings, model plan isolation, and zero Markdown truncation.

## PLAN-01: Deterministic Plan Lifecycle

- Tasks reside in `plans/active/`, `plans/backlog/`, or `plans/completed/` (`FR-`, `BE-`, `FR-BE-`, `QA-`, `AG-`).
- Tasks in `plans/active/` grant no execution authority until explicit approval ("виконуй", "починай"). Finished tasks are closed via `node scripts/plan-manager.mjs close <slug>`, deleting the active file while preserving the permanent compressed copy.
- Reason: Strict task lifecycle prevents scope creep and context pollution.

## PLAN-02: Mandatory Ukrainian Language for Plans & Audits

- All plans, specifications, roadmaps, and audit reports in `plans/` must be written strictly in Ukrainian (`uk`), keeping technical identifiers in Latin/code blocks.
- Reason: Plans and audits must be immediately readable in Ukrainian.
