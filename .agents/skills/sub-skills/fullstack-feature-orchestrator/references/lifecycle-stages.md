# 🔄 Fullstack Lifecycle Stages

Detailed step-by-step guidance for executing each phase of the cross-cutting fullstack feature development cycle.

---

## 📐 Phase 1: Contract-First Design (`@smartfeed/shared`)

### Mandatory Rules

1. **Zero Inline Types**: Never declare ad-hoc types inside React components or NestJS controllers. All shared request/response models must reside in `packages/shared/src/`.
2. **Schema & Types Co-location**: Export both TypeScript interface and Zod schema:
   ```typescript
   export const CreateFeedSchema = z.object({
     name: z.string().min(2).max(100),
     sourceUrl: z.string().url(),
     format: z.nativeEnum(FeedFormat),
   });
   export type CreateFeedDto = z.infer<typeof CreateFeedSchema>;
   ```
3. **Compilation Gate**: Always run `pnpm --filter @smartfeed/shared build` to generate compiled declarations (`dist/`) before using them in backend or frontend.

---

## ⚙️ Phase 2: Backend CQRS & Database (`services/backend-api`)

### Mandatory Rules

1. **Prisma Schema Update**:
   - Explicit snake_case mappings (`@@map("table_name")`, `@map("column_name")`).
   - Timestamps as `DateTime` (PostgreSQL `timestamptz`).
   - 100% Foreign Key indexes: every relation field MUST have `@@index([foreignKey])`.
   - Primary keys use `@default(cuid())`.
2. **4-Layer Defense Model**:
   - **Layer 1 (DTO)**: `ValidationPipe({ whitelist: true })` + `class-validator` decorators on every DTO property.
   - **Layer 2 (Domain/Quota)**: Quota validation service verifying organization subscription limits (SKU count, seats, feeds).
   - **Layer 3 (Security/RBAC)**: Tenant Scoping (`organizationId` validation) + role guards (`@Roles(Role.ADMIN)`).
   - **Layer 4 (Database)**: Foreign key constraints, atomic transactions via `$transaction`, and short transaction scopes.
3. **TDD RED → GREEN & Teardown**:
   - Write E2E test in `test/*.e2e-spec.ts` asserting failing behavior first (RED).
   - Implement handler to pass test (GREEN).
   - Always call `cleanDatabase(prisma)` in `beforeAll` and `afterAll`.

---

## 💻 Phase 3: Frontend Client & UI/UX (`apps/desktop`, `apps/admin-portal`)

### Mandatory Rules

1. **Modularity Budget**:
   - Every React component must strictly remain **under 250–300 lines**.
   - Proactively decompose complex pages into sub-components (`*Header.tsx`, `*Table.tsx`, `*Dialog.tsx`, `*Filters.tsx`).
2. **Zero Duplicate Network Calls**:
   - Deduplicate in-flight requests using `useRef` tokens.
   - Never fetch `/auth/me` right after login/register (user profile is returned in the auth payload).
   - No `React.StrictMode` double mounting in dev configs.
3. **100% Solid Sticky Headers & Palette Harmony**:
   - All sticky table headers (`thead.sticky.top-0`) and modal headers MUST use solid opaque backgrounds (`bg-card`, `bg-background`).
   - Zero hardcoded palette colors (`purple-*`, `pink-*`, `violet-*`). Use semantic tokens (`primary`, `card`, `border`, `muted`).
4. **100% Internationalization (i18n)**:
   - Immediate bilingual entries in `uk` and `en` JSON dictionaries.
   - Zero raw keys (e.g. `common:title`) or English leakages in the Ukrainian UI.

---

## 🔄 Phase 4: Parity & Invariants Verification (`mock-real-parity-testing`)

### Mandatory Rules

1. **Behavioral & Data Parity**:
   - When running against `mockDatabaseDriver` (browser dev) or SQLite (Tauri desktop), returned objects MUST have the exact same shape and hydrated relations as the NestJS/PostgreSQL backend (e.g. `supplierName`, `categories`, `activeFeedsCount`).
   - Never leak internal column names (e.g. displaying raw "Постачальник" instead of company name).
2. **Cascade Deletion Verification**:
   - Deleting a parent entity (e.g. Feed, Supplier) MUST automatically delete all associated child records (Products, Images, Snapshots).
   - Counters and quotas must atomically decrement.

---

## 🔍 Phase 5: Adversarial Review & DoD Verification

### Mandatory Rules

1. **Adversarial Stress Test**:
   - Test concurrency: multiple rapid clicks on action buttons (must disable button and prevent duplicate requests).
   - Test offline/error modes: graceful UI error toast or banner using `getErrorMessage(err, t)`. Zero empty `catch {}`.
2. **Static & Import Verification**:
   - Run `pnpm --filter @smartfeed/backend-api exec tsc --noEmit`.
   - Run `pnpm --filter @smartfeed/desktop exec tsc --noEmit`.
   - Run `pnpm --filter admin-portal exec tsc --noEmit`.
   - 100% `@/` path aliases. Zero relative imports (`../`).
