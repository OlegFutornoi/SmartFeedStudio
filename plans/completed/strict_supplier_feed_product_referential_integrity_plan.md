# 🏛️ План: Сувора референційна цілісність (Постачальник ➔ Фід ➔ Товари) та захист від передчасного імпорту

## 1. Огляд та бізнес-вимоги

**Проблема від користувача:**

1. Користувач тестував майстер імпорту, не завершив додавання фіду до кінця, але в системі вже з'явилися 2 активні фіди-дублікати (`ExportWebskladCSV.csv` на 4 720 та 248 товарів).
2. У каталозі товарів усі ці імпортовані товари відображаються з порожнім постачальником (`Постачальник: —`).
3. Вимога: категорично недопускати додавання товарів у базу без прив'язки до існуючого постачальника та без створення фіда. Товари не можуть бути «підвішеними» (orphan records).

---

## 2. Глибинний аналіз першопричин (Root Cause Diagnosis)

### Дефект 1: Розрив синхронізації між Cloud API та Local Database

- `CatalogsPage` завантажує список постачальників через `getSuppliers(token)`, отримуючи актуального постачальника з PostgreSQL (наприклад, `MMA`).
- Майстер передає `selectedSupplierId = "MMA_ID"`.
- Проте сервіси імпорту `LocalFeedsService` та `batchIngester` викликають виключно `localDb.suppliers.getSupplierById(supplierId)`.
- Оскільки локальна база (SQLCipher / Mock DB) не мала синхронізованого запису `MMA`, `supplier` повертався як `null`.
- `batchIngester` мовчки ігнорував відсутність постачальника і зберігав товари з `supplierName: ""` та `supplierCode: undefined`.
- `ProductsView` завантажував постачальників через `localDb.suppliers.getSuppliers()`, не знаходив `MMA` і рендерив у колонці прочерк `—`.

### Дефект 2: Відсутність валідації референційної цілісності в Mock DB та SQLite

- У `mock-feeds.ts` функція `createFeedSource` створювала джерело фіду навіть для порожнього `supplierId: ""`.
- У `mock-products.ts` функція `bulkUpsertProducts` не перевіряла наявність `supplierId` та `feedSourceId`.
- У `batch-ingester.ts` поле `feedSourceId` передавалося як `feedSourceId || null`.
- У Rust SQLite `local_products` поле `feed_source_id` було `TEXT` (nullable).
- У `services/backend-api/src/modules/feeds/feeds.controller.ts` метод `importAsync` не перевіряв існування постачальника в PostgreSQL.

### Дефект 3: Передчасне створення та дублювання фідів у Майстрі

- При натисканні кнопки переходу з Кроку 3 (`PREVIEW`) до Кроку 4 (`PROGRESS`) майстер негайно викликав `importFeedAsync`.
- При повторному тестуванні того самого файлу майстер створював новий незалежний фід замість оновлення існуючого.
- Якщо користувач закривав модальне вікно на Кроці 4 або не завершував процес, фід і товари вже залишалися у базі.

---

## 3. Архітектурні інваріанти (Domain Invariants)

1. **`DB-REF-01` (Zero Orphan Products)**:
   Жоден товар не може бути збережений у базі без валідного, існуючого `supplierId` ТА `feedSourceId`. При спробі збереження без них операція негайно переривається з виключенням `REFERENTIAL_INTEGRITY_VIOLATION`.
2. **`DB-REF-02` (Zero Orphan Feeds)**:
   Жоден фід не може бути створений без перевіреного `supplierId`.
3. **`FEED-DEDUP-01` (Feed Idempotency)**:
   Імпорт того самого файлу чи URL для того самого постачальника не повинен створювати новий дублюючий фід. Якщо фід уже існує для даного постачальника з тим самим джерелом, оновлюються його товари та мітка часу.
4. **`SYNC-PARITY-01` (Supplier Parity)**:
   Перед запуском імпорту локальна база даних гарантовано синхронізує/кешує профіль обраного постачальника, щоб `supplierName` та `supplierCode` завжди були доступні.

---

## 4. Покроковий план виконання (Tracer-Bullet Vertical Slices)

### Крок 1: Backend API (NestJS 11 CQRS) — Захист від імпорту без постачальника

- **Файл**: `services/backend-api/src/modules/feeds/feeds.controller.ts`
- **Зміни**:
  - У `importAsync(@Body() dto: ImportFeedAsyncDto, @CurrentUser() user: User)` додати перевірку постачальника в БД через `PrismaService` (`this.prisma.supplier.findFirst({ where: { id: dto.supplierId, ... } })`).
  - Якщо постачальника не знайдено — кидати `NotFoundException('SUPPLIER_NOT_FOUND')`.
- **Тест**: Створити Supertest E2E тест у `services/backend-api/test/feeds-integrity.e2e-spec.ts`.

### Крок 2: Desktop Mock DB & Rust SQLite — Суворі обмеження цілісності

- **Файли**:
  - `apps/desktop/src/services/local-db/mock/mock-feeds.ts`
  - `apps/desktop/src/services/local-db/mock/mock-products.ts`
  - `apps/desktop/src/services/feed-engine/batch-ingester.ts`
  - `apps/desktop/src/services/local-db/feeds.service.ts`
- **Зміни**:
  - У `mock-feeds.ts` перевіряти `getSupplierById(state, supplierId)`. Якщо постачальника немає — викидати помилку.
  - У `mock-products.ts` перевіряти, що кожен `p.supplierId` існує в `state.suppliers` і кожен `p.feedSourceId` існує в `state.feedSources`.
  - У `batch-ingester.ts` заборонити `feedSourceId: null`. Якщо постачальника не знайдено — не вставляти товари і кидати помилку.

### Крок 3: Синхронізація постачальників та ліквідація прочерків `—`

- **Файли**:
  - `apps/desktop/src/components/products/ProductsView.tsx`
  - `apps/desktop/src/lib/api/feeds-mutations.ts`
  - `apps/desktop/src/components/feeds/useImportFeedWizard.ts`
- **Зміни**:
  - У `ProductsView.tsx` замінити локальне вичитування на `getSuppliers(token)`, щоб таблиця завжди мала повний список актуальних постачальників (включаючи `MMA`).
  - Перед викликом `localDb.feeds.importFeedContent` переконатися, що якщо постачальник відомий у хмарі/майстрі, він присутній у `localDb` (за потреби додати в локальний кеш постачальників).
  - У `batch-ingester.ts` гарантувати збереження `supplierName: supplier.name` у кожному об'єкті товару.

### Крок 4: Дедуплікація фідів у Майстрі та захист від передчасних записів

- **Файли**:
  - `apps/desktop/src/services/local-db/feeds.service.ts`
  - `apps/desktop/src/services/local-db/mock/mock-feeds.ts`
  - `apps/desktop/src/components/feeds/useImportFeedWizard.ts`
- **Зміни**:
  - Якщо для цього постачальника вже існує фід із таким самим `fileName` або `sourceUrl`, повторний імпорт не створює новий запис фіду, а оновлює існуючий `feedSourceId` та перезаписує товари.
  - Очистити існуючі дублікати фідів у базі, якщо вони створені помилково.

### Крок 5: Повна верифікація (Verification Gate)

- Перевірка типізації: `pnpm --filter @smartfeed/desktop exec tsc --noEmit`.
- Перевірка інваріантів: `pnpm invariants:check`.
- Перевірка двомовності: `pnpm i18n:check`.
- Прогін Playwright E2E тестів (включаючи каскадне видалення та майстер):
  `pnpm --filter @smartfeed/desktop test:e2e e2e/feed-ingestion-wizard.spec.ts e2e/feeds-wizard.spec.ts e2e/suppliers-drawer-and-single-request.spec.ts e2e/feed-ingestion-cascade.spec.ts`.

---

## 5. Definition of Done (DoD)

1. [x] У базі неможливо створити товар без валідного `supplierId` та `feedSourceId`.
2. [x] Усі імпортовані товари відображають коректну назву постачальника (жодних прочерків `—`).
3. [x] Повторний імпорт того самого файлу не плодить дублікатів фідів у списку «Підключені фіди».
4. [x] 100% тестів E2E (Playwright + Jest) пройдено успішно (20/20 Playwright, 9/9 Jest).
5. [x] `pnpm invariants:check` та `pnpm i18n:check` мають 0 порушень.
