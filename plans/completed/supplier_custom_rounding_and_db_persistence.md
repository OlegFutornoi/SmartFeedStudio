# План реалізації кастомних правил маркетингового округлення цін та повної персистентності БД — ✅ Реалізовано

- **Статус**: `completed`
- **Дата створення**: 2026-10-24
- **Дата завершення**: 2026-10-24
- **Цільове середовище**: Full-Stack (PostgreSQL Prisma + NestJS CQRS Backend + `@smartfeed/shared` + Tauri v2 SQLite + MockDB + Desktop UI)

---

## 1. Аудит збереження даних у БД по всіх вкладках постачальника

Перевірено та підтверджено 100% персистентність усіх вкладок картки постачальника у PostgreSQL (`services/backend-api/prisma/schema.prisma`) та локальній зашифрованій SQLite (`apps/desktop/src-tauri/src/db/schema.rs`):

1. **Вкладка «Огляд та реквізити»**:
   - Таблиці: `suppliers` (PostgreSQL) / `local_suppliers` (SQLite).
   - Усі CRM-поля (`name`, `code`, `legal_name`, `tax_id`, `industry`, `segment`, `manager_*`, `country`, `city`, `address`, `postcode`, `website`, `notes`, `logo_url`, `is_active`) зберігаються через `POST /api/suppliers` та `PATCH /api/suppliers/:id`.
2. **Вкладка «Підключені фіди» (`SupplierFeedsTab`)**:
   - Таблиці: `feed_sources` (PostgreSQL) / `local_feed_sources` (SQLite).
3. **Вкладка «Категорії» (`SupplierCategoriesTab`)**:
   - Таблиці: `supplier_category_rules` (PostgreSQL) / `local_supplier_categories` + `local_marketplace_categories` + `local_supplier_category_marketplace_maps` (SQLite).
   - Зберігаються націнки категорій (`margin_percent`, `fixed_markup`, `markup_type`), комісії та привʼязки до маркетплейсів через `PATCH /api/suppliers/:id/categories/:categoryId`.
4. **Вкладка «Націнки та правила» (`SupplierPricingTab`)**:
   - Базова націнка (`default_margin_percent`, `default_fixed_markup`) зберігається в таблиці `suppliers` / `local_suppliers`.
   - Діапазони цін та правила категорій зберігаються в окремій таблиці `supplier_pricing_rules` (PostgreSQL) / `local_supplier_pricing_rules` (SQLite) через `GET/POST/PATCH/DELETE /api/suppliers/:id/pricing-rules`.
5. **Вкладка «Багатовалютність» (`SupplierCurrenciesTab`)**:
   - Валюта прайсу (`base_currency`), режим курсу (`exchange_rate_mode`), курс (`exchange_rate`), валютний буфер (`currency_buffer_percent`), правило округлення (`price_rounding`) та кастомні правила округлення (`custom_rounding_rules`) зберігаються в таблиці `suppliers` (PostgreSQL) / `local_suppliers` (SQLite).
   - Провайдери банків зберігаються в таблиці `bank_currency_providers` (`GET /api/currencies/banks`).

---

## 2. Реалізована архітектура кастомних правил округлення (`DB ➔ Backend ➔ Shared ➔ SQLite ➔ UI`)

1. **Контракти та математичне ядро (`@smartfeed/shared`)**:
   - Додано `CustomRoundingRuleDto`, `CustomRoundingRuleType` та `buildCustomRoundingRule` у `packages/shared/src/dtos/supplier.dto.ts` та `packages/shared/src/utils/currency-calculator.ts`.
   - Розширено `applyPriceRounding(value, mode)` для обчислення:
     - `CUSTOM_DEC_<N>`: копійки `.XX` (напр. `CUSTOM_DEC_49` ➔ `483.40 ➔ 483.49 ₴`).
     - `CUSTOM_INT_<N>`: ціле закінчення `на X` (напр. `CUSTOM_INT_0` ➔ `483.40 ➔ 480.00 ₴`).
     - `CUSTOM_MULT_<N>`: кратне `X ₴` (напр. `CUSTOM_MULT_10` ➔ `483.40 ➔ 480.00 ₴`).
2. **PostgreSQL та NestJS Backend (`services/backend-api`)**:
   - Додано колонку `customRoundingRules Json @default("[]") @map("custom_rounding_rules")` у `model Supplier` (`schema.prisma` та `0_init/migration.sql`).
   - Створено `CustomRoundingRuleItemDto` з валідацією `@ValidateNested({ each: true })` у `supplier-rules.dto.ts` та `supplier.dto.ts`.
   - Оновлено `CreateSupplierHandler`, `UpdateSupplierHandler`, `GetSuppliersHandler`, `GetSupplierByIdHandler`.
   - Додано підтримку `CNY` у `CurrenciesService`.
3. **Tauri v2 SQLite та MockDB (`apps/desktop`)**:
   - Додано колонку `custom_rounding_rules TEXT DEFAULT '[]'` у `local_suppliers` (`schema.rs`, `models.rs`, `suppliers.rs`) та оновлено `mock-suppliers.ts`.
4. **Інтерфейс вибору, додавання та видалення правил округлення (`PriceRoundingSelect.tsx`)**:
   - Створено модульний компонент `<PriceRoundingSelect />` (`221` рядок, `CORE-04`, `UI-05` на базі `@/components/ui/popover`, `Button`, `Input`, `Badge`).
   - Праворуч у кожному рядку випадаючого списку відображається живий приклад округлення (`483.40 ➔ ... ₴`) та кнопка видалення (`Trash2`) для кастомних правил, а внизу списку — панель створення власного правила (`.XX копійки`, `на X ціле`, `кратне X`) з миттєвим збереженням у БД.

---

## 3. Критерії готовності (6-Point DoD)

- [x] Backend Supertest E2E тест (`services/backend-api/test/suppliers.e2e-spec.ts` — 10/10 passed) перевіряє збереження `customRoundingRules` і кастомного `priceRounding` у PostgreSQL.
- [x] Backend `dist/` скомпільований (`pnpm --filter @smartfeed/backend-api build`).
- [x] Playwright E2E тести (`suppliers-slide-sheet.spec.ts` та `suppliers-drawer-and-single-request.spec.ts` — 13/13 passed) перевіряють додавання кастомного правила `.49`, перерахунок у симуляторі та видалення правила зі списку.
- [x] `tsc --noEmit` проходить із 0 помилок.
- [x] `pnpm i18n:check` проходить на 100%.
- [x] `pnpm invariants:check`, `cargo check` та `pnpm verify:fast` проходять із 0 помилок.
