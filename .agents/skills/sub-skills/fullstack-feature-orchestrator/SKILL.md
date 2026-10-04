---
name: fullstack-feature-orchestrator
description: >-
  Master orchestrator for end-to-end fullstack feature development across SmartFeed Studio.
  Coordinates the complete 5-phase cross-cutting engineering lifecycle:
  Phase 1. Contract-First API & DTOs (@smartfeed/shared);
  Phase 2. Backend CQRS & Database (services/backend-api with NestJS, Prisma, BullMQ, 4-layer defense, and cleanDatabase);
  Phase 3. Frontend Client & UI/UX (apps/desktop with Tauri v2/React or apps/admin-portal with Next.js 14, ui-ux-pro-max, solid sticky headers, zero duplicate calls, 100% i18n);
  Phase 4. Parity & Invariant Testing (mock-real-parity-testing between local Mock/SQLite and real NestJS backend, cascade deletions);
  Phase 5. Adversarial Review & DoD Verification (adver-review, fullstack-code-review, verification-before-completion).
  Use whenever implementing a new fullstack feature that spans across contracts, backend, and frontend.
---

# 🚀 Fullstack Feature Orchestrator

Master coordinator for cross-cutting feature development across the entire SmartFeed Studio monorepo. It binds together shared contracts, backend CQRS, frontend interfaces, environment parity, and adversarial review into a single, cohesive, zero-defect engineering lifecycle.

---

## 🏛 1. The 5-Phase Fullstack Pipeline

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                   Fullstack Feature Orchestrator Pipeline                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
  ┌────────────────────────────────────▼────────────────────────────────────┐
  │  Phase 1: Contract-First Design (@smartfeed/shared)                     │
  │  Zod schemas · Shared DTOs · Enums · Build gate: pnpm build:shared      │
  └────────────────────────────────────┬────────────────────────────────────┘
                                       │
  ┌────────────────────────────────────▼────────────────────────────────────┐
  │  Phase 2: Backend CQRS & Database (services/backend-api)                │
  │  Prisma schema · 4-Layer Defense · TDD RED → GREEN · cleanDatabase      │
  └────────────────────────────────────┬────────────────────────────────────┘
                                       │
  ┌────────────────────────────────────▼────────────────────────────────────┐
  │  Phase 3: Frontend Client & UI/UX (apps/desktop, apps/admin-portal)     │
  │  ui-ux-pro-max · Solid sticky headers · 100% i18n · Network dedup       │
  └────────────────────────────────────┬────────────────────────────────────┘
                                       │
  ┌────────────────────────────────────▼────────────────────────────────────┐
  │  Phase 4: Parity & Invariants Verification                              │
  │  Mock/SQLite vs Real Backend parity · Cascade deletion · Quota counters  │
  └────────────────────────────────────┬────────────────────────────────────┘
                                       │
  ┌────────────────────────────────────▼────────────────────────────────────┐
  │  Phase 5: Adversarial Review & Verification                             │
  │  Adversarial review · Zero God-files (<300 lines) · Zero ../ imports     │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## 🗺 2. Routing Matrix: Triggers to Reference Guides

| Development Phase / Problem       | Sub-Skills Activated                                                                                  | Reference Guide                                                                          |
| :-------------------------------- | :---------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| **Phase 1: Contracts & Types**    | `contract-first-api`, `typescript-advanced-types`                                                     | [`references/lifecycle-stages.md#phase-1`](references/lifecycle-stages.md)               |
| **Phase 2: Backend & Database**   | `backend`, `nestjs-best-practices`, `defense-in-depth-validation`, `supabase-postgres-best-practices` | [`references/lifecycle-stages.md#phase-2`](references/lifecycle-stages.md)               |
| **Phase 3: Frontend & UI**        | `frontend`, `ui-ux-pro-max`, `shadcn`, `frontend_network_dedup`                                       | [`references/lifecycle-stages.md#phase-3`](references/lifecycle-stages.md)               |
| **Phase 4: Parity & Cascades**    | `mock-real-parity-testing`, `e2e-scenario-matrix`, `invariant-checklist-generator`                    | [`references/lifecycle-stages.md#phase-4`](references/lifecycle-stages.md)               |
| **Phase 5: Review & DoD**         | `adver-review`, `fullstack-code-review`, `verification-before-completion`                             | [`references/lifecycle-stages.md#phase-5`](references/lifecycle-stages.md)               |
| **Phase Transitions & Artifacts** | `session-handoff`, `writing-plans`                                                                    | [`references/handoff-contracts.md`](references/handoff-contracts.md)                     |
| **Failure Modes & Edge Cases**    | `sentry-backend-bugs`, `observability-opentelemetry`                                                  | [`references/checklist-and-failure-modes.md`](references/checklist-and-failure-modes.md) |

---

## ⚡ 3. Quick Execution Protocol

1. **Initialize Phase 1**: Define shared types and Zod schemas in `packages/shared/src/`. Run `pnpm build:shared`.
2. **Execute Phase 2**: Implement backend CQRS handlers in `services/backend-api/`. Run E2E test with `cleanDatabase`.
3. **Execute Phase 3**: Build frontend components in `apps/desktop/` or `apps/admin-portal/`. Ensure 100% i18n (`uk` + `en`).
4. **Verify Phase 4**: Execute parity test asserting identical behavior between Mock/SQLite and Real API.
5. **Finalize Phase 5**: Run static verification (`tsc --noEmit`), lint checks, and pre-commit self-review.
