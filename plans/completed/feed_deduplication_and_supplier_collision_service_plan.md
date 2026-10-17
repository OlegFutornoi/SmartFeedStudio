# 🎯 Сервіс Нормалізації, Запобігання Дублікатам та Вирішення Колізій Фідів Постачальників

## 📌 1. Мета та контекст завдання

На сторінці `/catalogs` десктопного клієнта виявлено критичну проблему дублювання фідів (див. скріншот користувача):

- У списку підключених джерел присутні два абсолютно ідентичних записи:
  - **Рядок 1:** `livolo.kiev.ua (products_feed.xml)` [XML_ROZETKA], URL: `livolo.kiev.ua/products_feed.xml`, Товарів: 4, Останній синхронізований: 17 жовт., 21:29
  - **Рядок 2:** `livolo.kiev.ua (products_feed.xml)` [XML_ROZETKA], URL: `livolo.kiev.ua/products_feed.xml`, Товарів: 4 994, Останній синхронізований: 17 жовт., 20:51
- **Причина дефекту:** Повна відсутність валідації посилань, канонічної нормалізації URL, перевірки унікальності назв та захисту від дублювання як у межах одного постачальника, так і між різними постачальниками.
- **Масштаб ризику:** У дропшипінгу та B2B-каталогах десятки постачальників часто надають однаковий XML/CSV фід (наприклад, дистриб'юторські прайси Rozetka, Prom, Horoshop, Websklad). Без інтелектуального сервісу дедуплікації система багаторазово завантажує гігабайти однакових XML, створює дублікати 100k+ товарів у базі даних, спотворює квоти підписки та викликає некеровані черги фонової синхронізації.

---

## 🌐 2. Світовий досвід та бенчмарк провідних платформ (Perplexity Research)

Дослідження архітектур провідних PIM та Feed Management систем (**Channable, Productsup, ChannelEngine, Akeneo, DataFeedWatch**) виявило фундаментальне правило:

> **Розділення трьох сутностей ідентичності:**
>
> 1. `Feed Source Identity` — хто є власником підключення та конфігурації.
> 2. `Feed Content Identity` — чи вказують два URL/файли на один і той самий фізичний каталог.
> 3. `Product Master Identity` — відповідність окремих товарів (за EAN/GTIN/SKU).

### Ключові інженерні висновки:

1. **RFC 3986 Канонічна нормалізація URL:**
   - URL у вигляді `livolo.kiev.ua/products_feed.xml`, `https://livolo.kiev.ua/products_feed.xml/` та `https://livolo.kiev.ua/products_feed.xml?utm_source=feed&fbclid=123` мають зводитися до єдиного **канонічного вигляду**.
   - Очищення від сміттєвих маркетингових query-параметрів (`utm_*`, `fbclid`, `gclid`, `_ga`, `timestamp`, `_t`).
   - Збереження функціональних параметрів (`hash_tag`, `token`, `format`, `category_id`, `lang`).
   - Алфавітне сортування валідних query-параметрів.
   - Зведення host до lowercase, видалення стандартних портів (80, 443) та префіксу `www.`.
   - Розрахунок криптографічного відбитка: `urlFingerprint = sha256(canonicalUrl)`.
2. **Контентний хеш для файлів (Content Fingerprint):**
   - Для завантажених файлів (XML/CSV) генерується `contentHash = sha256(fileHeaderChunk + fileSize)`.
3. **Заборона "тихого злиття" (No Silent Merges):**
   - Система ніколи не повинна мовчки об'єднувати або перезаписувати дані різних постачальників без явної згоди користувача. Виявлення збігу URL — це сигнал перевірки (Review Signal), який вимагає явного вибору стратегії.

---

## 🏛️ 3. Архітектура Рішення: Дворівнева Матриця Колізій

### 3.1. Рівень 1: Внутрішній дублікат постачальника (`SAME_SUPPLIER_DUPLICATE`)

- **Умова:** Постачальник `S` вже має зареєстрований фід з таким самим `urlFingerprint` або `contentHash`.
- **Поведінка:** **Жорстке блокування створення дублікату**.
- **UX у Майстрі:**
  - Замість створення нового рядка у базі користувачеві показується інформаційна плашка:
    > _"Цей фід уже підключений до цього постачальника під назвою «livolo.kiev.ua (products_feed.xml)» (Синхронізовано: 17 жовт., 4 994 товарів). Створення дубліката заблоковано."_
  - Пропонується дія: кнопка **«Оновити існуючий фід»** (запускає пересинхронізацію активного фіду) або **«Перейти до каталогу»**.

### 3.2. Рівень 2: Міжпостачальницький конфлікт (`CROSS_SUPPLIER_CONFLICT`)

- **Умова:** Постачальник `B` намагається додати URL/файл, який вже зареєстрований за постачальником `A`.
- **Поведінка:** **Інтерактивне вікно вирішення колізії** з трьома стратегіями:
  1. **Стратегія A: «Використати спільне джерело» (`LINK_SHARED`) — Рекомендовано для економії ресурсів:**
     - Фід не парситься заново; постачальник `B` прив'язується до існуючого джерела як вторинний консьюмер. Товари діляться, але кожен постачальник може мати власні правила націнки (`SupplierPricingRule`).
  2. **Стратегія B: «Створити незалежний фід постачальника» (`CREATE_ISOLATED`) — Дропшипінг з різними умовами:**
     - Дозволяє створити окреме підключення, але **з обов'язковою авто-дизамбігуацією назви**: `livolo.kiev.ua (products_feed.xml) [Постачальник B]`.
     - Забороняє однакове ім'я в системі.
  3. **Стратегія C: «Скасувати додавання» (`ABORT`):**
     - Відхилити додавання для запобігання людської помилки менеджера.

### 3.3. Рівень 3: Валідація та Дизамбігуація Назви Фіду (`NAME_COLLISION`)

- **Вимоги до імені:**
  - Обов'язкове видиме поле редагування назви фіду на Кроці 1 (`WizardStepSource`) та Кроці 2 (`WizardStepSupplier`).
  - Довжина: від 2 до 100 символів.
  - Авто-генерація за замовчуванням через оновлений `formatFeedTitle(url, supplierName)`.
  - Якщо назва вже зайнята — автоматичне додавання суфікса `[Назва Постачальника]` або `#2`, `#3`.

---

## 📐 4. Контракти в `@smartfeed/shared`

Додати у `packages/shared/src/dtos/feed.dto.ts` та експортувати:

```typescript
export enum FeedCollisionType {
  NONE = 'NONE',
  SAME_SUPPLIER_DUPLICATE = 'SAME_SUPPLIER_DUPLICATE',
  CROSS_SUPPLIER_CONFLICT = 'CROSS_SUPPLIER_CONFLICT',
  NAME_COLLISION = 'NAME_COLLISION',
}

export enum FeedCollisionResolutionMode {
  RESYNC_EXISTING = 'RESYNC_EXISTING',
  LINK_SHARED = 'LINK_SHARED',
  CREATE_ISOLATED = 'CREATE_ISOLATED',
  ABORT = 'ABORT',
}

export const CheckFeedCollisionDtoSchema = z.object({
  supplierId: z.string().min(1),
  sourceType: z.nativeEnum(FeedSourceType),
  sourceUrl: z.string().optional(),
  fileName: z.string().optional(),
  feedName: z.string().optional(),
  fileContent: z.string().optional(),
});
export type CheckFeedCollisionDto = z.infer<typeof CheckFeedCollisionDtoSchema>;

export const FeedCollisionResultDtoSchema = z.object({
  hasCollision: z.boolean(),
  collisionType: z.nativeEnum(FeedCollisionType),
  canonicalUrl: z.string().nullable().optional(),
  urlFingerprint: z.string().nullable().optional(),
  existingFeedId: z.string().nullable().optional(),
  existingFeedName: z.string().nullable().optional(),
  conflictingSupplierId: z.string().nullable().optional(),
  conflictingSupplierName: z.string().nullable().optional(),
  existingProductsCount: z.number().int().nonnegative().optional(),
  lastSyncedAt: z.string().nullable().optional(),
  suggestedFeedName: z.string(),
  messageUk: z.string(),
  messageEn: z.string(),
});
export type FeedCollisionResultDto = z.infer<typeof FeedCollisionResultDtoSchema>;
```

---

## 💾 5. Зміни в Схемі Даних (PostgreSQL & SQLite)

### 5.1. PostgreSQL (`services/backend-api/prisma/schema.prisma`)

Оновити модель `SupplierSyncSetting` або додати модель `FeedSource` у Prisma:

```prisma
model FeedSource {
  id                   String      @id @default(cuid())
  organizationId       String?     @map("organization_id")
  supplierId           String      @map("supplier_id")
  supplier             Supplier    @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  parentFeedSourceId   String?     @map("parent_feed_source_id")
  name                 String
  sourceType           String      @default("URL") @map("source_type")
  fileFormat           String      @default("XML_ROZETKA") @map("file_format")
  sourceUrl            String?     @map("source_url")
  canonicalUrl         String?     @map("canonical_url")
  urlFingerprint       String?     @map("url_fingerprint")
  contentHash          String?     @map("content_hash")
  syncIntervalHours    Int         @default(24) @map("sync_interval_hours")
  autoUpdatePrices     Boolean     @default(true) @map("auto_update_prices")
  autoUpdateStocks     Boolean     @default(true) @map("auto_update_stocks")
  autoCreateNewProducts Boolean    @default(true) @map("auto_create_new_products")
  productsCount        Int         @default(0) @map("products_count")
  lastSyncedAt         DateTime?   @map("last_synced_at") @db.Timestamptz(6)
  lastSyncStatus       String      @default("IDLE") @map("last_sync_status")
  createdAt            DateTime    @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime    @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([supplierId])
  @@index([urlFingerprint])
  @@index([supplierId, urlFingerprint])
  @@map("feed_sources")
}
```

### 5.2. SQLite у Tauri (`apps/desktop/src-tauri/src/db/mod.rs`)

Оновити таблицю `local_feed_sources`:

```sql
ALTER TABLE local_feed_sources ADD COLUMN canonical_url TEXT;
ALTER TABLE local_feed_sources ADD COLUMN url_fingerprint TEXT;
ALTER TABLE local_feed_sources ADD COLUMN content_hash TEXT;
ALTER TABLE local_feed_sources ADD COLUMN parent_feed_source_id TEXT;

CREATE INDEX IF NOT EXISTS idx_feeds_url_fingerprint ON local_feed_sources(url_fingerprint);
CREATE INDEX IF NOT EXISTS idx_feeds_supplier_fingerprint ON local_feed_sources(supplier_id, url_fingerprint);
```

---

## 🧩 6. Покроковий План Реалізації (Tracer-Bullet Vertical Slices)

### Крок 1: Контракти та Утиліти Нормалізації (`@agents_backend` + `@agents_frontend`)

- **Файл:** `packages/shared/src/utils/feed-url-normalizer.ts` (крос-платформний чистий TypeScript).
- Реалізувати функцію `normalizeFeedUrl(rawUrl: string): { canonicalUrl: string; fingerprint: string }`.
  - Відкидання UTM-параметрів (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `gclid`, `_ga`, `_t`, `timestamp`).
  - Збереження `hash_tag`, `token`, `key`, `group_ids`, тощо.
  - Сортування query keys алфавітно.
  - Очищення подвійних слешів та портів.
  - Обчислення `sha256` відбитка.
- Реалізувати функцію `generateDisambiguatedFeedName(candidateName, existingNames, supplierName)`.
- Експортувати через `packages/shared/src/index.ts`.
- **Тести:** Unit-тести на нормалізацію URL у `packages/shared/test/feed-url-normalizer.spec.ts`.

### Крок 2: Оновлення Драйверів Бази Даних (SQLite Rust & Mock Driver) (`@agents_backend`)

- **Файли:**
  - `apps/desktop/src-tauri/src/db/mod.rs` (додавання колонок до схеми).
  - `apps/desktop/src-tauri/src/db/feeds.rs` (перевірка дублікатів перед `INSERT`, генерація відбитків, збереження `canonical_url` та `url_fingerprint`).
  - `apps/desktop/src/services/local-db/mock/mock-feeds.ts` (повноцінний check collision за `urlFingerprint` як для одного постачальника, так і між усіма постачальниками).
  - `apps/desktop/src/services/local-db/feeds.service.ts` (інтеграція виклику перевірки колізій `checkFeedCollision`).

### Крок 3: Бекенд CQRS Ендпоінт Перевірки Колізій (`@agents_backend`)

- **Файли:**
  - `services/backend-api/src/modules/feeds/queries/check-feed-collision.query.ts`
  - `services/backend-api/src/modules/feeds/queries/check-feed-collision.handler.ts`
  - `services/backend-api/src/modules/feeds/feeds.controller.ts` (`POST /feeds/check-collision`)
- **TDD (RED -> GREEN):**
  - Supertest E2E тест `services/backend-api/test/feed-collision.e2e-spec.ts`.
  - Тест 1: Перевірка нового унікального фіду -> `hasCollision: false, collisionType: 'NONE'`.
  - Тест 2: Повторне додавання для того самого постачальника -> `collisionType: 'SAME_SUPPLIER_DUPLICATE'`.
  - Тест 3: Додавання того ж фіду іншому постачальнику -> `collisionType: 'CROSS_SUPPLIER_CONFLICT'`.
  - Збірка продуктового бандла: `pnpm --filter @smartfeed/backend-api build`.

### Крок 4: Фронтенд-компоненти та Майстер Імпорту (`@agents_frontend`)

- **Файли:**
  - `apps/desktop/src/components/feeds/WizardStepSource.tsx`:
    - Додати поле вводу «Назва фіду» з розумним автокомплітом та можливістю редагування.
    - Відображати стан перевірки колізії (зелена галочка «Фід унікальний» або попереджувальний бейдж).
  - `apps/desktop/src/components/feeds/WizardCollisionDialog.tsx`:
    - Модальне вікно або інлайн-блок вирішення колізії (вибір між «Оновити існуючий», «Спільне джерело», «Окремий фід із суфіксом»).
  - `apps/desktop/src/components/feeds/useFeedAnalysis.ts` та `useImportFeedWizard.ts`:
    - Автоматичний виклик `checkFeedCollision` після аналізу URL або файлу.
    - Блокування кнопки «Далі» при спробі створити точний дублікат без вирішення колізії.
  - `apps/desktop/src/components/catalogs/ConnectedFeedsTableRow.tsx`:
    - Чітке відображення назви, постачальника та canonical URL.

### Крок 5: Двомовна Локалізація (UK / EN) (`@agents_frontend`)

- Додати ключі локалізації у `apps/desktop/src/i18n/locales/uk/suppliers.json` та `en/suppliers.json`:
  - `feedCollisionDetectedTitle`
  - `feedSameSupplierDuplicateMsg`
  - `feedCrossSupplierConflictMsg`
  - `btnResyncExistingFeed`
  - `btnLinkSharedFeed`
  - `btnCreateIsolatedFeed`
  - `feedNamePlaceholder`
  - `feedNameUniqueValidated`
- Верифікація 100% паритету: `pnpm i18n:check`.

### Крок 6: Наскрізне Тестування та Верифікація (`@agents_qa`)

- Написати Playwright E2E тест `apps/desktop/e2e/feed-deduplication.spec.ts`:
  - Сценарій 1: Додавання фіду Livolo постачальнику A -> успішно створено.
  - Сценарій 2: Спроба повторно додати той самий URL постачальнику A -> майстер блокує створення дубля і пропонує «Оновити існуючий».
  - Сценарій 3: Спроба додати той самий URL постачальнику B -> з'являється діалог вибору стратегії міжпостачальницької колізії.
- Запуск швидкої перевірки інваріантів: `pnpm verify:fast` (0 помилок ESLint, 0 tsc, 100% i18n, cargo check clean).

---

## ✅ 7. Definition of Done (DoD - AGENT-04)

1. [x] **Backend Supertest E2E:** 100% тестів на реальній базі пройдено (включаючи `feed-collision.e2e-spec.ts`).
2. [x] **Backend Build:** `dist/` зібрано свіжим (`pnpm --filter @smartfeed/backend-api build`).
3. [x] **Frontend Playwright E2E:** Тест `feed-deduplication.spec.ts` успішно перевіряє блокування дублів та міжпостачальницькі колізії на реальних даних (4/4 тестів пройдено).
4. [x] **Typecheck:** `pnpm exec tsc --noEmit` проходить без жодної помилки у всіх пакетах monorepo.
5. [x] **Bilingual Parity:** `pnpm i18n:check` проходить із результатом 100%.
6. [x] **Domain Invariants:** `pnpm invariants:check` повертає 0 порушень.
