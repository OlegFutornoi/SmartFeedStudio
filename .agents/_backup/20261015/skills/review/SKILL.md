---
name: review
description: >-
  Enterprise full-cycle code review, quality audit, and security inspection master skill for
  SmartFeed Studio. Consolidates review and audit skills (code-review-and-quality,
  code-simplification, doubt-driven-development, postgresql-optimization, security-and-hardening,
  performance-optimization, i18n-localization, mock-real-parity, bullmq-jobs). Guides the complete 8-stage audit lifecycle: 1. Reconnaissance,
  2. CQRS & Boundary Audit, 3. 4-Layer Security Audit, 4. Frontend & UX Audit, 5. Database & Schema Audit,
  6. Adversarial Stress-Test, 7. Remediation Plan Generation (plans/active/remediation_*.md), 8. Final Report.
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
│ CQRS & Boundary  │ │ 4-Layer Sec  │ │ DB & Background  │ │ Frontend/UX  │ │ Adversarial & Race │
├──────────────────┤ ├──────────────┤ ├────────────────────┤ ├──────────────┤ ├────────────────────┤
│ code-review-qual │ │ defense-4l   │ │ postgresql-opt     │ │ ui-ux-pro-max│ │ doubt-driven-dev   │
│ nestjs-best-prac │ │ security-hard│ │ prisma-pg-mastery  │ │ net-dedup    │ │ mutex-concurrency  │
│ contract-first   │ │ quotas-life  │ │ bullmq-jobs        │ │ i18n-localiz │ │ mock-real-parity   │
└──────────────────┘ └──────────────┘ └────────────────────┘ └──────────────┘ └────────────────────┘
```

## 📋 2. The 8-Stage Review Protocol

1. **Stage 1: Reconnaissance**: Check git diff, `project-context-map`, and `lessons-learned-registry`. Verify whether solution is grounded in official docs via `context7` MCP (`resolve-library-id`, `query-docs`) and audit against naive "working is enough" hacks.
2. **Stage 2: CQRS & Boundaries**: Ensure clean decoupling, no JWT in data layers, no business logic in controllers.
3. **Stage 3: 4-Layer Defense**: Class-validator on 100% DTOs, quota checks, RBAC tenant scoping, DB constraints.
4. **Stage 4: Frontend & UX**: 100% solid sticky headers, zero duplicate CTAs, zero off-scheme colors, 100% i18n (`pnpm i18n:check`), zero-duplicate API requests.
5. **Stage 5: Database & Background Queues**: 100% FK indexes, snake_case mapping, timestamptz, no OFFSET on large feeds, zero N+1, BullMQ exponential backoff & DLQ.
6. **Stage 6: Adversarial Stress-Test**: Concurrency race conditions, TOCTOU, cleanDatabase teardown in tests, `mock-real-parity` between browser Mock, SQLite, and PostgreSQL.
7. **Stage 7: Remediation Plan (Zero Plan Dumping)**: If defects found, write detailed plan to `plans/active/remediation_<target>.md`. Do not dump the plan into chat; output ONLY a 1-2 sentence summary and clickable file link `[План](file:///...)`. Do not patch code silently.
8. **Stage 8: Final Report**: Structured findings report by severity written to file/artifact with brief summary in chat.

---

## 📚 References & Specialized Playbooks

- [agents_review.md](../../references/agents_review.md) — Повний 88КБ плейбук аудиту коду (8 етапів, CQRS аудит, 4-шаровий захист, стрес-тести гонок, шаблони звітів)
- [code_review_and_skills.md](../../rules/code_review_and_skills.md) — Mandatory Domain Skills Matrix & Pre-Commit Checklist
- [code-review-and-quality](../code-review-and-quality/SKILL.md) — 5-axis code review master
- [doubt-driven-development](../doubt-driven-development/SKILL.md) — Adversarial cross-examination
- [mock-real-parity](../mock-real-parity/SKILL.md) — Parity between Mock, SQLite, and PostgreSQL
- [i18n-localization](../i18n-localization/SKILL.md) — 100% i18n parity check gate (`pnpm i18n:check`)
