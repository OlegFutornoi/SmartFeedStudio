# 🤖 SmartFeed Studio — Agent Guide

## 📌 Mission & Architecture

Enterprise platform for catalog feeds.

- **Admin Portal**: Next.js 14 (`apps/admin-portal`, :3000)
- **Desktop Client**: Tauri v2 + React 18 (`apps/desktop`, :1420) — Native SQLite/Keychain backend
- **Backend API**: NestJS 11 CQRS + Prisma + BullMQ (`services/backend-api`, :4000)
- **Contracts**: `@smartfeed/shared`

---

## 🏛 Rules Index (`.agents/rules/`)

All domain rules are modularized (max 12k chars per file):

1. [rules.md](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/rules.md) — Architecture, CQRS, Native vs Cloud backend
2. [code_review_and_skills.md](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/code_review_and_skills.md) — Skills matrix & pre-commit checklist
3. [testing_and_quality.md](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/testing_and_quality.md) — Teardown (`cleanDatabase`), 100% i18n, Git policy
4. [plans_lifecycle.md](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/plans_lifecycle.md) — Plans lifecycle (`active/`, `backlog/`, `completed/`)
5. [wiki_and_documentation.md](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/wiki_and_documentation.md) — WIKI & test coverage sync
6. [postgres_skills.md](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/postgres_skills.md) — PostgreSQL indexes & schema rules
7. [frontend_network_dedup.md](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/frontend_network_dedup.md) — Zero-duplicate API calls
8. [commands.md](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/commands.md) — CLI commands, ports, credentials

---

## ⚡ Commands & Ports

- `pnpm docker:up` / `pnpm docker:down` — Docker (PG: 5432, Redis: 6379, MinIO: 9000/9001)
- `pnpm dev` / `pnpm dev:backend` / `pnpm dev:admin` / `pnpm dev:desktop` — Dev servers
- `pnpm --filter @smartfeed/backend-api test:e2e` / `pnpm test:desktop` / `pnpm test:admin` — Tests
- `pnpm lint:fix && pnpm format` — Lint & Prettier format
- **Admin**: `admin@smartfeed.studio` / `AdminPassword123!`
