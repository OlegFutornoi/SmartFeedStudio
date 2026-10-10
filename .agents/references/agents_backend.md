# ⚙️ Backend Engineering Agent Guide (`agents_backend`)

> **Файл розташування:** [`.agents/agents_backend.md`](./agents_backend.md)  
> **Роль агента:** Спеціалізований автономний інженер для повної розробки хмарного бекенду SmartFeed Studio (`services/backend-api` на NestJS 11 CQRS + Prisma ORM + PostgreSQL 16 + Redis + BullMQ, спільні контракти `@smartfeed/shared`).  
> **Основна директива:** Повний замкнений 8-етапний інженерний життєвий цикл із **залізним дотриманням TDD (ТЕСТИ СПОЧАТКУ: RED → РЕАЛІЗАЦІЯ З 4-ШАРОВИМ ЗАХИСТОМ: GREEN)**, ретельним проміжним рев'ю, регресійним контролем, систематичним дебагом, оновленням документації та переведенням плану у статус виконаних.

---

## 🏛 1. Обов'язкова відповідність правилам проекту (`.agents/rules/`)

Перед будь-якою зміною у бекенді чи базі даних агент **ЗОБОВ'ЯЗАНИЙ** враховувати положення модульних правил SmartFeed Studio:

| Правило                                                                                      | Ключові вимоги до бекенд-агента                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| :------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**`rules.md`**](rules/rules.md)                                                             | **Native vs Cloud**: `apps/desktop` використовує **власний локальний нативний бекенд** на Rust/Tauri (`src-tauri/src/db.rs`) з базою SQLCipher SQLite та Keychain для збереження каталогів і парсингу фідів (НЕ ганяє локальні операції товарів через NestJS API). `services/backend-api` — хмарний бекенд: чистий CQRS, ізоляція `UsersModule` (тільки Prisma, 0 знань про JWT), взаємодія через `CommandBus` / `QueryBus`, події `EventBus`.                                |
| [**`engineering_discipline_and_planning.md`**](rules/engineering_discipline_and_planning.md) | **Architecture & Scalability > Speed & Naive Simplicity**: "працює" не є критерієм якості. **Бюджет модульності**: <250–300 рядків на файл (контролер, хендлер, сервіс, DTO). **Zero God-Files**. **Zero Silent Failures**: жодних порожніх `catch {}`. **Zero `as any`**: тільки типізовані контракти Prisma. **Safe OS Execution**: виключно `execFile(binary, [args], { shell: false })` (нуль CWE-78). **Mutex Protection**: `OrganizationMutex` проти TOCTOU гонок квот. |
| [**`postgres_skills.md`**](rules/postgres_skills.md)                                         | **PostgreSQL Checklist**: **100% FK Indexes** (`@@index([fkColumn])`). **100% snake_case mapping** (`@@map("snake_case")`, `@map("column_name")`). Усі дати `DateTime` → `timestamptz`. **Курсорна пагінація** (заборона OFFSET для великих списків). **Zero N+1** (batch `findMany` або `include`). **Короткі транзакції** `$transaction` (без S3/HTTP). CUID `@default(cuid())`. GIN `pg_trgm` індекси для ILIKE пошуку.                                                    |
| [**`testing_and_quality.md`**](rules/testing_and_quality.md)                                 | **Strict TDD RED First**: спочатку пишемо падаючий тест, лише потім продакшн-код. **Zero Test Data Leftovers**: обов'язковий `cleanDatabase` в `beforeAll` ТА `afterAll` з дотриманням FK-ієрархії видалення. **100% i18n & Error Mapping**: стандартизовані машиночитні коди помилок (`QUOTA_EXCEEDED`, `SEATS_EXCEEDED`), жодних сирих витоків англійських рядків. Git commit/push тільки за явною командою.                                                                |
| [**`plans_lifecycle.md`**](rules/plans_lifecycle.md)                                         | **Життєвий цикл планів**: `plans/active/` → `plans/completed/`. Заборона передчасного виконання без явної команди користувача. Автоматичне перенесення в `completed/` тільки після 100% успішних тестів з оновленням `plans/README.md`.                                                                                                                                                                                                                                       |
| [**`code_review_and_skills.md`**](rules/code_review_and_skills.md)                           | **Pre-commit Self-Review**: обов'язковий чеклист із 11 пунктів самоперевірки перед здачею задачі.                                                                                                                                                                                                                                                                                                                                                                             |
| [**`wiki_and_documentation.md`**](rules/wiki_and_documentation.md)                           | **Синхронізація документації**: оновлення таблиць покриття тестів у `services/backend-api/README.md` та `services/backend-api/AGENTS.md`, оновлення WIKI при зміні моделей або API.                                                                                                                                                                                                                                                                                           |
| [**`commands.md`**](rules/commands.md)                                                       | **Порти та інфраструктура**: Backend API (`:4000`, Swagger `:4000/api/docs`), PostgreSQL (`:5432`), Redis (`:6379`), MinIO (`:9000/:9001`). Тести: `pnpm --filter @smartfeed/backend-api test:e2e`. **Заборона `browser_subagent`**. Для Swagger UI використовувати Playwright MCP. Дефолтні креденшели: `admin@smartfeed.studio` / `AdminPassword123!`.                                                                                                                      |
| [**`communication_and_research.md`**](rules/communication_and_research.md)                   | **Token Economy & Upfront Research**: лаконічність у чаті, нуль дублювання планів у чат (план пишеться в `plans/active/`, у чаті 1-2 речення резюме + лінк); код пишеться максимально надійно і масштабовано (не "аби працювало"); обов'язкове оновлення інформації через `context7` MCP (`resolve-library-id`, `query-docs`) до проектування архітектури.                                                                                                                    |

---

## 🚦 Етап 0 (обов'язковий): Пре-флайт, контекстний аналіз та інваріанти

Перед будь-якою роботою або переходом до Етапу 1 Backend Agent **активує базові скіли підготовки**:

0. **Перевірка активного стану** через [**`planning-and-lifecycle`**](../skills/planning-and-lifecycle/SKILL.md): перевірити наявність активного плану в `plans/active/`.
1. **Звірка з архітектурою** через [**`project-context-map`**](../skills/project-context-map/SKILL.md): перевірити топологію монорепозиторію, порти сервісів, CQRS-модулі та міжмодульні межі без надлишкового читання всіх файлів.
2. **Звірка з реєстром помилок** через [**`lessons-learned-registry`**](../skills/lessons-learned-registry/SKILL.md): врахувати всі збережені інваріанти бекенду (гонки квот, блокування пулу PostgreSQL, пропущений `cleanDatabase`, витоки пам'яті).
3. **Визначення обов'язкових інваріантів**: каскадне видалення зв'язаних даних, паритет mock ↔ real, 100% `@/` path aliases, відсутність `as any`.
4. **Контроль гардрайлів** через [**`automated-guardrails-ci`**](../skills/automated-guardrails-ci/SKILL.md): врахувати діючі правила лінтингу та валідації.

---

## 🧭 2. Повний 8-етапний життєвий цикл розробки бекенду

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                      ЖИТТЄВИЙ ЦИКЛ РОЗРОБКИ AGENTS_BACKEND                             │
 └──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 1. 🔍 ГЛИБОКИЙ АНАЛІЗ ЗАДАЧІ, БІЗНЕС-ЛОГІКИ ТА БЕЗПЕКИ                       │
    │    • Ролі (RBAC), тенантність (organizationId), квоти (SKU/seats/S3/AI)       │
    │    • Моделювання відмов, аналіз каскадного видалення та паритету Mock↔Real    │
    │    • Скіли: project-context-map, lessons-learned-registry, subscription-lc,  │
    │             security-and-hardening, interview-me, doubt-driven-development    │
    │    • MCP: context7 (NestJS/Prisma/BullMQ docs), firecrawl (безпека, RFC)     │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 2. 📋 АРХІТЕКТУРНЕ ПЛАНУВАННЯ ТА СПІЛЬНІ КОНТРАКТИ                           │
    │    • План у plans/active/<feature>.md (DoD, бюджет <250 рядків, 4-шаровий захист)│
    │    • Контракти FIRST у @smartfeed/shared (DTO, Zod, Enums, pnpm build:shared)  │
    │    • Скіли: planning-and-lifecycle, contract-first-api, spec-driven-dev,      │
    │             incremental-implementation, code-simplification                   │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 3. 🧪 СУВОРИЙ TDD: НАПИСАННЯ ПАДАЮЧИХ ТЕСТІВ (TDD RED PHASE — ТЕСТИ СПОЧАТКУ)│
    │    • services/backend-api/test/<feature>.e2e-spec.ts (Supertest + реальна БД) │
    │    • cleanDatabase в beforeAll ТА afterAll (нуль сміття в базі даних)         │
    │    • Валідація DTO (400), Auth/Guards (401/403), Quotas, 200/201 Success     │
    │    • Запуск тесту -> ПЕРЕКОНАТИСЯ В ПАДІННІ (RED) З ОЧІКУВАНОЇ ПРИЧИНИ        │
    │    • Скіли: test-driven-development, mock-real-parity                         │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 4. ⚙️ РЕАЛІЗАЦІЯ З 4-ШАРОВИМ ЗАХИСТОМ ДО ПРОХОДЖЕННЯ ТЕСТІВ (GREEN PHASE)     │
    │    • Шар 1 (DTO / class-validator), Шар 2 (Domain/Квоти + Mutex)              │
    │    • Шар 3 (Guards/RBAC + CWE-78 execFile), Шар 4 (Prisma FKs/Trx)           │
    │    • PostgreSQL: 100% FK indexes, snake_case @@map, timestamptz, cuid PK      │
    │    • Запуск тесту -> ПЕРЕКОНАТИСЯ У 100% УСПІШНОМУ ПРОХОДЖЕННІ (GREEN)        │
    │    • Скіли: nestjs-best-practices, prisma-postgres-mastery, postgresql-opt,  │
    │             streaming-large-feeds, bullmq-jobs, idempotency-and-outbox        │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 5. 🔍 ПРОМІЖНЕ ІНЖЕНЕРНЕ РЕВ'Ю ТА САМОАУДИТ                                  │
    │    • Самоінспекція: <250 рядків на файл, 0 any, 0 порожніх catch, чисті типи   │
    │    • Статичний тайпчек: pnpm --filter @smartfeed/backend-api exec tsc --noEmit│
    │    • Скіли: code-review-and-quality, code-simplification, performance-opt    │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 6. 🛡️ СУЦІЛЬНЕ АВТОТЕСТУВАННЯ ТА РЕГРЕСІЙНИЙ КОНТРОЛЬ                         │
    │    • Повний E2E сьют: pnpm --filter @smartfeed/backend-api test:e2e           │
    │    • Регресійний контроль: жоден інший модуль не зламався (100% PASS)         │
    │    • Перевірка Swagger UI через Playwright MCP (БЕЗ browser_subagent)         │
    │    • Скіли: test-driven-development, doubt-driven-development                 │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
                        ┌───────────────────┴───────────────────┐
                        │ Чи виявлено збої / падіння / регресію?│
                        └─────────┬───────────────────┬─────────┘
                                  │ ТАК               │ НІ
                                  ▼                   ▼
    ┌─────────────────────────────────────────────┐  ┌──────────────────────────────┐
    │ 7. 🐞 СИСТЕМАТИЧНИЙ ДЕБАГ (4 ФАЗИ)          │  │ 8. 🏁 ФІНАЛЬНЕ РЕВ'Ю, ДОКИ  │
    │    • Фаза 1: Відтворення мінімальним тестом │  │    ТА ЗАВЕРШЕННЯ ПЛАНУ       │
    │    • Фаза 2: Трейсинг root cause назад      │  │    • code-review-and-quality │
    │    • Фаза 3: Архітектурний фікс (0 костилів)│  │    • Оновлення картки монорепо│
    │    • Фаза 4: 100% повторна верифікація      │  │    • plans/active -> compld  │
    │    • Circuit breaker: правило 3-х фіксів    │  │    • documentation-and-adrs  │
    │    • Скіли: systematic-debugging,           │  │    • git-commit (за командою)│
    │             observability-and-instrumentation│  └──────────────────────────────┘
    └─────────────────────┬───────────────────────┘
                          │ (повернення до тестів)
                          └───────────────────────►
```

---

## 📌 Етап 1: Глибокий аналіз задачі, бізнес-логіки та безпеки (Task & Security Deep Analysis)

Коли Backend Agent отримує задачу на бекенд, він **ніколи не починає писати код або міграції одразу**. Перший крок — повне дослідження архітектурних меж, бізнес-правил та векторів безпеки за допомогою спеціалізованих скілів.

### 🧠 Ключові перевірки етапу 1:

1. **Цільовий рантайм та межі (Native vs Cloud)**:
   - Чи це хмарний бекенд (`services/backend-api` NestJS + PostgreSQL)?
   - Чи локальний нативний бекенд десктопу (`apps/desktop` Tauri + SQLite)?
   - **Залізне правило**: локальні операції товарного каталогу десктопу **ніколи** не маршрутизуються через NestJS API.
2. **Актори, RBAC та тенантність**:
   - Хто виконує запит: `SUPER_ADMIN`, `ADMIN`, `USER` чи публічний гість?
   - Чи потрібна обов'язкова ізоляція організації (`organizationId`)? Запобігати витоку даних між тенантами.
3. **Квоти та ліцензії ([subscription-lifecycle](../skills/subscription-lifecycle/SKILL.md))**:
   - Які ліміти підписки зачіпаються: кількість місць у команді (`seats`), ліміт SKU фідів, квоти AI-кредитів чи S3-сховище?
   - Як розраховуються дати дії, grace-періоди та автоматичні даунгрейди?
4. **Моделювання збоїв та безпека ([security-and-hardening](../skills/security-and-hardening/SKILL.md))**:
   - Чи є ризик unhandled promise rejections при роботі зі стрімами?
   - Чи перевірені null-стани на зв'язках у базі даних (наприклад, `user.organization` може бути `null`)?
   - Чи унеможливлене вичерпання пулу з'єднань PostgreSQL при важких запитах?
5. **Глибокий аналіз усіх кейсів життєвого циклу та каскадності (Full Lifecycle & Cascade Analysis)**:
   - **Каскадне видалення (Zero Orphaned Records)**: що відбувається при видаленні сутності? Якщо видаляється батьківський об'єкт (фід, постачальник, організація, категорія), ВСІ пов'язані дочірні сутності (товари фіду, зображення, локальні файли, правила націнки) ЗОБОВ'ЯЗАНІ бути каскадно вилучені (`ON DELETE CASCADE` + сервісне очищення). Жодних «підвішених» товарів у БД.
   - **Обов'язковий паритет середовищ ([mock-real-parity](../skills/mock-real-parity/SKILL.md))**: поведінка, структури даних, валідація та зв'язки сутностей повинні давати 100% однаковий результат як на локальному браузерному моку, так і на реальному PostgreSQL/SQLite.
   - **Атомарний перерахунок лічильників та квот**: кожне видалення фіду чи товару зобов'язане атомарно зменшувати лічильники в базі даних та синхронізувати квоти.

### 🧠 Скіли аналізу в арсеналі агента на Етапі 1:

- [**`project-context-map`**](../skills/project-context-map/SKILL.md) — топологія модулів, портів та залежностей бекенду.
- [**`lessons-learned-registry`**](../skills/lessons-learned-registry/SKILL.md) — сканування реєстру відомих помилок проекту (гонки квот, блокування пулу PostgreSQL, витоки стрімів).
- [**`interview-me`**](../skills/interview-me/SKILL.md) — покрокове уточнення вимог у користувача по 1 питанню з оцінкою впевненості.
- [**`doubt-driven-development`**](../skills/doubt-driven-development/SKILL.md) — критичний аналіз ризиків: «Що станеться при збої мережі під час транзакції?», «Де криється гонка при подвійному запиті?».
- [**`subscription-lifecycle`**](../skills/subscription-lifecycle/SKILL.md) — квоти, тарифи, grace-періоди, захист лімітів організації.
- [**`security-and-hardening`**](../skills/security-and-hardening/SKILL.md) — OWASP API Security: автентифікація JWT, перевірка ролей, SSRF блокування приватних IP, безпечний запуск процесів (CWE-78).
- [**`source-driven-development`**](../skills/source-driven-development/SKILL.md) — перевірка офіційної документації (NestJS, Prisma, BullMQ).

### 🔌 MCP інструменти етапу 1:

- **`context7`**: отримати офіційну документацію перед початком проектування:
  - `prisma` — документація `$transaction`, фільтрів `findMany`, composite indexes.
  - `@nestjs/cqrs` — CommandBus, QueryBus, EventBus best practices.
  - `bullmq` / `@nestjs/bullmq` — конфігурація черг, retry-стратегії для важких фонових задач.
  - `@aws-sdk/s3-request-presigner` — генерація підписаних URL для прямого завантаження в S3 MinIO.
- **`firecrawl`**: дослідження стандартів OWASP Top 10, безпечної роботи з файловими дескрипторами та запобігання command injection (CWE-78).

---

## 📋 Етап 2: Архітектурне планування та спільні контракти (Planning & Shared Contracts)

Перед реалізацією обов'язково формується детальний план згідно з [plans_lifecycle.md](rules/plans_lifecycle.md) та [engineering_discipline_and_planning.md](rules/engineering_discipline_and_planning.md).

### 📐 Залізні стандарти планування:

1. **Файл плану**: Створюється у `plans/active/<feature_name>.md`. До явної команди користувача («виконуй», «починай») модифікація кодової бази або БД **категорично заборонена**.
2. **Контракти в першу чергу (`@smartfeed/shared`)**:
   - Усі DTO, Zod-схеми та Enums визначаються у `packages/shared` **ДО** створення хендлерів бекенду.
   - Обов'язкова збірка контрактів:
     ```bash
     pnpm --filter @smartfeed/shared build
     ```
   - **Повна заборона**: створення inline-типів або дублювання DTO між сервером та клієнтом.
3. **Бюджет модульності (<250–300 рядків на файл)**:
   - Жоден контролер, хендлер, сервіс чи утиліта не повинні перевищувати 250–300 рядків.
   - Одразу закладати декомпозицію в плані:
     ```text
     modules/billing/
     ├── billing.controller.ts       # Тільки ендпоінти та Swagger анотації (~120 рядків)
     ├── dto/
     │   ├── create-checkout.dto.ts  # class-validator декоратори (~80 рядків)
     │   └── upgrade-plan.dto.ts     # class-validator декоратори (~70 рядків)
     ├── commands/
     │   ├── upgrade-plan.command.ts # CQRS Command payload (~30 рядків)
     │   └── upgrade-plan.handler.ts # Бізнес-логіка з 4-шаровим захистом (~190 рядків)
     ├── queries/
     │   └── get-invoices.handler.ts # CQRS Query хендлер вибірки (~140 рядків)
     └── billing.repository.ts       # Робота з PrismaService (~180 рядків)
     ```
4. **Проектування 4-шарового захисту (Defense-in-Depth)**:
   - Шар 1: DTO валідатори (`class-validator`, `ValidationPipe`).
   - Шар 2: Доменні квоти та бізнес-правила (+ mutex при паралельних мутаціях).
   - Шар 3: Guards, RBAC, Tenant scoping (`organizationId`).
   - Шар 4: Database constraints, FK, атомарні транзакції.

### 📋 Скіли планування в арсеналі агента на Етапі 2:

- [**`planning-and-lifecycle`**](../skills/planning-and-lifecycle/SKILL.md) — створення детермінованого плану у `plans/active/` з інваріантами та DoD.
- [**`contract-first-api`**](../skills/contract-first-api/SKILL.md) — проектування та компіляція типів, DTO і Zod-схем у `@smartfeed/shared`.
- [**`spec-driven-development`**](../skills/spec-driven-development/SKILL.md) — точна специфікація API-ендпоінтів та CQRS сигнатур до кодування.
- [**`incremental-implementation`**](../skills/incremental-implementation/SKILL.md) — нарізка реалізації на тонкі вертикальні скибки до 250–300 рядків.
- [**`code-simplification`**](../skills/code-simplification/SKILL.md) — запобігання зайвим абстракціям, чиста архітектура без оверінжинірингу.

---

## 🧪 Етап 3: СУВОРИЙ TDD: Написання падаючих автотестів (TDD RED Phase — ТЕСТИ СПОЧАТКУ)

В SmartFeed Studio діє залізний закон інженерії бекенду:  
**ЖОДНОГО РЯДКА ПРОДАКШН-КОДУ БЕЗ ПАДАЮЧОГО ТЕСТУ (NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST)!**

На відміну від фронтенду, де дизайн верстається за узгодженим макетом, на бекенді **контрактні та інтеграційні тести пишуться ПЕРШИМИ**. Вони формулюють очікувану поведінку системи та гарантують захист від помилок проектування.

### 🛠️ Правила написання тестів на етапі TDD RED:

1. **Файл тесту**: Створюється у `services/backend-api/test/<feature>.e2e-spec.ts`.
2. **Повна ізоляція та нуль сміття ([testing_and_quality.md](rules/testing_and_quality.md))**:
   - Обов'язкове використання централізованого хелпера `cleanDatabase`:
     ```typescript
     import { cleanDatabase } from './utils/teardown.helper';

     describe('BillingModule (E2E)', () => {
       beforeAll(async () => {
         await cleanDatabase(prisma);
       });

       afterAll(async () => {
         await cleanDatabase(prisma);
         await app.close();
       });
       // ...
     });
     ```
   - Заборонено залишати сміття в PostgreSQL чи Redis після тесту.
3. **Обов'язковий набір контрактних кейсів у тесті**:
   - ✅ **400 Bad Request**: запит із відсутніми або невалідними полями (перевірка Layer 1 DTO).
   - ✅ **401 Unauthorized**: запит без Bearer JWT токена.
   - ✅ **403 Forbidden (RBAC / Quotas)**: запит користувача без прав або при вичерпанні лімітів квот підписки (перевірка Layer 2 & 3).
   - ✅ **404 Not Found**: запит неіснуючого ресурсу чи чужого тенанта.
   - ✅ **200 / 201 Success**: валідний запит створює/змінює запис у БД, повертає коректну структуру без витоку `passwordHash`.
4. **Запобігання тестовим анти-патернам**:
   - ❌ **НЕ тестувати моки**: тест повинен взаємодіяти з реальним NestJS додатком та тестовою базою даних.
   - ❌ **НЕ додавати тестові методи до продакшн-класів**.
   - ❌ **НЕ використовувати довільні затримки `sleep(2000)`**: опитування умов детермінованими ретраями.
5. **Запуск та фіксація RED**:
   - Запустити тест:
     ```bash
     pnpm --filter @smartfeed/backend-api test:e2e -- <feature>.e2e-spec.ts
     ```
   - **ОБОВ'ЯЗКОВО ПЕРЕКОНАТИСЯ**: тест падає саме через відсутність або незавершеність ендпоінту/хендлера, а не через синтаксичну помилку в самому файлі тесту.

### 🧪 Скіли етапу TDD RED в арсеналі агента:

- [**`test-driven-development`**](../skills/test-driven-development/SKILL.md) — строгий цикл RED → GREEN → REFACTOR, вичерпне покриття крайових випадків та ізоляція тестів.
- [**`mock-real-parity`**](../skills/mock-real-parity/SKILL.md) — гарантія паритету між реальними API відповідями та локальними SQLite/mock моделями.

---

## ⚙️ Етап 4: Реалізація з 4-шаровим захистом до проходження тестів (GREEN Phase)

Тільки після того, як падаючий тест зафіксовано у стані RED, агент приступає до написання продакшн-коду бекенду. Код пишеться суворо за стандартом **4-рівневого захисту (4-Layer Defense-in-Depth)**.

### 🛡️ 4 шари захисту бекенду:

#### Шар 1: Валідація на вході (DTO & ValidationPipe)

- Кожне поле DTO **повинно мати валідатор** `class-validator` (`@IsString()`, `@IsEnum()`, `@IsInt()`, `@Min()`, `@IsOptional()`) та документацію `@ApiProperty()`.
- У контролерах обов'язковий `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`, який відкидає невідомі поля.

#### Шар 2: Доменні правила, квоти та захист від гонок

- Бізнес-логіка розміщується виключно в CQRS хендлерах (`*.handler.ts`).
- Перевірка лімітів підписки: seats, SKU, credits, S3. При перевищенні — викидати `ForbiddenException('QUOTA_EXCEEDED')`.
- **Захист від TOCTOU race conditions**: чутливі операції мутацій квот огортаються в `OrganizationMutex.runExclusive(orgId, async () => { ... })` для унеможливлення паралельного вичерпання лімітів.

#### Шар 3: Безпека, RBAC & Guards

- Захист ендпоінтів декораторами: `@UseGuards(JwtAuthGuard, RolesGuard, RequireActiveLicenseGuard)`.
- **Tenant Scoping**: кожна вибірка та мутація перевіряє належність ресурсу до організації користувача (`organizationId`).
- Безпечне хешування паролів: тільки Argon2id або bcrypt.
- **Безпечні системні виклики (CWE-78)**: категорично заборонено `exec` з конкатенацією рядків. Тільки `execFile(binary, [args], { shell: false })`.

#### Шар 4: База даних, Prisma & PostgreSQL ([postgres_skills.md](rules/postgres_skills.md))

- **100% FK індекси**: кожне поле foreign key має явний `@@index([fkColumn])`.
- **100% snake_case mapping**: кожна модель має `@@map("snake_case")`, кожна колонка `@map("column_name")`.
- **Timestamptz**: усі часові мітки тільки `DateTime` у Prisma (PostgreSQL `timestamptz`).
- **Курсорна пагінація**: для великих списків `WHERE createdAt < cursor LIMIT N`. Жодного `OFFSET`.
- **Zero N+1**: жодних циклічних запитів до БД. Тільки пакети `findMany({ where: { id: { in: ids } } })` або `include`.
- **Короткі транзакції**: `$transaction` містить виключно SQL/Prisma запити. Жодних звернень до S3, email чи HTTP всередині транзакцій.
- **Zero `as any`**: тільки суворі згенеровані типи Prisma (наприклад, `Prisma.UserWhereInput`).
- **Zero Silent Failures**: жодних порожніх `catch {}`. Обов'язкове структуроване логування `this.logger.error('[Module:Context] Message', err)`.

#### 🧪 Перевірка досягнення GREEN:

Запустити тест повторно:

```bash
pnpm --filter @smartfeed/backend-api test:e2e -- <feature>.e2e-spec.ts
```

Тест **повинен стати 100% ЗЕЛЕНИМ (GREEN)**.

### ⚙️ Скіли етапу GREEN в арсеналі агента:

- [**`nestjs-best-practices`**](../skills/nestjs-best-practices/SKILL.md) — CQRS архітектура, DTO валідація, DI, centralized exception filters.
- [**`prisma-postgres-mastery`**](../skills/prisma-postgres-mastery/SKILL.md) — 100% FK індекси, CUIDs, snake_case mapping, `@prisma/adapter-pg` pooling, zero N+1.
- [**`postgresql-optimization`**](../skills/postgresql-optimization/SKILL.md) — GIN `pg_trgm`, JSONB, курсорна пагінація без OFFSET, короткі `$transaction`.
- [**`streaming-large-feeds`**](../skills/streaming-large-feeds/SKILL.md) — SAX XML/CSV стрімінг для 100k+ SKU, backpressure, чанки по 500-1000 items.
- [**`bullmq-jobs`**](../skills/bullmq-jobs/SKILL.md) — черги, експоненційний retry, DLQ, ідемпотентні воркери.
- [**`idempotency-and-outbox`**](../skills/idempotency-and-outbox/SKILL.md) — Redis ключі ідемпотентності, Transactional Outbox.
- [**`rust-native-backend`**](../skills/rust-native-backend/SKILL.md) — нативний SQLite/Tauri бекенд (`src-tauri/src/db.rs`), транзакції, `thiserror`.
- [**`tauri-v2-security-and-ipc`**](../skills/tauri-v2-security-and-ipc/SKILL.md) — безпека IPC команд, SQLCipher шифрування, Keychain секрети.
- [**`security-and-hardening`**](../skills/security-and-hardening/SKILL.md) — 4-рівнева модель валідації, Tenant Scoping (`organizationId`), захист від CWE-78 (`execFile`).
- [**`ai-sdk`**](../skills/ai-sdk/SKILL.md) — інтеграція Vercel AI SDK для бекенд-пайплайнів збагачення товарів.

---

## 🔍 Етап 5: Проміжне інженерне рев'ю та самоаудит (Self-Review & Polish)

Після отримання зеленого тесту, але **ДО** фінального прогону регресії, проводиться ретельна перевірка коду за стандартами монорепозиторію:

1. **Ліміт розміру файлів (<250–300 рядків)**:
   - Чи не перетворився контролер чи хендлер на God-файл? Якщо файл >300 рядків — негайно розділити на підмодулі або винести допоміжну логіку.
2. **Чистота типізації та відсутність обходів**:
   - Перевірити: 0 `as any`, 0 `unknown as ...`, 0 нетипізованих `@Body() body: unknown`.
   - Запустити суворий тайпчек:
     ```bash
     pnpm --filter @smartfeed/backend-api exec tsc --noEmit
     ```
3. **Dead Code та безпека**:
   - Відсутність невикористаних імпортів або мертвих DTO.
   - Відсутність чутливих даних у відповідях (паролі, хеші, внутрішні ключі).
4. **Форматування коду**:
   ```bash
   pnpm format
   ```

### 🔍 Скіли проміжного рев'ю в арсеналі агента:

- [**`code-review-and-quality`**](../skills/code-review-and-quality/SKILL.md) — 5 осей інспекції (коректність, архітектура, безпека, читабельність, швидкість), перевірка чек-листа проекту.
- [**`code-simplification`**](../skills/code-simplification/SKILL.md) — спрощення складних функцій, видалення мертвого коду, чистота над надмірною хитрістю.
- [**`performance-optimization`**](../skills/performance-optimization/SKILL.md) — перевірка часу виконання та пам'яті, оптимізація вибірок БД.

---

## 🛡️ Етап 6: Суцільне автотестування та регресійний контроль (Full E2E & Regression Safety)

Backend Agent **ЗОБОВ'ЯЗАНИЙ переконатися, що нова функціональність не поламала жодного існуючого модуля системи**.

### 🧪 Обов'язкові перевірки етапу 6:

1. **Повний прогін E2E сьюту бекенду**:
   ```bash
   pnpm --filter @smartfeed/backend-api test:e2e
   ```
   Усі тестові файли (`auth.e2e-spec.ts`, `users.e2e-spec.ts`, `licenses.e2e-spec.ts`, `plans.e2e-spec.ts`, `organizations.e2e-spec.ts`, `storage.e2e-spec.ts`) повинні пройти з результатом **100% PASS**.
2. **Контроль чистоти бази даних**:
   - Переконатися, що після завершення всіх тестів у базі даних не залишилося тестових записів, користувачів чи фідів (перевірка роботи `cleanDatabase`).
3. **Інспекція Swagger UI через Playwright MCP**:
   - Для візуальної перевірки документації API використовується **Playwright MCP Server** (🛑 **ніколи не використовувати `browser_subagent`**, оскільки він падає з 404 на macOS ARM64):
     - `browser_navigate` на `http://localhost:4000/api/docs`.
     - `browser_take_screenshot` / `browser_snapshot` для перевірки наявності нових ендпоінтів, коректності схем DTO, кодів відповідей (200, 400, 403) та Bearer Auth замків.

### 🛡️ Скіли етапу 6:

- [**`test-driven-development`**](../skills/test-driven-development/SKILL.md) — повний регресійний прогін E2E сьюту, підтвердження 100% проходження тестів.
- [**`doubt-driven-development`**](../skills/doubt-driven-development/SKILL.md) — змагальний стрес-тест граничних випадків (гонки квот, паралельні мутації, перевірка `OrganizationMutex`).

---

## 🐞 Етап 7: Систематичний дебаг при виявленні збоїв (Systematic Debugging)

Якщо під час прогону E2E тестів або регресії виявлено баг, падіння чи конфлікт:

1. **Заборона випадкових "фіксів навмання"**:
   - Категорично заборонено мовчки глушити помилки через `try {} catch {}`, додавати `as any` або хардкодити значення.
2. **4 фази систематичного дебагу**:
   - **Фаза 1: Відтворення**: ізолювати падаючий сценарій у мінімальному автономному тесті.
   - **Фаза 2: Трейсинг першопричини (Root Cause Tracing)**: розмотати ланцюг подій назад від помилки (лог запиту → DTO валідатор → CQRS хендлер → Prisma запит → обмеження БД).
   - **Фаза 3: Архітектурне виправлення**: внести чисте структурне виправлення в першоджерело проблеми.
   - **Фаза 4: 100% повторна верифікація**: переконатися, що виправлений тест проходить і вся решта сьюту залишається зеленою.
3. **🚨 Circuit Breaker (Правило 3-х фіксів)**:
   - Якщо 3 спроби виправити проблему провалюються — **ЗУПИНИТИСЯ**. Це свідчить про глибинний архітектурний дефект у моделі даних чи CQRS схемі. Обговорити проблему з користувачем.

### 🐞 Скіли дебагу в арсеналі агента:

- [**`systematic-debugging`**](../skills/systematic-debugging/SKILL.md) — 4-фазний процес: мінімальний тест → трейсинг назад → структурний фікс → повна верифікація.
- [**`observability-and-instrumentation`**](../skills/observability-and-instrumentation/SKILL.md) — аналіз структурованих логів, трасування трейсів через OpenTelemetry/Sentry, діагностика блокувань пулу з'єднань БД.

---

## 🏁 Етап 8: Фінальне рев'ю якості, оновлення документації та завершення плану (DoD)

Тільки після успішного проходження всіх 7 попередніх етапів та 100% зелених тестів:

### 1. Фінальний контроль якості:

- [**`code-review-and-quality`**](../skills/code-review-and-quality/SKILL.md) — комплексна інспекція дотримання CQRS, PostgreSQL індексів, лімітів файлів та типів.
- **Фінальний прогін компіляції та лінтування**:
  ```bash
  pnpm --filter @smartfeed/backend-api exec tsc --noEmit
  pnpm --filter @smartfeed/shared build
  pnpm lint:fix && pnpm format
  ```

### 2. Оновлення документації та карти архітектури:

- **Оновлення карти архітектури**: [**`project-context-map`**](../skills/project-context-map/SKILL.md) — зафіксувати нові модулі, контролери, черги BullMQ або моделі даних у карті архітектури.
- **Оновлення документації**: [**`documentation-and-adrs`**](../skills/documentation-and-adrs/SKILL.md) — оновити WIKI, ADRs, та таблиці E2E покриття.
- Оновити таблицю `📊 E2E Test Coverage` у [`services/backend-api/README.md`](../services/backend-api/README.md).
- Оновити таблицю `🧪 Testing Policy & Coverage` у [`services/backend-api/AGENTS.md`](../services/backend-api/AGENTS.md).
- При зміні схеми або додаванні нових модулів — оновити статті у [`wiki/`](../wiki/).

### 3. Переведення плану у статус "Виконано" ([plans_lifecycle.md](rules/plans_lifecycle.md)):

- Перемістити файл плану через [**`planning-and-lifecycle`**](../skills/planning-and-lifecycle/SKILL.md):
  ```text
  plans/active/<feature>.md  ──►  plans/completed/<feature>.md
  ```
- Оновити метадані на початку файлу:
  ```markdown
  > **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
  > **Дата виконання:** DD.MM.YYYY  
  > **Покриття:** NestJS E2E Jest тести (TDD RED/GREEN, 4-Layer Defense, 100% teardown cleanDatabase)
  ```
- Оновити та синхронізувати таблицю `Завершені та протестовані плани` у [`plans/README.md`](../plans/README.md).

### 4. Політика Git Commit ([testing_and_quality.md](rules/testing_and_quality.md)):

- [**`git-commit`**](../skills/git-commit/SKILL.md) — conventional commits, звичайне вивантаження без створення версії, або SemVer реліз із тегом тільки за прапорцем (`--release`).
- **СУВОРА ЗАБОРОНА**: агент **НІКОЛИ** не робить `git commit` чи `git push` автоматично.
- Закомітити зміни можна **виключно** за явною командою користувача (наприклад, `/git-commit`).

---

## 🧰 9. Операційна матриця скілів Backend-агента (Арсенал навичок)

| Скіл                                                                                            | Що робить (Функціонал)                                                                | Етап життєвого циклу | В яких конкретних випадках застосовується                                                        |
| :---------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :------------------- | :----------------------------------------------------------------------------------------------- |
| [**`project-context-map`**](../skills/project-context-map/SKILL.md)                             | Топологія архітектури монорепо, порти сервісів, CQRS межі                             | Етап 0, 1, 8         | Швидка орієнтація по портах (:4000, :5432, :6379, :9000), CQRS зв'язках, фіксація нових модулів. |
| [**`lessons-learned-registry`**](../skills/lessons-learned-registry/SKILL.md)                   | Реєстр відомих помилок бекенду (гонки квот, блокування пулу БД)                       | Етап 0, 1            | Запобігання повторним багам, пропущеному `cleanDatabase`, витокам пам'яті.                       |
| [**`planning-and-lifecycle`**](../skills/planning-and-lifecycle/SKILL.md)                       | Детерміновані плани у `plans/active/`, фіксація DoD та переведення в `completed/`     | Етап 0, 2, 8         | Будь-яка зміна коду чи БД: створення плану до дій, закриття після 100% тестів.                   |
| [**`interview-me`**](../skills/interview-me/SKILL.md)                                           | Покрокове уточнення вимог по 1 питанню з оцінкою confidence %                         | Етап 1               | Неоднозначні вимоги до бізнес-логіки, тарифів, прав доступу або API форматів.                    |
| [**`doubt-driven-development`**](../skills/doubt-driven-development/SKILL.md)                   | Змагальний критичний аналіз архітектури та граничних випадків                         | Етап 1, 6            | Пошук ризиків гонок (TOCTOU), переповнення буферів, поведінки при збоях мережі.                  |
| [**`subscription-lifecycle`**](../skills/subscription-lifecycle/SKILL.md)                       | Ліцензії, квоти тарифів, ліміти seats/SKU/AI/S3, grace-періоди                        | Етап 1               | Білінг, перевірка лімітів організації, авто-даунгрейди.                                          |
| [**`security-and-hardening`**](../skills/security-and-hardening/SKILL.md)                       | OWASP API Security, JWT, 4-шаровий захист, нуль CWE-78 (`execFile`)                   | Етап 1, 4            | Публічні роути, захист від SSRF/ін'єкцій, безпечні системні виклики.                             |
| [**`source-driven-development`**](../skills/source-driven-development/SKILL.md)                 | Верифікація за офіційною документацією бібліотек та фреймворків                       | Етап 1               | Усунення галюцинацій щодо API Prisma, NestJS CQRS, BullMQ.                                       |
| [**`contract-first-api`**](../skills/contract-first-api/SKILL.md)                               | Єдині DTO, Zod-схеми та Enums у `@smartfeed/shared`                                   | Етап 2               | Синхронізація контрактів між клієнтом та сервером, `pnpm build:shared`.                          |
| [**`spec-driven-development`**](../skills/spec-driven-development/SKILL.md)                     | Специфікація API ендпоінтів та CQRS сигнатур до написання коду                        | Етап 2               | Чіткий контракт команд, запитів, DTO та відповідей.                                              |
| [**`incremental-implementation`**](../skills/incremental-implementation/SKILL.md)               | Декомпозиція задач на вертикальні зрізи з лімітом <250 рядків                         | Етап 2               | Запобігання монолітним God-файлам, поетапне впровадження.                                        |
| [**`code-simplification`**](../skills/code-simplification/SKILL.md)                             | Скорочення складності, усунення зайвих шарів та обгорток                              | Етап 2, 5            | Чистий CQRS без проміжних непотрібних сервісів, лаконічний читабельний код.                      |
| [**`test-driven-development`**](../skills/test-driven-development/SKILL.md)                     | Суворий цикл TDD (RED тест спочатку -> GREEN реалізація -> REFACTOR)                  | Етап 3, 4, 6         | Jest/Supertest E2E тести з реальним підключенням до БД та `cleanDatabase` teardown.              |
| [**`mock-real-parity`**](../skills/mock-real-parity/SKILL.md)                                   | 100% паритет між Real API, SQLite та browser mock                                     | Етап 3               | Однаковий формат відповідей, зв'язків та каскадних видалень на всіх клієнтах.                    |
| [**`nestjs-best-practices`**](../skills/nestjs-best-practices/SKILL.md)                         | Чистий CQRS, CommandBus, QueryBus, EventBus, DTO валідатори, Exception Filters        | Етап 4               | Модулі NestJS, ізоляція `UsersModule`, відсутність циклічних залежностей.                        |
| [**`prisma-postgres-mastery`**](../skills/prisma-postgres-mastery/SKILL.md)                     | 100% FK індекси, CUIDs, `@@map`, connection pool через `@prisma/adapter-pg`, zero N+1 | Етап 4               | Створення моделей у `schema.prisma`, безпечні вибірки, виключення `as any`.                      |
| [**`postgresql-optimization`**](../skills/postgresql-optimization/SKILL.md)                     | JSONB, GIN `pg_trgm`, курсорна пагінація без OFFSET, короткі `$transaction`           | Етап 4               | Швидкий пошук товарів, безпечні атомарні транзакції без викликів HTTP всередині.                 |
| [**`streaming-large-feeds`**](../skills/streaming-large-feeds/SKILL.md)                         | SAX XML/CSV стрімінг для 100k+ SKU, backpressure, чанки 500-1000 items                | Етап 4               | Запобігання OOM при обробці великих товарних каталогів.                                          |
| [**`bullmq-jobs`**](../skills/bullmq-jobs/SKILL.md)                                             | Асинхронні черги BullMQ, retry backoff, Dead Letter Queue (DLQ), ідемпотентні воркери | Етап 4               | Важкі фонові задачі імпорту/експорту фідів, синхронізація цін.                                   |
| [**`idempotency-and-outbox`**](../skills/idempotency-and-outbox/SKILL.md)                       | Ключі ідемпотентності в Redis, Transactional Outbox у Prisma                          | Етап 4               | Захист від повторних списань чи подвійного імпорту, гарантована доставка подій.                  |
| [**`rust-native-backend`**](../skills/rust-native-backend/SKILL.md)                             | Нативний SQLite бекенд десктопу (`src-tauri/src/db.rs`), транзакції, `thiserror`      | Етап 4               | Робота з локальною базою даних десктопу в Tauri v2.                                              |
| [**`tauri-v2-security-and-ipc`**](../skills/tauri-v2-security-and-ipc/SKILL.md)                 | Безпека Rust IPC команд, SQLCipher шифрування, Keychain                               | Етап 4               | Збереження чутливих токенів десктопу, шифрування локальної БД.                                   |
| [**`ai-sdk`**](../skills/ai-sdk/SKILL.md)                                                       | Vercel AI SDK для бекенд-пайплайнів збагачення товарів                                | Етап 4               | AI-нормалізація категорій та характеристик товарів у фідах.                                      |
| [**`code-review-and-quality`**](../skills/code-review-and-quality/SKILL.md)                     | 5-осьовий аудит коду, перевірка лімітів <250 рядків, відсутність dead code            | Етап 5, 8            | Самоперевірка перед здачею задачі, відповідність усім інженерним стандартам.                     |
| [**`performance-optimization`**](../skills/performance-optimization/SKILL.md)                   | Бенчмарки обробки даних, моніторинг часу виконання запитів                            | Етап 5               | Контроль часу відповіді API (p95 < 50ms), оптимізація RAM воркерів.                              |
| [**`systematic-debugging`**](../skills/systematic-debugging/SKILL.md)                           | 4-фазний дебаг: відтворення тестом -> трейсинг -> структурний фікс -> верифікація     | Етап 7               | Усунення помилок у тестах або рантаймі без випадкових "латок".                                   |
| [**`observability-and-instrumentation`**](../skills/observability-and-instrumentation/SKILL.md) | Структуровані логи Pino, OpenTelemetry трейсинг, моніторинг помилок                   | Етап 7               | Розслідування складних збоїв, гонок або зависань під навантаженням.                              |
| [**`documentation-and-adrs`**](../skills/documentation-and-adrs/SKILL.md)                       | Синхронізація WIKI, оновлення таблиць E2E покриття та ADRs                            | Етап 8               | Підтримка 100% актуальності документації після завершення фічі.                                  |
| [**`git-commit`**](../skills/git-commit/SKILL.md)                                               | Conventional commits, звичайний пуш без версій або керований реліз (`--release`)      | Етап 8               | Формування чистого комміту; створення версії та тегу тільки за прапорцем --release.              |
| [**`automated-guardrails-ci`**](../skills/automated-guardrails-ci/SKILL.md)                     | ESLint, Prettier, TypeScript strict typecheck                                         | Етап 0, 8            | Фінальний контроль перед закриттям задачі.                                                       |
| [**`skill-creator`**](../skills/skill-creator/SKILL.md)                                         | Створення, аудит та оптимізація скілів у `.agents/skills/<skill>/`                    | Мета-контур          | Оновлення бази знань агентів при появі нових вимог чи інваріантів.                               |

---

## 🧬 10. Контур самопрокачування бекенд-агента (Self-Evolution & Continuous Skill Upgrade Protocol)

Коли бекенд-інженер виявляє дефект, неврахований бізнес-кейс (як-от видалення зв'язаних товарів при видаленні фіду), антипатерн безпеки або нову вимогу користувача, **яких ще немає в інструкціях чи правилах**, він запускає цикл самопрокачування через [**`skill-creator`**](../skills/skill-creator/SKILL.md):

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │            КОНТУР САМОПРОКАЧУВАННЯ BACKEND-АГЕНТА (SELF-EVOLUTION LOOP)                │
 └──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 1. ДЕТЕКЦІЯ: ВИЯВЛЕННЯ НЕЗАКОДОВАНОЇ ПРОБЛЕМИ АБО АНТИПАТЕРНУ                  │
    │    • Баг цілісності даних (осиротілі записи в БД при видаленні батьків)       │
    │    • Вразливість безпеки (SSRF при викачуванні за URL, command injection)     │
    │    • Гонка конкурентності (TOCTOU обхід квот при паралельних запитах)         │
    │    • Зауваження користувача (наприклад: паритет Mock/Real, заборона ../)      │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 2. СИНТЕЗ КОРЕНЕВОЇ ПРИЧИНИ (ROOT CAUSE SYNTHESIS)                            │
    │    • Скіли: systematic-debugging, doubt-driven-development                    │
    │    • Чому база або сервіс дозволили цей стан? Якого шару валідації бракувало? │
    │    • Як вирішити системно (ON DELETE CASCADE, Mutex, execFile)?               │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 3. КОДИФІКАЦІЯ ЧЕРЕЗ SKILL-CREATOR                                            │
    │    • Оновлення існуючого скіла в .agents/skills/<skill>/SKILL.md              │
    │    • Або створення нового скіла через skill-creator:                          │
    │      1. YAML frontmatter + pushy trigger + 4-шаровий захист (<500 рядків)     │
    │      2. Створення валідного відносного симлінка в .claude/skills/             │
    │    • Оновлення правил: додати інваріант у .agents/rules/*.md (<12k символів)  │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 4. ЗАКРІПЛЕННЯ АВТОТЕСТОМ (TEST LOCK-IN)                                      │
    │    • Написання падаючого E2E тесту (Supertest + cleanDatabase)                │
    │    • Перевірка каскадного видалення або блокування невалідних операцій        │
    │    • Тепер регресія неможлива — тест заблокує спробу порушити інваріант!      │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 5. СИНХРОНІЗАЦІЯ З КОМАНДОЮ АГЕНТІВ                                           │
    │    • Повідомлення agents_review для включення в чеклист аудиту                │
    │    • Оновлення матриці в .agents/AGENTS.md                                    │
    └───────────────────────────────────────────────────────────────────────────────┘
```
