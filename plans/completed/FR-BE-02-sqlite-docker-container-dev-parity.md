# 📋 Задача FR-BE-02: Підняття контейнера локальної SQLite-бази в Docker та усунення in-memory моків у Web-розробці

> **Тип:** Спільна Full-Stack задача (`FR-BE`)  
> **Статус:** ✅ Виконано (Completed)  
> **Ціль:** Забезпечити 100% паритет між десктопним Tauri-клієнтом та браузерним Web-режимом розробки шляхом запуску реальної локальної SQLite-бази в Docker замість штучних in-memory моків (`mockDatabaseDriver`).  
> **Відповідальні агенти:** `@agents_devops`, `@agents_backend`, `@agents_frontend`

---

## 1. Першопричина та аналіз проблеми (RCA)

1. **Імітаційний розрив (Mock vs Real SQLite):**
   - У нативному застосунку Tauri база даних — це зашифрований файл SQLite (`catalog.sfdb`) через Rust `rusqlite`.
   - У браузерному режимі розробки (`pnpm dev:desktop` на `http://localhost:1420`) браузер не мав доступу до файлової системи Mac, тому `client.ts` перемикався на `mockDatabaseDriver` (об'єкт у RAM браузера).
   - В результаті будь-які імпортовані фіди, товари та категорії зберігалися у тимчасовій пам'яті браузера, яка розсинхронізовувалася з базою і зникала при перезавантаженні сторінки.

2. **Справжні дані в Docker:**
   - Створено контейнер `smartfeed-sqlite-dev` (порт 5001), який надає доступ до реальної бази SQLite (`/data/smartfeed-dev.db`) через HTTP-міст `POST /api/invoke`.
   - Всі in-memory моки (`mock-driver.ts`, `mock-executor.ts`, `mock/`) повністю видалені з кодової бази.
   - Браузерний клієнт напряму працює з реальними таблицями SQLite у Docker, забезпечуючи 100% паритет із Tauri SQLite.

---

## 2. Архітектурне рішення

1. **Docker-контейнер `smartfeed-sqlite-dev` (порт 5001):**
   - Додано сервіс `sqlite-dev` у [`docker-compose.yml`](file:///Users/oleg/AQA/SmartFeedStudio/docker-compose.yml).
   - Контейнер монтує volume `sqlite_data:/data` та створює реальний файл `smartfeed-dev.db`.
   - Схема містить 14 таблиць: `local_suppliers`, `local_feed_sources`, `local_supplier_categories`, `local_supplier_pricing_rules`, `local_products`, `local_product_images`, `local_counters`, `local_bank_rates`, `local_supplier_sync_settings`, `local_supplier_sync_logs`, `local_marketplace_categories`, `local_supplier_category_marketplace_maps`, `local_export_channels`, `local_export_channel_pricing_rules`.

2. **Єдиний протокол взаємодії `POST /api/invoke`:**
   - Контейнер приймає команди з типізованої карти `LocalDbCommandMap`.
   - Виконує реальні SQL-запити через вбудований у Node 22 модуль `node:sqlite` (`DatabaseSync`), підтримує транзакції, індекси та каскадні зв'язки.
   - Надає ендпоінти `GET /health` та `POST /api/reset`.

3. **Адаптер клієнта [`client.ts`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/services/local-db/client.ts):**
   - Якщо `isTauri() === true` -> нативні Rust-команди Tauri v2.
   - Якщо `isTauri() === false` -> HTTP-виклики до реального SQLite в Docker (`http://localhost:5001/api/invoke`).
   - Жодних in-memory моків — у разі помилки зв'язку з базою генерується чесний виняток.

4. **Виправлення відображення фідів та категорій:**
   - У [`feed-sources.ts`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/lib/api/feed-sources.ts): об'єднання віддалених та локальних джерел фідів за ID.
   - У `supplier-categories.ts`: знято блокування за відсутності активних фідів у PostgreSQL, якщо категорії присутні в SQLite.
   - У `products.mjs`: під час імпорту товарів автоматично створюються та оновлюються категорії в `local_supplier_categories`.

---

## 3. Звіт про реалізацію

### Етап 1. Створення SQLite Dev Server (`tools/sqlite-dev-server`)

- [x] 1.1. Створено модульний сервер на базі Node 22 (`node:sqlite`): `server.mjs`, `db.mjs`, обробники `handlers/*.mjs` (<170 рядків кожен за правилом `CORE-04`).
- [x] 1.2. Перенесено 14 таблиць та індекси з `src-tauri/src/db/schema.rs` у `tools/sqlite-dev-server/schema.sql`.
- [x] 1.3. Реалізовано обробники для всіх команд `LocalDbCommandMap`.
- [x] 1.4. Додано маршрути `GET /health` та `POST /api/reset`.

### Етап 2. Інтеграція в Docker Compose

- [x] 2.1. Додано сервіс `sqlite-dev` у [`docker-compose.yml`](file:///Users/oleg/AQA/SmartFeedStudio/docker-compose.yml):
  - Контейнер: `smartfeed-sqlite-dev`
  - Порт: `5001:5001`
  - Volume: `sqlite_data:/data`
- [x] 2.2. Запущено та перевірено працездатність: `curl http://localhost:5001/health` повертає `status: ok`, `tablesCount: 14`.

### Етап 3. Оновлення клієнта Desktop (`client.ts`)

- [x] 3.1. Оновлено [`client.ts`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/services/local-db/client.ts): спрямування викликів у Docker SQLite на порт 5001 при роботі у браузері.
- [x] 3.2. Повністю видалено in-memory моки (`mock-driver.ts`, `mock-executor.ts`, папка `mock/`).
- [x] 3.3. Очищено залежності від моків у `authSessionStorage.ts`, `supplier-sync.ts`, `useCatalogMediaSync.ts` та `local-db/index.ts`.

### Етап 4. Виправлення синхронізації фідів та категорій

- [x] 4.1. Оновлено [`feed-sources.ts`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/lib/api/feed-sources.ts): об'єднання віддалених та локальних джерел фідів.
- [x] 4.2. Створено допоміжні модулі `feed-sources-types.ts` та `feed-sources-import.ts` для дотримання ліміту <300 рядків (`CORE-04`).
- [x] 4.3. Виправлено синтаксичну помилку мерджу категорій у `supplier-categories.ts`.
- [x] 4.4. Додано початкові записи постачальників Brain Distribution (`cmvb846920000mtl8slbx665q`) та Mobioptom (`cmvdo5de40006s1l8qef2u8dg`) у Docker SQLite.

### Етап 5. Автотести (Статус за вимогою користувача)

- [x] 5.1. Відповідно до прямої вказівки користувача:
  > _«тести ніякі зараз не пиши після цієї задачі ми повністю змінемо ситему тестування»_  
  > Нові тести не створювалися. Повна перебудова тестової інфраструктури запланована наступним етапом.

---

## 4. Критерії готовності (Definition of Done)

- [x] 1. Сервіс `smartfeed-sqlite-dev` успішно працює в Docker на порту `5001`, підтримує 14 таблиць.
- [x] 2. Браузерний застосунок взаємодіє виключно з реальною SQLite-базою в Docker, моки видалено.
- [x] 3. Постачальник Mobioptom та його фід і категорії успішно записуються та читаються з Docker SQLite.
- [x] 4. Перевірка типів `pnpm --filter @smartfeed/desktop exec tsc --noEmit` проходить з 0 помилок.
- [x] 5. Збірка бекенду `pnpm --filter @smartfeed/backend-api build` проходить успішно.
- [x] 6. Перевірка локалізації `pnpm i18n:check` проходить на 100%.
- [x] 7. Перевірка інваріантів `pnpm invariants:check` проходить з 0 порушень.
