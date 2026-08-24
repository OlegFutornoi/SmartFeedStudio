# 🖥 Desktop Client — SmartFeed Studio

## 🚀 Run Tests

```bash
# Run Playwright E2E tests (Headless CLI)
pnpm --filter @smartfeed/desktop test:e2e

# Run Playwright in Headed mode (Visible Browser Window)
pnpm --filter @smartfeed/desktop test:e2e:headed

# Run Playwright Interactive UI Mode (Time-travel, Inspector, Logs)
pnpm --filter @smartfeed/desktop test:e2e:ui
```

---

## 📌 Overview

Native Desktop Client for SmartFeed Studio built with **Tauri v2** + **React 18** + **Vite** + **shadcn/ui** + **Tailwind CSS**.

- **Dev URL**: `http://localhost:1420`
- **Routing**: `/auth/login` (Login Page), `/auth/register` (Register Page), `/` (Protected Home Page)
- **i18n**: Ukrainian (`uk`, default) & English (`en`) with page-based lazy namespace loading (`common`, `auth`, `home`, `errors`)

---

## 📊 E2E Test Coverage (Playwright)

| Test File                                | Scenarios Covered                                                                                                                                                                                               | Tests | Status  |
| :--------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---: | :-----: |
| [`e2e/auth.spec.ts`](./e2e/auth.spec.ts) | Route guard (`/` -> `/auth/login`), localized 401 error alert (`UA` / `EN`), successful login redirect to `/`, registration flow (`/auth/register`), multilingual dynamic switching (`UA` / `EN`), theme toggle |   6   | ✅ PASS |

**Total: 6 tests — 6 passing**

---

## ⚡ Dev Commands

```bash
# Start Vite in browser (Port 1420)
pnpm dev:desktop

# Run Playwright tests (Headless)
pnpm --filter @smartfeed/desktop test:e2e

# Run Playwright tests in visible browser window
pnpm --filter @smartfeed/desktop test:e2e:headed

# Run Playwright Interactive UI Inspector
pnpm --filter @smartfeed/desktop test:e2e:ui

# Run native Tauri application
pnpm --filter @smartfeed/desktop tauri:dev

# Build production web bundle
pnpm build:desktop
```
