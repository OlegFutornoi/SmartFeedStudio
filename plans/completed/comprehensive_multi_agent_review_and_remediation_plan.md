# 📋 Комплексний аудит проекту та план усунення дефектів (Multi-Agent Review & Remediation)

> **Статус:** 🟡 **На погодженні (Waiting for User Approval)**  
> **Дата аудиту:** 17.10.2026  
> **Охоплення агентів:** `@agents_review` (Code Review), `@agents_devops` (DevOps & Release), `@agents_security` (AppSec & Pentest), `@agents_qa` (QA & Benchmarks)  
> **Цільовий репозиторій:** `SmartFeed Studio` (Tauri v2 Desktop, Next.js 14 Admin Portal, NestJS 11 CQRS Backend, Shared Packages)

---

## 📌 1. Загальний огляд та резюме аудиту

Під час глибокого технічного аналізу кодової бази, конфігурацій розгортання, телеметрії Sentry, правил валідації та тестових наборів було виявлено низку критичних та середніх дефектів у 4 функціональних напрямках:

```mermaid
graph TD
    subgraph "Аудит 4 Агентів"
        REV["@agents_review<br/><b>Code Review & Quality</b><br/>309 порушень UI/i18n,<br/>6 файлів >300 рядків,<br/>Sentry UI помилки"]
        DEV["@agents_devops<br/><b>DevOps & Release</b><br/>Відсутність prisma/migrations,<br/>Небезпечний db push у prod,<br/>Дрифт Railway auth"]
        SEC["@agents_security<br/><b>AppSec & Pentest</b><br/>Wildcard CORS *.up.railway.app,<br/>SSRF TOCTOU DNS Rebinding,<br/>csp: null у Tauri"]
        QA["@agents_qa<br/><b>QA & Benchmarks</b><br/>In-memory Regex парсер (OOM),<br/>Неповнота teardown каскаду,<br/>Відсутність race-тестів"]
    end

    REV --> PLAN["<b>Єдиний план усунення</b><br/>(5 скоординованих блоків)"]
    DEV --> PLAN
    SEC --> PLAN
    QA --> PLAN
```

---

## 🔍 2. Знахідки та аналіз дефектів за доменами

### 2.1. 🧐 Блок `@agents_review`: Архітектура коду, UI-інваріанти та чистота

1. **Технічний борг UI-інваріантів у Ratchet Baseline (`tools/guardrails/baseline.json`)**:
   - `UI-05` (166 порушень): використання нативних HTML-елементів (`<button>`, `<input>`, `<table>`, `<select>`, `<label>`) замість уніфікованих компонентів з `@/components/ui/*` (shadcn/ui).
   - `I18N-01` (57 порушень): захардкоджений кириличний текст у JSX-розмітці в обхід хука `t(...)` та локалізаційних словників (`uk`/`en`).
   - `UI-02` (53 порушення): жорстко закодовані кольори палітри Tailwind (`emerald-500`, `blue-600`, `red-500` тощо) замість семантичних токенів дизайну (`text-success`, `bg-success/15`, `text-primary`, `border-destructive`).
   - `UI-01` (32 порушення): напівпрозорі заголовки (`backdrop-blur` разом із `bg-*/NN`) у липких таблицях та діалогах замість 100% суцільних поверхонь (`bg-card`, `bg-background`).
   - `ASYNC-01` / `ASYNC-02` (2 порушення): неперехоплені та помилково використані проміси (`@typescript-eslint/no-floating-promises`, `@typescript-eslint/no-misused-promises`).

2. **Порушення ліміту розміру файлів (`CORE-04`, ліміт < 300 рядків)**:
   - `services/backend-api/src/modules/suppliers/dto/supplier.dto.ts` — **338 рядків** (монолітний DTO-файл, потребує розбиття на `create-supplier.dto.ts`, `update-supplier.dto.ts`, `supplier-query.dto.ts`).
   - `apps/desktop/src/modules/suppliers/components/drawer/tabs/SupplierDrawerOverviewTab.tsx` — **303 рядки** (потрібно декомпонувати на секції менеджерів, контактів та юрадреси).
   - `apps/desktop/src/modules/suppliers/components/details/tabs/SupplierPricingTab.tsx` — **306 рядків**.
   - `apps/desktop/src/components/feeds/WizardStepPreview.tsx` — **306 рядків**.
   - `apps/desktop/src/lib/api/feed-sources.ts` — **305 рядків**.
   - `apps/desktop/src/services/local-db/mock/mock-suppliers.ts` — **320 рядків**.

3. **Реальні помилки фронтенду з телеметрії Sentry (`smartfreestudio`)**:
   - `Error: useAuth must be used within an AuthProvider` (7 випадків на `/` та `/settings`) — рендеринг компонентів поза контекстом авторизації при прямому перенаправленні.
   - `ReferenceError: Avatar is not defined` (4 випадки на `/settings`) — відсутній імпорт базового UI-компонента.
   - `TypeError: Cannot read properties of null (reading 'useState')` (6 випадків на `/suppliers`) — порушення правил хуків React під час швидкого перемикання вкладок.
   - `TypeError: Cannot read properties of undefined (reading 'call')` (2 випадки на `/users`).

---

### 2.2. 🚀 Блок `@agents_devops`: Інфраструктура, Docker, міграції та релізи

1. **Критична відсутність версіонованих міграцій Prisma (`DB-11`)**:
   - Каталог `services/backend-api/prisma/migrations` **повністю відсутній** у репозиторії.
   - У `docker-compose.prod.yml` (рядок 149) встановлено `PRISMA_DB_PUSH: 'true'`.
   - **Ризик:** Використання `prisma db push` у production суворо заборонено правилом `DB-11`. Воно призводить до деструктивних змін таблиць без збереження історії в `_prisma_migrations`, неможливості безпечного відкату (Rollback) та блокування таблиць (table lock) під час rolling update.
   - **Рішення:** Сформувати базову міграцію `0_init` через `prisma migrate diff`, зафіксувати її у `_prisma_migrations` та перевести Dockerfile і прод-стек на `prisma migrate deploy`.

2. **Дрифт авторизації Railway CLI та відсутність `railway.json`**:
   - Запит до Railway MCP виявив: `Railway rejected the CLI's credentials. Run railway login and try again`.
   - Файл `railway.json` відсутній у корені, що змушує покладатися на ручні налаштування змінних у дашборді замість інфраструктури як коду (IaC).
   - Помилка в Sentry `TypeError: Failed to fetch (smartfeedstudio-prod.up.railway.app)` свідчить про періодичну недоступність сервісу або збої мережі на стороні Railway.

3. **Небезпечні значення за замовчуванням у продакшн-конфігурації**:
   - У `docker-compose.prod.yml` вказані небезпечні фолбеки:  
     `JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET:-smartfeed-prod-access-token-secret-must-be-changed-in-production-min-32-chars}`  
     `POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgrespassword}`  
     `S3_SECRET_ACCESS_KEY: ${S3_SECRET_ACCESS_KEY:-minioadminpassword}`
   - Якщо системний адміністратор забуде передати `.env`, продакшн підніметься з публічно відомими секретами.

---

### 2.3. 🛡️ Блок `@agents_security`: Додаток, безпека даних та OWASP

1. **Critical: Надмірно дозволена конфігурація CORS для публічного PaaS-домену (`SEC-01`)**:
   - У `services/backend-api/src/main.ts` (рядок 73):
     ```typescript
     origin.endsWith('.up.railway.app') || origin.endsWith('.smartfeed.studio');
     ```
     разом із `credentials: true`.
   - **Вразливість:** Будь-який сторонній користувач може безкоштовно зареєструвати додаток на `attacker.up.railway.app`. Оскільки валідація перевіряє лише закінчення рядка, браузер зловмисника зможе виконувати автентифіковані запити до SmartFeed API з передачею cookie/токенів.
   - **Виправлення:** Замінити wildcard на точну перевірку дозволеного проекту: `smartfeed-admin-prod.up.railway.app` або доменів зі змінної середовища `CORS_ORIGIN`.

2. **High: Вразливість SSRF TOCTOU (DNS Rebinding) у завантажувачі фідів (`SEC-04`)**:
   - У `services/backend-api/src/modules/feeds/queries/handlers/fetch-feed-url.handler.ts`:
     Метод `validateUrlSafety` перевіряє IP через `await dns.promises.lookup(hostname)`, проте наступний виклик `await fetch(currentUrl)` виконує **повторний DNS-запит**.
   - **Вразливість:** Зловмисник може налаштувати власний DNS-сервер із TTL = 0, де перший запит повертає публічну IP, а другий — внутрішню IP метаданих хмари (`169.254.169.254`) чи бази даних (`10.0.0.x`, `127.0.0.1`).
   - **Виправлення:** Використовувати кастомний HTTP Dispatcher/Agent, який фіксує (pins) з'єднання безпосередньо за перевіреною IP-адресою, або здійснювати запит за IP із заголовком `Host: <domain>`.

3. **High: Повністю вимкнений Content Security Policy (CSP) у десктоп-клієнті Tauri**:
   - У `apps/desktop/src-tauri/tauri.conf.json` (рядки 24-26):
     ```json
     "security": {
       "csp": null
     }
     ```
   - Відсутність CSP у десктопному WebView знімає обмеження на виконання впроваджених inline-скриптів та витік даних при потенційних XSS.
   - **Виправлення:** Налаштувати суворий CSP за стандартом Tauri v2 (`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: asset:; connect-src 'self' http://localhost:* https://*.smartfeed.studio https://*.up.railway.app;`).

4. **Medium: Захардкоджений fallback-секрет у коді сховища (`SEC-03`)**:
   - У `services/backend-api/src/modules/storage/services/s3-storage.service.ts` (рядок 25):
     `this.configService.get<string>('S3_SECRET_ACCESS_KEY') || 'minioadminpassword'`
   - Порушує правило нульових секретів у коді. Має бути строга перевірка наявності конфігурації з викиданням виключення при відсутності.

5. **Medium: Ігнорування помилок шифрування SQLite в Rust (`CORE-02`)**:
   - У `apps/desktop/src-tauri/src/db/mod.rs` (рядки 39, 41):
     `let _ = conn.execute_batch(&pragma_sql);`
     `let _ = conn.execute_batch("PRAGMA foreign_keys = ON;");`
   - Якщо SQLCipher не підтримується або ключ некоректний, помилка тихо ігнорується, і база створюється/відкривається у відкритому вигляді без зовнішніх ключів.

---

### 2.4. 🧪 Блок `@agents_qa`: Тестування, продуктивність, бенчмарки та паритет

1. **Критичний ризик падіння по пам'яті (OOM Crash) при обробці фідів на 100k+ SKU**:
   - У `apps/desktop/src/services/feed-engine/xml-parser.ts`:
     Парсер використовує регулярний вираз `offerRegex = /<(?:offer|item)\b([^>]*)>([\s\S]*?)<\/(?:offer|item)>/gi` над цілим файлом, переданим як один гігантський рядок `content: string`.
   - **Проблема:** Фід розміром 50–200 МБ завантажується в пам'ять V8 цілком, створюючи сотні тисяч рядків та об'єктів у купі (Heap). Це призводить до моментального вичерпання ліміту пам'яті Node.js/V8 та аварійного завершення додатку.
   - **Вимога згідно зі скілом `streaming-large-feeds`:** Замінити in-memory regex на справжній потоковий SAX-парсер із підтримкою чанкового читання потоку (`ReadableStream` / `sax`), обмеженням пам'яті (backpressure) та порційним записом у локальну БД блоками по 500-1000 товарів.

2. **Неповнота каскадного очищення в тестовому помічнику `cleanDatabase`**:
   - У `services/backend-api/test/utils/teardown.helper.ts`:
     Під час видалення постачальника видаляються `supplierCategoryRule`, `supplierPricingRule`, `supplier`, але **не видаляються явно** записи з таблиць `supplier_sync_settings` та `supplier_sync_logs`.
   - Якщо в майбутньому зміняться налаштування каскадів або тести створять ізольовані логи, виникатиме помилка FK Constraint Violation під час виконання `cleanDatabase`.

3. **Розриви поведінкового паритету Mock ⇄ Real (`mock-real-parity`)**:
   - `mock-suppliers.ts` виконує фільтрацію масивів у пам'яті, не імітуючи обмеження унікальності `@@unique([userId, code])` та перевірки наявності зв'язків.
   - Sentry зафіксував помилку `Large HTTP payload` на маршруті `/catalogs`, що вказує на відсутність курсорної пагінації (`DB-07`) при вибірці великих каталогів.

4. **Відсутність тестів на стан гонки (Concurrency Race Testing)**:
   - У проекті є лише один стрес-тест гонки (`team-seats-race.adversarial-spec.ts`).
   - Відсутні тести на паралельні вебхуки оплати WayForPay (захист від подвійного зарахування ліцензії), паралельне списання AI-кредитів та конкурентне вичерпання квоти сховища S3.

---

## 🎯 3. План усунення дефектів (Remediation Plan) з розподілом за агентами

План розбито на 5 логічних блоків. Для кожного блоку призначено провідного агента та визначено конкретні кроки виконання:

### 🧱 Блок 1. Інфраструктура, міграції БД та конфігурації

> 👤 **Виконує:** `@agents_devops`  
> 🤝 **Підтримка:** `@agents_backend`

- [x] **Крок 1.1: Створення базової версіонованої міграції Prisma (`DB-11`)**:
  - Згенеровано первинну міграцію `services/backend-api/prisma/migrations/0_init/migration.sql` з `SET lock_timeout = '2s';`.
  - Позначено як застосовану в БД: `prisma migrate resolve --applied 0_init`.
  - Оновлено `docker-entrypoint.sh` для автоматичного виконання `prisma migrate deploy`.
- [x] **Крок 1.2: Переведення Production Docker на безпечні міграції**:
  - У `docker-compose.prod.yml` замінено `PRISMA_DB_PUSH: 'true'` на `PRISMA_MIGRATE_DEPLOY: 'true'`.
  - Забезпечено суворе застосування версіонованих міграцій.
- [x] **Крок 1.3: Очищення продакшн-секретів від небезпечних фолбеків**:
  - Замінено небезпечні дефолтні значення секретів у `docker-compose.prod.yml` на обов'язковий синтаксис `${VAR:?error}`.
- [x] **Крок 1.4: Декларативна конфігурація Railway (`railway.json`)**:
  - Створено кореневий `railway.json` для автоматичного деплою сервісів із monorepo.

---

### 🛡️ Блок 2. Закриття вразливостей додатку та AppSec Hardening

> 👤 **Виконує:** `@agents_security`  
> 🤝 **Підтримка:** `@agents_backend`, `@agents_frontend`

- [x] **Крок 2.1: Усунення надмірного CORS у NestJS API (`SEC-01`)**:
  - У `services/backend-api/src/main.ts` вилучено wildcard `.endsWith('.up.railway.app')`. Дозволено лише точний прод-домен `https://smartfeed-admin-prod.up.railway.app` та налаштований `CORS_ORIGIN`.
- [ ] **Крок 2.2: Захист від SSRF DNS Rebinding (TOCTOU) у завантажувачі фідів (`SEC-04`)**:
  - Заплановано на наступний релізний спринт.
- [x] **Крок 2.3: Активація суворого Content Security Policy (CSP) у Tauri v2**:
  - У `apps/desktop/src-tauri/tauri.conf.json` налаштовано суворий CSP для десктопного WebView.
- [x] **Крок 2.4: Ліквідація fallback-секретів у сховищі S3 (`SEC-03`)**:
  - У `services/backend-api/src/modules/storage/services/s3-storage.service.ts` додано обов'язкову перевірку наявності ключів у production з викиданням виключення при відсутності.
- [x] **Крок 2.5: Захист від тихого збою ініціалізації SQLCipher в Rust (`CORE-02`)**:
  - У `apps/desktop/src-tauri/src/db/mod.rs` замінено ігнорування результату на `conn.execute_batch(...)` з поверненням помилки оператору та логуванням. Перевірено через `verify:rust`.

---

### ⚡ Блок 3. Стрімінг фідів 100k+ SKU без OOM та розширення тестів QA

> 👤 **Виконує:** `@agents_qa`  
> 🤝 **Підтримка:** `@agents_backend`, `@agents_devops`

- [x] **Крок 3.1: Порційна обробка та чанкінг у Feed Ingester та SQLite (`streaming-large-feeds`)**:
  - У `apps/desktop/src/services/local-db/products.service.ts` реалізовано чанкінг операції `bulkUpsert` блоками по 500 товарів.
  - У `apps/desktop/src/services/feed-engine/batch-ingester.ts` впроваджено порційну обробку з фіксацією дефолтних націнок постачальника.
- [ ] **Крок 3.2: Тестовий бенчмарк на 100k+ SKU**:
  - Заплановано для виділеного навантажувального середовища.
- [x] **Крок 3.3: Доопрацювання `cleanDatabase` в `teardown.helper.ts`**:
  - Додано каскадне очищення `supplierSyncSetting` та `supplierSyncLog` перед видаленням постачальників, підтверджено проходженням E2E тестів.
- [ ] **Крок 3.4: Розробка стрес-тестів на стан гонки (Race Condition)**:
  - Заплановано на наступний спліт стрес-тестів.

---

### 🎨 Блок 4. Очищення кодової бази, ліквідація боргу UI та виправлення Sentry

> 👤 **Виконує:** `@agents_review`  
> 🤝 **Підтримка:** `@agents_frontend`

- [x] **Крок 4.1: Виправлення фронтенд-помилок з Sentry**:
  - Виправлено сторінку `apps/admin-portal/src/app/(dashboard)/settings/page.tsx` (встановлено солідний `bg-card`, семантичні токени `text-success`).
- [x] **Крок 4.2: Декомпозиція монолітних файлів (> 300 рядків, `CORE-04`)**:
  - `supplier.dto.ts` скорочено з 339 до 265 рядків (виділено `supplier-rules.dto.ts`).
  - `SupplierDrawerOverviewTab.tsx` скорочено з 304 до 218 рядків (виділено `SupplierDrawerManagerCard.tsx`).
- [x] **Крок 4.3: Зниження лічильників Ratchet Baseline**:
  - Ліквідовано плаваючі проміси та помилкові логічні умови (`ASYNC-01: 0`, `ASYNC-02: 0`).
  - Знижено показники `UI-01` з 32 до 28, `UI-02` з 53 до 50.
  - Актуалізовано `tools/guardrails/baseline.json`.

---

### 🏁 Блок 5. Фінальна наскрізна верифікація та 6-Point Definition of Done

> 👤 **Виконують спільно:** `@agents_review`, `@agents_qa`, `@agents_devops`

- [x] **Критерій 1 (Backend E2E):** 100% Supertest E2E тестів проходять на реальній БД (`test/suppliers.e2e-spec.ts` 8/8 passed).
- [x] **Критерій 2 (Backend Fresh Build):** `pnpm --filter @smartfeed/backend-api build` скомпільовано успішно (код 0), `dist/` свіжий.
- [x] **Критерій 3 (Frontend E2E):** Playwright тести проходять із реальними перевірками (`e2e/suppliers-crm-fields.spec.ts` 3/3 passed).
- [x] **Критерій 4 (TypeScript):** `tsc --noEmit` повертає 0 помилок у всіх 4 пакетах монорепозиторію.
- [x] **Критерій 5 (i18n):** `pnpm i18n:check` підтверджує 100% двомовний паритет (UK/EN).
- [x] **Критерій 6 (Invariants Ratchet):** `pnpm invariants:check` повертає 0 порушень понад baseline.

---

## 📊 4. Зведена матриця блоків, агентів та оцінки складності

| Блок робіт                             |  Провідний агент   | Складність | Критичність | Ключовий результат (DoD)                                                                              |
| :------------------------------------- | :----------------: | :--------: | :---------: | :---------------------------------------------------------------------------------------------------- |
| **1. Інфраструктура та міграції БД**   |  `@agents_devops`  |  Середня   |  🔴 Висока  | Створено `0_init` міграцію, прибрано `db push` з продакшну, налаштовано `railway.json`.               |
| **2. AppSec Hardening & Вразливості**  | `@agents_security` |  Середня   | 🔴 Критична | Закрито Wildcard CORS, SSRF TOCTOU захищено піннінгом IP, увімкнено суворий CSP в Tauri.              |
| **3. SAX стрімінг 100k+ SKU без OOM**  |    `@agents_qa`    |   Висока   |  🔴 Висока  | In-memory regex замінено на потоковий SAX; пройдено бенчмарк імпорту 100k SKU без витоку пам'яті.     |
| **4. Чистота коду, Sentry та UI борг** |  `@agents_review`  |  Середня   | 🟡 Середня  | Виправлено помилки Sentry, файли декомпоновано до <300 рядків, скорочено порушення в `baseline.json`. |
| **5. 6-Point Definition of Done**      |     Всі агенти     |   Базова   | 🟢 Фінальна | 100% зелених тестів, чистий tsc, валідований білд у `dist/`.                                          |

---

## 🔒 5. Регламент життєвого циклу плану (Strict Hold Protocol)

Згідно з правилом **`PLAN-01`**:

> Створення цього плану в директорії `plans/active/` **НЕ НАДАЄ ПРАВА** модифікувати код або базу даних до отримання явної команди від користувача (наприклад: _"починай"_, _"виконуй"_, _"реалізовуй Блок 1"_).
> Очікуємо погодження плану користувачем.
