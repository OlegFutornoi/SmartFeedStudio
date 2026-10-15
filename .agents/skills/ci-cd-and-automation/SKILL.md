---
name: ci-cd-and-automation
description: Continuous integration and deployment pipeline engineering. Governs automated quality gates, linting, type checks, build validation, and GitHub Actions workflow management.
rules:
  - core
  - docs_and_ops
  - testing
---

# CI/CD and Automation

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/docs_and_ops.md`, and `.agents/rules/testing.md`.
2. Note all CI pipeline invariants and quality gate requirements in working notes.
3. If modifying GitHub Actions workflows, call context7 to check action versions and syntax.
4. Do not alter CI configurations without validating local build parity.

## Quality gate sequence and pipeline standards

1. Stage 1 - Static analysis and linting: Run `pnpm lint` and `pnpm format:check`. Block pipeline on any ESLint violation or import boundary breach (zero `../` relative imports).
2. Stage 2 - Contract compilation: Build shared contracts package `pnpm --filter @smartfeed/shared build` before typechecking dependents.
3. Stage 3 - Static typecheck: Execute `pnpm exec tsc --noEmit` across all apps and services. Confirm zero compilation errors.
4. Stage 4 - Automated test suites: Execute unit and targeted integration suites in parallel. Ensure database tests run with clean database teardown.
5. Stage 5 - Application builds: Run `pnpm build` across Next.js Admin Portal and NestJS Backend API.
6. Desktop client release builds: Build Tauri v2 client binaries using official GitHub Actions runner matrix. Inject code-signing certificates and notarization credentials from repository secrets.
7. For reference workflow YAML definitions, see `references/workflows.md`.
