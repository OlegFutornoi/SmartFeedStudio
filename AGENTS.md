# SmartFeed Studio — Agent & Engineering Architecture Guide

## 1. System Mission & Tech Stack

Enterprise platform for parsing, editing, and syncing XML/CSV product feeds with encrypted local SQLite, Cloudflare R2 / S3 object storage, and AI-driven catalog enrichment.

- Admin Portal: Next.js 14 App Router (`apps/admin-portal`, port 3000)
- Desktop Client: Tauri v2 + React 18 (`apps/desktop`, port 1420) — Native SQLite (SQLCipher) + OS Keychain
- Documentation Portal: Astro Starlight (`apps/docs`, port 4321) — Bilingual Docs-as-Code & Cloudflare Pages
- Backend API: NestJS 11 CQRS + Prisma + BullMQ (`services/backend-api`, port 4000)
- Contracts: `@smartfeed/shared`
- Automated Tests: `e2e/` (`@smartfeed/e2e`)
- Infrastructure: PostgreSQL 16 (port 5432), Redis 7 (port 6379), MinIO S3 (port 9000/9001), Cloudflare R2

## 2. Rules Architecture (`.agents/rules/`)

All invariants are indexed by unique IDs and partitioned into 10 domain files:

- [core.md](file:///.agents/rules/core.md) — Universal invariants: path aliases, zero silent failures, no any, file budgets, safe OS exec, context7 research, brevity, MCP auto-approval, targeted testing.
- [agents.md](file:///.agents/rules/agents.md) — Autonomous agent router and mandatory 8-stage lifecycle.
- [backend.md](file:///.agents/rules/backend.md) — Native vs cloud segregation, CQRS modularity, DTO validation, mutation guards, mutex protection.
- [database.md](file:///.agents/rules/database.md) — PostgreSQL 16 & Prisma: 100% FK indexes, timestamptz(6), snake_case, CUIDs, cascade deletes, zero N+1, cursor pagination.
- [frontend.md](file:///.agents/rules/frontend.md) — React 18, Next.js 14, Tauri: request dedup (useRef), session storage, mock/real parity, row/dialog modularity, in-flight deduplication.
- [ui.md](file:///.agents/rules/ui.md) — UI design system: semantic tokens, 100% solid sticky headers, official shadcn primitives, micro-typography, form hygiene, accessible interactive primitives.
- [i18n.md](file:///.agents/rules/i18n.md) — Bilingual parity (UK/EN), translated attributes, backend error mapping, zero raw keys.
- [testing.md](file:///.agents/rules/testing.md) — cleanDatabase teardown, test isolation, real business data assertions, TDD RED->GREEN.
- [security.md](file:///.agents/rules/security.md) — 4-layer defense, zero secret serialization leaks, secret masking, BOLA tenant isolation, SSRF IP pinning.
- [docs_and_ops.md](file:///.agents/rules/docs_and_ops.md) — WIKI synchronization, backend E2E coverage tables, SemVer releases, monorepo ports.

## 3. Specialized Autonomous Agents

- Planner & Architecture Agent: `@agents_planner` / `@agents-planner` (`.agents/agents/planner.md`)
- Frontend Agent: `@agents_frontend` / `@agents-frontend` (`.agents/agents/frontend.md`)
- Backend Agent: `@agents_backend` / `@agents-backend` (`.agents/agents/backend.md`)
- Code Review Agent: `@agents_review` / `@agents-review` (`.agents/agents/review.md`)
- QA & Benchmarks Agent: `@agents_qa` / `@agents-qa` (`.agents/agents/qa.md`)
- DevOps & Release Agent: `@agents_devops` / `@agents-devops` (`.agents/agents/devops.md`)
- Security & Pentest Agent: `@agents_security` / `@agents-security` (`.agents/agents/security.md`)

## 4. Key Commands

- Infrastructure: `pnpm docker:up` / `pnpm docker:down`
- Dev servers: `pnpm dev` / `pnpm dev:backend` / `pnpm dev:admin` / `pnpm dev:desktop` / `pnpm dev:docs`
- Docs portal build: `pnpm build:docs`
- Testing: `pnpm e2e:server` / `pnpm e2e:local` / `pnpm e2e:server:backend` / `pnpm e2e:server:admin` / `pnpm e2e:local:backend` / `pnpm e2e:local:desktop`
- Contracts build: `pnpm --filter @smartfeed/shared build`
- Typecheck: `pnpm --filter @smartfeed/backend-api exec tsc --noEmit`
- Format & lint: `pnpm lint:fix && pnpm format`
- Localization check: `pnpm i18n:check`
- Invariants guardrail check: `pnpm invariants:check`
- MCP Knowledge Cache & Compression: `pnpm ai:cache` / `pnpm ai:compress` / `pnpm ai:omni`
