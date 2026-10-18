---
trigger: glob
globs: ['apps/desktop/src/**', 'apps/admin-portal/**']
description: UI design system, semantic tokens, shadcn primitives, micro-typography, accessible controls, and layout invariants for SmartFeed Studio.
---

# UI Design System & Component Invariants

## UI-01: 100% Solid Sticky Headers

- Sticky table headers (`thead.sticky.top-0`) and modal/drawer headers/footers must have solid opaque backgrounds (`bg-card`, `bg-muted`, `bg-background`).
- Translucent backgrounds (`bg-card/60`, `bg-background/80`) and `backdrop-blur-*` are strictly prohibited.
- Reason: Translucent headers bleed underlying scrolling content through the header, destroying legibility.

## UI-02: Zero Off-Scheme Palette Colors & Rainbow Elements

- Use strictly semantic tokens: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-destructive`, `bg-muted`, `bg-success`.
- Arbitrary palette colors (`blue-*`, `green-*`, `amber-*`, `yellow-*`, `purple-*`, etc.) are strictly prohibited across components, cards, badges, borders, and icons.
- Reason: Hardcoded palette colors break dark/light theming, violate brand identity, and create visual clutter.

## UI-03: Semantic Success Status Badge

- Success status badges and pills must use the semantic `--success` token (`bg-success/15 text-success border-success/30`), mapping to emerald/green without ad-hoc palette overrides.
- Never use `bg-emerald-*`, `text-emerald-*`, `bg-green-*`, or `text-green-*`.
- Reason: Aligns semantic theme switching with standardized success state assertions.

## UI-04: Zero Duplicate Action / CTA Buttons

- When an empty state card provides a CTA button, hide the toolbar CTA (`items.length === 0 && !search ? null : <Button ...>`).
- Never display two identical action buttons simultaneously on one view.
- Reason: Duplicate action buttons confuse users and compromise visual hierarchy.

## UI-05: Strict Official shadcn Component Architecture (Zero Custom Re-invention)

- Interfaces across Desktop and Web must be constructed strictly using official shadcn primitives (`@/components/ui/*`: `Button`, `Card`, `Tabs`, `Dialog`, `Sheet`, `Select`, `Switch`, `Badge`, `ScrollArea`, `Label`, `DropdownMenu`, `Table`, `Input`, `Tooltip`).
- Inventing custom controls, custom buttons, raw `<label>` tags, or hand-rolled primitives when official shadcn components exist is strictly prohibited.
- Install missing primitives via CLI: `npx shadcn@latest add <component> -y` and record them in `apps/desktop/src/components/ui/COMPONENTS.md`.
- Reason: Official shadcn primitives guarantee accessibility (ARIA), keyboard navigation, theming, and responsive design.

## UI-06: Compact Typography, Tabular Numbers & Clean Metrics

- DataTable cells use `text-xs px-3 py-2`, `h-9` headers, and `tabular-nums` for counters, IDs, and metrics.
- In numeric cells where the column header names the entity (e.g. "Feeds", "Products"), render clean numeric values/badges (`{count}`) without noun suffixes (`3 фідів`, `10 товарів`).
- Flex text containers must include `min-w-0` to allow truncation without column overflow.
- Reason: Compact density and clean metrics maximize data visibility and prevent alignment breaks.

## UI-07: Strict Icon & Control Semantic Styling (Zero Rainbow Icons)

- Icons in forms, cards, tabs, and toggles must use neutral semantic tokens: `text-muted-foreground` by default, `text-foreground` on active/focused states, or brand `text-primary`.
- Rainbow icon colors (`text-blue-500`, `text-amber-500`, `text-emerald-500`, etc.) for visual differentiation are strictly prohibited.
- Status colors (`text-destructive`, `text-success`) are reserved exclusively for functional outcomes (sync error, sync success).
- Reason: Arbitrary decorative icon colors degrade visual hierarchy and look unprofessional.

## UI-08: Form Input Hygiene & Unblocked Paste

- Never block paste operations (`onPaste` + `preventDefault()`); allow clipboard pasting for feed URLs, API keys, regex filters, and tokens across all inputs.
- Apply `spellCheck={false}` to technical, code, URL, email, SKU, supplier key, and username fields.
- Non-auth inputs must declare `autocomplete="off"` to prevent password managers from obscuring dropdowns.
- Checkboxes and radios must share a single hit target with their labels; submit buttons remain enabled until request starts with an inline spinner during processing.
- Reason: Blocking paste or leaving spellcheck active on code/URL inputs frustrates users and impedes data entry.

## UI-09: Micro-Typography, True Ellipses & Widow Prevention

- Use the true ellipsis character `…` (`&hellip;`), never three periods `...`, across all UI strings, placeholders, and loading states (`"Loading…"`, `"Saving…"`).
- Headlines, card titles, and dialog headers must apply `text-wrap: balance` or `text-pretty` to prevent orphan trailing words.
- Use non-breaking spaces (`&nbsp;`) before units, currencies, and keyboard shortcuts (`10&nbsp;MB`, `100&nbsp;SKU`, `⌘&nbsp;K`).
- Use curly quotes `“` `”` for prose copy rather than straight typewriter quotes `"`.
- Reason: Typographic precision eliminates layout jitter and elevates interface polish.

## UI-10: Accessible Interactive Primitives & Focus Visibility

- Use `<button>` for actions and state changes; use `<a>` or Next.js `<Link>` for navigation. Using `<div onClick>` or `<span onClick>` without keyboard semantics is strictly prohibited.
- Never apply `outline-none` without visible focus replacement (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`). Prefer `:focus-visible` over `:focus`.
- Heading anchors and scroll targets must include `scroll-margin-top` to prevent sticky headers from obscuring content.
- Reason: Semantic primitives guarantee keyboard navigation, screen reader support, and WCAG 2.2 AA compliance.

## UI-11: Surface Depth Hierarchy & Anti-Border Clutter

- Establish visual hierarchy through subtle tonal elevation rather than outlining every container with heavy borders.
- Three standard elevation layers: Canvas base (`bg-background`), secondary panel / card surface (`bg-card` or `bg-muted/30`), popovers and menus (`bg-popover border border-border/50 shadow-md`).
- Avoid nested boxed containers inside shadcn `Card` or `Dialog` elements. Use divider lines or subtle background shifts (`bg-muted/20`) instead of wrapping child groups in redundant `border border-border` boxes.
- Hairline borders: when borders are required, prefer subtle contrast (`border-border/40` to `border-border/60`) over harsh opaque boundaries.
- Reason: Over-bordered layouts create visual noise, flatten contrast, and typify low-quality AI-generated UI slop.

## UI-12: Desktop High-Density Geometry & Hover-Revealed Row Actions

- Desktop UI controls must use compact geometry: input/button radius 4px (`rounded-md` / `rounded-sm`), card/dialog radius 6-8px (`rounded-lg`). Oversized mobile radii (`rounded-2xl`, `rounded-3xl`) on desktop components are strictly prohibited.
- Table rows must maintain compact `h-9` or `h-10` heights, using `tabular-nums` for numeric cells, codes, and IDs.
- Secondary and tertiary actions in shadcn `Table` rows or list items must be subtle or revealed on hover (`opacity-70 group-hover:opacity-100` or `invisible group-hover:visible` with `focus-within:visible`), keeping tables scannable and free of icon walls.
- Reason: Enterprise power users prioritize data density and scannability over oversized touch targets and visual clutter.

## UI-13: Anti-AI-Slop & Singular Boldness Doctrine

- Each screen or dialog must possess exactly ONE primary visual focal point (one primary CTA button or hero metric); all secondary elements must be visually subordinate (`variant="outline"` or `variant="ghost"`).
- Strict ban on AI-slop tropes: zero uppercase letter-spaced eyebrow badges (`tracking-widest uppercase` tags above titles), zero multi-color gradient text (`bg-gradient-to-r text-transparent`), zero decorative emojis in cards, and zero repetitive 3-column marketing card grids for functional data tables.
- Chanel restraint doctrine: remove decorative containers, gratuitous badges, and colored pills before finalizing a view; express hierarchy through clean typography, whitespace, and subtle interactive states.
- Enhance official shadcn primitives (`Card`, `Badge`, `Button`, `Dialog`, `Table`) with precise spacing and micro-interactions rather than decorative visual gimmicks.
- Reason: Generic SaaS marketing templates degrade enterprise desktop tooling into noisy, amateurish interfaces.
