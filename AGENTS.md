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
11. [Master Intelligence & Skills Dispatcher](.agents/AGENTS.md) — Центральний диспетчер 46 модульних скілів та 5 спеціалізованих агентів
12. [Frontend Agent (agents_frontend)](.agents/references/agents_frontend.md) — Спеціалізований фронтенд-агент (8 етапів: аналіз UX, планування, UI/UX, Playwright TDD RED, реалізація GREEN, рев'ю, дебаг, передача)
13. [Backend Agent (agents_backend)](.agents/references/agents_backend.md) — Спеціалізований бекенд-агент (8 етапів: аналіз, контракти first, DB архітектура, Jest TDD RED, 4-шарова реалізація GREEN, рев'ю, дебаг, передача)
14. [Code Review & Audit Agent (agents_review)](.agents/references/agents_review.md) — Спеціалізований агент аудиту та якості (8 етапів: розвідка, CQRS аудит, 4-шаровий захист, UX/DoD, БД аудит, змагальний стрес-тест, план ремедіації, фінальний звіт)
15. [DevOps & Release Agent (agents_devops)](.agents/references/agents_devops.md) — Спеціалізований агент DevOps, інфраструктури, безпечних міграцій БД (Expand/Contract, Zero-Downtime), Docker, Railway та SemVer релізів
16. [QA & Performance Agent (agents_qa)](.agents/references/agents_qa.md) — Спеціалізований агент QA, навантажувальних бенчмарків 100k+ SKU, хаос-тестування гонок пам'яті, mock/real паритету та 100% очищення даних
17. [Task Prompt Examples](.agents/references/task_prompt_examples.md) — Практичні приклади та шаблони постановки задач для фронтенду, бекенду, рев'ю, devops, qa та fullstack
18. [communication_and_research.md](.agents/rules/communication_and_research.md) — Жорсткий регламент чату: лаконічність, нуль планів у чат, якість понад "аби працювало", upfront context7/MCP research

---

## ⚡ Commands & Ports

- `pnpm docker:up` / `pnpm docker:down` — Docker (PG: 5432, Redis: 6379, MinIO: 9000/9001)
- `pnpm dev` / `pnpm dev:backend` / `pnpm dev:admin` / `pnpm dev:desktop` — Dev servers
- `pnpm --filter @smartfeed/backend-api test:e2e` / `pnpm test:desktop` / `pnpm test:admin` — Tests
- `pnpm lint:fix && pnpm format` — Lint & Prettier format
- **Admin**: `admin@smartfeed.studio` / `AdminPassword123!`

---

## 🚫 Import Policy (Zero Relative Imports)

- **100% `@/` Path Aliases**: Never use relative imports (`../`, `../../`, `./`).
- All internal project imports must strictly use `@/` (e.g., `@/components/...`, `@/services/...`, `@/lib/...`, `@/modules/...`) or shared contracts `@smartfeed/shared`. Any `../` import is considered an architectural defect.

---

## 💬 Communication Policy & Zero Plan Dumping in Chat (Strict)

- **Concise & Direct (Token Economy)**: Always answer user questions briefly, clearly, and to the point.
- **Zero Plan & File Dumping in Chat**: Never rewrite, dump, or duplicate full plans, task breakdowns, or file contents into chat messages. All detailed plans MUST be written directly to `plans/active/<feature>.md`. Chat responses must contain ONLY concise summaries (1-2 sentences) with clickable markdown file links (`file:///...`).
- **Reliability & Quality > "Working is Enough"**: Never write code to "just make it work" with quick hacks. Analyze deeply and pick the most efficient, robust, scalable, and reliable approach.
- **Upfront Research via `context7` & MCPs**: Before implementing features or designing architecture, refresh library APIs and official docs via `context7` (`resolve-library-id`, `query-docs`) and relevant MCPs.
