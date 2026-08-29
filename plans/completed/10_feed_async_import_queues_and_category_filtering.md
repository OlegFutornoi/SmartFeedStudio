# 🚀 План: Асинхронні Черги BullMQ, Вибірковий Імпорт Категорій та Управління Фідами Постачальника

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 29.08.2026

---

## 📌 Огляд задачі

Користувач зазначив три критичні проблеми в процесі імпорту:

1. **Синхронне блокування інтерфейсу**: Раніше імпорт великого фіду блокував користувача на модальному вікні. Процес переведено на **фонові черги BullMQ + Redis**, щоб завантаження відбувалося асинхронно у фоні без блокування інтерфейсу.
2. **Неможливість вибору категорій (перевищення лімітів тарифу)**: Якщо у постачальника 5 000 товарів, а ліміт користувача за тарифом — 1 000 SKU, тепер доступний **вибірковий імпорт категорій** (з лічильниками SKU біля кожної категорії, швидким пошуком, «Обрати всі» / «Зняти всі») та динамічний підрахунок залишку квоти.
3. **Управління підключеними фідами у постачальника**: Реалізовано модальне вікно `SupplierFeedsModal` та інтерактивний лічильник на картці постачальника, де відображаються всі підключені джерела (`FeedSource`), їх статус, дата останньої синхронізації та кнопка ручної повторної синхронізації.

---

## 👥 Реалізовані Архітектурні Рішення

### 1. Неблокуючий фоновий імпорт (BullMQ + Redis)

- Ендпоінт `POST /api/feeds/import-async` додає задачу в чергу `feed-import` (`@Processor('feed-import')`), зберігає `ImportJob` зі статусом `PENDING`, і повертає `202 Accepted` з `jobId`.
- Модальне вікно дозволяє закрити діалог кнопкою «Продовжити роботу (закрити вікно)».
- Плаваючий глобальний віджет `GlobalJobProgressBar` та контекст `BackgroundJobsContext` опитують активні задачі лише під час виконання імпорту (Zero-Duplicate Network Calls) та показують live-прогрес (`[⏳ Livolo: 45% (650/1420 SKU)]`).
- Після завершення квоти товарів оновлюються автоматично через `useQuotas().refreshQuotas()`.

### 2. Вибірковий імпорт категорій (Selective Category Filtering)

- На кроці 3 прев'ю виводиться список категорій з чекбоксами та реальними лічильниками знайдених товарів:
  - `[x] Сенсорні вимикачі (30 SKU)`
  - `[x] Розумні розетки (15 SKU)`
  - `[ ] Рамки (5 SKU)`
- Пошук категорій `Search`, кнопки «Обрати всі», «Зняти всі».
- Живий лічильник квоти: `Обрано 45 SKU / Доступно за лімітом 4 750 SKU`.
- Якщо обрано більше за доступний ліміт — кнопка блокується з попередженням.

### 3. Управління підключеними фідами у постачальника

- Клік на блок «Підключені фіди: N» у картці постачальника відкриває `SupplierFeedsModal`:
  - Список джерел (`FeedSource`): формат, URL / файл, статус синхронізації, час синхронізації, кількість товарів.
  - Кнопка **«Синхронізувати»** для фонового оновлення цін та залишків.
  - Кнопка **«Видалити»** джерело.
  - Кнопка **«+ Підключити новий фід»**.

---

## 🏛 Архітектурні Зміни за Пакетами

### ⚙️ Backend API (`services/backend-api`)

- `schema.prisma`: додано зв'язок `User` ➡️ `ImportJob` (`userId` з `@@index([userId])`), поле `selectedCategories Json?`.
- `FeedParserService`: підрахунок товарів у категоріях (`categories: { id, name, parentId, productCount }[]`) та підтримка фільтра `selectedCategoryIds: string[]`.
- `FeedImportProcessor`: BullMQ воркер `@Processor('feed-import')` для фонової пакетної обробки товарів чанками по 50 шт з оновленням прогресу та `ImportJob`.
- `FeedsController`:
  - `POST /api/feeds/import-async`
  - `GET /api/feeds/jobs/:jobId`
  - `GET /api/feeds/jobs/active`
  - `GET /api/feeds/suppliers/:supplierId/sources`
  - `POST /api/feeds/suppliers/:supplierId/sources/:sourceId/sync`
  - `DELETE /api/feeds/suppliers/:supplierId/sources/:sourceId`

### 💻 Desktop Client (`apps/desktop`)

- `api.ts`: додано методи `importFeedAsync`, `getImportJobStatus`, `getActiveImportJobs`, `getSupplierFeedSources`, `syncSupplierFeedSource`, `deleteSupplierFeedSource`.
- `BackgroundJobsContext.tsx`: глобальний реактивний контекст моніторингу фонових імпортів.
- `GlobalJobProgressBar.tsx`: плаваючий віджет у правому нижньому кутку екрану.
- `WizardStepPreview.tsx`: інтерактивний вибір категорій з пошуком, лічильником обраних SKU та захистом лімітів квоти.
- `SupplierFeedsModal.tsx`: перегляд підключених посилань/файлів, статусів синхронізації та кнопка «Синхронізувати».
- `SupplierCard.tsx`: інтеграція відкриття списку підключених фідів.
- `uk/suppliers.json` & `en/suppliers.json`: 100% двомовні словники.

---

## 🧪 Результати Тестування

1. **Jest E2E (`services/backend-api`)**:
   - `pnpm --filter @smartfeed/backend-api test:e2e`
   - 13 сьютів, **153/153 тестів пройдено (100% PASS)**.
2. **Desktop Playwright E2E (`apps/desktop`)**:
   - `pnpm test:desktop`
   - **40/40 тестів пройдено (100% PASS)**.
3. **Admin Playwright E2E (`apps/admin-portal`)**:
   - `pnpm test:admin`
   - **67/67 тестів пройдено (100% PASS)**.
4. **Static Typecheck**:
   - `@smartfeed/shared`, `@smartfeed/backend-api`, `@smartfeed/desktop`, `admin-portal` — `tsc --noEmit` exit 0 (0 помилок).
