---
name: playwright-cli
description: CLI execution presets, environment configurations, and command flags for running Playwright tests in SmartFeed Studio E2E. Use when executing tests locally, configuring parallel workers, running concurrency stability gates, switching target projects, or filtering test runs by tags.
---

# Playwright CLI Execution Guide (`playwright-cli`)

Repository-specific execution presets, project switches, and concurrency configurations for SmartFeed Studio E2E.

---

## 1. Project Presets

The framework defines 4 isolated Playwright projects in `playwright.config.ts`:

- `server-backend`: NestJS API black-box tests (`:4000/api`) against `smartfeed_test_db`.
- `server-admin`: Admin Portal UI tests (`:3000`, Next.js 14).
- `local-backend`: Local SQLite dev container API tests (`:5001`, `POST /api/invoke`).
- `local-desktop`: Desktop React application UI tests (`:1420`, browser mode).

Execute via pnpm scripts or Playwright CLI:

```bash
# Via monorepo scripts
pnpm e2e:server:backend
pnpm e2e:server:admin
pnpm e2e:local:backend
pnpm e2e:local:desktop

# Direct project execution
npx playwright test --project=server-backend
npx playwright test --project=server-admin
npx playwright test --project=local-backend
npx playwright test --project=local-desktop
```

---

## 2. Concurrency & Stability Gate

Before completing any task, run the stability gate:

```bash
npx playwright test <spec_path> --project=<project> --repeat-each=3 --workers=2
```

---

## 3. Targeted Filtering

- By tag: `npx playwright test --grep="@smoke"`
- By file: `npx playwright test server/backend/specs/auth.spec.ts`
- Headed mode: `pnpm e2e:headed`
- UI mode: `pnpm e2e:ui`
