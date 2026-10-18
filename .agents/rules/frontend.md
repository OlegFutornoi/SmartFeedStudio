---
trigger: glob
description: Frontend architecture, React 18, Next.js 14, Tauri v2, design system, and UI invariants for SmartFeed Studio.
globs: ['apps/desktop/src/**', 'apps/admin-portal/**']
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
- Every Tauri `#[tauri::command]` SQLite handler must be registered in `REGISTERED_TAURI_COMMANDS` (`tauri-args.ts`), query exact DDL column names (`source_url`, never unmigrated aliases), and return identical DTO property keys (`id`) as the mock driver; shared hash utilities must encode strings via UTF-8 (`TextEncoder`) before SHA-256 hashing so Cyrillic/non-ASCII payloads never return empty hashes.
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
