---
name: vercel-react-best-practices
description: React 18 and Next.js 14 performance optimization patterns for SmartFeed Studio. Use when optimizing React components, eliminating waterfall requests, guarding against concurrent duplicate requests via useRef, reducing bundle size, or optimizing re-renders on large catalogs. Do not use for server database queries; use backend or database skills instead.
rules: [core, frontend]
---

# React & Next.js Performance Optimization

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/frontend.md`.
2. Verify invariant `FE-01`: zero duplicate API calls via `useRef` guards.
3. Verify invariant `FE-02`: no `React.StrictMode` double-mounting in desktop or admin apps.
4. Verify invariant `FE-04`: lean `useCallback` dependency arrays without UI translation flags.
5. Do not write data-fetching hooks or component memoization until steps 1-4 are complete.

## Inputs

- React component, context provider, or custom data-fetching hook.
- Component re-render metrics or network waterfall logs.

## Procedure

1. Step 1 - In-Flight Request Deduplication: wrap remote API fetches in `useRef` guards. Declare `const isFetchingRef = useRef<boolean>(false)` and `const lastTokenRef = useRef<string | null>(null)`. Exit early if a fetch for the current token is already completed or in-flight.
2. Step 2 - Lean Dependency Arrays: audit `useCallback` and `useMemo` dependencies. Exclude `t`, `i18n`, `locale`, and `theme` from data-fetching callbacks unless the API endpoint requires localized query parameters.
3. Step 3 - Eliminate Async Waterfalls: execute independent promises in parallel with `Promise.all()`. Start promises early before branching conditions.
4. Step 4 - Table Re-Render Isolation: extract row items into dedicated `React.memo` components (`*TableRow.tsx`). Pass primitive IDs or stable callback handlers instead of unstable inline object literals.
5. Step 5 - Bundle Optimization: dynamically import heavy dialogs and drawers using Next.js `dynamic()` or React `lazy()` with Suspense fallbacks.

## Outputs

- Deduplicated, memoized React components and custom hooks.
- Single-request network execution verified by Playwright tests.

## Gate (stop condition)

- Page load fires strictly 1 HTTP request per endpoint (`requestCount === 1`).
- Zero unnecessary component re-renders when language or theme toggles.
- Zero `React.StrictMode` double-mounts.

## Never

- Never place UI translation flags (`isUk`, `locale`) inside data-fetching `useCallback` dependencies (violates `FE-04`).
- Never fire cascaded `GET /auth/me` calls immediately after login or register (violates `FE-03`).
- Never wrap root desktop `<App />` in `<React.StrictMode>` (violates `FE-02`).
- Never pass inline arrow functions as callbacks inside un-memoized table row maps.

## References

- `references/waterfall-elimination.md` - read when diagnosing slow cascading component fetches.
- `references/bundle-optimization.md` - read when splitting heavy bundle modules.
