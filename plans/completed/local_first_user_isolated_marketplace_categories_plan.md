# 📋 План: Перенесення категорій маркетплейсів у суто локальну базу даних користувача (Local-First Decoupling)

> **Статус:** ✅ **Реалізовано (100% E2E PASS)**  
> **Гілка:** `feat/marketplace-category-mapping`  
> **Дата створення:** 18.10.2026  
> **Призначений агент:** `@agents_backend` & `@agents_frontend`  
> **Відповідає інваріантам:** `CORE-01`, `CORE-04`, `CORE-07`, `PLAN-01`, `PLAN-02`, `AGENT-04`, `TEST-01`, `SEC-04`

---

## 1. 🔍 Контекст та архітектурна невідповідність

1. **Суть проблеми:**
   - Модель `MarketplaceCategory` та пов'язані з нею ендпоінти (`/api/suppliers/marketplace-categories`) були помилково додані до серверної бази даних PostgreSQL 16 (`services/backend-api/prisma/schema.prisma`).
   - Центральна серверна база призначена виключно для адміністрування платформи: користувачі (`users`), організації, ліцензії, тарифи, сесії, платежі WayForPay, аудит-логи та резервні знімки (`snapshots`).
   - Каталоги постачальників, товари, локальні категорії та прив'язки до категорій маркетплейсів є **суто клієнтськими даними користувача** (Local-First архітектура: SQLite/SQLCipher у десктопі та ізольований `smartfeed_mock_db_${userId}` у браузері).
   - Збереження категорій маркетплейсів на сервері порушує ізоляцію даних користувачів та засмічує базу адміна даними, які їй не належать.

2. **Цільовий стан:**
   - Повне видалення `marketplace_categories` та `supplier_category_marketplace_maps` із серверної схеми Prisma / PostgreSQL.
   - Видалення відповідних NestJS CQRS-хендлерів та REST-маршрутів із `services/backend-api`.
   - Збереження категорій маркетплейсів та правил прив'язки **виключно в локальній базі користувача**:
     - У **Tauri SQLite** (`smartfeed_local.db`): створення таблиці `local_marketplace_categories` із обов'язковим полем `user_id` та ізоляцією за користувачем.
     - У **браузерному Mock-драйвері**: ізольоване збереження під ключем `smartfeed_mock_db_${userId}`.
   - Клієнтські компоненти (`MarketplaceCategoryDrawer`, `MarketplaceCategoryImportForm`, `SupplierCategoryRow`) працюють суто з локальною базою без жодних мережевих викликів до адмін-сервера.

---

## 2. 🧱 Покроковий план реалізації

### Етап 1: Очищення серверної бази адміна (PostgreSQL 16 & NestJS Backend)

1. **Очищення `services/backend-api/prisma/schema.prisma`:**
   - Видалити модель `MarketplaceCategory`.
   - Видалити модель `SupplierCategoryMarketplaceMap`.
   - Очистити зв'язки в моделі `SupplierCategoryRule` (видалити поля `marketplaceCategoryId`, `marketplaceCategory`, `marketplaceMappings`). Залишити в правилі тільки локальні для постачальника поля (назва, статус, націнка, ID).
   - Виконати `pnpm --filter @smartfeed/backend-api prisma generate` для оновлення Prisma Client.
2. **Видалення застарілих серверних хендлерів та контролерів:**
   - Видалити `get-marketplace-categories.handler.ts` та `create-marketplace-category.handler.ts`.
   - Прибрати ендпоінти `GET /api/suppliers/marketplace-categories` та `POST /api/suppliers/marketplace-categories` із `suppliers.controller.ts`.
   - Видалити реєстрацію хендлерів та команд із `suppliers.module.ts`, `suppliers.handlers.ts`, `suppliers.commands.ts`, `suppliers.queries.ts`.
3. **Оновлення бекенд-тестів:**
   - Переконатися, що `services/backend-api/test/suppliers.e2e-spec.ts` не посилається на видалені маркетплейс-категорії.
   - Запустити збірку бекенду: `pnpm --filter @smartfeed/backend-api build`.

---

### Етап 2: Реалізація таблиці в локальній базі SQLite (Tauri v2 Desktop)

1. **Оновлення схеми SQLite у `apps/desktop/src-tauri/src/db/schema.rs`:**
   - Додати створення таблиці `local_marketplace_categories` із жорсткою прив'язкою до `user_id`:
     ```sql
     CREATE TABLE IF NOT EXISTS local_marketplace_categories (
         id TEXT PRIMARY KEY,
         user_id TEXT NOT NULL,
         marketplace_code TEXT NOT NULL DEFAULT 'ROZETKA',
         external_id TEXT NOT NULL,
         xml_attribute_name TEXT NOT NULL DEFAULT 'rz_id',
         name_uk TEXT NOT NULL,
         name_en TEXT,
         full_path_uk TEXT,
         parent_external_id TEXT,
         url TEXT,
         default_commission_percent REAL DEFAULT 0,
         default_fixed_fee REAL DEFAULT 0,
         is_leaf INTEGER DEFAULT 1,
         is_active INTEGER DEFAULT 1,
         created_at TEXT DEFAULT CURRENT_TIMESTAMP,
         updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
         UNIQUE(user_id, marketplace_code, external_id)
     );
     CREATE INDEX IF NOT EXISTS idx_mcat_user_code ON local_marketplace_categories(user_id, marketplace_code);
     ```
   - Додати збереження мапінгу маркетплейсів у `local_supplier_categories`:
     - Додати колонку `marketplace_mappings TEXT` (JSON-структура мапінгу для різних маркетплейсів) або збереження в окремій локальній таблиці `local_supplier_category_marketplace_maps`.
2. **Реалізація Rust IPC методів:**
   - `get_marketplace_categories(user_id, marketplace_code, search)`
   - `create_marketplace_category(user_id, dto)`
   - `import_marketplace_categories(user_id, dtoArray)`

---

### Етап 3: Ізоляція користувача в локальному драйвері (Desktop Web/Mock Driver)

1. **Оновлення `apps/desktop/src/services/local-db/mock/mock-marketplace-categories.ts`:**
   - Прив'язати збереження категорій маркетплейсів до конкретного `state.currentUserId`.
   - Завантажувати початкові базові категорії (seed) виключно як шаблон для нового користувача, а всі додані, відредаговані або імпортовані категорії зберігати суто в просторі даного користувача (`smartfeed_mock_db_${userId}`).
   - При перемиканні користувача (`switchUser`) гарантувати повну ізоляцію: користувач бачить тільки свої власні категорії маркетплейсу.

---

### Етап 4: Перемикання клієнтських API та UI виключно на локальну БД

1. **Файл `apps/desktop/src/lib/api/supplier-categories.ts`:**
   - Повністю прибрати мережеві виклики `fetchWithAuth('/suppliers/marketplace-categories')`.
   - Функції `getMarketplaceCategories`, `createMarketplaceCategory`, `importMarketplaceCategories` скеровувати виключно в `localDb.suppliers.*` (який автоматично делегує запити або в нативний SQLite Tauri, або в локальний веб-драйвер).
2. **UI компоненти:**
   - `MarketplaceCategoryDrawer.tsx`: завантажує та відображає лише категорії поточного користувача.
   - `MarketplaceCategoryImportForm.tsx`: імпортує CSV виключно в локальну базу користувача.
   - `MarketplaceCategoryEditForm.tsx` та `MarketplaceCategoryCustomForm.tsx`: створюють і редагують записи локально.

---

## 3. 🛡️ Критерії готовності (Definition of Done)

- [x] У `schema.prisma` відсутні моделі `MarketplaceCategory` та `SupplierCategoryMarketplaceMap`.
- [x] Серверний Prisma Client перегенеровано, `tsc --noEmit` проходить із 0 помилок.
- [x] Бекенд `dist/` успішно скомпільовано (`nest build`).
- [x] У локальній базі (SQLite `local_marketplace_categories`, `local_supplier_category_marketplace_maps` та Web Mock) обидві таблиці мають поле `user_id` і строго ізольовані для кожного користувача.
- [x] Створення, редагування та імпорт категорій маркетплейсів працюють офлайн через локальну базу без жодних запитів до бекенд API.
- [x] Усі 8 Playwright тестів у `apps/desktop/e2e/suppliers-drawer-and-single-request.spec.ts` та 7 тестів у `formatters.spec.ts` проходять 100% успішно.
- [x] 10/10 бекенд Supertest E2E тестів у `suppliers.e2e-spec.ts` проходять 100%.
- [x] `invariants:check` та `i18n:check` проходять із 0 зауважень.
