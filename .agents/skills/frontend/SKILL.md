---
name: frontend
description: Enterprise full-cycle frontend engineering lifecycle orchestrator for SmartFeed Studio (React 18, Next.js 14, Tauri v2 desktop UI, Tailwind CSS, shadcn/ui, Playwright). Use when building, refactoring, styling, reviewing, or testing pages, components, dialogs, hooks, and local mock drivers in apps/desktop or apps/admin-portal. Do not use for server-side CQRS handlers or cloud database migrations; use backend instead.
rules: [core, frontend, i18n, testing]
---

# Frontend Engineering Master Orchestrator

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/frontend.md`, `.agents/rules/i18n.md`, `.agents/rules/testing.md`.
2. Follow `AGENT-05` reference hierarchy: use golden templates (`.agents/templates/table-numeric-cell.tsx.md`, `success-badge.tsx.md`, `solid-sheet-header.tsx.md`) or `// @golden` files; never copy unverified legacy code.
3. Note all invariant IDs relevant to the task (e.g. `CORE-01`, `CORE-04`, `FE-01` through `FE-07`, `UI-01` through `UI-07`, `I18N-01` through `I18N-06`, `TEST-02` through `TEST-05`).
4. If using any external library or shadcn component, call context7: `resolve-library-id {libraryName, query}` then `query-docs {libraryId, query}`.
5. Do not write or modify UI code until steps 1-4 are complete.

## Inputs

- User task prompt or issue description.
- Target application identifier (`apps/desktop` or `apps/admin-portal`).
- Existing feature files and tests in the target workspace.

## Procedure

1. Stage 1 - Discovery and UX Scope Analysis: identify the target runtime (Desktop Tauri SQLite vs Web Admin Portal), verify user permissions, map the 5 mandatory UI states (loading skeleton, empty state card, data table, localized error, success feedback), and verify bilingual dictionary keys.
2. Stage 2 - Planning and Modularity Budgeting: create implementation plan in `plans/active/<feature>.md`. Enforce component modularity budget (<250 lines per file). Explicitly budget row component extraction (`*TableRow.tsx`), modal extraction (`*DialogsContainer.tsx`), and modal state extraction (`use*PageState.ts`). Await user approval before coding.
3. Stage 3 - UI/UX Architecture and Official shadcn Primitives: strictly compose all UI views using official shadcn primitives (`@/components/ui/*`: Button, Input, Switch, Card, Dialog, Select, Badge, Tooltip, etc., `UI-05`). Never hand-roll custom ad-hoc interactive or container elements with raw HTML. Enforce semantic tokens only (`bg-background`, `bg-card`, `text-foreground`, `border-border`, `bg-primary`, `bg-destructive`, `bg-muted`, `bg-success`). Enforce 100% solid sticky headers (`thead.sticky.top-0 bg-card` or `bg-background`, `UI-01`). Zero rainbow/circus decorative icons (`UI-07`). Hide header CTA if empty state CTA is visible (`UI-04`). Install required shadcn primitives via `npx shadcn@latest add <component> -y`.
4. Stage 4 - Automated Testing (Playwright TDD RED): write Page Object Model E2E test in `apps/desktop/tests/` or `apps/admin-portal/tests/`. Assert real business data (`expect(val).not.toBe('Постачальник')`), single-request network execution (`requestCount === 1`), and dynamic bilingual switching (`UA` ⇄ `EN`). Run test to verify expected functional failure (RED).
5. Stage 5 - Implementation and UI Polish (GREEN): implement components to turn test GREEN. Use `useRef` guards for API calls (`isFetchingRef`, `lastFetchedTokenRef`). Use clean callback deps (never include locale/theme). Localize 100% of strings, tooltips (`title={t('...')}`), and map backend errors via `getErrorMessage(err, t)`.
6. Stage 6 - Code Review and Quality Verification: execute pre-commit verification checklist. Check file lengths (<250 lines), zero dead imports, zero `any` types, zero hardcoded colors. Run `pnpm --filter <app> exec tsc --noEmit` and `pnpm format`.
7. Stage 7 - Systematic Debugging: if UI fails or test breaks, inspect DOM and console with Playwright MCP tools (`browser_snapshot`, `browser_take_screenshot`). Trace root cause backward; apply structural fix.
8. Stage 8 - Documentation and Plan Handoff: move plan to `plans/completed/<feature>.md`. Update `plans/README.md`.

## Outputs

- Modular React components meeting the <250-line budget.
- Playwright E2E tests covering 5 UI states and bilingual parity.
- Bilingual localization keys added to both `locales/uk/*.json` and `locales/en/*.json`.
- Completed plan moved to `plans/completed/`.

## Gate (stop condition)

- Automated gates pass with 0 regressions: `pnpm verify:fast`.
- Targeted Playwright test passes cleanly: `pnpm --filter @smartfeed/desktop exec playwright test <spec>`.
- Static typechecking exits with 0 errors: `pnpm --filter @smartfeed/desktop exec tsc --noEmit`.
- Bilingual parity check passes: `pnpm i18n:check`.
- Automated domain invariants check passes with 0 violations: `pnpm invariants:check`.
- Formatting applied: `pnpm format`.
- Invariant IDs `FE-01` through `FE-07` and `UI-01` through `UI-07` satisfied.

## Never

- Never hand-roll custom interactive or card components when official shadcn components exist (violates `UI-05`).
- Never use decorative rainbow icons (`blue-*`, `amber-*`, `yellow-*`) for form or card icons (violates `UI-07`).
- Never use hardcoded palette colors (`emerald-*`, `green-*`, `blue-*`, etc.); use semantic tokens `text-success`, `bg-success/15 border-success/30` (violates `UI-02`, `UI-03`).
- Never append redundant noun suffixes inside table cells whose headers already name the entity (e.g. `5 фідів`); render clean numeric values or badges only (violates `UI-06`).
- Never use relative imports `../` or `./` across packages (violates `CORE-01`).
- Never write empty catch blocks `catch {}` (violates `CORE-02`).
- Never use `as any` to bypass component prop typing (violates `CORE-03`).
- Never write components longer than 250-300 lines (violates `CORE-04`).
- Never use semi-transparent `backdrop-blur` for sticky table headers (violates `UI-01`).
- Never use arbitrary palette colors like `purple-*` or `violet-*` (violates `UI-02`).
- Never render duplicate CTA buttons in both header and empty state card (violates `UI-04`).
- Never call `browser_subagent` or `open_browser_url` (violates `CORE-09`).

## References

- `references/playwright-testing.md` - read when writing Playwright POM test suites.
- `references/ui-ux-design-system.md` - read when configuring semantic tokens and layout styles.
- `references/checklist.md` - read when performing pre-commit quality audits.
