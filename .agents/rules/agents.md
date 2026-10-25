---
trigger: always_on
description: Autonomous specialized agent router and dispatching directives for SmartFeed Studio.
---

# Autonomous Agent Router

## AGENT-01: Agent Roles and Dispatching

- Route planning and system architecture tasks to Planner Agent (`@agents_planner` / `@agents-planner`): Requirements discovery, domain boundary modeling, tracer-bullet vertical slicing, ADRs, contract-first design, and implementation plan authoring. Specification: `.agents/agents/planner.md`.
- Route frontend tasks to Frontend Agent (`@agents_frontend` / `@agents-frontend`): UI, UX, React 18, Next.js 14, Tauri v2 desktop UI, Tailwind CSS, shadcn/ui. Specification: `.agents/agents/frontend.md`.
- Route backend tasks to Backend Agent (`@agents_backend` / `@agents-backend`): NestJS 11 CQRS, Prisma ORM, PostgreSQL 16, Redis, BullMQ, shared contracts. Specification: `.agents/agents/backend.md`.
- Route review tasks to Review Agent (`@agents_review` / `@agents-review`): 5-axis code review, architecture compliance, invariant audits, adversarial testing. Specification: `.agents/agents/review.md`.
- Route QA tasks to QA Agent (`@agents_qa` / `@agents-qa`): Automated testing framework `e2e/`, Server/Local end-to-end integration tests, and QA reports. Executes strictly dedicated `QA-<num>` tasks. Specification: `.agents/agents/qa.md`.
- Route DevOps tasks to DevOps Agent (`@agents_devops` / `@agents-devops`): Docker, zero-downtime PostgreSQL migrations, Railway deployment, SemVer releases. Specification: `.agents/agents/devops.md`.
- Route security tasks to Security Agent (`@agents_security` / `@agents-security`): STRIDE threat modeling, OWASP Top 10 pentesting, secret masking, PoC validation, vulnerability remediation. Specification: `.agents/agents/security.md`.
- Reason: Clear domain separation ensures the specialized engineer commands the appropriate skills, gates, and tests.

## AGENT-02: Mandatory 8-Stage Execution Loop

- Every specialized agent must execute its task through eight sequential stages:
  1. Discovery, scope analysis, and task state loading: load `task-memory-and-state` and read `.agents/state/active_task.json` to acquire immediate context, active plan, modified files, and unblocked next actions before performing any searches or file reads.
  2. Planning, shared contracts, and modularity budgeting: create active tasks in `plans/active/` named by domain (`FR-<num>-<title>.md`, `BE-<num>-<title>.md`, or `FR-BE-<num>-<title>.md`). Writing long analytical sheets or audit matrices directly into chat is strictly prohibited (`CORE-07`, `PLAN-01`).
  3. Architecture and domain constraints.
  4. Verification design: formulate typecheck, lint, build targets, and list recommended QA scenarios for subsequent QA tasks. Feature agents never author test files.
  5. Implementation and domain hardening.
  6. Code review and DoD verification against invariant IDs.
  7. Systematic debugging and root cause isolation: when defects, performance bottlenecks, or anti-patterns are uncovered, codify preventive invariants directly into the corresponding domain rule (`.agents/rules/<domain>.md`) and skill (`.agents/skills/<skill>/SKILL.md`) to permanently prevent defect repetition.
  8. Documentation, task state persistence, and plan completion: update `.agents/state/active_task.json` with modified files, test results, and next actions. Move completed tasks to `plans/completed/`. Chat output is strictly limited to 1-2 sentence summary with a clickable link to the task (`CORE-07`).
- Reason: Strict stage progression prevents premature coding, skipped tests, context pollution, and unverified deployments.

## AGENT-03: Invariant & Skill Codification Loop

- Whenever an agent discovers a defect, anti-pattern, concurrency flaw, or unhandled bottleneck during review, QA, security audit, or development, the agent must update the relevant domain rule (`.agents/rules/<domain>.md`) and governing skill (`.agents/skills/<skill>/SKILL.md`).
- Define the new invariant with a concrete invariant ID (e.g., `FE-xx`, `BE-xx`, `SEC-xx`), explicit constraints, and technical rationale.
- Reason: Fixing a bug or pointing out an architectural defect without codifying the invariant into governing rules allows identical errors to recur across subsequent turns.

## AGENT-04: Full-Stack Orchestra Protocol (Zero Siloed & Zero Raw Tasks)

- Multi-Agent Orchestration Mandate: specialized agents must operate as a synchronized symphony, never in isolated silos.
  1. Planner Agent (`@agents_planner`): Every vertical slice must tightly couple backend and frontend. Designing isolated backend endpoints without frontend views, or creating frontend screens with dead fake mocks is strictly prohibited.
  2. Backend Agent (`@agents_backend`): Non-negotiable type safety and synchronization. Feature code is implemented cleanly with 4-layer defense, and `pnpm --filter @smartfeed/backend-api build` must be executed immediately to keep `dist/` synchronized. Backend agents never author test files.
  3. Frontend Agent (`@agents_frontend`): Strict shadcn architecture (`UI-05`). User interfaces must be assembled exclusively using official ready-made shadcn components (`@/components/ui/*`). Never invent custom ad-hoc controls, custom styled buttons, or raw `<label>` tags. Zero rainbow icons (`UI-07`). Frontend agents never author test files.
  4. QA Agent (`@agents_qa`): Autonomously engineers the `e2e/` testing framework and authors end-to-end integration suites covering Server and Local domains strictly within dedicated QA tasks (`QA-<num>`).
  5. 4-Point Non-Negotiable Definition of Done (DoD):
     - Backend `dist/` is fresh (`pnpm --filter @smartfeed/backend-api build`).
     - Static typecheck (`tsc --noEmit`) passes with 0 errors.
     - Bilingual parity (`pnpm i18n:check`) passes 100%.
     - Domain invariants check (`pnpm invariants:check`) passes with 0 violations.
     - (Note: Test execution gates belong exclusively to `e2e/` QA tasks).
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
