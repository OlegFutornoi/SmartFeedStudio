---
trigger: model_decision
description: DevOps, Docker, Railway, SemVer releases, and documentation synchronization invariants.
---

# DevOps, Releases, and Documentation Invariants

## OPS-01: Continuous WIKI and AGENTS.md Synchronization

- Whenever architecture, modules, CQRS commands, Prisma models, shared DTOs, or server ports change, update `wiki/` documentation and the respective `AGENTS.md` sub-guides in the same turn.
- Reason: Outdated documentation misleads engineers and causes agents to produce misaligned code.

## OPS-02: Backend E2E Test Coverage Documentation

- Whenever an `*.e2e-spec.ts` test file is added or modified in `services/backend-api/test/`:
  1. Run the test suite: `pnpm --filter @smartfeed/backend-api test:e2e -- test/<spec>.e2e-spec.ts`.
  2. Update the coverage tables in `services/backend-api/README.md` and `services/backend-api/AGENTS.md`.
- Reason: Keeps test coverage reporting transparent and verifiable for continuous integration audits.

## OPS-03: SemVer Release Governance

- Regular development commits push directly to remote without git tags or triggering release builds.
- SemVer releases are triggered strictly via `/git-commit --release [patch|minor|major]`.
- The release command bumps the version, creates an annotated git tag `v*`, and pushes with tags to trigger GitHub Action release pipelines.
- Reason: Accidental automated tag pushes trigger expensive multi-platform desktop release builds.

## OPS-04: Rollback Runbook for Infrastructure Changes

- Every infrastructure or database migration plan must include an explicit step-by-step Rollback Runbook.
- Verify fallback procedures before applying changes to staging or production.
- Reason: Unplanned infrastructure failures without verified rollback steps cause prolonged production downtime.

## OPS-05: Standard Monorepo Ports and Access

- Backend API: port 4000 (`http://localhost:4000/api`, Swagger: `/api/docs`).
- Admin Web Portal: port 3000 (`http://localhost:3000`).
- Desktop UI: port 1420 (`http://localhost:1420`).
- Documentation Portal: port 4321 (`http://localhost:4321`).
- PostgreSQL: port 5432 (`smartfeed_db`).
- Redis: port 6379.
- MinIO S3: port 9000 (API) and 9001 (Console).
- Reason: Standardized ports prevent port collisions during local multi-service development.
