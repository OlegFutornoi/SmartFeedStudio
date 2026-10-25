---
trigger: model_decision
description: DevOps, Docker, Railway, SemVer releases, and documentation synchronization invariants.
---

# DevOps, Releases, and Documentation Invariants

## OPS-01: Continuous WIKI and AGENTS.md Synchronization

- Whenever architecture, modules, CQRS commands, Prisma models, shared DTOs, or server ports change, update `wiki/` documentation and the respective `AGENTS.md` sub-guides in the same turn.
- Reason: Outdated documentation misleads engineers and causes agents to produce misaligned code.

## OPS-02: E2E Test Coverage Documentation

- Test coverage matrix is maintained in `e2e/README.md` and `wiki/07-testing-and-qa/test-coverage-matrix.md`.
- Test coverage matrices are updated exclusively by QA Agent (`@agents_qa`) within `QA-<num>` tasks after new specs are integrated.
- Reason: Keeps test coverage reporting transparent, synchronized, and free from outdated developer-level duplication.

## OPS-03: SemVer Release Governance

- Regular development commits append `[skip ci]` by default and push directly to remote without git tags or triggering release builds.
- SemVer releases are triggered strictly via `/git-commit -r` or `/git-commit --release [patch|minor|major]`.
- The release command bumps the version, creates an annotated git tag `v*`, and pushes branch and ONLY the specific tag (`refs/tags/vX.Y.Z`, never global `--tags`) to trigger GitHub Action release pipelines.
- Reason: Accidental automated tag pushes or pushing global `--tags` triggers expensive multi-platform desktop release builds and runs workflows across historical tags.

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
