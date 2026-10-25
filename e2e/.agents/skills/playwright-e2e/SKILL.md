---
name: playwright-e2e
description: Reference for writing, editing, and debugging Playwright E2E and API tests in SmartFeed Studio across the 4 projects (server:backend, server:admin, local:backend, local:desktop). Activate for creating or maintaining tests, Page Objects, API clients, or debugging test failures.
---

# Playwright E2E Conventions (`@smartfeed/e2e`)

Core technical specifications and conventions for Playwright E2E and API testing in SmartFeed Studio.

---

## 1. The 4 Target Test Projects

1. `server:backend` (`:4000/api`): NestJS REST API black-box tests against `smartfeed_test_db`.
2. `server:admin` (`:3000`): Next.js 14 Admin Portal UI tests with authenticated `storageState`.
3. `local:backend` (`:5001`): Local SQLite Docker dev container (`tools/sqlite-dev-server`) invoking `LocalDbCommandMap` commands.
4. `local:desktop` (`:1420`): Desktop React/Tauri application UI tests in browser mode.

---

## 2. Page Object Model (POM) Standards

- Encapsulation: All Playwright locators must be declared as `private readonly` class fields.
- User-Facing Locators: Exclusively `getByRole`, `getByLabel`, `getByText`, or `getByTestId`. Prohibit XPath and arbitrary CSS classes.
- Verification Gate: Every Page Object must implement an asynchronous `toBeLoaded()` method verifying that key elements are visible before performing actions.
- Actions: All user interactions (`click`, `fill`, `selectOption`) must await `toBeLoaded()`.

---

## 3. API Client Standards

- 4-Layer Response Defense:
  1. `expect(res.status).not.toBe(500)`
  2. `expect(res.status).toBe(expectedStatus)`
  3. `expect(res.headers["content-type"]).toMatch(/application\/(?:problem\+)?json/)`
  4. Non-empty body with Zod schema validation
- Path Alias: Always import modules via `@/` (e.g. `@/core/http/api-client`).

---

## 4. Execution Commands

```bash
pnpm e2e:server:backend
pnpm e2e:server:admin
pnpm e2e:local:backend
pnpm e2e:local:desktop
```
