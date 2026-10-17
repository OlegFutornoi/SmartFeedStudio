# 🎯 Централізований Реактивний Сервіс Лічильників & Редизайн Блоків Кіно-Симулятора

## 📌 1. Мета та контекст завдання

Користувач надав зворотний зв'язок на основі реальних скріншотів інтерфейсу десктопного додатку:

1. **Картки кіно-симулятора цін (Скріншот 1)**: Блоки 2, 3, 4 виглядають як «неактивні» / вимкнені через `opacity-50`, а блок 1 має дивну важку тінь (`shadow-md scale-[1.02]`). Вимога: **всі блоки завжди повинні бути 100% чіткими, читабельними, без ефекту "неактивності" та без незрозумілих важких тіней**.
2. **Розсинхронізація лічильників фідів та товарів (Скріншоти 2 та 3)**:
   - На сторінці `/catalogs` відображається вкладка **«Джерела фідів 1»** та в таблиці присутні товари для постачальника **Mobioptom**.
   - На сторінці `/suppliers` у KPI-картках вгорі: **«Фіди: 0»**, **«Імпортовані товари: 0»**, а в рядку постачальника Mobioptom у стовпчиках «Фіди» та «Товари» стоять **0**.
   - Вимога: **провести глибокий аналіз, створити окремий централізований сервіс лічильників, щоб на будь-якій сторінці дані були синхронними, і при додаванні товарів/фідів значення миттєво оновлювалися всюди**.

---

## 🔍 2. Глибокий архітектурний аналіз причин розриву (@agents_review)

### 2.1. Чому картки 2, 3, 4 виглядали неактивними у `ReverseMarginCinemaPhases.tsx`

- **Файл:** `apps/desktop/src/modules/feed-simulator/components/ReverseMarginCinemaPhases.tsx` (рядки 98–105).
- **Причина:** У коді застосовано тернарну умову за індексом фази:
  ```tsx
  isCurrentActive
    ? `${item.activeGradient} scale-[1.02] shadow-md z-10`
    : isRevealed
      ? `${item.idleGradient} opacity-95`
      : 'bg-card/60 border-border/40 opacity-50';
  ```
- Коли активна фаза 0 (`phaseIndex === 0`), фази 1, 2, 3 ще не вважаються «відкритими» (`isRevealed = false`), тому вони отримують клас `opacity-50` та знебарвлену рамку `border-border/40`.
- Окрім цього, для активної картки задається `scale-[1.02] shadow-md z-10` з важким затемненим обрисом, що створює брудний перепад тіней.
- **Рішення:**
  - Повністю ліквідувати `opacity-50` — усі 4 блоки завжди мають повну непрозорість `opacity-100` та чітку читабельність шрифтів.
  - Замінити важку тінь `shadow-md` та `scale-[1.02]` на чистий, плоский, преміальний UI-акцент (наприклад, чітка кольорова рамка `border-2 border-primary` або верхня світлова смужка-індикатор).

---

### 2.2. Чому лічильники фідів та товарів показували 0 на сторінці постачальників

- **Файл 1 (Бекенд):** `services/backend-api/src/modules/suppliers/queries/get-suppliers.handler.ts` (рядки 70–71) та `get-supplier-by-id.handler.ts` (рядки 67–68):
  ```ts
  productsCount: 0,
  activeFeedsCount: 0,
  ```
  У NestJS API ці поля **захардкоджені в 0**, оскільки згідно з правилом архітектури `BE-01` (Native vs Cloud Segregation) PostgreSQL у хмарі зберігає лише організації, постачальників, підписки та CRM-реквізити, а 100k+ товарів та фіди зберігаються в локальній SQLite-базі клієнта (`catalog.db`) або in-memory mock-драйвері.
- **Файл 2 (Десктоп API-клієнт):** `apps/desktop/src/lib/api/suppliers.ts`:
  ```ts
  export async function getSuppliers(token?: string, search?: string): Promise<SupplierDto[]> {
    if (isTauri()) return localDb.suppliers.getSuppliers(search);
    // Якщо є токен, викликається бекенд!
    const response = await fetchWithAuth(`/suppliers${query}`, ...);
    if (response.ok) return await response.json(); // Повертає об'єкти з productsCount: 0, activeFeedsCount: 0!
  }
  ```
- **Файл 3 (Хук постачальників):** `apps/desktop/src/modules/suppliers/hooks/useSuppliersCrud.ts`:
  - Отримує масив постачальників з бекенду (де лічильники 0) і записує його напряму в стейт `setSuppliers(data)`.
  - **Ніде не відбувається злиття (hydration) з локальними лічильниками товарів та фідів SQLite / localDb!**
- **Файл 4 (Сторінка постачальників):** `apps/desktop/src/modules/suppliers/components/list/SuppliersListPage.tsx`:
  - Рахує загальні KPI просто як:
    ```tsx
    const activeFeedsTotal = suppliers.reduce((acc, s) => acc + (s.activeFeedsCount || 0), 0);
    const productsTotal = suppliers.reduce((acc, s) => acc + (s.productsCount || 0), 0);
    ```
  - Оскільки в кожного постачальника `activeFeedsCount === 0` та `productsCount === 0`, суми виходять **0**!
- **Файл 5 (Сторінка каталогів):** `apps/desktop/src/pages/CatalogsPage.tsx`:
  - На відміну від постачальників, бере фіди напряму з `localDb.feeds.getAllFeedSources()`, а кількість товарів — з `localDb.products.getProducts()`.
  - Тому на `/catalogs` фід є (badge `1`) і 6 товарів видно, а на `/suppliers` — нулі!

---

## 🏛️ 3. Архітектура рішення: Єдиний Централізований Сервіс Лічильників (@agents_planner)

Щоб на **будь-якій** сторінці (Постачальники, Каталоги, Дашборд/Home, CRM Drawer) лічильники були узгодженими та миттєво реагували на додавання/видалення фідів і товарів:

### 3.1. Створення ядра `LocalCountersService` у `services/local-db/counters.service.ts`

1. Метод `getCountersSummary()`:
   - Повертає агреговані дані:
     ```ts
     interface CountersSummary {
       totalSuppliers: number;
       totalFeeds: number;
       totalProducts: number;
       totalRules: number;
       feedsBySupplierId: Record<string, number>;
       productsBySupplierId: Record<string, number>;
     }
     ```
   - Запитує реальні агреговані підрахунки з `local_feed_sources` та `local_products` (у Tauri через оптимізований SQL-запит `COUNT(*) GROUP BY supplier_id`, у mock-режимі через агрегацію по `state.feedSources` та `state.products`).
2. Експорт синглтона `localCountersService` у `services/local-db/index.ts`.

### 3.2. Створення реактивного клієнтського сервісу та хука `useAppCounters`

- **Розташування:** `apps/desktop/src/services/counters/`
  - `counter.service.ts` — підтримує актуальний стан лічильників у пам'яті, має методи `refresh()`, `getSnapshot()`.
  - `useAppCounters.ts` — React-хук, що підписується на `syncEvents` (`useDataSync(['products', 'feeds', 'suppliers', 'all'])`) та повертає:
    ```ts
    const { counters, isLoading, refresh } = useAppCounters();
    // counters.totalSuppliers
    // counters.totalFeeds
    // counters.totalProducts
    // counters.getSupplierFeedsCount(supplierId)
    // counters.getSupplierProductsCount(supplierId)
    ```
- При будь-якій події імпорту фіду (`importFeedAsync`), синхронізації або видалення, `emitDataSync` спричиняє моментальний перерахунок та ре-рендер усіх компонентів, що використовують `useAppCounters`.

### 3.3. Гідрація постачальників (`hydrateSuppliersWithCounters`)

- У `apps/desktop/src/lib/api/suppliers.ts` або безпосередньо в `useSuppliersCrud.ts`:
  - Після отримання списку постачальників (навіть із віддаленого бекенду) запускається гідрація:
    ```ts
    const hydratedSuppliers = suppliers.map((sup) => ({
      ...sup,
      activeFeedsCount: counters.feedsBySupplierId[sup.id] ?? sup.activeFeedsCount ?? 0,
      productsCount: counters.productsBySupplierId[sup.id] ?? sup.productsCount ?? 0,
    }));
    ```
  - Це гарантує: незалежно від того, звідки прийшов постачальник (бекенд, кеш чи локальна база), його стовпчики «Фіди» та «Товари» завжди показують точні локальні дані!

### 3.4. Оновлення сторінок споживачів

- **`SuppliersListPage.tsx` & `SuppliersKpiCards.tsx`**:
  - KPI-картки живляться з `useAppCounters` або гідрованих сум.
  - Таблиця відображає актуальні `activeFeedsCount` та `productsCount` для Mobioptom (1 фід, 6 товарів).
- **`CatalogsPage.tsx`**:
  - Бейдж вкладок та загальна кількість SKU живляться з `useAppCounters`.
- **`HomePage.tsx`**:
  - Метрики дашборду використовують єдиний узгоджений лічильник.

---

## 🎨 4. Редизайн карток `ReverseMarginCinemaPhases.tsx` (@agents_frontend)

- **Файл:** `apps/desktop/src/modules/feed-simulator/components/ReverseMarginCinemaPhases.tsx`
- **Зміни оформлення:**
  1. **Zero Disabled/Inactive Look:** Усі 4 картки завжди мають `opacity-100`. Жоден блок не затемнюється і не приглушується.
  2. **Чисті, преміальні рамки та поверхні:**
     - Замість `scale-[1.02] shadow-md z-10` для активного блоку:
       - Активний блок: `border-2 border-primary/80 bg-card shadow-xs ring-1 ring-primary/20`.
       - Неактивні (але клікабельні) блоки: `border border-border/70 bg-card hover:border-border transition-colors`.
     - Верхня тоненька кольорова лінія-акцент (indicator bar) лише у вибраної картки.
  3. **Високий контраст та читабельність:**
     - Усі заголовки фаз (1, 2, 3, 4) — `text-foreground font-semibold`.
     - Цифри цін та суми — яскраві, чіткі, з відповідними семантичними токенами (`text-foreground`, `text-primary`, `text-destructive`, `text-success`).
     - Математичні бейджі внизу — солідний фон `bg-muted/60 text-foreground border-border/80`.

---

## 📋 5. План виконання робіт за кроками

### Крок 1: Редизайн блоків `ReverseMarginCinemaPhases.tsx`

- [x] Оновити класи карток: прибрати `opacity-50`, `scale-[1.02]`, важкі тіні `shadow-md`.
- [x] Забезпечити чітку семантичну підсвітку активної фази та 100% контрастність усіх 4 блоків.

### Крок 2: Реалізація сервісу локальних лічильників (`LocalCountersService`)

- [x] Створити `services/local-db/counters.service.ts` з підрахунком глобальних та по-постачальницьких фідів і товарів.
- [x] Додати обробник `db_get_counters_summary` у `mock-executor.ts` та зареєструвати в `types.ts`.
- [x] Реалізувати `db_get_counters_summary` у Rust Tauri SQLite (`db/mod.rs`, `lib.rs`).

### Крок 3: Створення реактивного Counter Service & Hook у десктопі

- [x] Створити `apps/desktop/src/services/counters/counter.service.ts` та хук `useAppCounters.ts`.
- [x] Підключити слухача подій `useDataSync` для автооновлення при імпорті/видаленні.

### Крок 4: Гідрація лічильників постачальників у `useSuppliersCrud` та `getSuppliers`

- [x] У `useSuppliersCrud.ts` та `getSuppliers.ts` об'єднувати дані постачальників з підрахованими фідами та товарами з локальної БД.
- [x] Переконатися, що на сторінці `/suppliers` Mobioptom показує правильну кількість фідів та товарів.
- [x] Видалити штучний множник `suppliers.length * 2` для правил: тепер відображається виключно реальна кількість з БД (0, якщо правил немає).

### Крок 5: Верифікація та Definition of Done (DoD)

- [x] Перевірити візуальний вигляд карток кіно-симулятора (чіткі, без `opacity-50`).
- [x] Запустити тест E2E постачальників: `pnpm --filter @smartfeed/desktop exec playwright test e2e/suppliers-crm-fields.spec.ts` (3 passed).
- [x] Запустити тест E2E управління постачальниками: `pnpm --filter @smartfeed/desktop exec playwright test e2e/suppliers-management.spec.ts` (5 passed).
- [x] Запустити швидку верифікацію: `pnpm verify:fast` (0 errors, cargo check passed).
- [x] Перевірити `pnpm invariants:check` (0 порушень).

---

## 🔒 6. Регламент затвердження (Strict Hold Protocol)

Згідно з правилом **`PLAN-01`**:

> Створення цього плану в директорії `plans/active/` **НЕ НАДАЄ ПРАВА** змінювати код до отримання команди від користувача.
> Очікуємо погодження: _"починай"_, _"виконуй"_, _"реалізовуй"_.
