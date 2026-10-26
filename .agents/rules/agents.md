---
trigger: always_on
description: Autonomous specialized agent router and dispatching directives for SmartFeed Studio.
---

# Autonomous Agent Router

## AGENT-01: Agent Roles and Dispatching

- Planner (`@agents_planner` / `@agents-planner`): Requirements discovery, domain boundaries, vertical slicing, ADRs, contract-first design, implementation plans (`.agents/agents/planner.md`).
- Frontend (`@agents_frontend` / `@agents-frontend`): UI, UX, React 18, Next.js 14, Tauri v2 desktop UI, Tailwind CSS, shadcn/ui (`.agents/agents/frontend.md`).
- Backend (`@agents_backend` / `@agents-backend`): NestJS 11 CQRS, Prisma ORM, PostgreSQL 16, Redis, BullMQ, shared contracts (`.agents/agents/backend.md`).
- Review (`@agents_review` / `@agents-review`): 5-axis code review, architecture compliance, invariant audits, adversarial testing (`.agents/agents/review.md`).
- QA (`@agents_qa` / `@agents-qa`): `e2e/` framework, Server/Local E2E integration tests, QA reports; executes strictly `QA-<num>` tasks (`.agents/agents/qa.md`).
- DevOps (`@agents_devops` / `@agents-devops`): Docker, zero-downtime PostgreSQL migrations, Railway deployment, SemVer releases (`.agents/agents/devops.md`).
- Security (`@agents_security` / `@agents-security`): STRIDE threat modeling, OWASP Top 10 pentesting, secret masking, PoC validation, vulnerability remediation (`.agents/agents/security.md`).
- Reason: Clear domain separation ensures each specialized engineer commands appropriate skills, gates, and tests.

## AGENT-02: Mandatory 8-Stage Execution Loop

- Every specialized agent must execute its task through eight sequential stages:
  1. Discovery & state: load `task-memory-and-state` and read `.agents/state/active_task.json` for immediate context, active plan, modified files, and next actions.
  2. Planning & contracts: create tasks in `plans/active/` (`FR-<num>-<title>.md`, `BE-<num>-<title>.md`, `FR-BE-<num>-<title>.md`). Zero plan dumping in chat (`CORE-07`, `PLAN-01`).
  3. Architecture and domain constraints.
  4. Verification design: formulate typecheck, lint, build targets, and recommended QA scenarios. Feature agents never author test files.
  5. Implementation and domain hardening.
  6. Code review and DoD verification against invariant IDs.
  7. Systematic debugging & root cause isolation: codify preventive invariants directly into `.agents/rules/<domain>.md` and `.agents/skills/<skill>/SKILL.md`.
  8. Documentation, state persistence & completion: update `.agents/state/active_task.json` and move completed tasks to `plans/completed/`. Chat output is strictly 1-2 sentence summary with clickable link (`CORE-07`).
- Reason: Strict stage progression prevents premature coding, skipped tests, context pollution, and unverified deployments.

## AGENT-03: Invariant & Skill Codification Loop

- Whenever an agent discovers a defect, anti-pattern, concurrency flaw, or unhandled bottleneck during review, QA, security audit, or development, the agent must update the relevant domain rule (`.agents/rules/<domain>.md`) and governing skill (`.agents/skills/<skill>/SKILL.md`).
- Define the new invariant with a concrete invariant ID (e.g., `FE-xx`, `BE-xx`, `SEC-xx`), explicit constraints, and technical rationale.
- Reason: Fixing a bug or pointing out an architectural defect without codifying the invariant into governing rules allows identical errors to recur across subsequent turns.

## AGENT-04: Full-Stack Orchestra Protocol (Zero Siloed & Zero Raw Tasks)

- Multi-Agent Orchestration Mandate: specialized agents must operate as a synchronized symphony, never in isolated silos.
  1. Planner Agent (`@agents_planner`): Every vertical slice couples backend and frontend. Isolated backend endpoints without frontend views or dead mock frontend screens are prohibited.
  2. Backend Agent (`@agents_backend`): Clean 4-layer defense. Run `pnpm --filter @smartfeed/backend-api build` to keep `dist/` synchronized. Backend agents never author test files.
  3. Frontend Agent (`@agents_frontend`): Strict shadcn architecture (`UI-05`). User interfaces assemble exclusively from official shadcn components (`@/components/ui/*`). Zero rainbow icons (`UI-07`). Frontend agents never author test files.
  4. QA Agent (`@agents_qa`): Autonomously engineers `e2e/` testing framework covering Server and Local domains strictly within dedicated QA tasks (`QA-<num>`).
  5. 4-Point Non-Negotiable Definition of Done (DoD):
     - Backend `dist/` is fresh (`pnpm --filter @smartfeed/backend-api build`).
     - Static typecheck (`tsc --noEmit`) passes with 0 errors.
     - Bilingual parity (`pnpm i18n:check`) passes 100%.
     - Domain invariants check (`pnpm invariants:check`) passes with 0 violations.
- Reason: Siloed development causes runtime contract mismatches, dead UIs, 400 Bad Request errors, and half-baked deliverables.

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
