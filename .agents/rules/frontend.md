---
trigger: glob
globs: ['apps/desktop/src/**', 'apps/admin-portal/**']
description: Frontend architecture, React 18, Next.js 14, Tauri v2, design system, and UI invariants for SmartFeed Studio.
---

# Frontend Engineering Invariants

## FE-01: Zero Duplicate API Calls via `useRef`

- Context providers and page components that fetch remote data must guard against concurrent or duplicate requests using `useRef`.
- Track in-flight state with `isFetchingRef` and completed tokens with `lastFetchedTokenRef`.
- Reason: React state updates are asynchronous; without ref guards, concurrent component mounts fire identical duplicate API calls.

## FE-02: No `React.StrictMode` Double Mounts

- In development, React 18 StrictMode mounts and remounts every component, doubling network requests and IPC command executions.
- Keep `reactStrictMode: false` in `apps/admin-portal/next.config.mjs`.
- Never wrap `<App />` in `<React.StrictMode>` in `apps/desktop/src/main.tsx`.
- Reason: Eliminates duplicate network traffic, phantom double socket connections, and false telemetry alarms.

## FE-03: Zero Redundant Post-Auth `/auth/me` Calls

- Endpoints `/auth/login` and `/auth/register` return the full user profile along with tokens.
- Never trigger a cascaded `refreshProfile()` immediately after successful login or registration.
- Profile hydration from `/auth/me` occurs strictly on initial application boot when an existing token is recovered from storage.
- Reason: Cascaded profile fetches delay user dashboard rendering and add unnecessary server load.

## FE-04: Lean `useCallback` Dependency Arrays

- Never include UI-only state (`locale`, `theme`, `isUk`) in data-fetching `useCallback` dependency arrays unless the HTTP query parameter requires localization.
- Separate translation hooks from data-fetching hooks.
- Reason: Adding translation flags to data-fetching dependencies triggers full remote re-fetches whenever the user changes interface language.

## FE-05: Mandatory Table Row Extraction

- Any DataTable with >3 columns or interactive cells (actions, switches, badges) must extract row rendering into `*TableRow.tsx` (<150 lines).
- Inlining all cell JSX inside the main table `.map()` is strictly prohibited.
- Reason: Inlined row cells inflate table files beyond the 250-line limit and cause all rows to re-render when a single row state changes.

## FE-06: List Page Modularity & Dialogs Container

- List pages must extract all modal dialogs into `*DialogsContainer.tsx` (<180 lines) and dialog open/close state into `use*PageState.ts` (<120 lines).
- The main page orchestrator file must remain under 180 lines.
- Reason: Bundling 5+ modal states into the main page file creates monolithic God-components that exceed working memory.

## FE-07: Session Storage Decoupling

- Context providers must encapsulate `localStorage` reads/writes into dedicated storage modules (e.g. `authSessionStorage.ts`).
- Never perform raw direct `localStorage` calls inside React UI rendering components.
- Reason: Scattered raw storage calls cause race conditions during token refresh and break unit testing in environments without DOM storage.

## FE-08: Mock ⇄ Real Data Parity

- Local browser `mockDatabaseDriver`, native Tauri SQLite, and cloud NestJS API must return identical data relations (`supplierName`), cascade deletes, and quota calculations.
- Never render column header names as data values in mock mode.
- Reason: Logic divergence between mock and real drivers hides bugs until production deployment.

## UI-01: 100% Solid Sticky Headers

- Sticky table headers (`thead.sticky.top-0`) and modal headers/footers must have solid opaque backgrounds (`bg-card`, `bg-muted`, `bg-background`).
- Translucent `backdrop-blur` without an opaque background is strictly prohibited.
- Reason: Translucent sticky headers bleed underlying table text through the header during scrolling, destroying legibility.

## UI-02: Zero Off-Scheme Palette Colors

- Strictly use semantic design tokens: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-destructive`, `bg-muted`, `bg-success`.
- Hardcoded arbitrary colors (`purple-*`, `violet-*`, `fuchsia-*`, `pink-*`) are strictly prohibited.
- Reason: Hardcoded palette colors break dark/light mode switching and create visually fragmented interfaces.

## UI-03: Semantic Success Status Badge

- Success status badges and pills must use the semantic `--success` token (e.g. `bg-success/15 text-success border-success/30`), mapping to emerald/green without ad-hoc palette overrides.
- Reason: Resolves the conflict between semantic theming and green success state assertions.

## UI-04: Zero Duplicate Action / CTA Buttons

- If an empty state card provides a CTA button (e.g. "Add Supplier"), the header/toolbar CTA must be hidden (`items.length === 0 && !search ? null : <Button ...>`).
- Never present two identical action buttons simultaneously on the same screen.
- Reason: Duplicate action buttons confuse users and violate visual hierarchy principles.

## UI-05: Mandatory Official shadcn Installation

- Base UI primitives (dialog, button, select, tabs, progress, dropdown) must be installed via official CLI (`npx shadcn@latest add <component> -y`).
- Never hand-roll base UI primitives from scratch.
- Maintain an up-to-date registry of installed components in `apps/desktop/src/components/ui/COMPONENTS.md`.
- Reason: Official shadcn components provide tested accessibility, ARIA attributes, keyboard navigation, and theme harmony.

## UI-06: Compact Typography and Tabular Numbers

- DataTable cells use `text-xs` (`px-3 py-2`), `h-9` headers, and `tabular-nums` for counters, IDs, and financial values.
- Flex children containing text must use `min-w-0` to allow truncation without overflowing table columns.
- Reason: Data density is essential for catalog management; default large typography limits visible products per screen.
