# 💻 Frontend & UI/UX Review Matrix (`apps/desktop`, `apps/admin-portal`)

## 1. Network Deduplication & React 18 Standards

| Check                       | Anti-Pattern                                             | Required Pattern                                                                                                              |
| :-------------------------- | :------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| **StrictMode Mounting**     | Wrapping app in `<React.StrictMode>`                     | Omit `React.StrictMode` in desktop `main.tsx`; set `reactStrictMode: false` in `next.config.mjs` to prevent double API calls. |
| **In-Flight Deduplication** | Uncontrolled `useEffect` data fetching                   | Use `useRef` guards (`isFetchingRef`, `lastFetchedTokenRef`) in Context providers.                                            |
| **Cascaded `/auth/me`**     | Calling `/auth/me` right after `/login` or `/register`   | Auth endpoints return the full `UserProfile`. `refreshProfile()` runs **strictly once** on initial mount.                     |
| **Lean `useCallback` Deps** | Including `theme`, `language`, `isUk` in data fetch deps | Isolate UI translation state from HTTP data fetching dependency arrays.                                                       |

---

## 2. UI/UX Design System & `ui-ux-pro-max` Standards

- [ ] **100% Solid Sticky Headers**:
  - All sticky table headers (`thead.sticky.top-0`), dialog headers/footers, and action bars **MUST use 100% solid, opaque backgrounds** (`bg-card`, `bg-muted`, `bg-background` with `z-10` and solid borders).
  - Semi-transparent backgrounds (`bg-*/40`, `bg-*/50`, `backdrop-blur-md` on sticky headers) are **strictly prohibited** because text overlaps when scrolled.
- [ ] **Component Size Limit (<250–300 lines)**:
  - React views must be modular and clean. Monolithic files (700–1000+ lines) must be decomposed into subcomponents (`*Dialog.tsx`, `*List.tsx`, `*Row.tsx`, `*Toolbar.tsx`).
- [ ] **Zero Dead Code & Zero Unused Imports**:
  - No unused icon imports from `lucide-react`, unused React hooks, dead DTOs, or unreachable code.
- [ ] **Tailwind & shadcn/ui Best Practices**:
  - Use semantic CSS tokens (`--background`, `--foreground`, `--primary`, `--card`, `--border`).
  - Class merging via `cn()` helper.

---

## 3. 100% i18n Localization & Number Formatting

- [ ] **Zero Hardcoded Text**: All user-facing strings (labels, buttons, tooltips, dialogs, titles, placeholders) use `t('namespace:key')`.
- [ ] **Zero Missing Keys**: Every `t(...)` call in JSX must have matching keys in both `locales/uk/*.json` and `locales/en/*.json`.
- [ ] **Metric Formatting**: Percentages must use `Math.round(percent)` or `Number(percent.toFixed(1))` (never raw `33.33333333333333%`).
- [ ] **Backend Error Translation**: Catch API errors and pass through `getErrorMessage(err, t)` so Ukrainian UI never displays raw English backend messages.
