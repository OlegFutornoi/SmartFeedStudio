---
trigger: always_on
description: Core universal engineering invariants applied across all tasks and domains in SmartFeed Studio.
---

# Core Universal Invariants

## CORE-01: Path Aliases and Import Boundaries

- All internal package imports must strictly use `@/` path alias or `@smartfeed/shared` contracts.
- Relative imports across directory levels (`../` or `./` across packages) are strictly prohibited.
- Reason: Relative imports break refactoring, cause circular dependency fragility, and leak module internals.

## CORE-02: Zero Silent Failures

- Catch blocks must never be empty or contain only comments.
- Every catch block must log a structured warning (`this.logger.warn(...)` or `console.warn(...)`) or throw an explicit domain `HttpException`.
- Reason: Swallowed exceptions mask critical operational errors and leave state corrupted.

## CORE-03: Zero `as any` Type Bypasses

- Never use `as any` or explicit `any` in application logic, controllers, Prisma clauses, or DTOs.
- Use generated Prisma types (e.g. `Prisma.UserWhereInput`), Zod `.parse()`, type guards, or `unknown` with validation.
- Reason: `any` destroys compile-time safety and propagates runtime crashes into production.

## CORE-04: File Size Budget (<250-300 Lines)

- Every file (React component, NestJS controller, CQRS handler, service, utility, hook) must stay under 250-300 lines.
- Decompose complex screens into sub-components (`*Header.tsx`, `*TableRow.tsx`, `*DialogsContainer.tsx`, `use*PageState.ts`).
- Reason: Monolithic God-files exceed model working memory, degrade review quality, and maximize merge conflicts.

## CORE-05: Safe OS Execution

- Never execute shell commands with string interpolation or concatenation (`exec(...)`).
- Use `execFile(binary, [arg1, arg2], { shell: false })` or Tauri `Command` with discrete arguments.
- Always normalize paths with `path.normalize()` before passing to binary executors.
- Reason: String concatenation in shell commands introduces Critical CWE-78 command injection vulnerabilities.

## CORE-06: Upfront Research via context7 and Project MCPs

- When integrating libraries, framework features, or APIs, ground knowledge via `context7` (`resolve-library-id`, `query-docs`) or project MCPs (`postgres`, `shadcn`, `redis`).
- Never guess API signatures or rely on stale training memory.
- Reason: Verified official docs prevent broken builds and debugging churn.

## CORE-07: Strict Chat Brevity and Zero Plan Dumping

- Never duplicate, rewrite, or dump full plans or file contents into chat.
- All detailed tasks reside strictly in `plans/active/<task-name>.md`.
- Chat responses must contain only a 1-2 sentence status summary and a clickable file link (`[Plan](file:///...)`).
- Reason: Dumping large plans into chat burns context tokens without providing operational value.

## CORE-08: 100% MCP Auto-Approval

- Never ask confirmation questions before or during calling any MCP tool (`playwright`, `sentry`, `shadcn`, `railway`, `postgres`, `redis`, `firecrawl`, `context7`, `github`).
- Autonomous tool execution is 100% pre-approved.
- Reason: Confirmation prompts block autonomous execution and waste interaction turns.

## CORE-09: Ban of `browser_subagent`

- Never call `browser_subagent` or `open_browser_url`.
- For browser inspection and automation, use Playwright MCP tools directly (`browser_navigate`, `browser_snapshot`, `browser_take_screenshot`) or targeted test runners (`pnpm e2e:local:desktop`, `pnpm e2e:server:admin`).
- Reason: Built-in subagent unconditionally fails with a 404 binary download error on macOS ARM64.

## CORE-10: Git Operations on Explicit Request Only

- Never automatically execute `git commit` or `git push`.
- Staging and committing occurs strictly on explicit user command (`/git-commit`, `commit`).
- Regular commits append `[skip ci]` and push without tags; release commits (`/git-commit -r`) omit `[skip ci]`, bump versions, and push ONLY the release tag (`refs/tags/vX.Y.Z`) for `release.yml`.
- Reason: Autonomous commits bypass user review; skipping CI on regular commits saves runner minutes.

## CORE-11: Targeted QA-Scoped Testing

- During QA execution, run strictly tests covering the targeted domain or feature slice (`--project`, `--grep`). Full global suites run only on explicit user request or release verification.
- Reason: Exhaustive multi-app suites on targeted validations waste resources and slow down feedback loops.

## CORE-12: Quality and Reliability Over "Working is Enough"

- Never accept quick hacks, fake stubs, or ignore edge cases and failure modes.
- Every architectural choice must prioritize scalability, type safety, resource cleanup, and concurrent reliability.
- Reason: Superficial quick fixes create technical debt that compounds into systemic instability.

## CORE-13: Absolute Ban on Emojis

- Emojis are strictly forbidden across the entire project: in test code, logs, console output, markdown files, plans, commit messages, and chat responses.
- Use clean, structured ASCII badges (e.g. `[TEST]`, `[STEP]`, `[REQ]`, `[RES]`, `[PASS]`, `[FAIL]`, `[WARN]`) or plain markdown formatting instead.
- Reason: Emojis degrade log readability in CI/CD terminals and parallel worker streams, and violate enterprise standards.

## PLAN-01: Three-Directory Plans Lifecycle

- Tasks reside strictly in `plans/active/`, `plans/backlog/`, or `plans/completed/`.
- Naming standard: separated by domain with sequential numbering: frontend `FR-<num>-<short-title>.md`, backend `BE-<num>-<short-title>.md`, joint full-stack `FR-BE-<num>-<short-title>.md`, or automated testing `QA-<num>-<short-title>.md`.
- Creating a task in `plans/active/` gives no authority to modify code or database until explicit user approval ("починай", "виконуй", "реалізуй").
- Once implemented and 100% verified by tests, move task to `plans/completed/<filename>.md` and update `plans/README.md`.
- Reason: Deterministic task taxonomy and lifecycle prevent scope creep, unapproved changes, and undocumented releases.

## PLAN-02: Mandatory Ukrainian Language for Plans & Audits

- All plans, specifications, roadmaps, and review audit reports in `plans/` must be written strictly in Ukrainian (`uk`).
- Technical identifiers (file paths, method names, CLI commands, invariant IDs) remain in Latin/code blocks; all headings, narratives, criteria, risk analyses, and DoD checklists must be in Ukrainian.
- Reason: Plans and audit summaries must be immediately readable and verifiable in Ukrainian.
