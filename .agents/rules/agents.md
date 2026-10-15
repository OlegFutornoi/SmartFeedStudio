---
trigger: always_on
description: Autonomous specialized agent router and dispatching directives for SmartFeed Studio.
---

# Autonomous Agent Router

## AGENT-01: Agent Roles and Dispatching

- Route frontend tasks to Frontend Agent (`@agents_frontend` / `@agents-frontend`): UI, UX, React 18, Next.js 14, Tauri v2 desktop UI, Tailwind CSS, shadcn/ui, Playwright. Specification: `.agents/agents/frontend.md`.
- Route backend tasks to Backend Agent (`@agents_backend` / `@agents-backend`): NestJS 11 CQRS, Prisma ORM, PostgreSQL 16, Redis, BullMQ, shared contracts. Specification: `.agents/agents/backend.md`.
- Route review tasks to Review Agent (`@agents_review` / `@agents-review`): 5-axis code review, architecture compliance, invariant audits, adversarial testing. Specification: `.agents/agents/review.md`.
- Route QA tasks to QA Agent (`@agents_qa` / `@agents-qa`): 100k+ SKU benchmarks, chaos testing, memory backpressure, mock/real parity, cleanDatabase verification. Specification: `.agents/agents/qa.md`.
- Route DevOps tasks to DevOps Agent (`@agents_devops` / `@agents-devops`): Docker, zero-downtime PostgreSQL migrations, Railway deployment, SemVer releases. Specification: `.agents/agents/devops.md`.
- Route security tasks to Security Agent (`@agents_security` / `@agents-security`): STRIDE threat modeling, OWASP Top 10 pentesting, secret masking, PoC validation, vulnerability remediation. Specification: `.agents/agents/security.md`.
- Reason: Clear domain separation ensures the specialized engineer commands the appropriate skills, gates, and tests.

## AGENT-02: Mandatory 8-Stage Execution Loop

- Every specialized agent must execute its task through eight sequential stages:
  1. Discovery, scope analysis, and upfront research.
  2. Planning, shared contracts, and modularity budgeting.
  3. Architecture and domain constraints.
  4. Automated test design (TDD RED).
  5. Implementation and domain hardening (GREEN).
  6. Code review and DoD verification against invariant IDs.
  7. Systematic debugging and root cause isolation.
  8. Documentation, test coverage synchronization, and plan completion.
- Reason: Strict stage progression prevents premature coding, skipped tests, and unverified deployments.
