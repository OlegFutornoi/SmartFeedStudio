---
name: planning-and-lifecycle
description: >-
  Deterministic task planning, architectural invariant validation, and plan lifecycle management.
  Use when starting any non-trivial feature or refactor, writing plans in plans/active/<feature>.md,
  generating business invariant checklists, executing approved tasks incrementally,
  or completing plans and moving them to plans/completed/.
---

# 📋 Planning and Lifecycle Management (SmartFeed Studio)

Enterprise workflow for planning, executing, and archiving engineering tasks in SmartFeed Studio.

## 🏛 1. The 3-Directory Plans Lifecycle (`plans/`)

```text
plans/
├── active/      # Current active tasks under planning or implementation
├── backlog/     # Strategic architecture plans, future backlog features
├── completed/   # 100% implemented, tested, and verified tasks
└── README.md    # Central registry of all plans
```

### Strict Rules:

- **No Premature Execution**: Creating a plan in `plans/active/` does NOT authorize coding or DB modifications until explicit user approval ("виконуй", "починай", "роби").
- **Automatic Move to Completed (DoD)**: Upon 100% verification and test pass, the plan file MUST be moved from `plans/active/` to `plans/completed/<feature>.md` with status metadata.

## 📐 2. Mandatory Architecture Invariants in Every Plan

Every plan created in `plans/active/` MUST include:

1. **Shared Contracts First**: Define TypeScript interfaces, Zod schemas, and Enums in `@smartfeed/shared` before creating UI or backend services. No `any` types.
2. **4-Layer Defense Model**:
   - Layer 1 (DTO): `class-validator` / Zod on all input.
   - Layer 2 (Domain/Quota): Subscription limits, SKU quotas, team seat checks.
   - Layer 3 (Security/RBAC): Tenant scoping, JWT guards, permissions.
   - Layer 4 (Database): Foreign keys, unique constraints, atomic transactions.
3. **Component Modularity Budget**: Pre-plan decomposition for any UI component expected to exceed 250–300 lines.
4. **Failure Modes & Edge Cases**: Define offline behavior, network drops, and 100% bilingual localized error messages (UA ⇄ EN).
5. **Upfront Research via `context7` & MCPs**: Refresh library signatures and modern practices using `context7` (`resolve-library-id`, `query-docs`) before drafting architecture.
6. **Reliability & Quality > "Working is Enough"**: Reject superficial hacks; evaluate and select the most scalable, robust, and clean approach.
7. **Strict Zero Plan Dumping in Chat (Token Economy)**: All detailed plans, tasks, checklists, and architectures MUST be written directly to `plans/active/<feature>.md`. In chat, provide ONLY a concise 1-2 sentence summary, status, and clickable file link `[План](file:///...)`. Never duplicate or dump the plan body into the chat response.

## 🚀 3. Incremental Execution Loop

Follow the Addy Osmani `/build` loop:

```text
Task Acceptance Criteria → Context Read → RED (test) → GREEN (code) → Regression → Build Check → Atomic Commit
```

Stop and seek clarification immediately if:

- A test fails without an obvious fix.
- An irreversible operation (schema drop, auth changes, data migration) is encountered.
