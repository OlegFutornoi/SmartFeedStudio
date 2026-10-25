# 📋 План: Відображення категорій постачальника та прив'язка категорій до джерел фідів

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 21.10.2026  
> **Цільовий застосунок:** Desktop Client (`apps/desktop` — Tauri v2 + React 18)  
> **Відповідальний агент:** `@agents_frontend` / `@agents_backend`

---

## 1. Контекст та аналіз першопричини (Root Cause Analysis)

### Симптоми з боку користувача:

1. У каталозі товарів (`/products`) відображається **4994 товари** постачальника **Mobioptom** з реальними категоріями фіду у фільтрі (наприклад, «Черные выключатели ELIOS в стеклянной 2.5D рамке»).
2. У картці постачальника Mobioptom на вкладці **«Категорії»** відображається порожній стан (`Empty State`): _«У цього постачальника ще немає категорій. Активно: 0 / 0»_.
3. Користувач не бачить, до якого саме фіду належить кожна категорія («ми повинні ще розуміти якого фіда це категорія»).

### Технічні причини дефекту:

1. **Передчасне повернення порожнього масиву з віддаленого API:**
   У файлі `apps/desktop/src/lib/api/supplier-categories.ts`:
   ```typescript
   const response = await fetchWithAuth(`/suppliers/${supplierId}/categories${query}`, ...);
   if (response.ok) {
     const data = await response.json();
     if (Array.isArray(data)) return data; // <--- Повертає [] з хмарної БД Postgres
   }
   ```
   Каталог товарів і парсинг фідів у SmartFeed Studio виконуються на клієнті в локальній БД (`localDb` / SQLite), а хмарний бекенд PostgreSQL зберігає лише сутності організації та постачальників без локальних товарів фіду. Запит до віддаленого бекенда повертає HTTP 200 `[]`. Оскільки `Array.isArray([]) === true`, функція повертає `[]` і ніколи не викликає локальний fallback `localDb.suppliers.getSupplierCategories`.
2. **Відсутність оновлення категорій після пакетного імпорту фідів:**
   У `BatchIngester.ingestProducts` товари імпортуються через `localDb.products.bulkUpsert`, проте оновлення категорій постачальника не викликалося після додавання нових товарів.
3. **Відсутність прив'язки категорії до фіду в інтерфейсі та моделях:**
   Модель `SupplierCategoryRuleDto` не містила полів `feedSourceId` та `feedName`. У таблиці категорій постачальника була відсутня колонка джерела фіду та фільтрація за фідами, що унеможливлювало розуміння, з якого саме фіду надійшла категорія при наявності декількох джерел.

---

## 2. Архітектурні зміни та рішення

### Крок 1. Контракти `@smartfeed/shared`

- Оновити `SupplierCategoryRuleDtoSchema` у `packages/shared/src/dtos/supplier-category.dto.ts`:
  - `feedSourceId: z.string().nullable().optional()`
  - `feedName: z.string().nullable().optional()`
- Перезібрати пакет: `pnpm --filter @smartfeed/shared build`.

### Крок 2. API-клієнт категорій десктопу (`supplier-categories.ts`)

- Оновити `getSupplierCategories`:
  - Якщо віддалена відповідь `data` є масивом, але має довжину 0 (`data.length === 0`), виконувати плавний перехід на `localDb.suppliers.getSupplierCategories(supplierId, search)`.
  - Якщо в локальній базі є категорії, повертати їх користувачеві.

### Крок 3. Локальний рушій категорій (`mock-supplier-categories.ts`)

- Оновити `ensureSupplierCategories`:
  - Знаходити товари як за `supplierId`, так і за іменем постачальника (`p.supplierName === supplier.name`).
  - Отримувати список фідів постачальника (`state.feedSources.get(supplierId)`).
  - Групувати категорії з урахуванням `categoryId` та `feedSourceId`.
  - Заповнювати `feedSourceId` та `feedName` для кожного правила категорії.
  - Зберігати налаштування `isActive`, `marginPercent`, `fixedMarkup`, якщо вони вже були задані користувачем.
  - Оновлювати `productCount` на основі реальної кількості товарів у цій категорії та фіді.
- Викликати оновлення категорій у `BatchIngester` після імпорту товарів фіду.

### Крок 4. Інтерфейс вкладки категорій (`SupplierCategoriesTab.tsx` та `SupplierCategoryRow.tsx`)

- Додати у верхню панель фільтр вибору фіду (`Select`):
  - Опція «Всі фіди» (`ALL`).
  - Список доступних фідів постачальника з підрахунком.
- Додати колонку «Джерело фіду» (`columnFeedSource`) з іконкою `Rss` та назвою фіду.
- Декомпонувати рядок таблиці у `SupplierCategoryRow.tsx` для дотримання бюджету рядків (`CORE-04` < 250 рядків).
- Забезпечити 100% солідний липкий хедер (`UI-03`).

### Крок 5. Локалізація (100% i18n parity)

- Додати ключі у `apps/desktop/src/i18n/locales/uk/suppliers.json` та `en/suppliers.json`:
  - `columnFeedSource`: «Джерело фіду» / «Feed Source»
  - `allFeeds`: «Всі фіди» / «All Feeds»
  - `primaryFeed`: «Основний фід» / «Primary Feed»
  - `filterByFeed`: «Фільтр за фідом» / «Filter by feed»
- Перевірити `pnpm i18n:check`.

### Крок 6. Тестування та верифікація (TDD & E2E)

- [x] Оновлено E2E-тест у `apps/desktop/e2e/suppliers-drawer-and-single-request.spec.ts`:
  - Перевірено відображення колонки «Джерело фіду» та бейджа фіду `Livolo Main XML` для категорії.
  - Перевірено пошук та фільтрацію категорій.
  - Усі 6/6 тестів пройшли успішно (зелені).
- [x] Декомпоновано компоненти з дотриманням бюджетів рядків (`CORE-04` < 250 рядків):
  - `SupplierCategoriesTab.tsx`: 204 рядки
  - `SupplierCategoriesToolbar.tsx`: 134 рядки
  - `SupplierCategoryRow.tsx`: 109 рядків
- [x] Декомпоновано тестові фікстури (`CORE-04` < 300 рядків):
  - `suppliers-feeds-mock-data.ts`: 228 рядків
  - `suppliers-mock-entities.ts`: 122 рядки
- [x] Перевірено статичну типізацію: `tsc --noEmit` пройшов з 0 помилок у `@smartfeed/desktop`, `@smartfeed/backend-api` та `@smartfeed/shared`.
- [x] Перевірено мовну відповідність: `pnpm i18n:check` — 100% паритет UK/EN.
- [x] Перевірено інваріанти: `pnpm invariants:check` — 0 порушень.
