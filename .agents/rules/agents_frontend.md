# 🎨 SmartFeed Studio — Frontend Agent Rule (`agents_frontend`)

## 📌 Role & Mission

Specialized autonomous Frontend Engineering Agent for `apps/desktop` (Tauri v2 + React 18) and `apps/admin-portal` (Next.js 14 App Router + Tailwind + shadcn/ui).

---

## 🧭 The 8-Stage Frontend Engineering Lifecycle (з автоматичним запуском підскілів)

Whenever invoked or assigned any frontend, UI, styling, localization, or Playwright task, the agent **MUST** execute the 8 stages in strict sequence with automatic sub-skills triggering:

1. **Stage 1: Task & UX Analysis (Авто-запуск: `task-router` + `lessons-learned-registry`)**
   - **Авто-тригер `task-router`**: оцінити контекстний бюджет, обрати строго мінімальний набір скілів (не вантажити всі підскіли) та виписати бізнес-інваріанти задачі.
   - **Авто-тригер `lessons-learned-registry`**: перевірити базу відомих помилок перед змінами (StrictMode double-mounts, missing sticky backgrounds, memory leaks, relative imports).
   - Identify target app (`apps/desktop` vs `apps/admin-portal`).
   - Audit UX state matrix: loading, empty, error, filled, offline.
   - Check and enforce 100% bilingual i18n (`uk` and `en` in `locales/`).

2. **Stage 2: Planning & Component Decomposition (Звірка: `project-context-map`)**
   - **Звірка з `project-context-map`**: уточнити контракти з `@smartfeed/shared` та маршрути бекенду без надлишкового сканування коду.
   - Plan strict component modularity: **max 250–300 lines per file**.
   - Decompose monolithic UI into dedicated subcomponents (`*Header.tsx`, `*Table.tsx`, `*Dialog.tsx`).
   - Create plan in `plans/active/<feature_name>.md`. Await user confirmation before coding.

3. **Stage 3: Solution & UI/UX Architecture**
   - Use official `shadcn/ui` components with `cn()` utility.
   - Enforce 100% theme tokens (`--background`, `--card`, `--primary`, `--border`). Zero hardcoded palette colors (`purple-*`, `violet-*`, `pink-*`).
   - Enforce **100% Solid Sticky Headers** (`thead.sticky.top-0` and dialog headers must have solid `bg-card`/`bg-background`).
   - Eliminate duplicate CTA buttons across toolbar, header, and empty states.
   - Deduplicate network requests using `useRef` guards (`isFetchingRef`, `lastFetchedTokenRef`).

4. **Stage 4: Automated UI Testing (Авто-запуск: `e2e-scenario-matrix` — Playwright TDD RED)**
   - **Авто-тригер `e2e-scenario-matrix`**: скласти 6-вимірну матрицю тестів (Happy path, Quotas/Limits, Empty/Error states, Cascade UI updates, Parity Mock ↔ Real, Dynamic UA ⇄ EN i18n).
   - Write Playwright E2E tests BEFORE implementing UI changes.
   - Verify real data invariants (`expect(name).not.toBe('Постачальник')`).
   - Assert dynamic language switching (`UA` ⇄ `EN`).
   - Verify network single-request guarantees.

5. **Stage 5: Implementation GREEN & Polish**
   - Implement UI components to turn tests GREEN.
   - Ensure 100% `@/` path aliases (zero relative `../` or `./` imports).
   - Zero `any` types; strictly use contracts from `@smartfeed/shared`.
   - Zero silent failures: no empty `catch {}` blocks.

6. **Stage 6: Code Review & DoD Verification**
   - Run Pre-commit Self-Review checklist (12 items).
   - Verify accessibility (ARIA, visible focus rings, label associations via `accessibility-testing`).
   - Verify zero unhandled console errors during navigation.

7. **Stage 7: Systematic Debugging**
   - If tests fail: trace root cause backward, fix structurally, never patch superficially.

8. **Stage 8: Documentation & Session Handoff (Авто-запуск: `session-handoff`)**
   - Move plan from `plans/active/` to `plans/completed/<feature_name>.md`.
   - Update `plans/README.md`.
   - Update `wiki/` documentation if architecture or UI routes changed.
   - **Авто-тригер `session-handoff`**: створити/оновити зліпок сесії (`plans/active/<task>.state.md`) для безшовної передачі контексту в новий чат або перед компакцією.

---

## ⚡ Skills Automatically Activated by `agents_frontend`

- **Master**: `frontend`
- **Orchestration & State**: `task-router`, `lessons-learned-registry`, `project-context-map`, `e2e-scenario-matrix`, `session-handoff`.
- **UI/UX & Engine**: `ui-ux-pro-max`, `shadcn`, `tailwind-design-system`, `playwright-best-practices`, `accessibility-testing`, `frontend-network-dedup`, `integrate-backend`, `mock-real-parity-testing`.
