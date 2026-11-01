# Antigravity Agent Guide — E2E Testing Framework (`e2e`)

## Purpose

The `@smartfeed/e2e` package is the centralized automated testing framework for SmartFeed Studio.
Sole ownership belongs exclusively to `@agents_qa` under dedicated `QA-<num>` tasks (`TEST-00`). Frontend and backend engineering agents never author or edit automated test suites.

## Test Domains & Structure

- `server/backend/`: NestJS REST API integration specs against isolated PostgreSQL `smartfeed_test_db`.
- `server/admin/`: Admin Portal Next.js web application UI specs.
- `local/backend/`: Local SQLite dev container specs (`POST /api/invoke`).
- `local/desktop/`: Desktop client browser mode UI specs.

## Architecture Invariants

- Page Object Model: UI selectors and locators live strictly in `pages/*.page.ts`.
- Web-First Locators: Use `getByTestId` and `getByRole`. Zero raw fragile CSS/XPath selectors.
- Web-First Assertions: Use `expect(...).toBeVisible()`. Zero arbitrary `waitForTimeout` sleeps (`TEST-09`).
- Test Isolation: Use prefix `e2e.<runId>.<entity>` and email `e2e.test+<timestamp>@smartfeed.local` (`TEST-08`).
- Database Teardown: Mandatory `cleanDatabase` cleanup after test runs (`TEST-01`).
- Preserved Dev Accounts: Never wipe or mutate manual developer accounts (`qatest@gmail.com`, `shoplinkerxml@gmail.com`).

## Key Commands

- Run all server tests: `pnpm e2e:server`
- Run backend server specs: `pnpm e2e:server:backend`
- Run admin portal specs: `pnpm e2e:server:admin`
- Run local desktop specs: `pnpm e2e:local:desktop`
- Open Playwright UI mode: `pnpm e2e:ui`
- View HTML report: `pnpm e2e:report`
