# Engineering Rules Rationale & Architectural Decisions

This document records the engineering justifications for universal rules (`core.md`) and agent lifecycle directives (`agents.md`).

## Universal Invariants (CORE)

- CORE-01 (Path Aliases): Relative imports across directory boundaries break refactoring, impede automated dependency analysis, and leak module internals.
- CORE-02 (Zero Silent Failures): Empty catch blocks swallow critical operational errors, mask partial failures, and corrupt distributed state.
- CORE-03 (Zero Type Bypasses): Casting to `any` strips TypeScript compile-time safety and propagates silent runtime exceptions across service boundaries.
- CORE-04 (File Size Budget): Monolithic files exceed focused review budgets, increase cognitive load, and trigger merge conflicts in multi-agent environments.
- CORE-05 (Safe OS Execution): Interpolating user or variable strings in shell commands introduces CWE-78 command injection.
- CORE-06 (Upfront Research): Calling external docs prevents hallucinated APIs; local compressed caching eliminates redundant external latency and token costs.
- CORE-07 (Strict Chat Brevity): Dumping large diffs or plans into chat pollutes LLM context windows without operational gain.
- CORE-08 (100% MCP Auto-Approval): Manual confirmation prompts block autonomous agent task execution.
- CORE-09 (Ban of browser_subagent): Built-in browser subagent fails with 404 binary download error on macOS ARM64; direct Playwright MCP tools operate reliably.
- CORE-10 (Git on Explicit Request): Autonomous commits bypass human review; skipping CI on regular commits saves runner minutes.
- CORE-11 (Targeted Testing): Running full monorepo suites during iterative feature development stalls feedback loops.
- CORE-12 (Quality Over Shortcuts): Fake stubs and superficial fixes create technical debt that compounds into systemic instability.
- CORE-13 (Absolute Ban on Emojis): Emojis corrupt log parsers, break CLI column alignment, and degrade readability in CI/CD terminals.
- CORE-14 (Dual-Plan Isolation): Ukrainian human plans provide rich developer context; dense English compressed plans save 65-75% tokens for models.
- PLAN-01 (Plan Lifecycle): Deterministic plan states prevent scope creep and eliminate rogue autonomous execution.
- PLAN-02 (Ukrainian Language): Human-facing architectural plans must remain immediately readable in Ukrainian.

## Autonomous Agent Directives (AGENT)

- AGENT-01 (Roles and Dispatching): Clear domain segregation ensures each specialized engineer commands appropriate skills, gates, and tests.
- AGENT-02 (8-Stage Execution Loop): Strict stage progression prevents premature coding, skipped tests, context pollution, and unverified deployments.
- AGENT-03 (Invariant Codification): Converting recurrent friction into machine-enforced barriers prevents models from repeating discarded assumptions.
- AGENT-04 (Full-Stack Orchestra): Siloed development causes runtime contract mismatches, dead UIs, 400 Bad Request errors, and half-baked deliverables.
- AGENT-05 (Reference Hierarchy): Unverified legacy files contain historical anti-patterns that induce few-shot regression loops.
- AGENT-06 (Verification Gates): Mandatory mechanical gate execution catches regressions before user handover.
- AGENT-07 (Trigger Integrity): Unverified skill description edits corrupt autonomous routing and induce hallucinated tool calls.
- AGENT-08 (Single-Writer Rule): Unconstrained parallel writing creates worktree collisions, race conditions, and corrupted git state.
