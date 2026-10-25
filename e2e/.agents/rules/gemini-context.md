---
trigger: always_on
---

# SmartFeed Studio E2E Architectural Context & Guidelines

## 1. Stack & Versions

- TypeScript (strict) · Playwright Test `@playwright/test ^1.62.1` + `APIRequestContext`
- `zod ^3.24.2` · `pg ^8.13.3` · `typescript ^5.7.3` · `eslint ^9.20.1` · Node 22+

## 2. Directory Placement & Decision Tree

- **Server Backend API Endpoint (`:4000/api`):** Place API client in `server/backend/clients/<domain>.client.ts`. Add test in `server/backend/specs/<domain>.spec.ts`.
- **Server Admin Portal Page (`:3000`):** Create `BasePage` subclass in `server/admin/pages/<feature>.page.ts`. Place components in `server/admin/components/`. Add test in `server/admin/specs/<feature>.spec.ts`.
- **Local DB Command (`:5001` `POST /api/invoke`):** Use `LocalDbClient` in `local/backend/clients/local-db.client.ts`. Add test in `local/backend/specs/<domain>.spec.ts`.
- **Local Desktop Client Page (`:1420`):** Create desktop page in `local/desktop/pages/<feature>.page.ts`. Place components in `local/desktop/components/`. Add test in `local/desktop/specs/<feature>.spec.ts`.

## 3. Object Hierarchy & Inheritance

- **UI:** `BasePage` (abstract `goto`, `toBeLoaded`) → `DashboardPage`, `SuppliersPage`, `LicensesPage`...
- **Components:** `BaseComponent` (abstract `toBeLoaded`) → `HeaderComponent`, `SidebarComponent`, `DialogComponent`...
- **API Clients:** `ApiClient` (`get`, `post`, `patch`, `delete` with Zod validation and 4-layer defense) → `AuthClient`, `SuppliersClient`...
- **Local DB Client:** `LocalDbClient` (`invoke<K>()` with typed `LocalDbCommandMap`).

## 4. Fixtures & Teardown

- `serverBackendTest("title", async ({ api, authToken, cleanup }) => {})`
- `serverAdminTest("title", async ({ page, adminPage }) => {})`
- `localBackendTest("title", async ({ localDb }) => {})`
- `localDesktopTest("title", async ({ page, desktopPage }) => {})`
- **Data Cleanup:**
  - Server DB: scoped cleanup via `cleanup.ts` in FK order; never touch manual accounts (`qatest@gmail.com`, `shoplinkerxml@gmail.com`).
  - Local DB: `POST /api/reset` before/after test suites.

## 5. Playwright Config & Locator Priorities

- Configuration: `testIdAttribute: "data-testid"`, `forbidOnly: !!process.env.CI`.
- Projects:
  - `server-backend:setup` / `server-backend`
  - `server-admin:setup` / `server-admin`
  - `local-backend:setup` / `local-backend`
  - `local-desktop:setup` / `local-desktop`
- **Locator Priority:**
  1. `getByRole("button", { name: /text/i })`
  2. `getByLabel(/text/i)`
  3. `getByText(/text/i)`
  4. `getByTestId("value")`
  5. Scoping: `childLocator.within(parentLocator)` for modals, tables, and rows.
  6. Prohibited: CSS classes, XPath.

## 6. Execution Commands

```bash
pnpm --filter @smartfeed/e2e typecheck  # Typecheck
pnpm e2e:server:backend                 # Server API tests
pnpm e2e:server:admin                   # Admin Portal tests
pnpm e2e:local:backend                  # Local DB API tests
pnpm e2e:local:desktop                  # Desktop UI tests
```
