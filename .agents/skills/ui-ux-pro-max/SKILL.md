---
name: ui-ux-pro-max
description: UI/UX design intelligence, semantic theming, accessibility, and component layout standards for SmartFeed Studio. Use when creating or styling UI pages, designing data tables, configuring color tokens, enforcing 100% solid sticky headers, removing duplicate action buttons, or installing official shadcn components. Do not use for backend CQRS or database queries; use backend or database skills instead.
rules: [core, ui, i18n]
---

# UI/UX Design System & Layout Intelligence

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/ui.md`, `.agents/rules/i18n.md`.
2. Follow `AGENT-05` reference hierarchy: use golden templates (`.agents/templates/solid-sheet-header.tsx.md`, `table-numeric-cell.tsx.md`, `success-badge.tsx.md`) or `// @golden` files.
3. Verify invariant `UI-01`: 100% solid sticky headers (`thead.sticky.top-0 bg-card` or `bg-background`).
4. Verify invariant `UI-02` & `UI-07`: zero off-scheme arbitrary colors (`blue-*`, `amber-*`, `yellow-*`, `orange-*`, `purple-*`); zero rainbow/circus decorative icons; strictly neutral (`text-muted-foreground`) or semantic (`text-primary`) tokens.
5. Verify invariant `UI-04`: zero duplicate CTA buttons between header toolbar and empty state cards.
6. Verify invariant `UI-05`: base UI primitives must be installed via shadcn CLI.
7. Verify invariants `UI-08`, `UI-09`, `UI-10`: unblocked paste across inputs, `spellCheck={false}` on technical/URL/SKU fields, true ellipsis `…`, balanced headlines (`text-wrap: balance`), semantic `<button>`/`<Link>`, and visible focus rings (`:focus-visible:ring-*`).
8. Verify invariants `UI-11`, `UI-12`, `UI-13`: surface depth hierarchy over heavy borders; desktop high-density geometry (radius 4-8px, row height `h-9`/`h-10`, hover-revealed row actions); singular boldness doctrine (one focal point per screen, zero AI-slop uppercase eyebrow tags, zero gradient text, zero repetitive 3-card marketing grids).
9. If researching component variants, call context7 or shadcn MCP tool.
10. Do not write markup or styles until steps 1-9 are complete.

## Inputs

- Screen or component requirement (data table, dialog modal, filter bar, empty state).
- Theme configuration in `apps/desktop/src/index.css` or `apps/admin-portal/src/app/globals.css`.

## Procedure

1. Step 1 - Semantic Token & Icon Mapping: map all background, foreground, border, and accent colors to semantic CSS variables (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-destructive`, `bg-muted`, `bg-success`). Icons in forms, cards, tabs, and toggles must strictly use `text-muted-foreground` or `text-primary` (`UI-07`). Never introduce raw hex codes or off-scheme palette classes (`blue-*`, `amber-*`, `yellow-*`, `purple-*`).
2. Step 2 - Solid Sticky Header Enforcement: assign `sticky top-0 z-10 bg-card border-b border-border` to all table `<thead>` elements. Translucent backdrops without solid background are strictly prohibited.
3. Step 3 - Empty State and CTA Deduplication: if an empty state card provides an action button (e.g. "Create Supplier"), conditionally hide the toolbar action button (`items.length === 0 && !search ? null : <Button ...>`).
4. Step 4 - Install Official shadcn Primitives: if a required primitive (Dialog, Tooltip, Select, Progress, Tabs, Table) is missing, install it directly: `npx shadcn@latest add <component> -y`. Record the component in `apps/desktop/src/components/ui/COMPONENTS.md`.
5. Step 5 - Compact Typography and Data Density: set table cells to `text-xs px-3 py-2`, headers to `h-9 text-xs font-medium text-muted-foreground`, and apply `tabular-nums` on numerical values.
6. Step 6 - Accessibility and Focus States: ensure all interactive buttons have visible focus rings (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`). Icon-only buttons must have localized `aria-label`. Heading anchors must include `scroll-margin-top` (`UI-10`).
7. Step 7 - Form Hygiene & Micro-Typography: ensure inputs never block paste (`UI-08`), set `spellCheck={false}` on technical/URL/SKU inputs, set `autocomplete="off"` on non-auth fields, use true ellipsis `…` in loading states, and balance headings with `text-wrap: balance` (`UI-09`). Use semantic `<button>` for actions and `<Link>` for navigation (`UI-10`).
8. Step 8 - Surface Depth & Hairline Borders (`UI-11`): establish visual hierarchy through tonal elevation (`bg-background` canvas, `bg-card` / `bg-muted/30` panel, `bg-popover` menus) and hairline borders (`border-border/40` to `border-border/60`). Never wrap nested child groups inside shadcn `Card` or `Dialog` in redundant boxed borders.
9. Step 9 - Desktop Density & Hover Actions (`UI-12`): maintain desktop radius scale (`rounded-md` for controls, `rounded-lg` for cards; no `rounded-2xl` on desktop). In shadcn `Table` rows, maintain `h-9`/`h-10` heights and reveal secondary row actions on hover (`opacity-70 group-hover:opacity-100` or `invisible group-hover:visible focus-within:visible`).
10. Step 10 - Singular Boldness & Anti-Slop Discipline (`UI-13`): enforce single primary focal point/CTA per view. Eliminate uppercase letter-spaced eyebrow tags, multi-color gradient headlines, and decorative emoji chips. Apply Chanel restraint.

## Outputs

- Accessible, responsive UI components styled with semantic design tokens.
- Updated component inventory in `COMPONENTS.md` when new shadcn primitives are added.

## Gate (stop condition)

- Automated gates pass with 0 regressions: `pnpm verify:fast`.
- 0 hardcoded palette colors (`emerald-*`, `green-*`, `blue-*`, `amber-*`, `yellow-*`, `orange-*`, `purple-*`, `violet-*`, `fuchsia-*`, `pink-*`) in component files (`UI-02`).
- 0 rainbow decorative icons on form fields, cards, tabs, or toggles (`UI-07`).
- Sticky table and drawer headers maintain 100% solid background (`bg-card`, zero `backdrop-blur-*`, zero `bg-*/<opacity>`).
- Numeric table cells render clean numbers/badges only; zero redundant noun suffixes (`UI-06`).
- Zero paste-blocking handlers across inputs and textareas (`UI-08`).
- True ellipsis glyph `…` used instead of triple dots `...` in all loading/ellipsis copy (`UI-09`).
- Zero `outline-none` without replacement; all interactive controls provide visible `:focus-visible` focus ring (`UI-10`).
- Zero nested redundant borders inside Cards or Dialogs (`UI-11`).
- Zero oversized mobile radii (`rounded-2xl`, `rounded-3xl`) on desktop components (`UI-12`).
- Zero AI-slop uppercase letter-spaced eyebrows or gradient text headlines (`UI-13`).
- 0 duplicate action buttons visible simultaneously.
- Component file is under 250 lines.

## Never

- Never use `${CLAUDE_PLUGIN_ROOT}` or undefined environment variables in script executions.
- Never use `emerald-*`, `green-*`, `blue-*`, `amber-*`, `yellow-*` palette classes; use semantic tokens `text-success`, `bg-success/15 border-success/30`, `text-primary` (violates `UI-02`, `UI-03`).
- Never append noun text suffixes inside table cells whose column headers already name the entity (e.g. `3 фідів`, `10 товарів`); render clean numeric values or badges only (violates `UI-06`).
- Never assign decorative rainbow colors (`blue-*`, `amber-*`, `yellow-*`) to form or card icons (violates `UI-02`, `UI-07`).
- Never use translucent `backdrop-blur` or opacity modifiers (`bg-card/60`) for sticky headers or sheet drawers (violates `UI-01`).
- Never write base UI primitives from scratch instead of using shadcn CLI (violates `UI-05`).
- Never block paste operations on inputs or textareas (violates `UI-08`).
- Never use triple periods `...` in UI strings or loading states; use true ellipsis `…` (violates `UI-09`).
- Never use `<div onClick>` or `<span onClick>` for actions without semantic `<button>` or keyboard handlers (violates `UI-10`).
- Never use `outline-none` without visible focus replacement (violates `UI-10`).
- Never wrap inner groups inside shadcn `Card` or `Dialog` in redundant `border border-border` boxes (violates `UI-11`).
- Never use `rounded-2xl` or `rounded-3xl` for desktop controls or cards (violates `UI-12`).
- Never use uppercase letter-spaced eyebrow tags or multi-color gradient text on headlines (violates `UI-13`).
- Never omit `aria-label` on icon-only action buttons.

## References

- `references/quick-reference.md` - read for UX guidelines on forms, navigation, and touch targets.
- `references/pro-rules.md` - read for canonical pre-delivery UX checklists.
