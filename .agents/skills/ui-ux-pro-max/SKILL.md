---
name: ui-ux-pro-max
description: UI/UX design intelligence, semantic theming, accessibility, and component layout standards for SmartFeed Studio. Use when creating or styling UI pages, designing data tables, configuring color tokens, enforcing 100% solid sticky headers, removing duplicate action buttons, or installing official shadcn components. Do not use for backend CQRS or database queries; use backend or database skills instead.
rules: [core, frontend, i18n]
---

# UI/UX Design System & Layout Intelligence

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/frontend.md`, `.agents/rules/i18n.md`.
2. Follow `AGENT-05` reference hierarchy: use golden templates (`.agents/templates/solid-sheet-header.tsx.md`, `table-numeric-cell.tsx.md`, `success-badge.tsx.md`) or `// @golden` files.
3. Verify invariant `UI-01`: 100% solid sticky headers (`thead.sticky.top-0 bg-card` or `bg-background`).
4. Verify invariant `UI-02` & `UI-07`: zero off-scheme arbitrary colors (`blue-*`, `amber-*`, `yellow-*`, `orange-*`, `purple-*`); zero rainbow/circus decorative icons; strictly neutral (`text-muted-foreground`) or semantic (`text-primary`) tokens.
5. Verify invariant `UI-04`: zero duplicate CTA buttons between header toolbar and empty state cards.
6. Verify invariant `UI-05`: base UI primitives must be installed via shadcn CLI.
7. If researching component variants, call context7 or shadcn MCP tool.
8. Do not write markup or styles until steps 1-7 are complete.

## Inputs

- Screen or component requirement (data table, dialog modal, filter bar, empty state).
- Theme configuration in `apps/desktop/src/index.css` or `apps/admin-portal/src/app/globals.css`.

## Procedure

1. Step 1 - Semantic Token & Icon Mapping: map all background, foreground, border, and accent colors to semantic CSS variables (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-destructive`, `bg-muted`, `bg-success`). Icons in forms, cards, tabs, and toggles must strictly use `text-muted-foreground` or `text-primary` (`UI-07`). Never introduce raw hex codes or off-scheme palette classes (`blue-*`, `amber-*`, `yellow-*`, `purple-*`).
2. Step 2 - Solid Sticky Header Enforcement: assign `sticky top-0 z-10 bg-card border-b border-border` to all table `<thead>` elements. Translucent backdrops without solid background are strictly prohibited.
3. Step 3 - Empty State and CTA Deduplication: if an empty state card provides an action button (e.g. "Create Supplier"), conditionally hide the toolbar action button (`items.length === 0 && !search ? null : <Button ...>`).
4. Step 4 - Install Official shadcn Primitives: if a required primitive (Dialog, Tooltip, Select, Progress, Tabs, Table) is missing, install it directly: `npx shadcn@latest add <component> -y`. Record the component in `apps/desktop/src/components/ui/COMPONENTS.md`.
5. Step 5 - Compact Typography and Data Density: set table cells to `text-xs px-3 py-2`, headers to `h-9 text-xs font-medium text-muted-foreground`, and apply `tabular-nums` on numerical values.
6. Step 6 - Accessibility and Focus States: ensure all interactive buttons have visible focus rings (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`). Icon-only buttons must have localized `aria-label`.

## Outputs

- Accessible, responsive UI components styled with semantic design tokens.
- Updated component inventory in `COMPONENTS.md` when new shadcn primitives are added.

## Gate (stop condition)

- Automated gates pass with 0 regressions: `pnpm verify:fast`.
- 0 hardcoded palette colors (`emerald-*`, `green-*`, `blue-*`, `amber-*`, `yellow-*`, `orange-*`, `purple-*`, `violet-*`, `fuchsia-*`, `pink-*`) in component files (`UI-02`).
- 0 rainbow decorative icons on form fields, cards, tabs, or toggles (`UI-07`).
- Sticky table and drawer headers maintain 100% solid background (`bg-card`, zero `backdrop-blur-*`, zero `bg-*/<opacity>`).
- Numeric table cells render clean numbers/badges only; zero redundant noun suffixes (`UI-06`).
- 0 duplicate action buttons visible simultaneously.
- Component file is under 250 lines.

## Never

- Never use `${CLAUDE_PLUGIN_ROOT}` or undefined environment variables in script executions.
- Never use `emerald-*`, `green-*`, `blue-*`, `amber-*`, `yellow-*` palette classes; use semantic tokens `text-success`, `bg-success/15 border-success/30`, `text-primary` (violates `UI-02`, `UI-03`).
- Never append noun text suffixes inside table cells whose column headers already name the entity (e.g. `3 фідів`, `10 товарів`); render clean numeric values or badges only (violates `UI-06`).
- Never assign decorative rainbow colors (`blue-*`, `amber-*`, `yellow-*`) to form or card icons (violates `UI-02`, `UI-07`).
- Never use translucent `backdrop-blur` or opacity modifiers (`bg-card/60`) for sticky headers or sheet drawers (violates `UI-01`).
- Never write base UI primitives from scratch instead of using shadcn CLI (violates `UI-05`).
- Never omit `aria-label` on icon-only action buttons.

## References

- `references/quick-reference.md` - read for UX guidelines on forms, navigation, and touch targets.
- `references/pro-rules.md` - read for canonical pre-delivery UX checklists.
