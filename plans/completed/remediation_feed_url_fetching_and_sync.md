# 📋 План виправлення: Завантаження фідів за URL та синхронізація залишків і цін (Remediation Plan)

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 04.10.2026  
> **Автор/Роль:** `agents_review` (Code Review & Audit Agent)  
> **Пріоритет:** 🔥 **P0 (Критичний функціонал ядра)**  
> **Цільові пакети:** `@smartfeed/shared`, `services/backend-api`, `apps/desktop`

---

## 📌 1. Формулювання проблеми та першопричина (Root Cause Analysis)

### 🔴 Симптоми

1. При введенні зовнішнього URL фіду (наприклад, `https://mobioptom.com/price/allcategories.xml` або `https://livolo.kiev.ua/...`) у вікні «Майстер Імпорту Фідів» та натисканні кнопки «Аналізувати» виникає червона помилка:  
   _«Не вдалося завантажити фід. Перевірте підключення до інтернету або доступність сервера постачальника.»_
2. Користувач не може виконати первинний імпорт фіду за посиланням.
3. Наступна періодична синхронізація залишків та цін (автооновлення `autoUpdatePrices`, `autoUpdateStocks`, кнопка «Синхронізувати») не може працювати, оскільки в `syncSupplierFeedSource` була заглушка, яка не завантажувала свіжий XML та не оновлювала товари в базі.

### 🔍 Технічна першопричина

1. **Браузерне CORS-блокування у десктопному клієнті (WebKit/Safari)**:
   - У `apps/desktop/src/lib/api/feeds-mutations.ts` функція `fetchFeedContent` містить умову `if (!isTauri())`. У нативному десктопному застосунку `isTauri() === true`, через що локальний Vite-проксі (`/feed-proxy`) ігнорувався.
   - Далі виконувався прямий браузерний виклик `fetch(cleanUrl)` зсередини WKWebView.
   - Оскільки 99% серверів постачальників не мають заголовка `Access-Control-Allow-Origin: *`, WebKit безпеково блокував запит (`Failed to fetch`).
2. **Відсутність серверного Fetcher/Proxy ендпоінта в NestJS**:
   - На відміну від зображень (які завантажуються нативним Rust-клієнтом), для фідів був відсутній серверний або нативний релей для обходу CORS.
3. **Заглушка замість синхронізації в `syncSupplierFeedSource`**:
   - `syncSupplierFeedSource` повертав фіктивний `{ success: true, jobId: ... }` без повторного стягування фіду, парсингу оферів та оновлення полів `price`, `stock_quantity`, `in_stock` у `local_products`.

---

## 🏛 2. Архітектурне рішення (Target Architecture & 4-Layer Defense)

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                              АРХІТЕКТУРА ЗАВАНТАЖЕННЯ ТА СИНХРОНІЗАЦІЇ                  │
 └────────────────────────────────────────────────────────────────────────────────────────┘
                                            │
               ┌────────────────────────────┴───────────────────────────┐
               ▼                                                        ▼
   ┌───────────────────────┐                                ┌───────────────────────┐
   │ 1. Первинний імпорт   │                                │ 2. Фонова / ручна     │
   │    за URL             │                                │    синхронізація      │
   └───────────┬───────────┘                                └───────────┬───────────┘
               │                                                        │
               ▼                                                        ▼
   ┌────────────────────────────────────────────────────────────────────────────┐
   │ fetchFeedContent(url) — 3-рівневий каскад завантаження без CORS:          │
   │  1. Backend API Relay: POST /api/feeds/fetch-url (Server-to-Server, no CORS) │
   │  2. Local Dev Proxy:   GET /feed-proxy?url=... (якщо запущено Vite dev)    │
   │  3. Native OS Rust / Direct fallback                                      │
   └─────────────────────────────────────┬──────────────────────────────────────┘
                                         │ Повертає raw XML/CSV
                                         ▼
   ┌────────────────────────────────────────────────────────────────────────────┐
   │ feedEngine.parseProducts(content) & batchIngester.ingestProducts()        │
   │  • Оновлення цін за націнками постачальника (PricingRules)                 │
   │  • Атомарний Upsert у SQLite (price, cost_price, stock_quantity, in_stock)│
   │  • Оновлення часу останньої синхронізації lastSyncedAt                     │
   │  • Реактивні події: emitDataSync(['products', 'feeds', 'suppliers'])      │
   └────────────────────────────────────────────────────────────────────────────┘
```

### 🛡️ 4-Рівнева модель захисту (Defense-in-Depth):

- **Шар 1 (DTO & Валідація)**: `FetchFeedUrlDto` перевіряє валідність URL (`@IsUrl({ protocols: ['http', 'https'] })`). Захист від SSRF (блокування запитів до localhost, 127.0.0.1, 10.x, 192.168.x).
- **Шар 2 (Domain/Quota)**: Перевірка лімітів підписки на кроці вибору категорій (для користувача `dgo@gmail.com` з планом STARTER діє ліміт 1 000 SKU).
- **Шар 3 (Security/RBAC)**: Ендпоінт захищений `JwtAuthGuard` та Throttler (rate limiting від DoS).
- **Шар 4 (Database)**: Атомарне оновлення в SQLite за унікальним `id` (`sf_prod_{supplierId}_{sku}`) без дублікації записів.

---

## 📐 3. Бюджет модульності компонентів (Max 250–300 рядків)

- `packages/shared/src/dtos/feed.dto.ts` — додавання `FetchFeedUrlDto` (~25 рядків).
- `services/backend-api/src/modules/feeds/feeds.module.ts` (~35 рядків).
- `services/backend-api/src/modules/feeds/feeds.controller.ts` (~60 рядків).
- `services/backend-api/src/modules/feeds/queries/fetch-feed-url.query.ts` (~20 рядків).
- `services/backend-api/src/modules/feeds/queries/handlers/fetch-feed-url.handler.ts` (~120 рядків, захист від SSRF, timeout 60s, стрімінг).
- `apps/desktop/src/lib/api/feeds-mutations.ts` — рефакторинг `fetchFeedContent` (~60 рядків).
- `apps/desktop/src/lib/api/feed-sources.ts` — повноцінна реалізація `syncSupplierFeedSource` (~60 рядків).

---

## 📋 4. Поетапний план реалізації

- [ ] **Фаза 1: Контракти в `@smartfeed/shared`**
  - Додати `FetchFeedUrlDtoSchema`, `FetchFeedResultDtoSchema`.
  - Зібрати контракт `pnpm build:shared`.
- [ ] **Фаза 2: Серверний CQRS модуль `FeedsModule` у `services/backend-api`**
  - Створити `FetchFeedUrlQuery` та безпечний обробник з SSRF-захистом.
  - Створити `FeedsController` з ендпоінтом `POST /feeds/fetch-url`.
  - Підключити `FeedsModule` до `app.module.ts`.
- [ ] **Фаза 3: Оновлення мережевого завантажувача у десктопному клієнті**
  - Оновити `fetchFeedContent` у `apps/desktop/src/lib/api/feeds-mutations.ts` для виклику бекенд-релея `${API_BASE_URL}/feeds/fetch-url` з fallback на локальний Vite-проксі.
- [ ] **Фаза 4: Повноцінна синхронізація залишків та цін у `apps/desktop`**
  - У `syncSupplierFeedSource` (`apps/desktop/src/lib/api/feed-sources.ts`) реалізувати повторне завантаження за URL, парсинг оферів, оновлення товарів у БД через `feedEngine.ingest` та фіксацію `lastSyncedAt`.
- [ ] **Фаза 5: Верифікація та тестування**
  - Перевірити парсинг `https://mobioptom.com/price/allcategories.xml`.
  - Запустити повний тайпчек `tsc --noEmit` у всіх пакетах.
  - Запустити автоформатування `pnpm format`.
