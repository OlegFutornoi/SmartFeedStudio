---
name: ui-ux-pro-max
description: UI/UX design intelligence, semantic theming, accessibility, and component layout standards for SmartFeed Studio. Use when creating or styling UI pages, designing data tables, configuring color tokens, enforcing 100% solid sticky headers, removing duplicate action buttons, or installing official shadcn components. Do not use for backend CQRS or database queries; use backend or database skills instead.
rules: [core, frontend, i18n]
---

# UI/UX Design System & Layout Intelligence

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/frontend.md`, `.agents/rules/i18n.md`.
2. Verify invariant `UI-01`: 100% solid sticky headers (`thead.sticky.top-0 bg-card` or `bg-background`).
3. Verify invariant `UI-02`: zero off-scheme arbitrary colors; strictly semantic tokens.
4. Verify invariant `UI-04`: zero duplicate CTA buttons between header toolbar and empty state cards.
5. Verify invariant `UI-05`: base UI primitives must be installed via shadcn CLI.
6. If researching component variants, call context7 or shadcn MCP tool.
7. Do not write markup or styles until steps 1-6 are complete.

## Inputs

- Screen or component requirement (data table, dialog modal, filter bar, empty state).
- Theme configuration in `apps/desktop/src/index.css` or `apps/admin-portal/src/app/globals.css`.

## Procedure

1. Step 1 - Semantic Token Mapping: map all background, foreground, border, and accent colors to semantic CSS variables (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-destructive`, `bg-muted`, `bg-success`). Never introduce raw hex codes or off-scheme classes.
2. Step 2 - Solid Sticky Header Enforcement: assign `sticky top-0 z-10 bg-card border-b border-border` to all table `<thead>` elements. Translucent backdrops without solid background are strictly prohibited.
3. Step 3 - Empty State and CTA Deduplication: if an empty state card provides an action button (e.g. "Create Supplier"), conditionally hide the toolbar action button (`items.length === 0 && !search ? null : <Button ...>`).
4. Step 4 - Install Official shadcn Primitives: if a required primitive (Dialog, Tooltip, Select, Progress, Tabs, Table) is missing, install it directly: `npx shadcn@latest add <component> -y`. Record the component in `apps/desktop/src/components/ui/COMPONENTS.md`.
5. Step 5 - Compact Typography and Data Density: set table cells to `text-xs px-3 py-2`, headers to `h-9 text-xs font-medium text-muted-foreground`, and apply `tabular-nums` on numerical values.
6. Step 6 - Accessibility and Focus States: ensure all interactive buttons have visible focus rings (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`). Icon-only buttons must have localized `aria-label`.

## Outputs

- Accessible, responsive UI components styled with semantic design tokens.
- Updated component inventory in `COMPONENTS.md` when new shadcn primitives are added.

## Gate (stop condition)

- 0 hardcoded palette colors (`purple-*`, `violet-*`, `fuchsia-*`, `pink-*`) in component files.
- Sticky table headers maintain 100% solid background during scrolling.
- 0 duplicate action buttons visible simultaneously.
- Component file is under 250 lines.

## Never

- Never use `${CLAUDE_PLUGIN_ROOT}` or undefined environment variables in script executions.
- Never use translucent `backdrop-blur` without an opaque background for sticky table headers (violates `UI-01`).
- Never write base UI primitives from scratch instead of using shadcn CLI (violates `UI-05`).
- Never omit `aria-label` on icon-only action buttons.

## References

- `references/quick-reference.md` - read for UX guidelines on forms, navigation, and touch targets.
- `references/pro-rules.md` - read for canonical pre-delivery UX checklists.
