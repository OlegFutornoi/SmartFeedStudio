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

- When integrating external libraries, adopting framework features, or checking API signatures, ground knowledge via `context7`.
- Use native MCP tools (`resolve-library-id`, `query-docs`) or CLI (`ctx7`), supplemented by project MCPs (`postgres`, `shadcn`, `redis`).
- Never guess API signatures or rely on stale training memory. Verified official docs prevent broken builds.
- Reason: Third-party APIs evolve frequently; verified official documentation prevents debugging churn.

## CORE-07: Strict Chat Brevity and Zero Plan Dumping

- Never duplicate, rewrite, or dump full plans, task breakdowns, or file contents into chat messages.
- All detailed tasks reside strictly in `plans/active/<task-name>.md`.
- Chat responses must contain only a 1-2 sentence status summary and a clickable file link (`[Plan](file:///...)`).
- Reason: Dumping large plans into chat burns context tokens without providing operational value.

## CORE-08: 100% MCP Auto-Approval

- Never ask confirmation questions before or during calling any MCP tool (`playwright`, `sentry`, `shadcn`, `railway`, `postgres`, `redis`, `firecrawl`, `context7`, `github`).
- Autonomous tool execution is 100% pre-approved.
- Reason: Confirmation prompts block autonomous execution and waste interaction turns.

## CORE-09: Ban of `browser_subagent`

- Never call `browser_subagent` or `open_browser_url`.
- For browser inspection and automation, use Playwright MCP tools directly (`browser_navigate`, `browser_snapshot`, `browser_take_screenshot`) or local test runners (`pnpm test:desktop`, `pnpm test:admin`).
- Reason: The built-in subagent unconditionally fails with a 404 binary download error on macOS ARM64.

## CORE-10: Git Operations on Explicit Request Only

- Never automatically execute `git commit` or `git push`.
- Staging and committing code occurs strictly when the user issues an explicit command (`/git-commit`, `commit`).
- Regular commits append `[skip ci]` and push without tags (zero CI runs); release commits (`/git-commit -r`) omit `[skip ci]`, bump versions, and push ONLY the release tag (`refs/tags/vX.Y.Z`) to trigger release builds (`release.yml`).
- Reason: Autonomous commits bypass user review; skipping CI on regular commits saves runner minutes.

## CORE-11: Targeted Feature-Scoped Testing

- During feature implementation or bug fixing, run strictly the tests covering the modified feature or page.
- Running full global test suites is prohibited during feature work. Full suites run only on explicit user request or release verification.
- Reason: Running 99+ desktop tests or all backend suites on single-component edits wastes CPU and slows feedback loops.

## CORE-12: Quality and Reliability Over "Working is Enough"

- Never accept quick hacks, fake stubs, or ignore edge cases and failure modes.
- Every architectural choice must prioritize scalability, type safety, resource cleanup, and concurrent reliability.
- Reason: Superficial quick fixes create technical debt that compounds into systemic instability.

## PLAN-01: Three-Directory Plans Lifecycle

- Tasks (formerly plans) reside strictly in `plans/active/`, `plans/backlog/`, or `plans/completed/`.
- Naming standard: starting from next task, tasks are separated by domain with sequential numbering: frontend `FR-<num>-<short-title>.md`, backend `BE-<num>-<short-title>.md`, or joint full-stack `FR-BE-<num>-<short-title>.md`. Legacy files remain untouched.
- Creating a task in `plans/active/` gives no authority to modify code or database until explicit user approval ("починай", "виконуй", "реалізуй").
- Once implemented and 100% verified by tests, move the task to `plans/completed/<filename>.md` and update `plans/README.md`.
- Reason: Deterministic task taxonomy and lifecycle prevent scope creep, unapproved changes, and undocumented releases.

## PLAN-02: Mandatory Ukrainian Language for Plans & Audits

- All plans, specifications, roadmaps, and code review audit reports in `plans/` (`plans/active/`, `plans/backlog/`, `plans/completed/`) must be written strictly in Ukrainian (`uk`).
- Technical identifiers (file paths, method names, CLI commands, invariant IDs) remain in Latin/code blocks, but all headings, narrative descriptions, criteria, risk analyses, and DoD checklists must be in Ukrainian.
- Reason: The project owner requires all technical plans and audit summaries to be immediately readable and verifiable in Ukrainian.
