# Agent Slash Commands

Location: `.agents/commands/` (mirrored in `.claude/commands/`)  
Format: TOML command specifications for Claude Code, Antigravity IDE, and compatible agent CLIs.

This directory contains automated workflows and development commands. Each command ties specialized skills into a deterministic step-by-step procedure.

## Available Commands

- `/build` ([`build.toml`](./build.toml))
  - Description: Step-by-step implementation of the next task in active plan (RED -> GREEN -> regression -> build verification). When invoked with `/build auto`, executes the approved plan autonomously.
  - Related skills: `incremental-implementation`, `test-driven-development`.

- `/code-simplify` ([`code-simplify.toml`](./code-simplify.toml))
  - Description: Simplification and cleanup. Reduces code complexity, eliminates nested branching and duplication, and enhances readability without altering observable runtime behavior.
  - Related skills: `code-simplification`.

- `/review` ([`review.toml`](./review.toml))
  - Description: 5-axis code audit (correctness, architecture, security, performance, rule invariant compliance).
  - Related skills: `review`.

- `/planning` ([`planning.toml`](./planning.toml))
  - Description: Deterministic planning. Generates structured execution plan in `plans/active/` with invariants, checklists, and Definition of Done.
  - Related skills: `planning-and-lifecycle`.

- `/spec` ([`spec.toml`](./spec.toml))
  - Description: Specification creation. Defines requirements, task boundaries, and contracts before implementation begins.
  - Related skills: `planning-and-lifecycle`, `contract-first-api`.

- `/test` ([`test.toml`](./test.toml))
  - Description: Test execution and verification run. Executes Jest E2E, Playwright, and checks for regressions.
  - Related skills: `qa`, `playwright-automation`.

- `/ship` ([`ship.toml`](./ship.toml))
  - Description: Release verification. Performs final audit, static typecheck (`tsc --noEmit`), migration verification, and release preparation.
  - Related skills: `release-and-rollback`, `ci-cd-and-automation`.

- `/constraints` ([`constraints.toml`](./constraints.toml))
  - Description: Architectural constraints check. Audits file size budgets (<250-300 lines), prohibits relative imports, ensures no `as any`, and checks for empty catch blocks.
  - Related skills: `ci-cd-and-automation`, `lessons-learned-registry`.

- `/webperf` ([`webperf.toml`](./webperf.toml))
  - Description: Frontend performance audit. Detects redundant re-renders, duplicate network requests, and missing deduplication.
  - Related skills: `performance-optimization`, `vercel-react-best-practices`.

## Execution Patterns

1. Antigravity IDE / Claude Code Chat:
   - Invoke command name directly:
     ```text
     /build auto
     ```
     or
     ```text
     /code-simplify apps/desktop/src/modules/products/ProductsTable.tsx
     ```

2. Direct Agent Invocation:
   - Provide natural language intent referencing command:
     ```text
     execute /review on recent backend modifications
     ```
