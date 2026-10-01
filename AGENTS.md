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

1. [rules.md](.agents/rules/rules.md) — Architecture, CQRS, Native vs Cloud backend
2. [code_review_and_skills.md](.agents/rules/code_review_and_skills.md) — Skills matrix & pre-commit checklist
3. [testing_and_quality.md](.agents/rules/testing_and_quality.md) — Teardown (`cleanDatabase`), 100% i18n, Git policy
4. [plans_lifecycle.md](.agents/rules/plans_lifecycle.md) — Plans lifecycle (`active/`, `backlog/`, `completed/`)
5. [wiki_and_documentation.md](.agents/rules/wiki_and_documentation.md) — WIKI & test coverage sync
6. [postgres_skills.md](.agents/rules/postgres_skills.md) — PostgreSQL indexes & schema rules
7. [frontend_network_dedup.md](.agents/rules/frontend_network_dedup.md) — Zero-duplicate API calls
8. [commands.md](.agents/rules/commands.md) — CLI commands, ports, credentials, 100% MCP auto-approval policy
9. [design_system_and_theming.md](.agents/rules/design_system_and_theming.md) — 100% theme harmony, semantic tokens & zero off-scheme colors (no ad-hoc purple/pink), zero duplicate action buttons
10. [engineering_discipline_and_planning.md](.agents/rules/engineering_discipline_and_planning.md) — Architecture & scalability first, quality over naive simplicity ("working" is not enough), zero God-files (<250-300 lines), mutex concurrency, safe OS execution, pre-planned domain modularity
11. [Master Skills Guide](.agents/AGENTS.md) — Повний каталог та диспетчер 79 скілів (4 майстер-оркестратори, 75 підскілів за 8 напрямками)
12. [Frontend Agent (agents_frontend)](.agents/agents_frontend.md) — Спеціалізований фронтенд-агент повного циклу (8 етапів: аналіз, планування, дизайн, рев'ю, автотести кожної кнопки/флоу/регресії, дебаг, переведення планів)
13. [Backend Agent (agents_backend)](.agents/agents_backend.md) — Спеціалізований бекенд-агент повного циклу (8 етапів: аналіз, планування, TDD RED тести спочатку, 4-шарова реалізація GREEN, рев'ю, E2E регресія, дебаг, переведення планів)
14. [Code Review & Audit Agent (agents_review)](.agents/agents_review.md) — Спеціалізований агент аудиту та якості (8 етапів: розвідка, CQRS аудит, 4-шаровий захист, UX аудит, БД аудит, змагальний стрес-тест, формування плану покращення plans/active/remediation_*.md, фінальний звіт)

---

## ⚡ Commands & Ports

- `pnpm docker:up` / `pnpm docker:down` — Docker (PG: 5432, Redis: 6379, MinIO: 9000/9001)
- `pnpm dev` / `pnpm dev:backend` / `pnpm dev:admin` / `pnpm dev:desktop` — Dev servers
- `pnpm --filter @smartfeed/backend-api test:e2e` / `pnpm test:desktop` / `pnpm test:admin` — Tests
- `pnpm lint:fix && pnpm format` — Lint & Prettier format
- **Admin**: `admin@smartfeed.studio` / `AdminPassword123!`

---

## 💬 Communication Policy (Strict)

- **Concise & Direct**: Always answer user questions briefly, clearly, and to the point.
- **Zero Text Walls**: Never generate long essay-style walls of text or redundant boilerplate unless explicitly requested.
