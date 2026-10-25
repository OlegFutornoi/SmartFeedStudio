# Comprehensive 5-Axis Code Review & Quality Audit Report

**Date**: 2026-10-16  
**Auditor**: `@agents_review` (Code Review & Quality Audit Agent)  
**Scope**: 57 modified files (+2,189 / -611 lines) across Backend API, Desktop Client, Shared Contracts, and Infrastructure.  
**Audit Status**: **APPROVED WITH REMEDIATIONS (P1/P2/P3)**

---

## 1. Executive Summary & Quality Gates

| Quality Gate            | Invariant Standard             | Status                 | Evidence / Notes                                                                                                      |
| :---------------------- | :----------------------------- | :--------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| **Backend E2E Tests**   | `TEST-01`, `TEST-06`, `BE-08`  | ✅ **100% PASS**       | 10/10 passed in `services/backend-api/test/suppliers.e2e-spec.ts` (Jest, real DB, `cleanDatabase` teardown).          |
| **Frontend E2E Tests**  | `TEST-02`, `TEST-03`, `FE-01`  | ✅ **100% PASS**       | 7/7 passed in `apps/desktop/e2e/supplier-sync-tab.spec.ts` & `suppliers-crm-fields.spec.ts` (Playwright, 12.1s).      |
| **Static Typecheck**    | `TEST-07` (`tsc --noEmit`)     | ✅ **0 Errors**        | Passed cleanly across `@smartfeed/shared`, `@smartfeed/backend-api`, and `@smartfeed/desktop`.                        |
| **Bilingual Parity**    | `I18N-01` (`pnpm i18n:check`)  | ✅ **100% PASS**       | 100% parity across `en/suppliers.json` and `uk/suppliers.json`.                                                       |
| **Database Invariants** | `DB-01` - `DB-05`              | ✅ **100% PASS**       | 100% FK indexes, `timestamptz(6)`, `snake_case`, CUIDs, cascade deletes.                                              |
| **Security & RBAC**     | `SEC-01` - `SEC-06`, `BE-02`   | ⚠️ **1 Finding (P2)**  | All mutation routes guarded with `JwtAuthGuard`; BOLA isolation verified; 1 un-decorated `@Query('limit')`.           |
| **Frontend & UI Theme** | `UI-01` - `UI-07`              | ⚠️ **2 Findings (P1)** | Translucent drawer header (`UI-01`); hardcoded emerald palette colors in 2 components (`UI-02`/`UI-03`).              |
| **CQRS Modularity**     | `ARCH-04` (1 File = 1 Handler) | ⚠️ **1 Finding (P2)**  | Multi-handler bundling in `suppliers.handlers.ts`, `supplier-sync.handlers.ts`, `supplier-pricing-rules.handlers.ts`. |

---

## 2. Detailed 5-Axis Findings

### Axis 1: Correctness & CQRS Architecture

#### Finding 1.1 (P2 - Medium): CQRS Handler Bundling Violates `ARCH-04`

- **Location**:
  - [`services/backend-api/src/modules/suppliers/queries/suppliers.handlers.ts`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/suppliers/queries/suppliers.handlers.ts) (lines 12, 88, 158, 198 — 4 query handlers in 1 file).
  - [`services/backend-api/src/modules/suppliers/queries/supplier-sync.handlers.ts`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/suppliers/queries/supplier-sync.handlers.ts) (lines 23, 67 — 2 query handlers in 1 file).
  - [`services/backend-api/src/modules/suppliers/commands/handlers/supplier-pricing-rules.handlers.ts`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/suppliers/commands/handlers/supplier-pricing-rules.handlers.ts) (lines 12, 53, 100 — 3 command handlers in 1 file).
- **Rule**: `ARCH-04: Strict CQRS Modularity (1 File = 1 Handler)` — Each handler must reside in its own dedicated file (<120-150 lines). Bundling multiple handlers into a single file is prohibited.
- **Remediation**: Decompose into single-handler files:
  - `queries/get-suppliers.handler.ts`
  - `queries/get-supplier-by-id.handler.ts`
  - `queries/get-supplier-categories.handler.ts`
  - `queries/get-supplier-pricing-rules.handler.ts`
  - `queries/get-supplier-sync-settings.handler.ts`
  - `queries/get-supplier-sync-logs.handler.ts`
  - `commands/handlers/create-supplier-pricing-rule.handler.ts`
  - `commands/handlers/update-supplier-pricing-rule.handler.ts`
  - `commands/handlers/delete-supplier-pricing-rule.handler.ts`

#### Finding 1.2 (P2 - Medium): Command Handlers Returning Full Read Entities

- **Location**:
  - [`services/backend-api/src/modules/suppliers/commands/handlers/create-supplier.handler.ts:56`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/suppliers/commands/handlers/create-supplier.handler.ts#L56)
  - [`services/backend-api/src/modules/suppliers/commands/handlers/update-supplier.handler.ts:68`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/suppliers/commands/handlers/update-supplier.handler.ts#L68)
- **Rule**: `ARCH-04` — Command Handlers return `{ id }` or void, never full read entities.
- **Note**: The current frontend and E2E test `suppliers.e2e-spec.ts` assert full returned entity payloads directly from `POST` and `PATCH`. While this accelerates client state updates, full CQRS decoupling prescribes returning `{ id }` and having the client refetch or hydrate via `GetSupplierByIdQuery`.

#### Finding 1.3 (P3 - Low): File Size Budget in Desktop API Client

- **Location**: [`apps/desktop/src/lib/api/suppliers.ts`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/lib/api/suppliers.ts) (310 lines).
- **Rule**: `CORE-04: File Size Budget (<250-300 Lines)`.
- **Remediation**: Extract category operations (`getSupplierCategories`, `toggleSupplierCategory`, `batchToggleSupplierCategories`, `updateSupplierCategoryRule`) into a separate [`apps/desktop/src/lib/api/supplier-categories.ts`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/lib/api/supplier-categories.ts), reducing `suppliers.ts` to ~190 lines.

---

### Axis 2: Security & Hardening (SEC-01 to SEC-06)

#### Finding 2.1 (P2 - Medium): Raw `@Query('limit')` in Controller Endpoint

- **Location**: [`services/backend-api/src/modules/suppliers/suppliers.controller.ts:195`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/suppliers/suppliers.controller.ts#L195)
  ```ts
  async getSyncLogs(
    @Param('id') supplierId: string,
    @CurrentUser() user: { id: string },
    @Query('limit') limit?: number,
  )
  ```
- **Rule**: `BE-01: 100% Validated Controller DTOs` — Untyped `@Body() body: unknown` or raw `@Query('key')` are strictly forbidden; every query must use a dedicated class decorated with `class-validator` and `@Type(() => Number)` with `@IsInt()`, `@Min()`, `@Max()`.
- **Remediation**: Create `GetSupplierSyncLogsQueryDto`:
  ```ts
  export class GetSupplierSyncLogsQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 50;
  }
  ```

#### Security Strengths Verified (PASS):

- **`BE-02` / `BE-03`**: 100% of mutation routes (`POST`, `PATCH`, `DELETE`) protected by `@UseGuards(JwtAuthGuard)`.
- **`SEC-04`**: Strict BOLA tenant isolation: every query and command scopes by `where: { id, userId }` or `where: { supplierId, userId }`. Tested and verified via E2E test `5. Multi-Tenant Protection — User 2 cannot access or edit User 1 supplier`.
- **`SEC-02`**: No plaintext credentials or secret tokens returned or serialized.
- **`CORE-05`**: Zero raw `exec()` command execution; safe path normalization.

---

### Axis 3: Database & Schema (DB-01 to DB-12)

#### Finding 3.1 (P2 - Medium): Potential TOCTOU on Sync Settings Creation

- **Location**: [`services/backend-api/src/modules/suppliers/commands/handlers/update-supplier-sync-settings.handler.ts:22-34`](file:///Users/oleg/AQA/SmartFeedStudio/services/backend-api/src/modules/suppliers/commands/handlers/update-supplier-sync-settings.handler.ts#L22-L34)
- **Description**: Uses `findFirst` followed by `create` if null. If two parallel requests fire simultaneously when settings are not yet initialized, both can attempt `create`, resulting in a `P2002` unique constraint violation on `supplier_id`.
- **Remediation**: Use atomic `prisma.supplierSyncSetting.upsert({ where: { supplierId }, update: dto, create: { supplierId, ...dto } })`.

#### Database Strengths Verified (PASS):

- **`DB-01`**: 100% FK indexes configured:
  - `Supplier`: `@@index([organizationId])`, `@@index([userId])`.
  - `SupplierCategoryRule`: `@@index([supplierId])`.
  - `SupplierPricingRule`: `@@index([supplierId])`.
  - `SupplierSyncSetting`: `@@index([supplierId])`.
  - `SupplierSyncLog`: `@@index([supplierId])`, `@@index([supplierId, createdAt])`.
- **`DB-02`**: All timestamps declare `@db.Timestamptz(6)`.
- **`DB-03`**: 100% snake_case mapping across all tables and columns.
- **`DB-04`**: Monotonic time-ordered CUIDs (`@id @default(cuid())`).
- **`DB-05`**: Cascade deletions (`onDelete: Cascade`) enforced on all child relations.

---

### Axis 4: Frontend, UX, & UI Standards (UI-01 to UI-07, FE-01 to FE-14)

#### Finding 4.1 (P1 - High): Translucent Sticky Header Violates `UI-01`

- **Location**: [`apps/desktop/src/modules/suppliers/components/drawer/SupplierDrawerHeader.tsx:30`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/modules/suppliers/components/drawer/SupplierDrawerHeader.tsx#L30)
  ```tsx
  className = 'p-4 px-5 border-b border-border/80 bg-card/60 backdrop-blur-xs pr-10';
  ```
- **Rule**: `UI-01: 100% Solid Sticky Headers` — Sticky table headers and modal headers/footers must have solid opaque backgrounds (`bg-card`, `bg-muted`, `bg-background`). Translucent `backdrop-blur` without an opaque background is strictly prohibited.
- **Remediation**: Replace `bg-card/60 backdrop-blur-xs` with solid `bg-card`.

#### Finding 4.2 (P1 - High): Hardcoded Palette Colors Violate `UI-02` & `UI-03`

- **Location**:
  - [`apps/desktop/src/modules/suppliers/components/drawer/SupplierDrawerHeader.tsx:93`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/modules/suppliers/components/drawer/SupplierDrawerHeader.tsx#L93):
    `text-emerald-600 dark:text-emerald-400`
  - [`apps/desktop/src/modules/suppliers/components/list/SupplierTableRow.tsx:180`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/modules/suppliers/components/list/SupplierTableRow.tsx#L180):
    `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20`
- **Rule**:
  - `UI-02: Zero Off-Scheme Palette Colors & Rainbow Elements` — Hardcoded arbitrary palette colors are strictly prohibited.
  - `UI-03: Semantic Success Status Badge` — Success status badges and pills must use the semantic `--success` token: `bg-success/15 text-success border-success/30`.
- **Remediation**: Replace hardcoded emerald styles with `text-success` and `bg-success/15 text-success border-success/30`.

#### Finding 4.3 (P2 - Medium): Hardcoded Ukrainian String in Table Row

- **Location**: [`apps/desktop/src/modules/suppliers/components/list/SupplierTableRow.tsx:124`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/modules/suppliers/components/list/SupplierTableRow.tsx#L124)
  ```tsx
  {
    s.activeFeedsCount || 0;
  }
  фідів;
  ```
- **Rule**: `I18N-01: Bilingual Parity & Zero Raw Text` — Direct raw strings in UI elements bypass localization.
- **Remediation**: Use translation hook with pluralization:
  ```tsx
  {
    t('suppliers:feedsCountLabel', {
      count: s.activeFeedsCount || 0,
      defaultValue: `${s.activeFeedsCount || 0} фідів`,
    });
  }
  ```

#### Frontend Strengths Verified (PASS):

- **`UI-05`**: Strict official shadcn primitives exclusively (`Badge`, `Switch`, `Card`, `Select`, `Button`, `Sheet`, `Table`).
- **`UI-07`**: Zero rainbow icons. All card icons use neutral semantic tokens (`text-primary`, `text-muted-foreground`).
- **`FE-01`**: Strict `useRef` protection (`isFetchingRef`) in `SupplierSyncTab.tsx`.
- **`FE-04`**: Lean dependency array `[supplier.id, token]`, excluding UI translation flags.

---

### Axis 5: Bilingual Parity & Test Quality (I18N-01, TEST-01 to TEST-07)

- **`I18N-01`**: `pnpm i18n:check` passed with 100% parity across `en/suppliers.json` and `uk/suppliers.json`.
- **`TEST-01`**: Backend E2E suites run `cleanDatabase` in `beforeAll` and `afterAll`, preventing leftover data bleed.
- **`TEST-03`**: Playwright tests assert real business entities (`Brain Distribution Inc`, `sup_test_1`, `ТОВ «Брейн Дистрибʼюшн»`).
- **`TEST-07`**: Monorepo static typecheck (`tsc --noEmit`) passes with 0 errors across all packages.

---

## 3. Remediation Action Plan & Resolution Status

| ID         | Severity      | File                                                                                                    | Remediation Task                                                                                                                      | Status          |
| :--------- | :------------ | :------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------ | :-------------- |
| **REM-01** | **P1 (High)** | `apps/desktop/src/modules/suppliers/components/drawer/SupplierDrawerHeader.tsx`                         | Make header 100% solid (`bg-card`, remove `backdrop-blur-xs`), replace `text-emerald-*` with `text-success`.                          | ✅ **RESOLVED** |
| **REM-02** | **P1 (High)** | `apps/desktop/src/modules/suppliers/components/list/SupplierTableRow.tsx`                               | Replace hardcoded emerald styles with `bg-success/15 text-success border-success/30`. Render clean numeric value `{s.activeFeedsCount |                 | 0}`. | ✅ **RESOLVED** |
| **REM-03** | **P2 (Med)**  | `services/backend-api/src/modules/suppliers/suppliers.controller.ts`                                    | Replace `@Query('limit')` with dedicated `GetSupplierSyncLogsQueryDto` with `@Type`, `@IsInt`, `@Min`, `@Max`.                        | ✅ **RESOLVED** |
| **REM-04** | **P2 (Med)**  | `services/backend-api/src/modules/suppliers/commands/handlers/update-supplier-sync-settings.handler.ts` | Refactor `findFirst` + `create` into atomic `upsert` to eliminate TOCTOU concurrency race.                                            | ✅ **RESOLVED** |
| **REM-05** | **P2 (Med)**  | `services/backend-api/src/modules/suppliers/`                                                           | Split bundled query/command handlers into 1 file per handler per `ARCH-04` (<100 lines each).                                         | ✅ **RESOLVED** |
| **REM-06** | **P3 (Low)**  | `apps/desktop/src/lib/api/suppliers.ts`                                                                 | Extract category API calls into `supplier-categories.ts`, keeping `suppliers.ts` under 250 lines (182 lines).                         | ✅ **RESOLVED** |

---

## 4. Verification Checkpoint (6-Point Definition of Done)

- [x] **Criteria 1 (Backend E2E)**: 10/10 Supertest tests pass on real PostgreSQL database with `cleanDatabase` teardown.
- [x] **Criteria 2 (Production Build)**: Backend `dist/` compiled and verified fresh (`pnpm --filter @smartfeed/backend-api build`).
- [x] **Criteria 3 (Frontend E2E)**: 7/7 desktop Playwright tests pass asserting real business data in 15.6s.
- [x] **Criteria 4 (Static Typecheck)**: `tsc --noEmit` passes with 0 errors across `@smartfeed/shared`, `@smartfeed/backend-api`, `@smartfeed/desktop`.
- [x] **Criteria 5 (Bilingual Parity)**: `pnpm i18n:check` passes 100% across all locales.
- [x] **Criteria 6 (Automated Domain Invariants)**: `pnpm invariants:check` passes with 0 violations across UI semantic tokens, solid headers, CQRS single-handler structure, and controller DTOs.

---

## 5. Root Cause Analysis (RCA): Чому такі помилки виникали і що не вистачало агентам

### 5.1 Чому виникали помилки

1. **Контекстна мімікрія під неперевірені зразки (Few-Shot Pattern Mimicry):**
   - Перед написанням нового коду агенти роблять `grep_search` по репозиторію. У старих модулях (`growth-showcase`, `currencies.controller.ts`, старі таби постачальників) існували класи `text-emerald-500`, `@Query('param')` без DTO та об'єднані хендлери.
   - LLM сприймає наявний код як фактичний "проєктний стандарт" сильніше, ніж загальний опис правил у markdown.
2. **Пасивні правила замість автоматичних блокуючих ґейтів (Text Guidelines vs Machine Gates):**
   - Чому агенти ніколи не ламали типи або словники? Бо є `tsc --noEmit` та `pnpm i18n:check`. Якщо там помилка — термінал падає з червоним кодом 1.
   - Правила `UI-01`, `UI-02`, `ARCH-04`, `BE-01` існували лише як текст. E2E тести перевіряли бізнес-сценарії, TypeScript компілювався, і агент вважав задачу виконаною, не маючи зворотного зв'язку про порушення правил стилю чи структури.
3. **Гіперопіка i18n проти здорового глузду UX (Over-Engineering vs Pragmatic UX):**
   - Агенти отримали жорстку установку: _"жодного хардкоду рядків"_. Замість того, щоб зрозуміти контекст (у таблиці колонка вже має назву "Активні фіди", тому в клітинках достатньо вивести лаконічну цифру або бейдж `{count}`), агент почав будувати складний шаблон `"{{count}} фідів"`, що зламало правила української плюралізації ("1 фідів") і візуально засмітило таблицю.
4. **Однопотокова ментальна модель (TOCTOU Race Condition):**
   - Агент інстинктивно пише процедурний код: "спочатку перевір `findFirst`, якщо нема — зроби `create`, якщо є — зроби `update`". Це призводить до помилок паралелізму, оскільки агент не думає про конкурентні запити без явного правила обов'язкового використання `upsert`.

### 5.2 Що впроваджено системно для запобігання

1. **Машинний перевірочний скрипт [`scripts/check-invariants.mjs`](file:///Users/oleg/AQA/SmartFeedStudio/scripts/check-invariants.mjs):**
   - Автоматично сканує всі змінені файли на hardcoded palette colors (`emerald-*`, `green-*` тощо), напівпрозорі хедери (`backdrop-blur` без солідної підкладки), мульти-хендлерні файли (`ARCH-04`) та «голі» `@Query('param')`.
   - Інтегровано в команду `pnpm invariants:check` та в загальний `pnpm verify:build`.
2. **6-пунктовий Definition of Done (DoD):**
   - Додано обов'язковий Критерій 6 у `.agents/rules/agents.md`, `.agents/AGENTS.md` та скіли `frontend`, `backend`, `code-review-and-quality`.
3. **Калібрування скілів (`ui-ux-pro-max`, `frontend`, `backend`):**
   - Додано чітке правило `UI-06`: у числових стовпчиках таблиць виводити лише чисті цифри/бейджи `{count}`, без текстових іменників ("фідів", "товарів").
   - Додано обов'язкову вимогу атомарного `upsert` для 1:1 налаштувань.
