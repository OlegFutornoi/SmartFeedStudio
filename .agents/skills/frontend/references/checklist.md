# 📋 Frontend Pre-Commit & Quality Checklist

Comprehensive self-review checklist for all frontend changes in `apps/desktop` and `apps/admin-portal`.

---

## 1. 🧩 Component Modularity & Budget (<250-300 lines)

- [ ] **No God-Components**: Every file is strictly under **250–300 lines**.
- [ ] **Clean Decomposition**: Separate files for headers, tables, rows, dialogs, empty states, and custom hooks.
- [ ] **Single Responsibility**: Presentation is decoupled from data-fetching hooks.

---

## 2. 🎨 UI/UX & Design System Compliance

- [ ] **100% Solid Sticky Headers**: `thead.sticky.top-0`, modal headers, footers, and floating action bars use solid opaque backgrounds (`bg-card`, `bg-muted`, `bg-background` with solid borders). Zero semi-transparent text bleed.
- [ ] **Zero Off-Scheme Palette Colors**: 0 hardcoded `purple-*`, `pink-*`, `violet-*`, `fuchsia-*`. All styling uses semantic design tokens (`primary`, `border`, `card`, `muted`, `background`, `destructive`).
- [ ] **Zero Duplicate Action Buttons**: Primary CTA button (e.g. "Add Feed") is NOT shown in toolbar/header when an empty state card already provides that CTA.
- [ ] **5 Mandatory UI States Handled**:
  - [ ] Loading skeleton (`<Skeleton />`).
  - [ ] Empty state with icon, message, and action.
  - [ ] Data presentation with pagination/sorting.
  - [ ] Error state with localized retry.
  - [ ] Success state with localized toast.
- [ ] **Theme Harmony**: High contrast in both Dark and Light modes.

---

## 3. 🌐 100% Internationalization (i18n)

- [ ] **Zero Hardcoded Strings**: All text in buttons, titles, subtitles, placeholders, dialogs, badges, and alerts uses `t('namespace:key')`.
- [ ] **Dictionary Completeness**: Every key exists in both `locales/uk/*.json` and `locales/en/*.json`.
- [ ] **HTML Title Attributes Translated**: `title={t('common:edit')}`, never raw English strings.
- [ ] **Metric Formatting**: Percentages formatted cleanly (`Math.round(percent)` or `Number(percent.toFixed(1))`), never raw floats (`33.33333333333333%`).
- [ ] **Backend Error Localization**: API error responses translated via `getErrorMessage(err, t)`.

## 4. 🛡 Cleanliness & Error Handling (Zero Silent Failures)

- [ ] **Zero Silent Failures**: No empty `catch {}` blocks anywhere in components, hooks, or utility scripts.
- [ ] **Structured Diagnostics or User Toasts**: Every catch block logs structured diagnostic info (`console.warn('[Component:Context] Description:', err)`) or renders a localized toast notification (`toast.error(getErrorMessage(err, t))`).
- [ ] **No `as any` Bypasses**: Strict typing with TypeScript interfaces or Zod contracts.

---

## 5. ⚡ Network & React Performance

- [ ] **Zero-Duplicate API Calls**: Context providers and data hooks use `isFetchingRef` and `lastFetchedTokenRef` to guard against concurrent/duplicate requests.
- [ ] **No React.StrictMode Double-Mounting**: `reactStrictMode: false` in `next.config.mjs`; omitted in desktop `main.tsx`.
- [ ] **Lean Dependency Arrays**: UI-only state (`isUk`, `locale`, `theme`) is excluded from data-fetching `useCallback` dependency arrays.
- [ ] **Zero Redundant `/auth/me`**: Login and registration do not trigger an immediate cascaded `/auth/me` fetch.

---

## 5. ♿ Web Interface & Accessibility Guidelines (`web-design-guidelines`)

- [ ] **Icon-Only Buttons**: All icon-only buttons have explicit `aria-label` or `title`.
- [ ] **Decorative Icons**: Non-interactive icons have `aria-hidden="true"`.
- [ ] **Semantic HTML**: `<button>` for actions, `<Link>`/`<a>` for navigation. 0 `<div onClick>`.
- [ ] **Visible Focus States**: `focus-visible:ring-2` on interactive elements. 0 bare `outline-none`.
- [ ] **Forms & Inputs UX**: Meaningful `name`, `type`, `autocomplete`. Never block paste (`onPaste` + `preventDefault` prohibited). Labels clickable (`htmlFor`). Focus first invalid field on submit.
- [ ] **Typography & Numbers**: `tabular-nums` on numbers/counters. Truncated flex items have `min-w-0`. Loading states end with `…` (`"Loading…"`).
- [ ] **Animation & Motion**: Animates `transform`/`opacity` only. Respects `prefers-reduced-motion`. 0 `transition: all`.

---

## 6. 🧪 Playwright Testing & Test Isolation

- [ ] **TDD Followed**: Failing Playwright test written and verified (RED) before implementing UI code (GREEN).
- [ ] **Page Object Model (POM)**: Tests use dedicated page objects with resilient `data-testid` selectors.
- [ ] **Dedicated Bilingual Tests**: Explicit test asserting all text elements translate when switching UA ⇄ EN.
- [ ] **Network Assertion**: Playwright test verifies target API endpoints are called strictly **1 time** on load.
- [ ] **Test Isolation**: `localStorage`, `sessionStorage`, cookies, and mocked routes reset before/after each test.
- [ ] **No Arbitrary Sleeps**: Replaced with `waitForResponse`, `waitForSelector`, or `expect.poll`.

---

## 7. 🚀 Verification Commands

```bash
# 1. Typecheck Desktop Client
pnpm --filter @smartfeed/desktop exec tsc --noEmit

# 2. Typecheck Admin Web Portal
pnpm --filter admin-portal exec tsc --noEmit

# 3. Run Desktop Playwright E2E Tests
pnpm test:desktop

# 4. Run Admin Playwright E2E Tests
pnpm test:admin

# 5. Format All Code
pnpm format
```
