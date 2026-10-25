# 📋 План: Повний Декаплінг Налаштувань Синхронізації Постачальника з Хмарного Бекенду (Local-First Decoupling: `SupplierSyncSetting` & `SupplierSyncLog`)

**Статус:** ✅ Виконано та верифіковано (100% тестів PASS, 0 помилок)  
**Відповідальний агент:** `@agents_backend`  
**Дата створення:** 2026-10-25  
**Дата завершення:** 2026-10-25  
**Контекст:** Ліквідація застарілих хмарних сутностей `SupplierSyncSetting` та `SupplierSyncLog` із PostgreSQL (`schema.prisma`) та NestJS контролерів, оскільки каталоги товарів та вся логіка синхронізації виконуються на 100% локально на комп'ютері користувача у SQLite (`local_supplier_sync_settings`, `local_supplier_sync_logs`).

---

## 🏛️ 1. Архітектурне Обґрунтування

1. **Local-First суверенітет:** Каталоги товарів (`local_products`, 100 000+ SKU) не зберігаються на сервері PostgreSQL задля конфіденційності клієнта та нульових витрат на хмарні бази даних.
2. **Ліквідація рудиментів:** Сервер не має товарів і не може їх оновлювати, тому таблиці `supplier_sync_settings` та `supplier_sync_logs` у хмарній БД та фіктивний хендлер `sync-supplier-feed.handler.ts` були архітектурним баластом.
3. **Локальні джерела правди:** Налаштування захисту полів, націнок та історія оновлень зберігаються виключно в клієнтській БД десктопного додатку:
   - `local_supplier_sync_settings` ([`schema.rs:L154`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src-tauri/src/db/schema.rs#L154))
   - `local_supplier_sync_logs` ([`schema.rs:L178`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src-tauri/src/db/schema.rs#L178))
   - `state.syncSettings` та `state.syncLogs` ([`mock-supplier-sync.ts`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/services/local-db/mock/mock-supplier-sync.ts))

---

## 🎯 2. Виконані Етапи (Definition of Done)

### Етап 1: Оновлення Тестів (TDD RED -> GREEN)

- [x] Додано перевірку 404 у `services/backend-api/test/suppliers.e2e-spec.ts` (тест 8b): `/api/suppliers/:id/sync-settings`, `/api/suppliers/:id/sync-logs`, `/api/suppliers/:id/sync` повертають 404 Not Found.
- [x] Оновлено тест 11 у `services/backend-api/test/suppliers-tabs-crud.e2e-spec.ts` на перевірку 404.
- [x] Прибрано видалені моделі із `test/utils/teardown.helper.ts`.

### Етап 2: Очищення Схеми PostgreSQL (Prisma)

- [x] Видалено моделі `SupplierSyncSetting` та `SupplierSyncLog` із `services/backend-api/prisma/schema.prisma`.
- [x] Видалено поля зв'язків `syncSettings` та `syncLogs` із моделі `Supplier`.
- [x] Виконано `pnpm --filter @smartfeed/backend-api prisma:generate`.

### Етап 3: Видалення Серверних Хендлерів та Ендпоінтів

- [x] Видалено мертві хендлери та DTO:
  - `queries/get-supplier-sync-settings.handler.ts`
  - `queries/get-supplier-sync-logs.handler.ts`
  - `queries/supplier-sync.handlers.ts`
  - `commands/handlers/update-supplier-sync-settings.handler.ts`
  - `commands/handlers/sync-supplier-feed.handler.ts`
  - `commands/handlers/clear-supplier-sync-logs.handler.ts`
  - `dto/supplier-sync.dto.ts`
- [x] Очищено `suppliers.controller.ts`, `suppliers.commands.ts`, `suppliers.queries.ts`, `commands/handlers/index.ts`, `suppliers.module.ts`, `feeds.controller.ts`.
- [x] Переведено `check-feed-collision.handler.ts` на перевірку колізій через реальні джерела фідів `SupplierFeedSource`.
- [x] Успішно зібрано продакшн бандл бекенду: `pnpm --filter @smartfeed/backend-api build` (0 помилок).

### Етап 4: Декаплінг Клієнтського API Десктопу

- [x] В `apps/desktop/src/lib/api/supplier-sync.ts`: прибрано мережеві виклики `fetchWithAuth('/suppliers/:id/sync-settings')`, `/sync-logs`, `/sync`. Усі операції виконуються на 100% локально через клієнтський драйвер.

### Етап 5: Верифікація та DoD

- [x] Supertest E2E `suppliers.e2e-spec.ts`: 11/11 тестів PASS.
- [x] Supertest E2E `suppliers-tabs-crud.e2e-spec.ts`: 12/12 тестів PASS.
- [x] Supertest E2E `feed-collision.e2e-spec.ts`: 5/5 тестів PASS.
- [x] `pnpm verify:fast`: PASS (ESLint, i18n parity 100%, invariants 100%, depcruise 0 violations, agents check 0 errors, tsc --noEmit 0 errors, cargo check PASS).
