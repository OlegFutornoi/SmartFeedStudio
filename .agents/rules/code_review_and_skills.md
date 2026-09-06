---
trigger: always_on
description: Mandatory domain skills matrix, code writing best practices, and pre-commit self-review checklist.
---

# 🧠 SmartFeed Studio — Code Review, Error Prevention & Skills Matrix

## 📌 Core Directive: Zero-Defect Engineering & Rigorous Pre-Commit Review

Whenever writing, refactoring, reviewing, or testing code in this monorepo, the agent **MUST ALWAYS** apply the specialized skills matrix to structurally prevent errors at design time, compile time, runtime, and review time.

---

## 🛠 1. Mandatory Domain Skills Matrix by Layer

### ⚙️ A. Backend Architecture & CQRS Services (`services/backend-api`)

| Skill                                                          | Key Rules & Error Prevention Focus                                                                                                                                                                     |
| :------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`nestjs-best-practices`**                                    | Strict CQRS decoupling; zero circular imports; DI singletons; centralized exception filters (`GlobalHttpExceptionFilter`); validation pipes with `whitelist: true`.                                    |
| **`backend-development`**                                      | Production-ready REST endpoints; stateless JWT auth; Argon2id / bcrypt hashing; rate limiting; OWASP Top 10 security mitigations.                                                                      |
| **`backend-patterns`**                                         | Domain-driven structure; repository/service decoupling; Redis caching; async job queues with BullMQ.                                                                                                   |
| **`defense-in-depth-validation`**                              | **4-Layer Defense**: Layer 1: DTO validation (Zod); Layer 2: Domain/Quota validation; Layer 3: Environment/Auth guards (`RequireActiveLicenseGuard`); Layer 4: DB foreign keys, transaction rollbacks. |
| **`sentry-backend-bugs`**                                      | Prevention of unhandled promise rejections, missing null checks on relations (`organization`, `members`), race conditions, stream memory leaks, DB connection starvation.                              |
| **`supabase-postgres-best-practices`** & **`prisma-postgres`** | **100% Foreign Key Indexes**; `timestamptz` for all timestamps; snake_case DB mapping via `@@map()`; no OFFSET pagination; connection pooling via `@prisma/adapter-pg`; zero N+1 queries.              |
| **`subscription-lifecycle`**                                   | Dynamic expiration calculations; grace periods; automatic downgrade fallbacks; quota enforcement across team seats, XML SKUs, AI credits, S3 storage.                                                  |
| **`systematic-debugging`** & **`root-cause-tracing`**          | 4-Phase systematic debugging: 1. Reproduce with minimal test; 2. Trace root cause backward; 3. Implement structural fix; 4. Verify 100% test pass.                                                     |

---

### 💻 B. Frontend & UI/UX Design (`apps/desktop`, `apps/admin-portal`)

| Skill                                          | Key Rules & Error Prevention Focus                                                                                                                                                                                                                                                                                        |
| :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`ui-ux-pro-max`**                            | **Visual Inspection & DoD**: High-contrast hierarchy; micro-interactions; zero text clipping; **100% Solid Sticky Headers & Dialogs**: Sticky table headers (`thead.sticky.top-0`), modal headers/footers, and floating bars **MUST ALWAYS use 100% solid, opaque backgrounds** (`bg-card`, `bg-muted`, `bg-background`). |
| **`vercel-react-best-practices`**              | Eliminate redundant re-renders; no `React.StrictMode` double-mounting in dev; lean `useCallback` dependency arrays; hoist static constants; parallel data fetching (`Promise.all`).                                                                                                                                       |
| **`frontend-design`** & **`beautiful-desing`** | Editorial, high-contrast, premium visual identity; HSL CSS tokens (`--background`, `--primary`, `--card`); modern typography (Inter); refined micro-animations; zero raw browser defaults.                                                                                                                                |
| **`shadcn`**                                   | Consistent component reuse (`card`, `button`, `badge`, `dialog`, `dropdown-menu`, `table`); Tailwind merge via `cn()`; accessible ARIA attributes; localized placeholders/tooltips.                                                                                                                                       |
| **`integrate-backend`**                        | Safe API client integration with TypeScript DTO contracts; in-flight request deduplication with `useRef`; localized error toasts; zero untranslated backend error messages.                                                                                                                                               |

---

### 🧪 C. Testing, Quality Assurance & Anti-Patterns

| Skill                                | Key Rules & Error Prevention Focus                                                                                                                                 |
| :----------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`playwright-best-practices`**      | Page Object Model (POM); resilient `data-testid` selectors; deterministic network idle waits; dedicated bilingual tests (asserting dynamic translation UA ⇄ EN).   |
| **`test-driven-development-tdd`**    | Strict RED → GREEN → REFACTOR cycle. Write API or UI contract assertions first before implementing changes.                                                        |
| **`testing-anti-patterns`**          | **3 Iron Laws**: 1. NEVER test mock behavior; 2. NEVER add test-only methods to production classes; 3. NEVER mock without fully understanding dependencies.        |
| **`condition-based-waiting`**        | Replace arbitrary timeouts/sleeps with condition polling (e.g. `waitForResponse`, `expect.poll`, `waitForSelector`).                                               |
| **`verification-before-completion`** | Always run full static typecheck (`tsc --noEmit`), build shared contracts (`pnpm build:shared`), and execute complete test suites before claiming task completion. |

---

### 🔍 D. Code Review & Engineering Protocol

| Skill                                       | Key Rules & Error Prevention Focus                                                                                                                       |
| :------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`fullstack-code-review`**                 | **Master Orchestrator**: Comprehensive review inspecting CQRS boundaries, React performance, PostgreSQL schema, 100% i18n, and test isolation.           |
| **`requesting-code-review`**                | Dispatch self-review or review checks after completing major tasks to catch issues before they cascade.                                                  |
| **`code-review-reception`**                 | Receive and evaluate feedback with technical rigor; verify against codebase reality; zero performative agreement; test every single fix individually.    |
| **`writing-plans`** & **`executing-plans`** | Create bite-sized, deterministic implementation plans in `plans/<feature>.md` with clear review checkpoints and explicit user approval before execution. |

---

## 🛡 2. Mandatory Pre-Commit Self-Review Checklist

Before reporting completion to the user or preparing any changes:

1. ✅ **Architectural Integrity**: Does backend code respect CQRS boundaries? Does frontend isolate UI state from data fetchers?
2. ✅ **Validation at Every Layer**: Is input validated at DTO boundary, service layer, and database constraints?
3. ✅ **Component Modularity**: Are React components clean and modular (max ~250–300 lines)? Monolithic components (700+ lines) are strictly prohibited.
4. ✅ **Zero Dead Code**: Are there any unused imports (e.g. from `lucide-react`, React hooks, DTOs), unused variables, or dead types?
5. ✅ **100% i18n Localization & Zero Untranslated Keys**: Are all labels, toasts, modals, errors, placeholders, and tooltips/titles (`title={t('...')}`) translated in both `uk` and `en` locale files?
6. ✅ **Zero Leftover Teardown**: Do all automated tests cleanly teardown their data using `cleanDatabase`?
7. ✅ **Static Typecheck Clean**: Does `tsc --noEmit` pass with **0 errors** across all packages?
8. ✅ **Auto-Formatting**: Has `pnpm format` been executed?
9. ✅ **Visual Testing & `ui-ux-pro-max` DoD**: Has the UI been visually tested and verified against all `ui-ux-pro-max` standards before marking the task complete?
10. ✅ **Zero Off-Scheme Palette Colors**: Are all UI components strictly using semantic design tokens (`primary`, `border`, `card`, `muted`, `background`)? Hardcoded palette colors (`purple-*`, `violet-*`, `fuchsia-*`, `pink-*`) are strictly prohibited per [design_system_and_theming.md](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/design_system_and_theming.md).
