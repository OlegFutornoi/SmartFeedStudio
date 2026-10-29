# Задача BE-03: Комплексний аудит архітектури, безпеки та відмовостійкості бекенду і план санації

- **ID / Статус:** `BE-03` | Активна задача (29.10.2026)
- **Агенти:** `@agents_planner` (аудит) -> `@agents_backend` (реалізація) -> `@agents_qa` (тести в `e2e/`)
- **Пакети:** `services/backend-api`, `packages/shared`, `prisma/schema.prisma`
- **Правила:** `core.md`, `backend.md`, `database.md`, `security.md`, `agents.md`

---

## 1. Реєстр виявлених дефектів (17 знахідок за 5 осями)

### Вісь 1: Архітектура та межі середовищ (Native vs Cloud)

- **[DEF-01] [CRITICAL] (`ARCH-01`, `ARCH-02`) Десктопні файлові операції на хмарному сервері:**
  - _Файли:_ `services/backend-api/src/modules/storage/utils/workspace-disk.ts`, `workspace-backup.ts`, `commands/open-workspace-folder.handler.ts`, `migrate-workspace.handler.ts`, `init-workspace.handler.ts`.
  - _Суть:_ Хмарний бекенд виконує `fs.mkdirSync`, `fs.cpSync`, створення `workspace.json` та `catalog.db` у `~/Documents/SmartFeedStudioData` всередині Docker-контейнера Railway замість клієнтської ОС (де це належить виключно Tauri v2 IPC).

### Вісь 2: Безпека, автентифікація та мультитенантність (OWASP API Top 10)

- **[DEF-02] [CRITICAL] (`BE-04`, `CWE-798`) Хардкод секретів та паролів у fallback-рядках:**
  - _Файли:_ `services/backend-api/src/prisma/prisma.service.ts:14`, `modules/payments/commands/simulate-sandbox-webhook.handler.ts:39-40`.
  - _Суть:_ При відсутності ENV використовується дефолтний `postgresql://postgres:postgrespassword@...` та тестовий секрет WayForPay `flk3409refn54t54t*FNJRET`.
- **[DEF-03] [HIGH] (`CORE-02`, `SEC-01`) Неробочий цикл відновлення пароля через Email:**
  - _Файли:_ `services/backend-api/src/modules/auth/auth.service.ts:122-145`, `modules/mail/mail.service.ts`.
  - _Суть:_ `AuthService.forgotPassword` генерує токен, але не викликає `MailService` (метод `sendPasswordResetEmail` відсутній). Користувач у production ніколи не отримує листа.
- **[DEF-04] [HIGH] (`OWASP API2:2023`) Надмірний TTL Access-токена (30 діб):**
  - _Файл:_ `services/backend-api/src/modules/auth/services/token.service.ts:56-58`.
  - _Суть:_ `JWT_ACCESS_EXPIRATION` за замовчуванням дорівнює `30d` замість короткоживучого `15m`–`30m` із ротацією refresh-токена.
- **[DEF-06] [HIGH] (`SEC-01` Layer 2) Відсутність перевірки квот при створенні постачальників та AI-запитах:**
  - _Файли:_ `services/backend-api/src/modules/suppliers/commands/handlers/create-supplier.handler.ts`, `modules/ai/llm-gateway.service.ts`.
  - _Суть:_ `CreateSupplierHandler` не перевіряє `license.maxSuppliersLimit`; `LlmGatewayService` не перевіряє і не списує `aiCredits` та не має `AbortSignal.timeout`.
- **[DEF-07] [HIGH] (`SEC-04` BOLA/IDOR) Відсутність ізоляції постачальників за організацією:**
  - _Файли:_ `services/backend-api/src/modules/suppliers/queries/get-suppliers.handler.ts:12`, `commands/handlers/create-supplier.handler.ts:11-25`, `suppliers.controller.ts:82-84`.
  - _Суть:_ Вибірка виконується строго за `where: { userId }`, а `SuppliersController` не передає `organizationId` у `CreateSupplierCommand`. Члени команди не бачать спільних постачальників організації.
- **[DEF-08] [HIGH] (`SEC-05` SSRF TOCTOU) Відсутність IP-пінінгу для HTTPS при завантаженні фідів:**
  - _Файл:_ `services/backend-api/src/modules/feeds/queries/handlers/fetch-feed-url.handler.ts:30-38`.
  - _Суть:_ IP-пінінг виконується лише для `http:`. Для `https:` виклик `fetch(currentUrl)` робить повторний DNS-запит під час TLS handshake, залишаючи вектор DNS Rebinding.
- **[DEF-09] [MEDIUM] (`CWE-312`) Зберігання секретних ключів у БД у відкритому вигляді:**
  - _Файл:_ `services/backend-api/prisma/schema.prisma:352` (`merchantSecretKey`), `schema.prisma:489` (`authHeaderValue`).
  - _Суть:_ Ключі платіжних шлюзів та токени авторизації фідів постачальників зберігаються у PostgreSQL без AES-256-GCM шифрування.

### Вісь 3: База даних та Prisma ORM

- **[DEF-11] [MEDIUM] (`DB-01`) Відсутні індекси на зовнішніх ключах ієрархій:**
  - _Файл:_ `services/backend-api/prisma/schema.prisma:486` (`SupplierFeedSource.parentFeedSourceId`), `schema.prisma:522` (`SupplierCategoryRule.parentId`).
  - _Суть:_ Відсутність `@@index([parentFeedSourceId])` та `@@index([parentId])` спричиняє Sequential Scan при побудові дерева категорій і каскадних операціях.
- **[DEF-12] [MEDIUM] (`DB-06`) N+1 видалення записів у воркері очищення сховища:**
  - _Файл:_ `services/backend-api/src/modules/storage/processors/storage-gc.processor.ts:51-58`.
  - _Суть:_ `this.prisma.storageFile.delete` викликається поштучно всередині циклу `for (const file of expiredPendingFiles)` замість батчевого `deleteMany({ where: { id: { in: ids } } })`.
- **[DEF-13] [MEDIUM] (`DB-07`) Офсетна пагінація (`skip`) на таблиці файлів сховища:**
  - _Файл:_ `services/backend-api/src/modules/storage/queries/get-storage-files.handler.ts:51-53`.
  - _Суть:_ При 50k+ зображень товарів `skip: (page - 1) * limit` призводить до лінійної деградації читання; необхідна підтримка курсорної пагінації (`cursor: { id }`).

### Вісь 4: Багатопотоковість, черги BullMQ та відмовостійкість

- **[DEF-05] [HIGH] (`BE-07`, `CWE-362`) In-memory м'ютекс не захищає при горизонтальному масштабуванні:**
  - _Файли:_ `services/backend-api/src/modules/organizations/utils/organization-mutex.ts`, `modules/licenses/commands/select-tariff-plan.handler.ts:36`.
  - _Суть:_ `OrganizationMutex` використовує локальний `Map<string, Promise<void>>`. На кількох репліках Railway конкурентні запити обходять блокування. Потрібен розподілений лок у Redis (`SET key token NX PX ttl`).
- **[DEF-10] [HIGH] (`CWE-400`, `OWASP API4`) Глобальний ліміт тіла запиту 100MB на всі маршрути:**
  - _Файл:_ `services/backend-api/src/main.ts:16-17`.
  - _Суть:_ `app.use(json({ limit: '100mb' }))` та `urlencoded({ limit: '100mb' })` відкривають публічні ендпоінти (`/api/auth/login`, `/api/users`) для OOM DoS-атак.
- **[DEF-14] [HIGH] (`CORE-12`, `BE-10`) Фейкові заглушки замість черги BullMQ у FeedsController:**
  - _Файл:_ `services/backend-api/src/modules/feeds/feeds.controller.ts:145-215`.
  - _Суть:_ `importAsync`, `getActiveJobs`, `getJobStatus` повертають статичні заглушки (`[]`, `status: 'COMPLETED'`) без постановки задач у BullMQ.
- **[DEF-15] [HIGH] (`BE-07`) Неатомарне нарахування ліцензії у вебхуку WayForPay:**
  - _Файл:_ `services/backend-api/src/modules/payments/commands/handle-wayforpay-webhook.handler.ts:73-106`.
  - _Суть:_ Статус транзакції змінюється на `APPROVED` до виклику `SelectTariffPlanCommand`. При збої команди повторний вебхук бачить `APPROVED` і пропускає видачу ліцензії.

### Вісь 5: Архітектурна модульність CQRS та гігієна коду

- **[DEF-16] [LOW] (`ARCH-04`) Порушення CQRS контрактів та обхід шини в LegalModule:**
  - _Файли:_ `services/backend-api/src/modules/organizations/commands/update-organization.handler.ts:35-42`, `modules/legal/legal.controller.ts`.
  - _Суть:_ Command-хендлери повертають повні сутності замість `{ id }`; `LegalController` викликає `LegalService` напряму без `CommandBus`/`QueryBus`.
- **[DEF-17] [LOW] (`CORE-13`, `SEC-02`) Витік внутрішніх кодів Prisma та емодзі в логах:**
  - _Файли:_ `services/backend-api/src/common/filters/http-exception.filter.ts:65`, `services/backend-api/src/main.ts:110-111`.
  - _Суть:_ У production клієнту повертається `Database error code: ${exception.code}`; у `main.ts` присутні емодзі в `logger.log`.

---

## 2. Покроковий план усунення (5 етапів)

### Етап 1: Захист секретів, токенів, лімітів тіла та гігієна шлюзу (`DEF-02`, `DEF-04`, `DEF-09`, `DEF-10`, `DEF-17`)

1. `services/backend-api/src/prisma/prisma.service.ts`: видалити fallback-рядок підключення; викидати помилку при відсутності `DATABASE_URL`.
2. `services/backend-api/src/modules/payments/commands/simulate-sandbox-webhook.handler.ts`: видалити хардкод-ключ `flk3409refn54t54t*FNJRET`; вимагати налаштованого ключа у БД або ENV.
3. `services/backend-api/src/modules/auth/services/token.service.ts`: змінити дефолтний `JWT_ACCESS_EXPIRATION` з `30d` на `15m`.
4. `services/backend-api/src/main.ts`: знизити глобальний ліміт `json`/`urlencoded` до `2mb`; замінити емодзі в логах на `[BOOTSTRAP]` та `[SWAGGER]`.
5. `services/backend-api/src/common/filters/http-exception.filter.ts`: приховати сирі коди `exception.code` Prisma у production-режимі.
6. Додати утиліту AES-256-GCM шифрування (`ENCRYPTION_KEY`) для `merchantSecretKey` та `authHeaderValue`.

### Етап 2: Поштовий цикл скидання пароля та SSRF-захист HTTPS (`DEF-03`, `DEF-08`)

1. `services/backend-api/src/modules/mail/templates/password-reset-email.ts`: створити двомовний HTML-шаблон листа скидання пароля.
2. `services/backend-api/src/modules/mail/mail.service.ts`: додати метод `sendPasswordResetEmail`.
3. `services/backend-api/src/modules/auth/auth.service.ts`: інжектувати `MailService` та викликати `sendPasswordResetEmail` у `forgotPassword`.
4. `services/backend-api/src/modules/feeds/queries/handlers/fetch-feed-url.handler.ts`: використати кастомний `undici.Agent` із функцією `lookup`, яка передає верифіковану IP-адресу як для `http:`, так і для `https:` з'єднань (усунення DNS Rebinding).

### Етап 3: Розподілений Redis-м'ютекс, мультитенантність та квоти (`DEF-05`, `DEF-06`, `DEF-07`)

1. `services/backend-api/src/modules/organizations/utils/organization-mutex.ts`: реалізувати розподілене блокування через Redis (`SET lock:<key> <uuid> NX PX 15000` з безпечним Lua-звільненням) та fallback на in-memory у тестах.
2. `services/backend-api/src/modules/suppliers/`:
   - У `CreateSupplierHandler` визначати активну організацію користувача, перевіряти `license.maxSuppliersLimit` (Layer 2) і зберігати `organizationId`.
   - У `GetSuppliersHandler` та суміжних запитах фільтрувати за `OR: [{ organizationId }, { userId }]`.
3. `services/backend-api/src/modules/ai/llm-gateway.service.ts`: додати `AbortSignal.timeout(30_000)` для всіх запитів до OmniRoute та перевірку/списання `aiCredits`.

### Етап 4: Індекси БД, ліквідація N+1, курсорна пагінація та атомарність оплат (`DEF-11`, `DEF-12`, `DEF-13`, `DEF-15`)

1. `services/backend-api/prisma/schema.prisma`: додати `@@index([parentFeedSourceId])` у `SupplierFeedSource` та `@@index([parentId])` у `SupplierCategoryRule`; створити міграцію.
2. `services/backend-api/src/modules/storage/processors/storage-gc.processor.ts`: замінити поштучний `storageFile.delete` у циклі на `Promise.allSettled` для S3 та єдиний `storageFile.deleteMany({ where: { id: { in: deletedIds } } })`.
3. `services/backend-api/src/modules/storage/queries/get-storage-files.handler.ts`: додати підтримку курсорної пагінації (`cursor`).
4. `services/backend-api/src/modules/payments/commands/handle-wayforpay-webhook.handler.ts`: виконувати перехід транзакції у `APPROVED` та активацію ліцензії атомарно, щоб унеможливити втрату оплаченої підписки.

### Етап 5: Демаркація локального Storage, черга BullMQ фідів та CQRS-чистота (`DEF-01`, `DEF-14`, `DEF-16`)

1. `services/backend-api/src/modules/storage/`: ізолювати локальні дискові хендлери (`workspace-disk.ts`, `workspace-backup.ts`) від production-хмари (повертати явний статус або делегувати клієнту Tauri).
2. `services/backend-api/src/modules/feeds/`: підключити BullMQ чергу `feed-ingestion`, створити `FeedIngestionProcessor` і замінити мок-відповіді у `FeedsController` (`importAsync`, `getActiveJobs`, `getJobStatus`) на реальні стани задач BullMQ.
3. `services/backend-api/src/modules/legal/`: перевести мутації та запити `LegalController` на CQRS (`CommandBus` / `QueryBus`).

---

## 3. Критерії готовності (4-Point Definition of Done)

1. `pnpm --filter @smartfeed/backend-api build` — свіжий білд у `dist/`.
2. `pnpm --filter @smartfeed/backend-api exec tsc --noEmit` — 0 помилок типізації.
3. `pnpm i18n:check` — 100% двомовний паритет (`uk`/`en`).
4. `pnpm invariants:check` — 0 порушень інваріантів.
