---
name: turborepo
description: Turborepo monorepo pipeline orchestration, build caching, task filtering, and dependency graphs. Use when configuring turbo.json, optimizing monorepo builds, setting up workspace packages, or tuning CI pipeline speed.
rules:
  - core
  - docs_and_ops
---

# Turborepo Monorepo Orchestration

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/docs_and_ops.md`.
2. Note all monorepo build and pipeline invariants in working notes.
3. If modifying turbo.json, call context7 to verify Turborepo configuration schema.
4. Do not alter root pipeline scripts without verifying downstream package tasks.

## Pipeline architecture and task delegation

1. Package tasks over root tasks: Place task implementation scripts inside each app and package `package.json` (`apps/desktop`, `apps/admin-portal`, `services/backend-api`, `packages/shared`). Root `package.json` must strictly delegate via `pnpm exec turbo run <task>`.
2. Explicit command syntax: Always use `turbo run <task>` in scripts and CI definitions. Never use the shorthand `turbo <task>` in committed configuration.
3. Task dependencies and topology:
   - Configure `"dependsOn": ["^build"]` for build tasks requiring compiled upstream packages (`@smartfeed/shared`).
   - Define explicit outputs (`"outputs": ["dist/**", ".next/**"]`) for deterministic caching.
   - Set `"cache": false` for development servers and interactive runners.
4. Targeted package filtering:
   - Run task on specific package: `pnpm exec turbo run test --filter=@smartfeed/backend-api`
   - Run task on modified packages: `pnpm exec turbo run build --filter=...[origin/main]`
5. Environment variable declarations:
   - Declare environment variables that affect build output in `globalEnv` or task-specific `env` arrays in `turbo.json`.
   - Prevent cache poisoning by ensuring secrets are omitted from build artifacts.
6. For detailed pipeline patterns and recipes, see `references/turbo-recipes.md`.
