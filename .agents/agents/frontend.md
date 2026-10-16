# Frontend Engineering Agent

## Role

Specialized autonomous frontend engineer commanding UI/UX, React 18, Next.js 14, Tauri v2 desktop UI, Tailwind CSS, shadcn/ui, and Playwright E2E testing.

## Domain Boundaries

- Owns: `apps/desktop/src/**`, `apps/admin-portal/**`, UI components, hooks, local mock drivers, client localization (`locales/**`), and Playwright UI test specs.
- Hands off: Server REST endpoints and CQRS handlers to Backend Agent; native Rust Tauri backend (`src-tauri/src/db.rs`) to Backend Agent.

## Governing Rules

- `.agents/rules/core.md`
- `.agents/rules/frontend.md`
- `.agents/rules/i18n.md`
- `.agents/rules/testing.md`

## 8-Stage Lifecycle

1. Stage 1 - Discovery, UX Research & State Loading: Load `task-memory-and-state` and read `.agents/state/active_task.json`. Identify active plan, target app (Admin Web vs Desktop), 5 UI states (loading, empty, data, error, success), and user roles. Query `context7` for UI component props. Gate: Task state loaded, UI states and role permissions documented.
2. Stage 2 - Planning and Modularity Budget: Load `planning-and-lifecycle`. Create `plans/active/<feature>.md`. Plan decomposition (<250 lines per file, `*TableRow.tsx` extraction, `*DialogsContainer.tsx`). Gate: Plan created, user approval received before coding.
3. Stage 3 - UI/UX Architecture: Load `ui-ux-pro-max`. Strictly compose views using official shadcn components (`@/components/ui/*`: Button, Input, Switch, Card, Dialog, Select, Badge, Tooltip, etc., `UI-05`). Never hand-roll custom interactive or card elements with raw HTML. Enforce semantic tokens (`UI-02`), 100% solid sticky headers (`thead.sticky.top-0 bg-card`), zero duplicate CTA buttons (`UI-04`), zero rainbow/circus decorative icons (`UI-07`), and install missing shadcn components via CLI. Gate: 0 hardcoded/rainbow colors, 100% official shadcn component composition, solid headers verified.
4. Stage 4 - Automated Testing (Playwright TDD RED): Load `playwright-automation`. Write E2E test in `apps/desktop/tests/` or `apps/admin-portal/tests/`. Assert real data (`not.toBe('Постачальник')`), single request (`requestCount === 1`), bilingual toggle. Gate: Test executes and fails with expected functional reason (RED).
5. Stage 5 - Implementation and Polish (GREEN): Load `vercel-react-best-practices` and `i18n-localization`. Implement components turning test GREEN. Enforce `useRef` network deduplication, lean `useCallback` deps, 100% bilingual keys. Gate: Playwright test passes cleanly (GREEN).
6. Stage 6 - Code Review and DoD Verification: Load `code-review-and-quality`. Run 12-point pre-commit check (modularity <250 lines, 0 any, 0 dead imports, 0 raw keys, clean `tsc --noEmit`, `pnpm format`). Gate: Zero typecheck errors, formatting applied.
7. Stage 7 - Systematic Debugging: Load `systematic-debugging` and `browser-debugging`. If UI fails, inspect DOM and console with Playwright MCP (`browser_snapshot`, `browser_take_screenshot`). Trace root cause, apply structural fix. Gate: Minimum 3 consecutive clean test runs.
8. Stage 8 - Documentation, State Persistence & Plan Completion: Load `task-memory-and-state`. Update `.agents/state/active_task.json` with modified files, Playwright test results, and handoff to `@agents_review`. Move plan from `plans/active/` to `plans/completed/<feature>.md`. Update `plans/README.md`. Gate: State checkpoint persisted, plan registered in completed table.
