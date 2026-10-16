---
trigger: always_on
description: Autonomous specialized agent router and dispatching directives for SmartFeed Studio.
---

# Autonomous Agent Router

## AGENT-01: Agent Roles and Dispatching

- Route planning and system architecture tasks to Planner Agent (`@agents_planner` / `@agents-planner`): Requirements discovery, domain boundary modeling, tracer-bullet vertical slicing, ADRs, contract-first design, and implementation plan authoring. Specification: `.agents/agents/planner.md`.
- Route frontend tasks to Frontend Agent (`@agents_frontend` / `@agents-frontend`): UI, UX, React 18, Next.js 14, Tauri v2 desktop UI, Tailwind CSS, shadcn/ui, Playwright. Specification: `.agents/agents/frontend.md`.
- Route backend tasks to Backend Agent (`@agents_backend` / `@agents-backend`): NestJS 11 CQRS, Prisma ORM, PostgreSQL 16, Redis, BullMQ, shared contracts. Specification: `.agents/agents/backend.md`.
- Route review tasks to Review Agent (`@agents_review` / `@agents-review`): 5-axis code review, architecture compliance, invariant audits, adversarial testing. Specification: `.agents/agents/review.md`.
- Route QA tasks to QA Agent (`@agents_qa` / `@agents-qa`): 100k+ SKU benchmarks, chaos testing, memory backpressure, mock/real parity, cleanDatabase verification. Specification: `.agents/agents/qa.md`.
- Route DevOps tasks to DevOps Agent (`@agents_devops` / `@agents-devops`): Docker, zero-downtime PostgreSQL migrations, Railway deployment, SemVer releases. Specification: `.agents/agents/devops.md`.
- Route security tasks to Security Agent (`@agents_security` / `@agents-security`): STRIDE threat modeling, OWASP Top 10 pentesting, secret masking, PoC validation, vulnerability remediation. Specification: `.agents/agents/security.md`.
- Reason: Clear domain separation ensures the specialized engineer commands the appropriate skills, gates, and tests.

## AGENT-02: Mandatory 8-Stage Execution Loop

- Every specialized agent must execute its task through eight sequential stages:
  1. Discovery, scope analysis, and task state loading: load `task-memory-and-state` and read `.agents/state/active_task.json` to acquire immediate context, active plan, modified files, and unblocked next actions before performing any searches or file reads.
  2. Planning, shared contracts, and modularity budgeting: create active plans in `plans/active/<name>.md`. Writing long analytical sheets or audit matrices directly into chat is strictly prohibited (`CORE-07`, `PLAN-01`).
  3. Architecture and domain constraints.
  4. Automated test design (TDD RED).
  5. Implementation and domain hardening (GREEN).
  6. Code review and DoD verification against invariant IDs.
  7. Systematic debugging and root cause isolation: when defects, performance bottlenecks, or anti-patterns are uncovered, codify preventive invariants directly into the corresponding domain rule (`.agents/rules/<domain>.md`) and skill (`.agents/skills/<skill>/SKILL.md`) to permanently prevent defect repetition.
  8. Documentation, task state persistence, and plan completion: update `.agents/state/active_task.json` with modified files, test results, and next actions. Move completed plans to `plans/completed/`. Chat output is strictly limited to 1-2 sentence summary with a clickable link to the plan (`CORE-07`).
- Reason: Strict stage progression prevents premature coding, skipped tests, context pollution, and unverified deployments.

## AGENT-03: Invariant & Skill Codification Loop

- Whenever an agent discovers a defect, anti-pattern, concurrency flaw, or unhandled bottleneck during review, QA, security audit, or development, the agent must update the relevant domain rule (`.agents/rules/<domain>.md`) and governing skill (`.agents/skills/<skill>/SKILL.md`).
- Define the new invariant with a concrete invariant ID (e.g., `FE-xx`, `BE-xx`, `SEC-xx`), explicit constraints, and technical rationale.
- Reason: Fixing a bug or pointing out an architectural defect without codifying the invariant into governing rules allows identical errors to recur across subsequent turns.

## AGENT-04: Full-Stack Orchestra Protocol (Zero Siloed & Zero Raw Tasks)

- Multi-Agent Orchestration Mandate: specialized agents must operate as a synchronized symphony, never in isolated silos.
  1. Planner Agent (`@agents_planner`): Every vertical slice must tightly couple backend and frontend. Designing isolated backend endpoints without frontend views, or creating frontend screens with dead fake mocks is strictly prohibited.
  2. Backend Agent (`@agents_backend`): Non-negotiable TDD (RED -> GREEN). Must author Supertest E2E tests (`test/*.e2e-spec.ts`) FIRST. Writing application code before tests fail (RED) is forbidden. Code until 100% GREEN, and immediately execute `pnpm --filter @smartfeed/backend-api build` to keep `dist/` synchronized.
  3. Frontend Agent (`@agents_frontend`): Strict shadcn architecture (`UI-05`). User interfaces must be assembled exclusively using official ready-made shadcn components (`@/components/ui/*`). Never invent custom ad-hoc controls, custom styled buttons, or raw `<label>` tags. Zero rainbow icons (`UI-07`).
  4. QA Agent (`@agents_qa`): Assert live contract execution in the browser with real business data (`TEST-03`), zero 400 Bad Requests, zero console errors, zero text clipping.
  5. 6-Point Non-Negotiable Definition of Done (DoD): A task is NEVER complete or handed to the user while it is raw ("сира"). All 6 gates must pass:
     - Backend E2E tests pass 100% on real database.
     - Backend `dist/` is compiled and verified fresh.
     - Frontend Playwright tests pass 100% asserting real data.
     - Static typechecking (`tsc --noEmit`) passes with 0 errors across all packages.
     - Bilingual dictionary parity (`pnpm i18n:check`) passes 100%.
     - Automated domain invariants check (`pnpm invariants:check`) passes with 0 violations across UI semantic tokens, solid headers, CQRS single-handler structure, and controller DTOs.
- Reason: Siloed development causes runtime contract mismatches, dead UIs, 400 Bad Request errors, and half-baked ("сирі") deliverables.

## AGENT-05: Reference-Pattern Hierarchy

- When writing new code or adapting existing patterns, agents must adhere to a strict three-tier reference hierarchy:
  1. Golden Templates (`.agents/templates/*`): Authoritative reference scaffolds for controllers, CQRS handlers, UI cells, and badges.
  2. Golden Source Files (`// @golden` header): In-tree implementations verified against all active invariants.
  3. Untrusted Code: All unannotated codebase files are treated as legacy; agents must never blindly mimic them without validating against `.agents/rules/`.
- Reason: Unverified legacy files contain historical anti-patterns that induce few-shot regression loops.

## AGENT-06: Pre- and Post-Flight Verification Gate

- Stage 1 (Discovery): Record pre-flight baseline via `pnpm guardrails:check` or `pnpm verify:fast`.
- Stage 6 (Verification): Run `pnpm verify:fast` to guarantee zero regressions against the ratchet baseline.
- Final Turn: Provide the exact mechanical gate summary line in the report instead of unverified textual claims.
- Reason: Mandatory mechanical execution catches regressions before user handover.
