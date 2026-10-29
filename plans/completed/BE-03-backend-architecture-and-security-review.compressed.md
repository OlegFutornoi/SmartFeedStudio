# BE-03: Backend Architecture, Security, and Resilience Audit (Compressed Execution Plan)

- **ID / Status:** `BE-03` | Active Plan (29.10.2026)
- **Agents:** `@agents_planner` (Audit) -> `@agents_backend` (Implementation) -> `@agents_qa` (E2E in `e2e/`)
- **Target Packages:** `services/backend-api`, `packages/shared`, `prisma/schema.prisma`
- **Governing Rules:** `core.md`, `backend.md`, `database.md`, `security.md`, `agents.md`

---

## 1. Defect Registry (17 Findings across 5 Axes)

### Axis 1: Architecture & Environment Boundaries (Native vs Cloud Isolation)

- **[DEF-01] [CRITICAL] (`ARCH-01`, `ARCH-02`) Local filesystem operations in cloud container:**
  - Files: `services/backend-api/src/modules/storage/utils/workspace-disk.ts`, `workspace-backup.ts`, `commands/open-workspace-folder.handler.ts`, `migrate-workspace.handler.ts`, `init-workspace.handler.ts`
  - Issue: Cloud backend executes `fs.mkdirSync`, `fs.cpSync`, and creates `workspace.json`/`catalog.db` in `~/Documents/SmartFeedStudioData` inside Railway Docker container instead of delegating to client OS via Tauri v2 IPC.

### Axis 2: Security, Authentication & Multi-Tenancy (OWASP API Top 10)

- **[DEF-02] [CRITICAL] (`BE-04`, `CWE-798`) Hardcoded fallback secrets:**
  - Files: `services/backend-api/src/prisma/prisma.service.ts:14`, `modules/payments/commands/simulate-sandbox-webhook.handler.ts:39-40`
  - Issue: Default DB fallback `postgresql://postgres:postgrespassword@...` and test secret `flk3409refn54t54t*FNJRET`.
- **[DEF-03] [HIGH] (`CORE-02`, `SEC-01`) Broken email password reset flow:**
  - Files: `services/backend-api/src/modules/auth/auth.service.ts:122-145`, `modules/mail/mail.service.ts`
  - Issue: `forgotPassword` generates token but never invokes `MailService` (`sendPasswordResetEmail` missing).
- **[DEF-04] [HIGH] (`OWASP API2:2023`) Excessive 30d JWT access token TTL:**
  - File: `services/backend-api/src/modules/auth/services/token.service.ts:56-58`
  - Issue: Default `JWT_ACCESS_EXPIRATION=30d` instead of short-lived `15m` with refresh token rotation.
- **[DEF-06] [HIGH] (`SEC-01` Layer 2) Missing quota checks on suppliers and AI credits:**
  - Files: `services/backend-api/src/modules/suppliers/commands/handlers/create-supplier.handler.ts`, `modules/ai/llm-gateway.service.ts`
  - Issue: No validation of `license.maxSuppliersLimit` during supplier creation; no `aiCredits` deduction or `AbortSignal.timeout` in LLM gateway.
- **[DEF-07] [HIGH] (`SEC-04` BOLA/IDOR) Missing supplier organization isolation:**
  - Files: `services/backend-api/src/modules/suppliers/queries/get-suppliers.handler.ts:12`, `commands/handlers/create-supplier.handler.ts:11-25`, `suppliers.controller.ts:82-84`
  - Issue: Queries filter only by `userId` without `organizationId`. Invited team members cannot access company catalogs.
- **[DEF-08] [HIGH] (`SEC-05` SSRF TOCTOU) Missing HTTPS IP pinning:**
  - File: `services/backend-api/src/modules/feeds/queries/handlers/fetch-feed-url.handler.ts:30-38`
  - Issue: No IP pinning for `https:` requests allows DNS Rebinding during TLS handshake.
- **[DEF-09] [MEDIUM] (`CWE-312`) Plaintext secret storage in PostgreSQL:**
  - File: `services/backend-api/prisma/schema.prisma:352,489`
  - Issue: `merchantSecretKey` and `authHeaderValue` stored plaintext without AES-256-GCM encryption.

### Axis 3: Database Schema & Query Performance (PostgreSQL 16 & Prisma)

- **[DEF-11] [MEDIUM] (`DB-01`) Missing FK indexes on hierarchy models:**
  - File: `services/backend-api/prisma/schema.prisma:486,522`
  - Issue: Missing `@@index([parentFeedSourceId])` in `SupplierFeedSource` and `@@index([parentId])` in `SupplierCategoryRule` causes sequential table scans.
- **[DEF-12] [MEDIUM] (`DB-06`) N+1 per-file deletes in Storage GC worker:**
  - File: `services/backend-api/src/modules/storage/processors/storage-gc.processor.ts:51-58`
  - Issue: Individual `storageFile.delete` called inside `for` loop instead of batched `deleteMany({ where: { id: { in: ids } } })`.
- **[DEF-13] [MEDIUM] (`DB-07`) Offset pagination degradation on 50k+ storage files:**
  - File: `services/backend-api/src/modules/storage/queries/get-storage-files.handler.ts:51-53`
  - Issue: `skip: (page - 1) * limit` degrades linearly on 50k+ product images; requires cursor pagination.

### Axis 4: Concurrency, Queues & Distributed State

- **[DEF-05] [HIGH] (`BE-07`, `CWE-362`) In-memory mutex fails in horizontally scaled deployment:**
  - Files: `services/backend-api/src/modules/organizations/utils/organization-mutex.ts`, `modules/licenses/commands/select-tariff-plan.handler.ts:36`
  - Issue: In-memory `Map<string, Promise<void>>` allows concurrent requests across Railway replicas to bypass seat/quota limits. Requires distributed Redis lock (`SET lock:<key> <uuid> NX PX 15000`).
- **[DEF-10] [HIGH] (`CWE-400`, `OWASP API4`) Global 100MB body limit exposes endpoints to OOM DoS:**
  - File: `services/backend-api/src/main.ts:16-17`
  - Issue: `app.use(json({ limit: '100mb' }))` and `urlencoded({ limit: '100mb' })` expose public endpoints (`/api/auth/login`, `/api/users`) to memory exhaustion.
- **[DEF-14] [HIGH] (`CORE-12`, `BE-10`) Fake BullMQ stubs in FeedsController:**
  - File: `services/backend-api/src/modules/feeds/feeds.controller.ts:145-215`
  - Issue: `importAsync`, `getActiveJobs`, and `getJobStatus` return static mocks instead of enqueuing real BullMQ jobs.
- **[DEF-15] [HIGH] (`BE-07`) Non-atomic license activation in payment webhook:**
  - File: `services/backend-api/src/modules/payments/commands/handle-wayforpay-webhook.handler.ts:73-106`
  - Issue: Transaction marked `APPROVED` before `SelectTariffPlanCommand` completes. Failure loses customer license while subsequent webhooks skip activation.

### Axis 5: CQRS Modularity, Code Hygiene & Observability

- **[DEF-16] [LOW] (`ARCH-04`) CQRS violations & bus bypass in LegalModule:**
  - Files: `services/backend-api/src/modules/organizations/commands/update-organization.handler.ts:35-42`, `modules/legal/legal.controller.ts`
  - Issue: Command handlers return full entities instead of `{ id }`; `LegalController` calls `LegalService` directly bypassing CommandBus/QueryBus.
- **[DEF-17] [LOW] (`CORE-13`, `SEC-02`) Prisma error code leak & emoji logging:**
  - Files: `services/backend-api/src/common/filters/http-exception.filter.ts:65`, `main.ts:110-111`
  - Issue: Production exposes `Database error code: ${exception.code}`; emojis present in `logger.log`.

---

## 2. Remediation Plan (5 Phases)

### Phase 1: Secrets, Rate Limits & Gateway Hygiene (`DEF-02`, `DEF-04`, `DEF-09`, `DEF-10`, `DEF-17`)

1. Remove hardcoded DB URL in `prisma.service.ts`; fail fast on missing `DATABASE_URL`.
2. Delete test secret in `simulate-sandbox-webhook.handler.ts`; load from DB/ENV.
3. Reduce JWT TTL to `15m` in `token.service.ts`.
4. Lower global body limit to `2mb` in `main.ts`; replace emojis with `[BOOTSTRAP]` and `[SWAGGER]`.
5. Mask Prisma error codes in production in `GlobalHttpExceptionFilter`.
6. Implement AES-256-GCM encryption utility for `merchantSecretKey` and `authHeaderValue`.

### Phase 2: Email & SSRF Defense (`DEF-03`, `DEF-08`)

1. Create bilingual password reset HTML template in `mail/templates/password-reset-email.ts`.
2. Implement `sendPasswordResetEmail` in `mail.service.ts`.
3. Call `sendPasswordResetEmail` from `auth.service.ts:forgotPassword`.
4. Configure custom `undici.Agent` with `lookup` pinning verified IP for both `http:` and `https:`.

### Phase 3: Distributed Locks, Tenancy & Quotas (`DEF-05`, `DEF-06`, `DEF-07`)

1. Replace in-memory mutex with Redis `SET lock:<key> <uuid> NX PX 15000` (Lua release script) in `organization-mutex.ts`.
2. Add organization check and `license.maxSuppliersLimit` enforcement (Layer 2) in `CreateSupplierHandler`.
3. Filter suppliers by `OR: [{ organizationId }, { userId }]` in `GetSuppliersHandler`.
4. Add `AbortSignal.timeout(30_000)` and deduct `aiCredits` in `LlmGatewayService`.

### Phase 4: DB Optimization & Atomic Payments (`DEF-11`, `DEF-12`, `DEF-13`, `DEF-15`)

1. Add missing indexes (`@@index([parentFeedSourceId])`, `@@index([parentId])`) in `schema.prisma`.
2. Replace N+1 deletes in `StorageGcProcessor` with `Promise.allSettled` for S3 and batched `deleteMany`.
3. Implement cursor pagination (`cursor: { id }`) in `GetStorageFilesHandler`.
4. Make status update and license activation atomic in `HandleWayForPayWebhookHandler`.

### Phase 5: Storage Separation, BullMQ Queues & CQRS (`DEF-01`, `DEF-14`, `DEF-16`)

1. Isolate local filesystem operations (`workspace-disk.ts`) from cloud production; limit cloud storage strictly to S3/R2.
2. Connect `FeedsController` (`importAsync`, `getActiveJobs`, `getJobStatus`) to real BullMQ `feed-ingestion` queue.
3. Route `LegalController` requests through CQRS buses (`CommandBus` / `QueryBus`).

---

## 3. Definition of Done (4-Point DoD)

1. `pnpm --filter @smartfeed/backend-api build` — Fresh build in `dist/`.
2. `pnpm --filter @smartfeed/backend-api exec tsc --noEmit` — 0 TypeScript errors.
3. `pnpm i18n:check` — 100% bilingual parity (`uk`/`en`).
4. `pnpm invariants:check` — 0 rule violations.
