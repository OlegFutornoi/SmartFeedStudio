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

## FE-09: Client-Level In-Flight Request Deduplication

- API clients (`fetchWithAuth`, `BaseApiClient`) across Desktop and Web must deduplicate concurrent in-flight GET requests via an `inFlightRequests Map`.
- If multiple components or hooks trigger the same GET endpoint simultaneously, they must share the identical in-flight Promise instead of dispatching redundant HTTP requests.
- Reason: Component-level ref guards do not prevent duplicate requests dispatched across separate unshared component subtrees mounted in parallel.

## FE-10: Zero Duplicate Context Data Re-Fetching

- Child pages and nested views must consume shared global entities (user profile, license, quotas, navigation) from their respective Context hooks (`useAuth`, `useLicense`, `useQuotas`, `useNavigation`) rather than re-fetching the underlying API endpoints directly.
- Direct endpoint calls (e.g. `getMyLicense()` inside `usePlansPageData`) when a parent provider already holds the canonical state are strictly prohibited.
- Reason: Redundant re-fetching triggers network waterfalls, causes visual flicker, and increases backend load on page navigation.

## FE-11: Aggregated Startup Bootstrap

- On application boot or hard reload, avoid firing 5+ fragmented HTTP requests from isolated context providers.
- Use an aggregated bootstrap payload (`/api/bootstrap` or `/api/admin/dashboard/overview`) where possible to hydrate multiple contexts in a single round-trip.
- Reason: Independent provider mounting cascades network requests, stalls First Contentful Paint, and overloads connection pools.

## FE-12: Zero Raw Fetch Bypasses in Services

- All frontend services, utilities, and helper modules making HTTP requests to the backend must strictly use `fetchWithAuth` or `BaseApiClient`.
- Raw direct `fetch()` calls to application API endpoints are strictly prohibited.
- Reason: Raw `fetch()` bypasses client-side in-flight promise deduplication (`FE-09`), automatic 401 token refreshing, error normalization, and authorization header management.

## FE-13: Scoped Domain DataSync Subscriptions

- Hooks and components utilizing `useDataSync` must specify strictly the narrow domain keys they react to (e.g. `['settings']`, `['suppliers']`).
- Subscribing to the catch-all `'all'` domain is prohibited unless the subscriber is a root catalog/quota reconciler.
- Reason: Catch-all `'all'` subscriptions trigger avalanche re-fetch cascades whenever any unrelated background task or sync event completes.

## FE-14: In-Memory TTL & Navigation Cache for Reference Data

- Static and semi-static reference data (tariff plans, page-guides, system profiles, storage settings) must maintain an in-memory TTL cache (e.g. 60–300s) on the client.
- Switching between tabs or navigating through sidebar menu items must resolve instantaneously from memory without dispatching duplicate HTTP requests.
- Reason: Uncached menu navigation floods the network with redundant GET calls, degrades user responsiveness, and multiplies backend load.

## UI-01: 100% Solid Sticky Headers

- Sticky table headers (`thead.sticky.top-0`) and modal/drawer headers/footers must have solid opaque backgrounds (`bg-card`, `bg-muted`, `bg-background`).
- Translucent backgrounds (`bg-card/60`, `bg-background/80`) and `backdrop-blur-*` on headers/footers are strictly prohibited.
- Reason: Translucent sticky headers bleed underlying table text through the header during scrolling, destroying legibility.

## UI-02: Zero Off-Scheme Palette Colors & Rainbow Elements

- Strictly use semantic design tokens: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-destructive`, `bg-muted`, `bg-success`.
- Hardcoded arbitrary palette colors (`emerald-*`, `green-*`, `blue-*`, `amber-*`, `yellow-*`, `orange-*`, `purple-*`, `violet-*`, `fuchsia-*`, `pink-*`, `sky-*`, `indigo-*`, `teal-*`, `cyan-*`) are strictly prohibited across components, cards, badges, borders, and icons.
- Reason: Hardcoded palette colors break dark/light mode switching, violate the brand identity, and create visually fragmented "circus" interfaces.

## UI-03: Semantic Success Status Badge

- Success status badges and pills must use the semantic `--success` token (e.g. `bg-success/15 text-success border-success/30`), mapping to emerald/green without ad-hoc palette overrides.
- Never use `bg-emerald-*`, `text-emerald-*`, `bg-green-*`, or `text-green-*`.
- Reason: Resolves the conflict between semantic theming and green success state assertions.

## UI-04: Zero Duplicate Action / CTA Buttons

- If an empty state card provides a CTA button (e.g. "Add Supplier"), the header/toolbar CTA must be hidden (`items.length === 0 && !search ? null : <Button ...>`).
- Never present two identical action buttons simultaneously on the same screen.
- Reason: Duplicate action buttons confuse users and violate visual hierarchy principles.

## UI-05: Strict Official shadcn Component Architecture (Zero Custom Re-invention)

- User interfaces across Desktop and Web MUST be strictly constructed using official, ready-made, accessible, and responsive shadcn primitives (`@/components/ui/*`: `Button`, `Card`, `Tabs`, `Dialog`, `Sheet`, `Select`, `Switch`, `Badge`, `ScrollArea`, `Label`, `DropdownMenu`, `Table`, `Input`, `Tooltip`).
- Inventing custom ad-hoc controls, custom styled buttons, raw `<label>` tags, custom popups, or hand-rolled primitives when ready-made responsive shadcn components already exist is STRICTLY PROHIBITED.
- If a required primitive is missing from `@/components/ui/`, install it directly via official CLI (`npx shadcn@latest add <component> -y`) instead of inventing ad-hoc HTML/CSS.
- Maintain an up-to-date registry of installed components in `apps/desktop/src/components/ui/COMPONENTS.md`.
- Reason: Official shadcn primitives guarantee battle-tested accessibility (ARIA), keyboard navigation, seamless dark/light mode theming, and responsive design, eliminating visual defects and layout bugs.

## UI-06: Compact Typography, Tabular Numbers & Clean Metrics

- DataTable cells use `text-xs` (`px-3 py-2`), `h-9` headers, and `tabular-nums` for counters, IDs, and financial values.
- In numeric table cells where the column header already defines the entity (e.g. "Feeds", "Products", "Categories"), render strictly clean numeric values/badges (`{count}`). NEVER append nouns or text suffixes (`3 фідів`, `10 товарів`) inside the cell.
- Flex children containing text must use `min-w-0` to allow truncation without overflowing table columns.
- Reason: Data density and visual clarity are essential for catalog management; appending redundant noun suffixes inside cells clutters tables, breaks alignment, and creates awkward pluralization edge cases.

## UI-07: Strict Icon & Control Semantic Styling (Zero Rainbow Icons)

- All icons in forms, cards, tabs, and toggles must strictly use neutral semantic tokens: `text-muted-foreground` by default, `text-foreground` on active/focused states, or brand `text-primary`.
- Never assign rainbow colors (`text-blue-500`, `text-amber-500`, `text-yellow-500`, `text-emerald-500`, etc.) to icons to visually differentiate cards, inputs, tabs, or toggles.
- Semantic status colors (`text-destructive`, `text-success`) are reserved exclusively for actual functional runtime outcomes (e.g. sync error, sync success), never for decorative variety.
- Reason: Coloring every icon a different random hue turns professional software into a cluttered carnival and degrades visual hierarchy.
