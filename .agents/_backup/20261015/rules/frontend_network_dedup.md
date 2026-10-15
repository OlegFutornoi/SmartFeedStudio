---
trigger: always_on
description: Mandatory Zero-Duplicate API Calls & React Network Deduplication Policy across Desktop and Admin Web Portal.
---

# 🚫 SmartFeed Studio — Zero-Duplicate Network Calls & React Standards

## 📌 Core Rule: Zero Redundant or Duplicate API Requests

Any frontend application (`apps/desktop`, `apps/admin-portal`) MUST NOT fire duplicate, redundant, or cascaded HTTP API requests during page loads, authentication state transitions, or component re-renders.

---

## 🛠 5 Mandatory Frontend Anti-Duplication Principles

### 1. No Development `React.StrictMode` Double Mounts

- In React 18, `React.StrictMode` mounts, unmounts, and re-mounts every component and effect in dev mode, causing double network traffic.
- **Admin Portal**: Keep `reactStrictMode: false` in `next.config.mjs`.
- **Desktop Client**: Never wrap `<App />` in `<React.StrictMode>` in `apps/desktop/src/main.tsx`.

### 2. In-Flight Request Deduplication & Ref Tracking (`useRef`)

Context providers (e.g. `NavigationProvider`, `AuthProvider`, `PlansProvider`) that fetch remote data MUST guard against concurrent or redundant fetches using `useRef`:

```typescript
const lastFetchedTokenRef = useRef<string | null>(null);
const isFetchingRef = useRef<boolean>(false);

const fetchData = useCallback(
  async (force = false) => {
    if (!token || !isAuthenticated) return;
    if (!force && lastFetchedTokenRef.current === token) return; // Already fetched for this token
    if (isFetchingRef.current) return; // Prevent concurrent duplicate calls

    try {
      isFetchingRef.current = true;
      const data = await apiCall(token);
      lastFetchedTokenRef.current = token;
      setData(data);
    } finally {
      isFetchingRef.current = false;
    }
  },
  [token, isAuthenticated],
);
```

### 3. Zero Redundant Post-Auth `/auth/me` Effects

- `/auth/login` and `/auth/register` endpoints already return the full `UserProfile` object along with JWT tokens.
- Never trigger a cascaded `refreshProfile()` (`GET /auth/me`) immediately after successful login or register.
- `refreshProfile()` must ONLY execute on initial app mount if an existing token was recovered from `localStorage`.

### 4. Lean `useCallback` Dependency Arrays

- Never include UI-only state (such as `isUk`, `locale`, `theme`) in data fetching `useCallback` dependency arrays unless the HTTP query parameter itself requires localization.
- Separate data fetching hooks from translation rerenders.

### 5. Automated Single-Request Performance Tests

- Every key view (Dashboard, Navigation, Plans, Licenses, Users) MUST include automated Playwright tests asserting that endpoints are called **strictly 1 time** upon page load:

```typescript
let requestCount = 0;
page.on('request', (req) => {
  if (req.url().includes('/api/endpoint')) requestCount++;
});
await page.goto('/target-page');
expect(requestCount).toBe(1);
```
