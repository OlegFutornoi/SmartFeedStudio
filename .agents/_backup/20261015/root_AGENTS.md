# 🤖 SmartFeed Studio — Agent Guide

## 📌 Mission & Architecture

Enterprise platform for parsing, editing, and syncing XML/CSV product feeds with encrypted local SQLite, Cloudflare R2 / S3 object storage, and AI-driven catalog enrichment.

- **Admin Portal**: Next.js 14 App Router (`apps/admin-portal`, :3000)
- **Desktop Client**: Tauri v2 + React 18 (`apps/desktop`, :1420) — Native SQLite (SQLCipher) + OS Keychain backend
- **Backend API**: NestJS 11 CQRS + Prisma + BullMQ (`services/backend-api`, :4000)
- **Contracts**: `@smartfeed/shared`
- **Infrastructure**: PostgreSQL 16 (:5432), Redis 7 (:6379), MinIO S3 (:9000/9001), Cloudflare R2
- **AI & Integrations**: OpenRouter AI Assistant (`OPENROUTER_API_KEY`), WayForPay Payments

---

## 🏛 Rules Index (`.agents/rules/`)

All 17 domain rules are strictly modularized (<12,000 characters each):

1. [rules.md](.agents/rules/rules.md) — Core Architecture, CQRS, Native vs Cloud runtime separation, zero orphaned records
2. [code_review_and_skills.md](.agents/rules/code_review_and_skills.md) — Modular skills matrix & 15-point pre-commit review checklist
3. [testing_and_quality.md](.agents/rules/testing_and_quality.md) — Centralized `cleanDatabase` teardown, 100% bilingual i18n, targeted testing
4. [plans_lifecycle.md](.agents/rules/plans_lifecycle.md) — Deterministic 3-directory plans lifecycle (`active/`, `backlog/`, `completed/`)
5. [wiki_and_documentation.md](.agents/rules/wiki_and_documentation.md) — Continuous WIKI synchronization & backend E2E test coverage tables
6. [postgres_skills.md](.agents/rules/postgres_skills.md) — PostgreSQL 10-point checklist: 100% FK indexes, `timestamptz(6)`, CUIDs, GIN trgm
7. [frontend_network_dedup.md](.agents/rules/frontend_network_dedup.md) — Zero-duplicate API calls, `useRef` in-flight guards, lean `useCallback`
8. [commands.md](.agents/rules/commands.md) — Monorepo CLI commands, ports, credentials, 100% MCP auto-approval policy
9. [design_system_and_theming.md](.agents/rules/design_system_and_theming.md) — 100% theme harmony, semantic tokens, zero off-scheme colors, zero duplicate CTAs
10. [engineering_discipline_and_planning.md](.agents/rules/engineering_discipline_and_planning.md) — Architecture & scalability first, zero God-files (<250-300 lines), safe OS execution (`execFile`)
11. [communication_and_research.md](.agents/rules/communication_and_research.md) — Strict chat brevity, zero plan dumping, upfront `context7` & MCP research
12. [agents_frontend.md](.agents/rules/agents_frontend.md) — Frontend Agent rule: 8-stage lifecycle, UI modularity budget (<250 lines), solid sticky headers
13. [agents_backend.md](.agents/rules/agents_backend.md) — Backend Agent rule: 8-stage lifecycle, CQRS modularity (1 file = 1 handler), 4-layer defense
14. [agents_review.md](.agents/rules/agents_review.md) — Code Review Agent rule: 8-stage lifecycle, 5-axis audit, adversarial stress testing
15. [agents_devops.md](.agents/rules/agents_devops.md) — DevOps Agent rule: 8-stage lifecycle, Expand/Contract migrations, Railway, SemVer releases
16. [agents_qa.md](.agents/rules/agents_qa.md) — QA Agent rule: 8-stage lifecycle, 6D scenario matrix, 100k+ SKU benchmarks, mock/real parity
17. [agents_security.md](.agents/rules/agents_security.md) — Security Agent rule: 8-stage lifecycle, STRIDE, OWASP Top 10, PoC exploits, remediation

---

## 📚 Specialized Playbooks & Architecture Dispatcher

- [Master Intelligence & 52 Skills Dispatcher](.agents/AGENTS.md) — Central orchestrator connecting 6 specialized agents with 52 modular skills
- [Frontend Playbook](.agents/references/agents_frontend.md) — Comprehensive 8-stage playbook for React 18, Next.js 14, Tauri v2 & Playwright
- [Backend Playbook](.agents/references/agents_backend.md) — Comprehensive 8-stage playbook for NestJS CQRS, Prisma ORM, BullMQ & Redis
- [Code Review Playbook](.agents/references/agents_review.md) — Comprehensive 8-stage playbook for monorepo audits & remediation plans
- [DevOps Playbook](.agents/references/agents_devops.md) — Comprehensive 8-stage playbook for Docker, PostgreSQL zero-downtime migrations & Railway
- [QA & Performance Playbook](.agents/references/agents_qa.md) — Comprehensive 8-stage playbook for 100k+ SKU load testing & chaos benchmarks
- [Security & Pentest Playbook](.agents/references/agents_security.md) — Comprehensive 8-stage playbook for AppSec, OWASP Top 10 & PoC validation
- [Task Prompt Examples](.agents/references/task_prompt_examples.md) — Practical prompt templates for dispatching tasks to specialized agents

---

## 🤖 6 Specialized Autonomous Agents (@mentions)

Invoke specialized agents via `@` in chat prompts:

- `@agents_frontend` / `@agents-frontend`: UI/UX, React 18, Next.js 14, Tauri v2, Tailwind, shadcn/ui, Playwright TDD RED/GREEN, solid sticky headers.
- `@agents_backend` / `@agents-backend`: NestJS 11 CQRS, Prisma ORM, PostgreSQL 16, Redis, BullMQ, 4-layer defense, 1 handler per file.
- `@agents_review` / `@agents-review`: 5-axis code review, architecture integrity, security audit, zero N+1, 100% i18n, adversarial stress testing.
- `@agents_devops` / `@agents-devops`: DevOps, Docker Compose, PostgreSQL Expand/Contract migrations, Railway deployment, SemVer releases.
- `@agents_qa` / `@agents-qa`: QA, 100k+ SKU load benchmarks, chaos testing, memory backpressure, mock/real parity, cleanDatabase teardown.
- `@agents_security` / `@agents-security`: AppSec, OWASP Top 10 pentest, PoC validation, secret masking, TOCTOU SSRF defense, remediation plans.

---

## ⚡ Key Terminal Commands & Ports

- `pnpm docker:up` / `pnpm docker:down` — Docker (PG: 5432, Redis: 6379, MinIO: 9000/9001)
- `pnpm dev` / `pnpm dev:backend` / `pnpm dev:admin` / `pnpm dev:desktop` — Dev servers
- `pnpm --filter @smartfeed/backend-api test:e2e` / `pnpm test:desktop` / `pnpm test:admin` — Tests
- `pnpm --filter @smartfeed/shared build` — Compile shared contracts
- `pnpm lint:fix && pnpm format` — Lint & Prettier format
- `pnpm i18n:check` — Bilingual localization parity verification
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

---

## 🎯 Targeted Feature Testing Policy (Zero Redundant Full-Suite Runs)

- **Targeted Scope Only**: When implementing or fixing a specific feature, run **strictly** the tests covering that feature/page (e.g. `pnpm exec playwright test e2e/<feature>.spec.ts`).
- **Zero Redundant Full Runs**: Never run the entire global test suite (all 99+ desktop specs or all backend E2E suites) during feature work. Full suites are executed ONLY upon explicit user command or during release verification.

---

## ⚡ 100% MCP Auto-Approval & Zero Confirmation Questions Policy (Strict)

- **Zero Confirmation Questions**: The agent must **NEVER** ask confirmation questions (via `ask_question`, modals, or chat messages) before calling or accessing ANY MCP tool (`call_mcp_tool`, `mcp_*`).
- **100% Auto-Approved**: All MCP tools across all servers (`playwright`, `sentry`, `shadcn`, `railway`, `postgres`, `redis`, `firecrawl`, `context7`, `github`) are pre-approved and executed autonomously and immediately.
