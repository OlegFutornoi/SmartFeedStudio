# Monorepo Topology Map

## Domain Locations

- Shared Contracts (DTO, Zod, Enum): `packages/shared` (`pnpm --filter @smartfeed/shared build` after updates).
- Backend API (:4000): `services/backend-api/src/modules/*` (CQRS: `commands/`, `queries/`, `events/`, `dto/`).
- Prisma Database Schema: `services/backend-api/prisma/schema.prisma` (snake_case `@@map`, 100% FK indexes).
- Backend Integration Tests: `services/backend-api/test/*.e2e-spec.ts` (`cleanDatabase` teardown).
- Admin Portal (:3000): `apps/admin-portal` (Next.js 14 App Router, cloud backend).
- Desktop Client UI (:1420): `apps/desktop/src` (React 18, API clients `@/services/api/*`).
- Desktop Client Native: `apps/desktop/src-tauri/src` (`db.rs`, SQLCipher SQLite, OS Keychain).
- Mock/Local Driver: `mockDatabaseDriver`, `LocalProductsService` (parity with cloud backend).
- Playwright E2E Automation: `apps/*/e2e` (Page Object Model, `data-testid`).
- Documentation: `wiki/0X-*`, root `AGENTS.md`, and plans in `plans/{active,backlog,completed}`.
- Agent System: `.agents/rules`, `.agents/skills`, `.agents/agents/*.md` (rules <12,000 chars).

## Data Flows

- Desktop: UI -> `@/services/api/*` -> (Tauri `invoke` -> SQLite) or (HTTP -> NestJS) - both modes maintain 100% parity.
- Admin: UI -> HTTP -> NestJS -> CommandBus / QueryBus -> Prisma -> PostgreSQL 16.
- Feed Ingestion: URL -> fetch -> SAX stream parser -> items/categories -> atomic counter increment.
