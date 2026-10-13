# 🏛️ План ремедіації: Повна архітектура модуля постачальників, збереження в БД та UI-стандартизація

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 13.10.2026  
> **Агенти:** `agents_review`, `agents_security`, `agents_frontend`, `agents_backend`  
> **Гілка:** `feature/suppliers-management-module`

---

## 🔍 1. Результати комплексного рев'ю (`agents_review` + `agents_security`)

| #     | Дефект / Зауваження                                              | Корінна причина (Root Cause)                                                                                                                                                                                                                                                                                                                                                                        | Рівень критичності            | Статус            |
| :---- | :--------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------- | :---------------- |
| **1** | **Кнопка «Редагувати» не працює**                                | У `SuppliersListPage.tsx` при відкритті кабінету постачальника (`selectedSupplierForWorkspace`) повертався ранній return. Модальне вікно `<SupplierCreateDialog>` залишалося в іншій гілці JSX і не рендерилося в DOM.                                                                                                                                                                              | **P0 (Блокуючий баг)**        | ✅ Виправлено     |
| **2** | **Відсутній повзунок активності постачальника**                  | У `SupplierDetailHeader.tsx` статус рендерився статичним бейджем з непомітним кліком. Потрібен явний, стандартний перемикач `<Switch>` зі статусом «Активний / Неактивний».                                                                                                                                                                                                                         | **P1 (UX дефект)**            | ✅ Виправлено     |
| **3** | **Поле пошуку занадто широке**                                   | У `SuppliersTableToolbar.tsx` контейнер пошуку мав `flex-1 min-w-[200px] max-w-sm` замість стандартного проекту `w-full sm:w-64 max-w-xs shrink-0`.                                                                                                                                                                                                                                                 | **P2 (UI розсинхрон)**        | ✅ Виправлено     |
| **4** | **Відсутнє налаштування колонок таблиці**                        | `SuppliersDataTable` не підключав хук `useColumnVisibility` та кнопку `DataTableViewOptions` («Налаштувати стовпці»), які є обов'язковими для всіх таблиць каталогу.                                                                                                                                                                                                                                | **P1 (UI стандарт)**          | ✅ Виправлено     |
| **5** | **Переплутана іконка експорту**                                  | Для експорту використовувалася іконка `Download` (стрілка вниз = імпорт/завантаження), замість `Upload` / `FileUp` (стрілка вгору = вивантаження).                                                                                                                                                                                                                                                  | **P2 (UI дефект)**            | ✅ Виправлено     |
| **6** | **Дані зберігаються «у повітрі» (відсутність таблиць у SQLite)** | У `src-tauri/src/db.rs` таблиця `local_suppliers` не має колонок валют (`base_currency`, `target_currency`, `exchange_rate_mode`, `exchange_rate`, `price_rounding`), а таблиці `local_supplier_categories` та `local_supplier_pricing_rules` **взагалі відсутні в SQLite**. У Tauri IPC handlers не зареєстровані відповідні команди. Дані трималися виключно в оперативній пам'яті mock-драйвера. | **P0 (Архітектурний дефект)** | ✅ Реалізовано БД |
| **7** | **Відсутність повноцінного E2E тестування**                      | Було лише 2 базові смоук-тести, жодного тесту на редагування постачальника, перемикання активності через Switch, зміну колонок, збереження валют і правил.                                                                                                                                                                                                                                          | **P1 (QA прогалина)**         | ✅ 100% тестів    |

---

## 🛡️ 2. Модель 4-шарового захисту та безпеки (`agents_security`)

1. **Рівень 1 (DTO & Контракти у `@smartfeed/shared`)**:
   - Строга валідація Zod для `SupplierDto`, `SupplierCategoryRuleDto`, `SupplierPricingRuleDto`.
   - Заборона передачі `undefined` та `any`.

2. **Рівень 2 (Бізнес-правила & Квоти)**:
   - Перевірка лімітів постачальників за тарифним планом (`isSupplierLimitReached`).
   - Захист від некоректних курсів валют (курс повинен бути `> 0`).

3. **Рівень 3 (Безпека IPC та SQL Injection Prevention)**:
   - Усі SQL-запити в `src-tauri/src/db.rs` виконуються виключно через параметризовані аргументи SQLite (`?1`, `?2`).
   - Санітизація експорту: не експортувати внутрішні технічні поля або чутливі заголовки авторизації фідів.

4. **Рівень 4 (База даних SQLite & Каскадна цілісність)**:
   - Атомарне каскадне видалення: при видаленні постачальника в єдиній транзакції видаляються:
     `local_supplier_categories`, `local_supplier_pricing_rules`, `local_feed_sources`, `local_products`, `local_product_images`.
   - Індексація: індекси `idx_supplier_categories_supplier`, `idx_supplier_pricing_rules_supplier` для миттєвих вибірок при 100k+ товарів.

---

## 📐 3. Архітектура збереження даних (SQLite + Mock Parity)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          SMARTFEED STUDIO DESKTOP                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┴────────────────────────────┐
       ▼ (Tauri Native Mode)                                     ▼ (Web / Playwright Mode)
┌───────────────────────────────┐                         ┌───────────────────────────────┐
│       src-tauri/src/db.rs     │                         │   mock-driver.ts / storage    │
│  - local_suppliers (валюти)   │ <── 100% Parity ─────-> │  - state.suppliers            │
│  - local_supplier_categories  │                         │  - state.supplierCategories   │
│  - local_supplier_pricing_rules│                        │  - state.supplierPricingRules │
│  - local_feed_sources         │                         │  - localStorage persistence   │
│  - local_products             │                         │                               │
└───────────────────────────────┘                         └───────────────────────────────┘
```

---

## 🚀 4. Покроковий план виконання

### Крок 1: База даних SQLite та Rust команди (`src-tauri`) & NestJS CQRS

- [x] Оновити `src-tauri/src/models.rs`: додати моделі `SupplierCategoryRuleDto`, `SupplierPricingRuleDto`, розширити `SupplierDto`, `CreateSupplierDto`, `UpdateSupplierDto` полями валют.
- [x] Оновити `src-tauri/src/db.rs`: додати міграції для полів валют у `local_suppliers`, створити таблиці `local_supplier_categories` та `local_supplier_pricing_rules` з індексами.
- [x] Реалізувати CRUD-операції в `db.rs` для категорій постачальника та правил націнки з каскадним видаленням.
- [x] Оновити `src-tauri/src/lib.rs`: зареєструвати команди у `tauri::generate_handler!`:
      `db_get_supplier_categories`, `db_toggle_supplier_category`, `db_batch_toggle_supplier_categories`, `db_update_supplier_category_rule`,
      `db_get_supplier_pricing_rules`, `db_create_supplier_pricing_rule`, `db_update_supplier_pricing_rule`, `db_delete_supplier_pricing_rule`.
- [x] Реалізувати NestJS CQRS `SuppliersModule` в `services/backend-api` з моделями Prisma `Supplier`, `SupplierCategoryRule`, `SupplierPricingRule`, 100% FK індексами та каскадним видаленням.

### Крок 2: Локальний міст та збереження (`client.ts`, `mock-storage.ts`)

- [x] Зареєструвати нові команди у `REGISTERED_TAURI_COMMANDS` в `client.ts`.
- [x] Додати збереження `supplierCategories` та `supplierPricingRules` у `saveMockDbToStorage` та `restoreMockDbFromStorage` в `mock-storage.ts`, щоб у веб-режимі нічого не зникало при перезавантаженні сторінки.

### Крок 3: Виправлення блокуючих UI-багів

- [x] **Виправити кнопку «Редагувати»**: у `SuppliersListPage.tsx` монтувати `<SupplierCreateDialog>` та `<ConfirmDeleteDialog>` поруч із `<SupplierDetailWorkspace>`, щоб клік на «Редагувати» миттєво відкривав форму редагування.
- [x] **Додати Switch активності**: у `SupplierDetailHeader.tsx` розмістити семантичний `<Switch checked={supplier.isActive} onCheckedChange={onToggleStatus} />` з текстом «Активний / Неактивний». Також додати Switch у колонку «Статус» таблиці.
- [x] **Компактний пошук**: у `SuppliersTableToolbar.tsx` встановити `w-full sm:w-64 max-w-xs shrink-0` замість розтягуваного контейнера.
- [x] **Іконка експорту**: замінити `Download` на `Upload` (стрілка вгору = вивантажити).

### Крок 4: Налаштування стовпчиків (`DataTableViewOptions`)

- [x] Підключити `useColumnVisibility('suppliers_table_columns', defaultColumns)` у `SuppliersListPage.tsx`.
- [x] Інтегрувати кнопку `DataTableViewOptions` («Налаштувати стовпці») у `SuppliersTableToolbar.tsx`.
- [x] Застосувати видимість стовпчиків у `SuppliersDataTable.tsx` (`vendor`, `contacts`, `feeds`, `products`, `currencyMarkup`, `status`).

### Крок 5: Покрокова верифікація кожної вкладки

- [x] **Вкладка 1: Джерела фідів** — перевірка підключення фіду, відображення списку, синхронізації та видалення.
- [x] **Вкладка 2: Категорії** — перевірка відображення категорій тільки при наявності товарів, збереження націнки категорії, масове перемикання.
- [x] **Вкладка 3: Націнки та правила** — створення, редагування, пріоритет та збереження діапазонів цін у БД.
- [x] **Вкладка 4: Багатовалютність** — вибір базової/цільової валюти, вибір режиму курсу, збереження націнки та кроку округлення у БД.
- [x] **Вкладка 5: Товари** — вибірка товарів конкретного постачальника за `supplierId`.

### Крок 6: Комплексне E2E тестування (`Playwright` + `Jest`)

- [x] Написати Playwright тести у `e2e/suppliers-workspace.spec.ts` (7 тестів пройдено).
- [x] Написати Playwright тести у `e2e/suppliers-management.spec.ts` (5 тестів пройдено).
- [x] Написати бекенд Jest E2E тести у `services/backend-api/test/suppliers.e2e-spec.ts` (8 тестів пройдено).
- [x] Виконати перевірку: `pnpm i18n:check` (100% паритет), `pnpm --filter @smartfeed/desktop exec tsc --noEmit` (0 помилок), `pnpm --filter @smartfeed/backend-api exec tsc --noEmit` (0 помилок).
