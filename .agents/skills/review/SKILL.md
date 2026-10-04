---
name: review
description: >-
  Enterprise full-cycle code review, quality audit, and security inspection master skill for
  SmartFeed Studio. Consolidates all review and audit skills (fullstack-code-review, adver-review,
  postgresql-code-review, security-best-practices, performance-budget, verification-before-completion).
  Guides the complete 8-stage audit lifecycle: 1. Reconnaissance, 2. CQRS & Boundary Audit,
  3. 4-Layer Security Audit, 4. Frontend & UX Audit, 5. Database & Schema Audit, 6. Adversarial Stress-Test,
  7. Remediation Plan Generation (plans/active/remediation_*.md), 8. Final Report.
  Use whenever inspecting code quality, running audits, finding regressions, checking database indexing,
  verifying component modularity, or reviewing PRs/branches.
---

# 🔍 Enterprise Code Review, Audit & Quality Lifecycle (SmartFeed Studio)

A comprehensive, full-cycle code review **master skill** for SmartFeed Studio.

## 🧭 1. Consolidated Review Architecture

```text
                        ┌──────────────────────────────────────┐
                        │        review (Master Skill)         │
                        └──────────────────┬───────────────────┘
                                           │
         ┌──────────────────┬──────────────┴─────┬──────────────────┬──────────────────┐
         ▼                  ▼                    ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────┐ ┌────────────────────┐ ┌──────────────┐ ┌────────────────────┐
│ CQRS & Boundary  │ │ 4-Layer Sec  │ │ DB & PostgreSQL    │ │ Frontend/UX  │ │ Adversarial & Race │
├──────────────────┤ ├──────────────┤ ├────────────────────┤ ├──────────────┤ ├────────────────────┤
│ fullstack-cr     │ │ defense-4l   │ │ postgresql-cr      │ │ ui-ux-pro-max│ │ adver-review       │
│ nestjs-bp        │ │ sentry-bug   │ │ supabase-pg-bp     │ │ net-dedup    │ │ mutex-concurrency  │
└──────────────────┘ └──────────────┘ └────────────────────┘ └──────────────┘ └────────────────────┘
```

## 📋 2. The 8-Stage Review Protocol

1. **Stage 1: Reconnaissance**: Check git diff, project-context-map, and lessons-learned-registry.
2. **Stage 2: CQRS & Boundaries**: Ensure clean decoupling, no JWT in data layers, no business logic in controllers.
3. **Stage 3: 4-Layer Defense**: Class-validator on 100% DTOs, quota checks, RBAC tenant scoping, DB constraints.
4. **Stage 4: Frontend & UX**: 100% solid sticky headers, zero duplicate CTAs, zero off-scheme colors, 100% i18n, zero-duplicate API requests.
5. **Stage 5: Database & Schema**: 100% FK indexes, snake_case mapping, timestamptz, no OFFSET on large feeds, zero N+1.
6. **Stage 6: Adversarial Stress-Test**: Concurrency race conditions, TOCTOU, cleanDatabase teardown in tests.
7. **Stage 7: Remediation Plan**: If defects found, write `plans/active/remediation_<target>.md`. Do not patch code silently.
8. **Stage 8: Final Report**: Structured findings report by severity.
