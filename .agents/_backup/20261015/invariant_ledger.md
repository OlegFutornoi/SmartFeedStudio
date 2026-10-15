# Invariant Ledger (SmartFeed Studio)

Snapshot Date: 2026-10-15
Purpose: Canonical tracking of all project invariants extracted from rules, skills, playbooks, and AGENTS.md.
Execution Rule: Every invariant removed from multiple duplicate locations MUST exist in exactly one canonical location.

---

## 1. Core Invariants (CORE)

- CORE-01: Zero relative imports (`../` or `./` across packages). All internal imports must strictly use `@/` alias or `@smartfeed/shared`.
  - Old locations: `rules.md`, `engineering_discipline_and_planning.md`, `code_review_and_skills.md`, root `AGENTS.md`, `.agents/AGENTS.md`, `frontend/SKILL.md`, `backend/SKILL.md`.
  - New canonical location: `.agents/rules/core.md`.

- CORE-02: Zero silent failures. Empty or comment-only `catch {}` blocks are strictly forbidden. Catch blocks must log structured diagnostic warning (`this.logger.warn` or `console.warn`) or throw an explicit domain `HttpException`.
  - Old locations: `engineering_discipline_and_planning.md`, `code_review_and_skills.md`, `agents_backend.md`, `backend/SKILL.md`, `frontend/SKILL.md`.
  - New canonical location: `.agents/rules/core.md`.

- CORE-03: Zero `as any` type bypasses. No `as any` in application logic, controllers, Prisma clauses, or DTOs. Use generated Prisma types, Zod parsers, type guards, or `unknown`.
  - Old locations: `engineering_discipline_and_planning.md`, `code_review_and_skills.md`, `agents_backend.md`, `backend/SKILL.md`, `contract-first-api/SKILL.md`.
  - New canonical location: `.agents/rules/core.md`.

- CORE-04: File size budget (<250-300 lines). No monolithic God-files. Controllers, handlers, components, services, and hooks must stay under 250-300 lines by extracting sub-components and helpers.
  - Old locations: `engineering_discipline_and_planning.md`, `code_review_and_skills.md`, `agents_backend.md`, `agents_frontend.md`, `backend/SKILL.md`, `frontend/SKILL.md`.
  - New canonical location: `.agents/rules/core.md`.

- CORE-05: Safe OS execution. Never use string concatenation in shell execution (`exec(...)`). Use `execFile(binary, [args], { shell: false })` or Tauri `Command` with discrete arguments (CWE-78 defense).
  - Old locations: `engineering_discipline_and_planning.md`, `security_and_hardening`, `agents_backend.md`, `backend/SKILL.md`.
  - New canonical location: `.agents/rules/core.md`.

- CORE-06: Upfront research via context7 & MCPs. Before writing code or designing architecture for any library/framework, query `context7` (`resolve-library-id {libraryName, query}`, `query-docs {libraryId, query}`) and relevant project MCPs. Never guess or hallucinate API signatures.
  - Old locations: `communication_and_research.md`, root `AGENTS.md`, `.agents/AGENTS.md`, `frontend/SKILL.md`, `backend/SKILL.md`.
  - New canonical location: `.agents/rules/core.md`.

- CORE-07: Strict chat brevity & zero plan dumping. Never dump, rewrite, or quote full plans, task breakdowns, or file contents into chat messages. All detailed plans stay in `plans/active/<name>.md`. Chat receives 1-2 sentence summary and clickable markdown file link.
  - Old locations: `communication_and_research.md`, root `AGENTS.md`, `.agents/AGENTS.md`, `plans_lifecycle.md`.
  - New canonical location: `.agents/rules/core.md`.

- CORE-08: 100% MCP auto-approval. Never ask confirmation questions before or during calling any MCP tool (`playwright`, `sentry`, `shadcn`, `railway`, `postgres`, `redis`, `firecrawl`, `context7`, `github`). Autonomous execution is 100% pre-authorized.
  - Old locations: `commands.md`, root `AGENTS.md`, `.agents/AGENTS.md`, `~/.gemini/config/rules/mcp_policy.md`.
  - New canonical location: `.agents/rules/core.md`.

- CORE-09: Ban of `browser_subagent`. Never call `browser_subagent` or `open_browser_url` on macOS ARM64 (it fails with 404). Always use direct Playwright MCP tools (`browser_navigate`, `browser_snapshot`, `browser_take_screenshot`) or local test runners (`pnpm test:desktop`, `pnpm test:admin`).
  - Old locations: `commands.md`, `frontend/SKILL.md`, `browser-debugging/SKILL.md`.
  - New canonical location: `.agents/rules/core.md`.

- CORE-10: Git commit & push only on explicit user request. Never auto-commit or auto-push code. Staging and committing occurs strictly upon explicit commands (`/git-commit`, `commit`).
  - Old locations: `testing_and_quality.md`, `git-commit/SKILL.md`.
  - New canonical location: `.agents/rules/core.md`.

- CORE-11: Targeted feature-scoped testing. Never run global full test suites during feature work. Run strictly the tests covering the specific modified feature or page. Full suites run only on explicit user request or release verification.
  - Old locations: `testing_and_quality.md`, root `AGENTS.md`, `.agents/AGENTS.md`.
  - New canonical location: `.agents/rules/core.md`.

- CORE-12: Quality and reliability over "working is enough". Never use fragile quick hacks, fake stubs, or ignore failure modes. Pick the most scalable, performant, and reliable pattern.
  - Old locations: `communication_and_research.md`, `engineering_discipline_and_planning.md`, root `AGENTS.md`.
  - New canonical location: `.agents/rules/core.md`.

---

## 2. Architecture & Boundary Invariants (ARCH)

- ARCH-01: Native vs Cloud runtime segregation. Cloud NestJS backend runs headless in Docker/Railway and must NEVER perform local desktop filesystem operations (`fs.unlinkSync`, `fs.mkdirSync` on client workspaces). Local catalogs, SQLite, and client workspace files belong 100% to Tauri v2 Rust (`src-tauri`).
  - Old locations: `rules.md`, `agents_backend.md`, `backend/SKILL.md`.
  - New canonical location: `.agents/rules/backend.md`.

- ARCH-02: Zero headless server GUI spawns. Never invoke OS file explorers (`open`, `explorer`, `xdg-open`) inside cloud backend API (CWE-400). GUI actions belong strictly to desktop client.
  - Old locations: `agents_backend.md`, `backend/SKILL.md`, `agents_security.md`.
  - New canonical location: `.agents/rules/backend.md`.

- ARCH-03: Shared contracts first. All API DTOs, Zod validation schemas, and enums reside in `packages/shared`. Always run `pnpm --filter @smartfeed/shared build` after contract edits. Zero inline ad-hoc types across client and backend.
  - Old locations: `rules.md`, `contract-first-api/SKILL.md`, `engineering_discipline_and_planning.md`.
  - New canonical location: `.agents/rules/backend.md`.

- ARCH-04: Strict CQRS modularity. Each Command Handler and Query Handler must reside in its own dedicated file (<120-150 lines). Bundling multiple handlers into one file is prohibited. Command Handlers return `{ id }` or void, never full read entities.
  - Old locations: `agents_backend.md`, `backend/SKILL.md`, `nestjs-best-practices/SKILL.md`.
  - New canonical location: `.agents/rules/backend.md`.

- ARCH-05: UsersModule zero JWT awareness. UsersModule handles database persistence for users via PrismaService. AuthModule handles JWT issuance, validation, and strategy, communicating with UsersModule strictly via CommandBus/QueryBus.
  - Old locations: `rules.md`, `agents_backend.md`, `agents_review.md`.
  - New canonical location: `.agents/rules/backend.md`.

- ARCH-06: Facade architecture for multi-domain modules. Any service or client with multiple domains must split into domain modules with a thin root `index.ts` facade.
  - Old locations: `engineering_discipline_and_planning.md`.
  - New canonical location: `.agents/rules/backend.md`.

---

## 3. Database & Prisma Invariants (DB)

- DB-01: 100% Foreign Key indexes. Every foreign key column in `schema.prisma` MUST have an explicit `@@index([fkColumn])`. PostgreSQL does NOT auto-index foreign keys.
  - Old locations: `postgres_skills.md`, `prisma-postgres-mastery/SKILL.md`, `backend/SKILL.md`, `agents_backend.md`.
  - New canonical location: `.agents/rules/database.md`.

- DB-02: Mandatory `@db.Timestamptz(6)`. All `DateTime` fields in `schema.prisma` must explicitly declare `@db.Timestamptz(6)` for timezone awareness. Never use `timestamp without time zone`.
  - Old locations: `postgres_skills.md`, `prisma-postgres-mastery/SKILL.md`, `backend/SKILL.md`, `agents_backend.md`.
  - New canonical location: `.agents/rules/database.md`.

- DB-03: 100% snake_case mapping. All Prisma models use `@@map("table_name")` and all columns use `@map("column_name")`. No camelCase identifiers in PostgreSQL.
  - Old locations: `postgres_skills.md`, `prisma-postgres-mastery/SKILL.md`, `backend/SKILL.md`.
  - New canonical location: `.agents/rules/database.md`.

- DB-04: CUID primary keys. All entities use `@id @default(cuid())` for ordered B-tree insertion without index fragmentation.
  - Old locations: `postgres_skills.md`, `prisma-postgres-mastery/SKILL.md`, `backend/SKILL.md`.
  - New canonical location: `.agents/rules/database.md`.

- DB-05: Cascade deletions (`onDelete: Cascade`). All parent-child foreign key relations declare `onDelete: Cascade` to ensure zero orphaned records (L-001).
  - Old locations: `rules.md`, `postgres_skills.md`, `prisma-postgres-mastery/SKILL.md`, `backend/SKILL.md`.
  - New canonical location: `.agents/rules/database.md`.

- DB-06: Zero N+1 queries. Never execute queries inside loops (`.map()`, `for`). Use `findMany({ where: { id: { in: ids } } })` or `include`/`select`.
  - Old locations: `postgres_skills.md`, `prisma-postgres-mastery/SKILL.md`, `backend/SKILL.md`.
  - New canonical location: `.agents/rules/database.md`.

- DB-07: Cursor pagination on high-volume feeds. Large catalog and feed endpoints must use cursor pagination (`take`, `skip: cursor ? 1 : 0`, `cursor: { id }`). `OFFSET` pagination is forbidden on high-volume datasets.
  - Old locations: `postgres_skills.md`, `postgresql-optimization/SKILL.md`, `backend/SKILL.md`.
  - New canonical location: `.agents/rules/database.md`.

- DB-08: Short transactions. `$transaction()` must never wrap external HTTP calls, S3 presigned URL generation, emails, or BullMQ queue pushes. Keep transaction scope strictly to DB writes.
  - Old locations: `postgres_skills.md`, `prisma-postgres-mastery/SKILL.md`, `backend/SKILL.md`.
  - New canonical location: `.agents/rules/database.md`.

- DB-09: Connection pooling via `@prisma/adapter-pg`. PrismaService must use `Pool` from `pg` via adapter. Never create direct connections per request.
  - Old locations: `postgres_skills.md`, `prisma-postgres-mastery/SKILL.md`.
  - New canonical location: `.agents/rules/database.md`.

- DB-10: GIN `pg_trgm` indexes for text search. Any `ILIKE '%term%'` text search on high-cardinality fields (email, fullName, title) requires a GIN trgm index.
  - Old locations: `postgres_skills.md`, `postgresql-optimization/SKILL.md`.
  - New canonical location: `.agents/rules/database.md`.

- DB-11: Zero-downtime Expand/Contract migrations. Production schema changes must follow Expand/Contract with `SET lock_timeout = '2s'` before DDL. `prisma db push` is forbidden in production.
  - Old locations: `postgres_skills.md`, `agents_devops.md`, `backend/SKILL.md`.
  - New canonical location: `.agents/rules/database.md`.

- DB-12: Strict Prisma types. Use generated Prisma types (e.g. `Prisma.UserWhereInput`) in repository/service methods. Never bypass typechecking with `as any`.
  - Old locations: `postgres_skills.md`, `backend/SKILL.md`.
  - New canonical location: `.agents/rules/database.md`.

---

## 4. Backend & API Invariants (BE)

- BE-01: 100% validated DTOs. Every `@Body()` and `@Query()` in NestJS controllers must use a dedicated class decorated with `class-validator` (`@IsString()`, `@IsInt()`, `@Min()`, `@Type(() => Number)`). Never accept raw untyped queries or bodies.
  - Old locations: `engineering_discipline_and_planning.md`, `agents_backend.md`, `backend/SKILL.md`.
  - New canonical location: `.agents/rules/backend.md`.

- BE-02: 100% protected mutation endpoints. Every `POST`, `PUT`, `DELETE`, `PATCH` endpoint must declare `@UseGuards(JwtAuthGuard, ...)` (and `@Roles(...)` if administrative) unless explicitly decorated with `@Public()`.
  - Old locations: `agents_backend.md`, `backend/SKILL.md`, `agents_security.md`.
  - New canonical location: `.agents/rules/backend.md`.

- BE-03: Guard-Decorator parity. Whenever `@CurrentUser()` is used in a controller handler, the route must have `@UseGuards(JwtAuthGuard)` or `@UseGuards(OptionalJwtAuthGuard)` so Passport populates `request.user`.
  - Old locations: `agents_backend.md`, `backend/SKILL.md`.
  - New canonical location: `.agents/rules/backend.md`.

- BE-04: Zero hardcoded fallback secrets (CWE-798). Never use string fallbacks (`|| 'secret'`, `?? 'key'`) for JWT secrets, HMAC keys, encryption keys, or API tokens. Fail fast at bootstrap or throw `InternalServerErrorException`.
  - Old locations: `agents_backend.md`, `backend/SKILL.md`, `agents_security.md`.
  - New canonical location: `.agents/rules/backend.md`.

- BE-05: Secret masking. Merchant credentials (`merchantSecretKey`), password hashes, and merchant tokens must NEVER be returned in plaintext in REST responses (mask as `••••••••` or boolean `isConfigured`).
  - Old locations: `agents_backend.md`, `backend/SKILL.md`, `secret-serialization/SKILL.md`.
  - New canonical location: `.agents/rules/security.md`.

- BE-06: OWASP API4 commercial upgrade gating. Commercial plan upgrades (price > 0) strictly require an approved `PaymentTransaction` reference or return 402 Payment Required. Gated sandbox simulation allowed only in non-production.
  - Old locations: `agents_backend.md`, `backend/SKILL.md`, `agents_security.md`.
  - New canonical location: `.agents/rules/backend.md`.

- BE-07: Concurrency & TOCTOU protection. Sensitive quota operations (seat claiming, credit deduction, invitation tokens) must use mutex locks (`OrganizationMutex`) or serializable transactions to prevent double-allocation race conditions.
  - Old locations: `engineering_discipline_and_planning.md`, `agents_backend.md`, `backend/SKILL.md`.
  - New canonical location: `.agents/rules/backend.md`.

- BE-08: SSRF TOCTOU defense. External URL fetching (feeds, webhooks) must pin the verified safe IP address between DNS lookup and HTTP fetch to prevent DNS rebinding attacks.
  - Old locations: `agents_backend.md`, `agents_security.md`, `security-and-hardening/SKILL.md`.
  - New canonical location: `.agents/rules/security.md`.

- BE-09: Large feed SAX streaming backpressure. Catalogs with 100k+ SKU must use streaming SAX parsers and chunked batch writes (500-1000 items) to prevent Node.js heap OOM.
  - Old locations: `agents_backend.md`, `streaming-large-feeds/SKILL.md`, `backend/SKILL.md`.
  - New canonical location: `.agents/rules/backend.md`.

- BE-10: BullMQ queue resilience. Asynchronous background jobs must declare unique `jobId` for idempotency, exponential backoff retries, and route exhausted failures to a Dead Letter Queue (DLQ).
  - Old locations: `agents_backend.md`, `bullmq-jobs/SKILL.md`, `backend/SKILL.md`.
  - New canonical location: `.agents/rules/backend.md`.

---

## 5. Frontend & UI/UX Invariants (FE & UI)

- FE-01: Zero duplicate API calls. Frontend context providers and pages must use `useRef` guards (`isFetchingRef`, `lastFetchedTokenRef`) to prevent redundant concurrent fetches.
  - Old locations: `frontend_network_dedup.md`, `agents_frontend.md`, `frontend/SKILL.md`.
  - New canonical location: `.agents/rules/frontend.md`.

- FE-02: No `React.StrictMode` double mounting. Never wrap `<App />` in `<React.StrictMode>` in `apps/desktop/src/main.tsx` and maintain `reactStrictMode: false` in `apps/admin-portal/next.config.mjs`.
  - Old locations: `frontend_network_dedup.md`, `frontend/SKILL.md`.
  - New canonical location: `.agents/rules/frontend.md`.

- FE-03: Zero redundant `/auth/me` on login/register. Login and register endpoints return the full user profile with JWT; never trigger a cascaded `GET /auth/me` immediately after successful authentication.
  - Old locations: `frontend_network_dedup.md`, `frontend/SKILL.md`.
  - New canonical location: `.agents/rules/frontend.md`.

- FE-04: Lean `useCallback` dependency arrays. Never include UI-only state (`locale`, `theme`, `isUk`) in data fetching `useCallback` dependency arrays unless the HTTP query itself requires localization.
  - Old locations: `frontend_network_dedup.md`, `frontend/SKILL.md`.
  - New canonical location: `.agents/rules/frontend.md`.

- FE-05: Mandatory Table Row extraction. Any DataTable with >3 columns or interactive cells (actions, switches, badges) must extract row rendering into `*TableRow.tsx` (<150 lines). Never inline all cells in the table map.
  - Old locations: `agents_frontend.md`, `frontend/SKILL.md`.
  - New canonical location: `.agents/rules/frontend.md`.

- FE-06: List page modularity. List pages must extract dialogs into `*DialogsContainer.tsx` and modal state into `use*PageState.ts` to keep the main page orchestrator <180 lines.
  - Old locations: `agents_frontend.md`, `frontend/SKILL.md`.
  - New canonical location: `.agents/rules/frontend.md`.

- FE-07: Session storage decoupling. Context providers must encapsulate `localStorage` reads/writes into dedicated storage utilities (e.g. `authSessionStorage.ts`), avoiding direct scattered `localStorage` calls in UI components.
  - Old locations: `agents_frontend.md`, `frontend/SKILL.md`.
  - New canonical location: `.agents/rules/frontend.md`.

- FE-08: Mock ⇄ Real parity. Local browser `mockDatabaseDriver`, native Tauri SQLite, and NestJS API must return identical data relations (`supplierName`), cascade deletes, and quota calculations.
  - Old locations: `rules.md`, `mock-real-parity/SKILL.md`, `agents_qa.md`.
  - New canonical location: `.agents/rules/frontend.md`.

- UI-01: 100% Solid Sticky Headers. Sticky table headers (`thead.sticky.top-0`) and modal headers/footers must have solid opaque backgrounds (`bg-card`, `bg-muted`, `bg-background`). Translucent `backdrop-blur` without solid background is strictly prohibited.
  - Old locations: `design_system_and_theming.md`, `agents_frontend.md`, `ui-ux-pro-max/SKILL.md`, `frontend/SKILL.md`.
  - New canonical location: `.agents/rules/frontend.md`.

- UI-02: Zero off-scheme palette colors. Strictly use semantic theme tokens (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-destructive`, `bg-muted`, `bg-success`). Hardcoded colors (`purple-*`, `violet-*`, `fuchsia-*`, `pink-*`) are prohibited.
  - Old locations: `design_system_and_theming.md`, `agents_frontend.md`, `ui-ux-pro-max/SKILL.md`, `frontend/SKILL.md`.
  - New canonical location: `.agents/rules/frontend.md`.

- UI-03: Semantic success status badge. Success status badges use the semantic `--success` token (e.g. `bg-success/15 text-success border-success/30`), mapping to emerald/green without ad-hoc palette overrides.
  - Old locations: Conflict resolution between `frontend/SKILL.md` (no emerald) and `testing_and_quality.md` (expect /emerald/).
  - New canonical location: `.agents/rules/frontend.md`.

- UI-04: Zero duplicate action/CTA buttons. If an empty state card provides a CTA button (e.g. "Add Supplier"), the header/toolbar CTA must be hidden (`items.length === 0 && !search ? null : <Button ...>`).
  - Old locations: `design_system_and_theming.md`, `agents_frontend.md`, `ui-ux-pro-max/SKILL.md`, `frontend/SKILL.md`.
  - New canonical location: `.agents/rules/frontend.md`.

- UI-05: Mandatory official shadcn installation. Base UI primitives must be installed via official CLI (`npx shadcn@latest add <component> -y`), never hand-rolled from scratch. Inventory maintained in `apps/desktop/src/components/ui/COMPONENTS.md`.
  - Old locations: `agents_frontend.md`, `ui-ux-pro-max/SKILL.md`, `frontend/SKILL.md`.
  - New canonical location: `.agents/rules/frontend.md`.

- UI-06: Compact typography and tabular numbers. DataTable cells use `text-xs` (`px-3 py-2`), `h-9` headers, and `tabular-nums` for counters, IDs, and financial values.
  - Old locations: `code_review_and_skills.md`, `frontend/SKILL.md`.
  - New canonical location: `.agents/rules/frontend.md`.

---

## 6. Internationalization Invariants (I18N)

- I18N-01: 100% bilingual parity (UK ⇄ EN). All user-visible strings must have identical keys defined in both `locales/uk/*.json` and `locales/en/*.json`. Validated via `pnpm i18n:check`.
  - Old locations: `testing_and_quality.md`, `i18n-localization/SKILL.md`, `agents_frontend.md`.
  - New canonical location: `.agents/rules/i18n.md`.

- I18N-02: Zero raw untranslated keys in UI. Raw keys (e.g. `common:edit`, `suppliers:title`) must never render in the UI.
  - Old locations: `testing_and_quality.md`, `i18n-localization/SKILL.md`.
  - New canonical location: `.agents/rules/i18n.md`.

- I18N-03: Translated HTML attributes. Tooltips, titles (`title={t('...')}`), and accessibility labels (`aria-label={t('...')}`) must be localized. Never hardcode English strings in attributes.
  - Old locations: `testing_and_quality.md`, `i18n-localization/SKILL.md`, `frontend/SKILL.md`.
  - New canonical location: `.agents/rules/i18n.md`.

- I18N-04: Backend error mapping. Server error responses must be intercepted and translated via `getErrorMessage(err, t)` so raw English error messages never leak into the Ukrainian interface.
  - Old locations: `testing_and_quality.md`, `i18n-localization/SKILL.md`, `frontend/SKILL.md`.
  - New canonical location: `.agents/rules/i18n.md`.

- I18N-05: Zero English backend enums in UI tables. In Ukrainian locale, status badges must never display raw English enums (`APPROVED`, `Active`, `Done`, `Suspended`, `PENDING`). Use localized display values (`Оплачено`, `Активна`).
  - Old locations: `testing_and_quality.md`.
  - New canonical location: `.agents/rules/i18n.md`.

---

## 7. Testing & Quality Invariants (TEST)

- TEST-01: Mandatory `cleanDatabase` teardown (zero test leftovers). Every E2E test suite creating database rows must call `cleanDatabase` in `beforeAll` AND `afterAll` using FK-safe deletion order.
  - Old locations: `testing_and_quality.md`, `agents_backend.md`, `agents_qa.md`, `test-driven-development/SKILL.md`.
  - New canonical location: `.agents/rules/testing.md`.

- TEST-02: Frontend test isolation. Playwright tests must reset `localStorage`, `sessionStorage`, cookies, and route handlers before and after each test case.
  - Old locations: `testing_and_quality.md`, `playwright-automation/SKILL.md`.
  - New canonical location: `.agents/rules/testing.md`.

- TEST-03: Real business data assertions (zero superficial tests). Tests must assert real data values (e.g. `expect(name).not.toBe('Постачальник')`) to prevent column header leakage into data rows.
  - Old locations: `testing_and_quality.md`, `agents_qa.md`, `frontend/SKILL.md`.
  - New canonical location: `.agents/rules/testing.md`.

- TEST-04: Client avatar assertions. User and client table columns must assert visible avatar (`[data-testid="user-avatar"]`).
  - Old locations: `testing_and_quality.md`.
  - New canonical location: `.agents/rules/testing.md`.

- TEST-05: Single-request performance tests. Key views (Dashboard, Navigation, Suppliers, Licenses) must include tests asserting endpoints are called strictly 1 time on page load (`requestCount === 1`).
  - Old locations: `frontend_network_dedup.md`, `testing_and_quality.md`.
  - New canonical location: `.agents/rules/testing.md`.

- TEST-06: Strict TDD RED -> GREEN cycle. Write automated test first -> confirm expected functional failure (RED) -> implement minimal code -> confirm pass (GREEN).
  - Old locations: `test-driven-development/SKILL.md`, `agents_backend.md`, `agents_frontend.md`.
  - New canonical location: `.agents/rules/testing.md`.

- TEST-07: Static typecheck clean. `tsc --noEmit` must pass with 0 errors across all monorepo packages after any change.
  - Old locations: `testing_and_quality.md`, `code_review_and_skills.md`.
  - New canonical location: `.agents/rules/testing.md`.

---

## 8. Security & Hardening Invariants (SEC)

- SEC-01: 4-Layer Defense-in-Depth. Layer 1 (DTO validation), Layer 2 (Domain/Quota limits), Layer 3 (RBAC/Tenant guard), Layer 4 (DB constraints & atomic transactions).
  - Old locations: `agents_backend.md`, `agents_security.md`, `security-and-hardening/SKILL.md`.
  - New canonical location: `.agents/rules/security.md`.

- SEC-02: Zero secret serialization sinks. Password hashes, private keys, and tokens must never appear in `JSON.stringify`, Sentry error telemetry spans, or application logs.
  - Old locations: `secret-serialization/SKILL.md`, `agents_security.md`.
  - New canonical location: `.agents/rules/security.md`.

- SEC-03: Tauri v2 IPC command parameter validation. All Tauri commands in `src-tauri` must validate input paths, prevent path traversal (`..`), and restrict keychain access to authorized service namespaces.
  - Old locations: `tauri-v2-security-and-ipc/SKILL.md`, `agents_security.md`.
  - New canonical location: `.agents/rules/security.md`.

- SEC-04: BOLA/IDOR tenant scoping. Every query and mutation operating on tenant resources must explicitly scope by `organizationId` from authenticated user session, never trusting client-supplied organization IDs.
  - Old locations: `api-security-testing/SKILL.md`, `agents_security.md`.
  - New canonical location: `.agents/rules/security.md`.

---

## 9. DevOps & Documentation Invariants (OPS & DOCS)

- OPS-01: Continuous WIKI and AGENTS.md synchronization. Whenever architecture, CQRS commands, Prisma models, shared DTOs, or ports change, update `wiki/` and respective `AGENTS.md` sub-guides in the same turn.
  - Old locations: `wiki_and_documentation.md`.
  - New canonical location: `.agents/rules/docs_and_ops.md`.

- OPS-02: Backend E2E coverage documentation. Whenever an `*.e2e-spec.ts` test is added or modified, update the coverage tables in `services/backend-api/README.md` and `services/backend-api/AGENTS.md`.
  - Old locations: `wiki_and_documentation.md`.
  - New canonical location: `.agents/rules/docs_and_ops.md`.

- OPS-03: SemVer release governance. Regular commits push code directly; release commits (`/git-commit --release [patch|minor|major]`) bump version, create annotated git tag `v*`, and trigger GitHub Action release pipelines.
  - Old locations: `testing_and_quality.md`, `git-commit/SKILL.md`, `release-and-rollback/SKILL.md`.
  - New canonical location: `.agents/rules/docs_and_ops.md`.

---

## 10. Plans Lifecycle Invariants (PLAN)

- PLAN-01: 3-directory lifecycle. Plans reside strictly in `plans/active/`, `plans/backlog/`, or `plans/completed/`.
  - Old locations: `plans_lifecycle.md`.
  - New canonical location: `.agents/rules/core.md`.

- PLAN-02: Prohibition of premature execution. Creating a plan in `plans/active/` gives no authority to modify code or database until explicit user approval ("починай", "виконуй", "реалізуй").
  - Old locations: `plans_lifecycle.md`.
  - New canonical location: `.agents/rules/core.md`.

- PLAN-03: Automatic move to completed on DoD. Once a task is implemented and 100% verified by tests, move the plan to `plans/completed/<name>.md`, update status header, and update `plans/README.md`.
  - Old locations: `plans_lifecycle.md`.
  - New canonical location: `.agents/rules/core.md`.

---

## 11. Conflict Resolutions

1. Emerald status color vs Semantic token ban:
   - Conflict: `frontend/SKILL.md` banned `emerald-*`, but `testing_and_quality.md` asserted `toHaveClass(/emerald/)`.
   - Resolution: Defined `UI-03`. Success badges use semantic `--success` token mapping to emerald (`bg-success/15 text-success border-success/30`), maintaining semantic harmony while satisfying the test assertion.
2. 7-stage vs 8-stage lifecycle:
   - Conflict: Master skills specified 7 stages; agent rules specified 8 stages.
   - Resolution: Standardized on 8 stages across all agents, master skills, and documentation.
