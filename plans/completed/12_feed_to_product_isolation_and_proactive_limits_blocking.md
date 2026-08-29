# 🎯 План: Ізоляція Товарів за Джерелом Фіду, Блокування Кнопок при Досягненні Лімітів та Виправлення Локалізації

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 29.08.2026

---

## 📌 1. Мета та Архітектурний Контекст

1. **Ізоляція товарів за фідами (`feedSourceId`)**:
   - Прив'язати кожен товар до конкретного підключеного джерела фіду (`feedSourceId`).
   - При видаленні фіду видаляти **лише товари цього фіду**, залишаючи товари з інших фідів цього ж постачальника цілими.
2. **Проактивне блокування кнопок при досягненні лімітів / надлишку**:
   - Заблокувати кнопки `+ Додати постачальника`, `Підключити фід` та `+ Підключити новий фід` (`disabled`, `opacity-50 cursor-not-allowed`) зі спливаючими підказками (tooltips), які чітко пояснюють користувачеві, що ліміт тарифу вичерпано.
3. **100% Локалізація (i18n)**:
   - Додати відсутній ключ `"connectFeedBtn"` у словники `uk/suppliers.json` та `en/suppliers.json`.

---

## 🏛 2. Зміни за Компонентами

### 🐘 А. База Даних & Спільні Контракти (`packages/shared`, `services/backend-api/prisma`)

1. `schema.prisma`:
   - У модель `Product` додати `feedSourceId String? @map("feed_source_id")`, зв'язок `feedSource FeedSource? @relation(fields: [feedSourceId], references: [id], onDelete: SetNull)`, та індекс `@@index([feedSourceId])`.
   - У модель `FeedSource` додати `products Product[]`.
2. `packages/shared/src/dtos/product.dto.ts`:
   - Додати `feedSourceId: z.string().nullable().optional()`.
3. Виконати:
   - `pnpm --filter @smartfeed/backend-api exec prisma db push`
   - `pnpm --filter @smartfeed/backend-api exec prisma generate`
   - `pnpm --filter @smartfeed/shared build`

### ⚙️ Б. Бекенд API (`services/backend-api`)

1. `feeds.controller.ts`:
   - У методі `deleteFeedSource` видаляти товари строго за `where: { feedSourceId: sourceId }`.
2. `feed-import.processor.ts` (BullMQ фоновий імпорт):
   - При створенні та оновленні товару зберігати `feedSourceId: feedSource.id`.
3. `import-feed-content.handler.ts` (Синхронний імпорт):
   - При створенні та оновленні товару зберігати `feedSourceId: feedSource.id`.

### 💻 В. Десктопний Клієнт (`apps/desktop`)

1. `uk/suppliers.json` & `en/suppliers.json`:
   - Додати `"connectFeedBtn"`, `"feedLimitReachedTooltip"`, `"supplierLimitReachedTooltip"`, `"productLimitReachedTooltip"`.
2. `SuppliersPage.tsx`:
   - Заблокувати кнопку `+ Додати постачальника` при `isSupplierLimitReached` з тултіпом.
   - Заблокувати кнопку `Підключити фід` при `isFeedLimitReached` з тултіпом.
   - Передати `isFeedLimitReached` у `SupplierCard`.
3. `SupplierCard.tsx`:
   - Заблокувати кнопку `Підключити фід` при `isFeedLimitReached` з тултіпом.
4. `SupplierFeedsModal.tsx`:
   - Заблокувати кнопку `+ Підключити новий фід` у футері та кнопку в порожньому стані при `isFeedLimitReached`.

---

## 🧪 3. План Тестування (100% Тест-Покриття)

1. **Jest E2E (`feeds-parsing.e2e-spec.ts`)**:
   - Перевірити створення 2 фідів одного постачальника: видалення Фіду 1 видаляє лише товари Фіду 1, товари Фіду 2 залишаються.
2. **Playwright E2E (`suppliers-feeds.spec.ts`)**:
   - Перевірити стан `disabled` кнопок при вичерпаному ліміті та коректність перекладу `connectFeedBtn`.
3. **Статичний тайпчек**:
   - `tsc --noEmit` у всіх пакетах.
