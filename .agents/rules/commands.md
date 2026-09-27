---
trigger: always_on
description: Essential CLI commands, environment ports, and access credentials for SmartFeed Studio monorepo.
---

# ⚡ SmartFeed Studio — Operations, Terminal Commands & Extended Rules

## ⚡ Key Terminal Commands

- **Start Infrastructure**: `pnpm docker:up` (Postgres: 5432, Redis: 6379, MinIO: 9000/9001)
- **Stop Infrastructure**: `pnpm docker:down`
- **Production Docker**: `pnpm docker:prod:build` / `pnpm docker:prod:up` / `pnpm docker:prod:down` / `pnpm docker:prod:logs`
- **Start All Apps (Dev)**: `pnpm dev`
- **Run Backend API**: `pnpm dev:backend`
- **Run Admin Portal**: `pnpm dev:admin`
- **Run Desktop Vite**: `pnpm dev:desktop`
- **Build All Apps**: `pnpm build`
- **Run Backend E2E Tests**: `pnpm --filter @smartfeed/backend-api test:e2e`
- **Run Desktop E2E Tests**: `pnpm test:desktop`
- **Run Desktop Tests (Headed)**: `pnpm test:desktop:headed`
- **Run Desktop Tests (UI Mode)**: `pnpm test:desktop:ui`
- **Run Admin E2E Tests**: `pnpm test:admin`
- **Run Admin Tests (Headed)**: `pnpm test:admin:headed`
- **Run Admin Tests (UI Mode)**: `pnpm test:admin:ui`
- **Lint & Format**: `pnpm lint:fix && pnpm format`
- **Prisma Schema Sync**: `pnpm --filter @smartfeed/backend-api exec prisma db push`
- **Run Database Seeder**: `pnpm prisma:seed`
- **Open Prisma Studio**: `pnpm prisma:studio`
- **Railway CLI**: `railway status` / `railway up` / `railway mcp` (Token: `RAILWAY_TOKEN`)

---

## 🌐 Default Ports & Access Credentials

- **Backend API**: `http://localhost:4000/api` (Swagger: `http://localhost:4000/api/docs`)
- **Admin Portal**: `http://localhost:3000`
- **Desktop UI**: `http://localhost:1420`
- **PostgreSQL**: `localhost:5432` (DB: `smartfeed_db`, User: `postgres`, Pass: `postgrespassword`)
- **Redis**: `localhost:6379`
- **MinIO Console**: `http://localhost:9001` (User: `minioadmin`, Pass: `minioadminpassword`)
- **Default Super Admin**: `admin@smartfeed.studio` / `AdminPassword123!`

---

## 🚫 Mandatory Browser Automation & Playwright MCP Policy (Zero Token Waste)

1. **Strict Prohibition of `browser_subagent`**:
   - **NEVER** call `browser_subagent` or `open_browser_url`. The built-in subagent unconditionally fails with `404 Not Found from https://playwright.azureedge.net/builds/driver/playwright-1.57.0-mac-arm64.zip` on macOS Apple Silicon (ARM64).
   - Calling `browser_subagent` is **STRICTLY PROHIBITED** as it wastes user tokens and fails every time.

2. **Mandatory Direct Playwright MCP Server or Playwright Test Runners**:
   - For all browser inspections and automation, **ALWAYS** use:
     - **Playwright MCP Server**: Call lazy-loaded MCP tools via `call_mcp_tool` with `ServerName: "playwright"` (`browser_navigate`, `browser_snapshot`, `browser_take_screenshot`, `browser_click`, etc.).
     - **Direct Automated Test Suites**: Run `pnpm test:desktop` or `pnpm test:admin` (or headed versions `pnpm test:desktop:headed` / `pnpm test:admin:headed`) using the pre-installed local browser binaries.

3. **No Guessing Loops & Instant Credential Requests**:
   - Never enter guessing, retry, or looping attempts if login credentials, passwords, or tokens are missing.
   - Use default known test credentials (`admin@smartfeed.studio` / `AdminPassword123!`), or immediately ask the user without wasting tokens.
