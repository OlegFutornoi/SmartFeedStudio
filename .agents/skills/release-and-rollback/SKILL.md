---
name: release-and-rollback
description: Semantic versioning, changelog generation, post-deployment health verification, and zero-data-loss rollback procedures. Use when tagging releases, deploying to production, or managing deployment rollbacks.
rules:
  - core
  - docs_and_ops
  - testing
---

# Release and Rollback

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/docs_and_ops.md`, and `.agents/rules/testing.md`.
2. Note all release criteria and rollback steps in working notes.
3. If managing cloud deployments, inspect Railway status via railway MCP.
4. Do not publish release tags or deploy without verifying rollback runbooks.

## Semantic versioning and release criteria

1. Version bump rules:
   - MAJOR: Breaking contract changes, removed endpoints, or incompatible database schema changes.
   - MINOR: New backward-compatible features, new API endpoints, or new UI screens.
   - PATCH: Backward-compatible bug fixes, performance optimizations, or styling updates.
2. Pre-release verification gates: Before creating any release tag (`vX.Y.Z`):
   - Confirm `pnpm --filter @smartfeed/shared build` compiles cleanly.
   - Confirm `pnpm exec tsc --noEmit` passes with 0 errors across all monorepo packages.
   - Confirm all targeted test suites pass.
   - Confirm `CHANGELOG.md` is updated with conventional commit entries.
3. Git release command trigger: Release tagging and git push occur only upon explicit user command (`/git-commit --release [patch|minor|major]`).

## Post-deployment health verification and rollback

1. Post-deployment smoke check: Query `/api/health` immediately following deployment. Verify HTTP 200 responses, Redis connectivity, and PostgreSQL connection pool readiness.
2. Rollback trigger: If `/api/health` returns any status code >= 500, or critical auth/login flows fail, trigger immediate deployment rollback.
3. Zero-data-loss rollback strategy:
   - Database migrations must follow the Expand/Contract pattern. Application code rollbacks must remain fully compatible with expanded database schemas.
   - Use Railway CLI (`railway rollback`) or git revert to roll back application containers cleanly.
