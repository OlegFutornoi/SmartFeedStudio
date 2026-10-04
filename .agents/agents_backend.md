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

---

## 🚦 Етап 0 (обов'язковий): Router, Реєстр уроків і Карта проєкту

Перед Етапом 1 агент **зобов'язаний**:

0. Якщо існує `plans/active/<task>.state.md` — почати з нього ([`session-handoff`](skills/sub-skills/session-handoff/SKILL.md)); наприкінці сесії/перед компакцією — оновити його.
1. Прочитати [`task-router`](skills/sub-skills/task-router/SKILL.md) і обрати мінімальний набір скілів (не вантажити всі).
2. `grep` у [`lessons-learned-registry`](skills/sub-skills/lessons-learned-registry/references/registry.md) за темою задачі і врахувати інваріанти.
3. Знайти код через [`project-context-map`](skills/sub-skills/project-context-map/references/map.md) та `wiki/`, а не скануванням репозиторію.
4. Виписати інваріанти задачі (каскади, лічильники, паритет mock↔real, `@/` імпорти).
5. Нове правило/баг → [`automated-guardrails-ci`](skills/sub-skills/automated-guardrails-ci/SKILL.md) + запис у реєстр.

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
    │    • Моделювання відмов, Sentry bug prevention (null checks, memory leaks)    │
    │    • Скіли: nestjs-best-practices, backend-patterns, subscription-lifecycle    │
    │    • MCP: context7 (NestJS/Prisma/BullMQ docs), firecrawl (OWASP/queues)      │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 2. 📋 АРХІТЕКТУРНЕ ПЛАНУВАННЯ ТА СПІЛЬНІ КОНТРАКТИ                           │
    │    • План у plans/active/<feature>.md (DoD, бюджет <250 рядків, 4-шаровий план)│
    │    • Контракти FIRST у @smartfeed/shared (DTO, Zod, Enums, pnpm build:shared)  │
    │    • Скіли: writing-plans, executing-plans, subagent-driven, simplification   │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 3. 🧪 СУВОРИЙ TDD: НАПИСАННЯ ПАДАЮЧИХ ТЕСТІВ (TDD RED PHASE — ТЕСТИ СПОЧАТКУ)│
    │    • services/backend-api/test/<feature>.e2e-spec.ts (Supertest + реальна БД) │
    │    • cleanDatabase в beforeAll ТА afterAll (нуль сміття в базі даних)         │
    │    • Ствердження: валідація DTO (400), Auth/Guards (401/403), Quotas, 200/201 │
    │    • Запуск тесту -> ПЕРЕКОНАТИСЯ В ПАДІННІ (RED) З ОЧІКУВАНОЇ ПРИЧИНИ        │
    │    • Скіли: test-driven-development-tdd, testing-anti-patterns, condition-wait│
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 4. ⚙️ РЕАЛІЗАЦІЯ З 4-ШАРОВИМ ЗАХИСТОМ ДО ПРОХОДЖЕННЯ ТЕСТІВ (GREEN PHASE)     │
    │    • Шар 1 (DTO / class-validator), Шар 2 (Domain/Квоти + OrganizationMutex)  │
    │    • Шар 3 (Guards/RBAC + Argon2/CWE-78 execFile), Шар 4 (Prisma FKs/Trx)     │
    │    • PostgreSQL: 100% FK indexes, snake_case @@map, timestamptz, cuid PK      │
    │    • Запуск тесту -> ПЕРЕКОНАТИСЯ У 100% УСПІШНОМУ ПРОХОДЖЕННІ (GREEN)        │
    │    • Скіли: backend, defense-in-depth-validation, supabase-postgres-bp, postgresql-code-review│
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 5. 🔍 ПРОМІЖНЕ ІНЖЕНЕРНЕ РЕВ'Ю ТА САМОАУДИТ                                  │
    │    • Самоінспекція: <250 рядків на файл, 0 any, 0 порожніх catch, чисті типи   │
    │    • Статичний тайпчек: pnpm --filter @smartfeed/backend-api exec tsc --noEmit│
    │    • Скіли: requesting-code-review, code-review-reception                     │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 6. 🛡️ СУЦІЛЬНЕ АВТОТЕСТУВАННЯ ТА РЕГРЕСІЙНИЙ КОНТРОЛЬ                         │
    │    • Повний E2E сьют: pnpm --filter @smartfeed/backend-api test:e2e           │
    │    • Регресійний контроль: жоден інший модуль не зламався (100% PASS)         │
    │    • Перевірка Swagger UI через Playwright MCP (БЕЗ browser_subagent)         │
    │    • Перевірка чистоти БД після тестів (zero leftovers)                       │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
                        ┌───────────────────┴───────────────────┐
                        │ Чи виявлено збої / падіння / регресію?│
                        └─────────┬───────────────────┬─────────┘
                                  │ ТАК               │ НІ
                                  ▼                   ▼
    ┌─────────────────────────────────────────────┐  ┌──────────────────────────────┐
    │ 7. 🐞 СИСТЕМАТИЧНИЙ ДЕБАГ (4 ФАЗИ)          │  │ 8. 🏁 ФІНАЛЬНЕ РЕВ'Ю, ДОКИ  │
    │    • Фаза 1: Відтворення мінімальним тестом │  │    ТА ПЕРЕВЕДЕННЯ ПЛАНУ      │
    │    • Фаза 2: Трейсинг root cause назад      │  │    • fullstack-code-review   │
    │    • Фаза 3: Архітектурний фікс (0 костилів)│  │    • Оновлення таблиць тестів│
    │    • Фаза 4: 100% повторна верифікація      │  │    • plans/active -> compld  │
    │    • Circuit breaker: правило 3-х фіксів    │  │    • Синхронізація README.md │
    │    • Скіли: systematic-debugging, root-cause│  └──────────────────────────────┘
    └─────────────────────┬───────────────────────┘
                          │ (повернення до тестів)
                          └───────────────────────►
```

---

## 📌 Етап 1: Глибокий аналіз задачі, бізнес-логіки та безпеки (Task & Security Deep Analysis)

Коли агент отримує задачу на бекенд, він **ніколи не починає писати код або міграції одразу**. Перший крок — повне дослідження архітектурних меж, бізнес-правил та векторів безпеки.

### 🧠 Ключові перевірки етапу 1:

1. **Цільовий рантайм та межі (Native vs Cloud)**:
   - Чи це хмарний бекенд (`services/backend-api` NestJS + PostgreSQL)?
   - Чи локальний нативний бекенд десктопу (`apps/desktop` Tauri + SQLite)?
   - **Залізне правило**: локальні операції товарного каталогу десктопу **ніколи** не маршрутизуються через NestJS API.
2. **Актори, RBAC та тенантність**:
   - Хто виконує запит: `SUPER_ADMIN`, `ADMIN`, `USER` чи публічний гість?
   - Чи потрібна обов'язкова ізоляція організації (`organizationId`)? Запобігати витоку даних між тенантами.
3. **Квоти та ліцензії ([subscription-lifecycle](skills/sub-skills/subscription-lifecycle/SKILL.md))**:
   - Які ліміти підписки зачіпаються: кількість місць у команді (`seats`), ліміт SKU фідів, квоти AI-кредитів чи S3-сховище?
   - Як розраховуються дати дії, grace-періоди та автоматичні даунгрейди?
4. **Моделювання збоїв та Sentry bug prevention ([sentry-backend-bugs](skills/sub-skills/sentry-backend-bugs/SKILL.md))**:
   - Чи є ризик unhandled promise rejections при роботі зі стрімами?
   - Чи перевірені null-стани на зв'язках у базі даних (наприклад, `user.organization` може бути `null`)?
   - Чи унеможливлене вичерпання пулу з'єднань PostgreSQL при важких запитах?
5. **Глибокий аналіз усіх кейсів життєвого циклу та каскадності (Full Lifecycle & Cascade Analysis)**:
   - **Каскадне видалення (Zero Orphaned Records)**: що відбувається при видаленні сутності? Якщо видаляється батьківський об'єкт (фід, постачальник, організація, категорія), ВСІ пов'язані дочірні сутності (товари фіду, зображення, локальні файли, правила націнки) ЗОБОВ'ЯЗАНІ бути каскадно вилучені (`ON DELETE CASCADE` + сервісне очищення). Жодних «підвішених» товарів у БД.
   - **Обов'язковий паритет середовищ (Local vs Real Backend Parity)**: поведінка, структури даних, валідація та зв'язки сутностей повинні давати 100% однаковий результат як на локальному браузерному моку, так і на реальному PostgreSQL/SQLite.
   - **Атомарний перерахунок лічильників та квот**: кожне видалення фіду чи товару зобов'язане атомарно зменшувати лічильники в базі даних та синхронізувати квоти.

### 🧠 Скіли аналізу:

- [**`nestjs-best-practices`**](skills/sub-skills/nestjs-best-practices/SKILL.md) — чистий CQRS, відсутність циклічних імпортів, ізоляція модулів.
- [**`backend-patterns`**](skills/sub-skills/backend-patterns/SKILL.md) — доменна архітектура, Redis кешування, черги BullMQ.
- [**`subscription-lifecycle`**](skills/sub-skills/subscription-lifecycle/SKILL.md) — квоти, тарифи, grace-періоди.
- [**`sentry-backend-bugs`**](skills/sub-skills/sentry-backend-bugs/SKILL.md) — запобігання витокам пам'яті, блокуванням пулу БД та гонкам.
- [**`api-security-best-practices`**](skills/sub-skills/api-security-best-practices/SKILL.md) — OWASP API Security: автентифікація JWT, авторизація ресурсів, input validation, rate limiting, захист від SSRF та injection.
- [**`better-auth-security-best-practices`**](skills/sub-skills/better-auth-security-best-practices/SKILL.md) — захист секретів, CSRF, trusted origins, шифрування OAuth-токенів, аудит-логування, конфігурація сесій та cookies.
- [**`security-best-practices`**](skills/sub-skills/security-best-practices/SKILL.md) — мовно- та фреймворк-специфічний безпековий рев'ю (TypeScript/NestJS): виявлення вразливостей, secure-by-default код, security report.
- [**`inversion-exercise`**](skills/sub-skills/inversion-exercise/SKILL.md) & [**`scale-game`**](skills/sub-skills/scale-game/SKILL.md) — мислення від збою та тестування на масштабі (10,000 паралельних запитів).
- [**`collision-zone-thinking`**](skills/sub-skills/collision-zone-thinking/SKILL.md) — аналіз конфліктних точок між сервісами.

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

### 📋 Скіли планування:

- [**`writing-plans`**](skills/sub-skills/writing-plans/SKILL.md) — створення покрокового інженерного плану з чіткими DoD.
- [**`executing-plans`**](skills/sub-skills/executing-plans/SKILL.md) — детерміноване покрокове виконання.
- [**`subagent-driven-development`**](skills/sub-skills/subagent-driven-development/SKILL.md) — залучення ізольованих сабагентів.
- [**`simplification-cascades`**](skills/sub-skills/simplification-cascades/SKILL.md) — ліквідація зайвих рівнів абстракції.

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
4. **Запобігання тестовим анти-патернам ([testing-anti-patterns](skills/sub-skills/testing-anti-patterns/SKILL.md))**:
   - ❌ **НЕ тестувати моки**: тест повинен взаємодіяти з реальним NestJS додатком та тестовою базою даних.
   - ❌ **НЕ додавати тестові методи до продакшн-класів**.
   - ❌ **НЕ використовувати довільні затримки `sleep(2000)`**: тільки опитування умов за допомогою [condition-based-waiting](skills/sub-skills/condition-based-waiting/SKILL.md).
5. **Запуск та фіксація RED**:
   - Запустити тест:
     ```bash
     pnpm --filter @smartfeed/backend-api test:e2e -- <feature>.e2e-spec.ts
     ```
   - **ОБОВ'ЯЗКОВО ПЕРЕКОНАТИСЯ**: тест падає саме через відсутність або незавершеність ендпоінту/хендлера, а не через синтаксичну помилку в самому файлі тесту.

### 🧪 Скіли етапу TDD RED:

- [**`test-driven-development-tdd`**](skills/sub-skills/test-driven-development-tdd/SKILL.md) — строгий цикл RED → GREEN → REFACTOR.
- [**`testing-anti-patterns`**](skills/sub-skills/testing-anti-patterns/SKILL.md) — 3 залізні закони правильного тестування.
- [**`condition-based-waiting`**](skills/sub-skills/condition-based-waiting/SKILL.md) — детерміноване очікування асинхронних подій та черг BullMQ.

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

### ⚙️ Скіли етапу GREEN:

- [**`backend`**](skills/backend/SKILL.md) — генеральний майстер бекенд-інженерії.
- [**`defense-in-depth-validation`**](skills/sub-skills/defense-in-depth-validation/SKILL.md) — 4-рівнева модель валідації.
- [**`supabase-postgres-best-practices`**](skills/sub-skills/supabase-postgres-best-practices/SKILL.md) — залізні стандарти PostgreSQL.
- [**`postgresql-code-review`**](skills/sub-skills/postgresql-code-review/SKILL.md) — спеціалізований огляд та валідація PostgreSQL-коду: JSONB containment queries (`@>`), GIN індекси на масиви, кастомні ENUM/DOMAIN типи, `CITEXT`/`TIMESTAMPTZ`, CHECK констрейнти, оптимізація тригерів та RLS безпека.
- [**`postgresql-optimization`**](skills/sub-skills/postgresql-optimization/SKILL.md) — розширені можливості PostgreSQL: JSONB, масиви, повнотекстовий пошук, віконні функції, оптимізація запитів та індексів.
- [**`prisma-client-api`**](skills/sub-skills/prisma-client-api/SKILL.md) & [**`prisma-postgres`**](skills/sub-skills/prisma-postgres/SKILL.md) — безпечні запити та connection pooling.
- [**`prisma-cli`**](skills/sub-skills/prisma-cli/SKILL.md) — безпечне виконання `prisma generate`, `db push`, `migrate`.
- [**`backend-development`**](skills/sub-skills/backend-development/SKILL.md) — REST стандарти, OWASP безпека.
- [**`api-security-best-practices`**](skills/sub-skills/api-security-best-practices/SKILL.md) — захищений дизайн API: JWT верифікація, авторизація ресурсів, Zod валідація, rate limiting.
- [**`better-auth-security-best-practices`**](skills/sub-skills/better-auth-security-best-practices/SKILL.md) — секрети, CSRF захист, trusted origins, cookie безпека.

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

### 🔍 Скіли проміжного рев'ю:

- [**`requesting-code-review`**](skills/sub-skills/requesting-code-review/SKILL.md)
- [**`code-review-reception`**](skills/sub-skills/code-review-reception/SKILL.md)
- [**`postgresql-code-review`**](skills/sub-skills/postgresql-code-review/SKILL.md) — самоаудит запитів до PostgreSQL, міграцій, типів та індексів перед інтеграцією.

---

## 🛡️ Етап 6: Суцільне автотестування та регресійний контроль (Full E2E & Regression Safety)

Агент **ЗОБОВ'ЯЗАНИЙ переконатися, що нова функціональність не поламала жодного існуючого модуля системи**.

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

### 🐞 Скіли дебагу:

- [**`systematic-debugging`**](skills/sub-skills/systematic-debugging/SKILL.md)
- [**`root-cause-tracing`**](skills/sub-skills/root-cause-tracing/SKILL.md)
- [**`when-stuck-problem-solving-dispatch`**](skills/sub-skills/when-stuck-problem-solving-dispatch/SKILL.md)

---

## 🏁 Етап 8: Фінальне рев'ю якості, оновлення документації та завершення плану (DoD)

Тільки після успішного проходження всіх 7 попередніх етапів та 100% зелених тестів:

### 1. Фінальний контроль якості:

- [**`fullstack-code-review`**](skills/sub-skills/fullstack-code-review/SKILL.md) — комплексна інспекція дотримання CQRS, PostgreSQL індексів, лімітів файлів та типів.
- [**`postgresql-code-review`**](skills/sub-skills/postgresql-code-review/SKILL.md) — фінальний аудит структури бази даних, констрейнтів, JSONB та індексів.
- [**`adver-review`**](skills/sub-skills/adver-review/SKILL.md) — змагальний стрес-тест граничних випадків (гонки квот, колізії email, переривання транзакцій).
- [**`verification-before-completion`**](skills/sub-skills/verification-before-completion/SKILL.md) — фінальний прогін компіляції та лінтування:
  ```bash
  pnpm --filter @smartfeed/backend-api exec tsc --noEmit
  pnpm --filter @smartfeed/shared build
  pnpm lint:fix && pnpm format
  ```

### 2. Оновлення документації покриття тестів ([wiki_and_documentation.md](rules/wiki_and_documentation.md)):

- Оновити таблицю `📊 E2E Test Coverage` у [`services/backend-api/README.md`](../services/backend-api/README.md).
- Оновити таблицю `🧪 Testing Policy & Coverage` у [`services/backend-api/AGENTS.md`](../services/backend-api/AGENTS.md).
- При зміні схеми або додаванні нових модулів — оновити статті у [`wiki/`](../wiki/).

### 3. Переведення плану у статус "Виконано" ([plans_lifecycle.md](rules/plans_lifecycle.md)):

- Перемістити файл плану:
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

### 4. Завершення гілки розробки:

- [**`finishing-a-development-branch`**](skills/sub-skills/finishing-a-development-branch/SKILL.md) — структурований процес завершення feature branch: верифікація тестів → вибір стратегії інтеграції (merge/PR/cleanup) → виконання.

### 5. Політика Git Commit ([testing_and_quality.md](rules/testing_and_quality.md)):

- **СУВОРА ЗАБОРОНА**: агент **НІКОЛИ** не робить `git commit` чи `git push` автоматично.
- Закомітити зміни можна **виключно** за явною командою користувача (наприклад, `/git-commit`).

---

## 🧰 9. Операційна матриця всіх підскілів бекенд-агента (Що, Коли, В яких випадках)

| Підскіл                                                    | Що робить (Функціонал)                                                                        | Коли активується (Фаза/Тригер)     | В яких конкретних випадках застосовується                                                             |
| :--------------------------------------------------------- | :-------------------------------------------------------------------------------------------- | :--------------------------------- | :---------------------------------------------------------------------------------------------------- |
| **`backend`** (Master)                                     | Оркестратор повного 8-етапного інженерного циклу бекенду                                      | Будь-яка задача на бекенді         | Від архітектурного аналізу до E2E тестування, CQRS реалізації та закриття плану.                      |
| **`nestjs-best-practices`**                                | Стандарти NestJS 11: CQRS, нуль циклічних імпортів, DI, Exception Filters                     | Етап 1, 2, 4; створення сервісів   | Ізоляція модулів (`UsersModule` чистий від токенів), глобальні пайпи валідації.                       |
| **`backend-development`**                                  | REST API стандарти, OWASP Top 10, JWT, Argon2id, rate limiting                                | Етап 4, 6; контролери та ендпоінти | Публічні роути `/auth/*`, захист від брутфорсу через `ThrottlerGuard`, заголовки безпеки.             |
| **`backend-patterns`**                                     | Патерни DDD, репозиторії, Redis кешування, фонові черги BullMQ                                | Етап 1, 2, 4; асинхронні процеси   | Важкий парсинг XML/CSV на 50,000 товарів, фонова генерація каталогів, відправка вебхуків.             |
| **`streaming-large-feeds`**                                | Потоковий SAX-парсинг великих фідів (100k+ SKU), backpressure, чанкований імпорт BullMQ       | Етап 1, 2, 4; обробка каталогів    | Запобігання OOM, pause/resume стрімів, розбиття фідів на пакети по 500-1000 SKU, моніторинг RAM.      |
| **`idempotency-and-outbox`**                               | Ідемпотентність мутацій (`X-Idempotency-Key`), Transactional Outbox у Prisma, BullMQ DLQ      | Етап 2, 4; надійність мутацій      | Захист від подвійних списань та імпортів, надійна публікація подій через outbox, retry + jitter.      |
| **`defense-in-depth-validation`**                          | 4-шаровий захист (DTO -> Domain/Квоти -> Guards/RBAC -> DB FK/Trx)                            | Етап 2, 4; операції мутації даних  | Створення сутностей, списання кредитів, перевірка ліцензій, захист від підробки параметрів.           |
| **`sentry-backend-bugs`**                                  | Захист від рантайм-багів: unhandled rejections, null checks, витоки пам'яті                   | Етап 1, 4; стріми та зв'язки       | Обробка великих файлових потоків, читання nullable реляцій (`user.organization?.name`).               |
| **`subscription-lifecycle`**                               | Білінг, квоти тарифів, терміни дії, grace-періоди, авто-даунгрейди                            | Етап 1, 4; бізнес-правила          | Запрошення користувачів (seats), імпорт товарів (SKU limit), нарахування AI-кредитів.                 |
| **`supabase-postgres-best-practices`**                     | Залізні стандарти PostgreSQL: 100% FK індекси, snake_case, timestamptz                        | Етап 4; зміна схеми та запити      | Створення моделей у `schema.prisma`, виключення OFFSET пагінації, усунення N+1 запитів.               |
| **`neon-postgres`**                                        | Serverless Postgres: налаштування пулу, cold starts, pgvector, pg_trgm                        | Етап 4; хмарна БД та пошук         | Конфігурація триграмного пошуку за товарами `pg_trgm`, збереження векторних ембеддінгів.              |
| **`prisma-client-api`**                                    | Безпечні методи Prisma Client (`findMany`, `$transaction`, виключення `as any`)               | Етап 4; репозиторії та хендлери    | Типізовані вибірки `Prisma.*WhereInput`, атомарні транзакції для запобігання гонкам.                  |
| **`prisma-cli`**                                           | Робота з CLI Prisma: безпечне виконання `generate`, `db push`, `migrate dev`                  | Етап 4; міграції схеми             | Накачування змін у PostgreSQL, генерація типізованого Prisma Client, сідінг бази.                     |
| **`db-migrations-zero-downtime`**                          | Безпечні міграції БД без простою: Expand/Contract, `lock_timeout`, online backfill            | Етап 1, 4; зміна структури таблиць | Захист від блокування таблиць `AccessExclusiveLock`, `CREATE INDEX CONCURRENTLY`, чанковий бекфіл.    |
| **`prisma-postgres`**                                      | Оптимізація Prisma + PostgreSQL: пул з'єднань через `@prisma/adapter-pg`                      | Етап 4; конфігурація сервісу       | Налаштування `PrismaService`, запобігання вичерпанню ліміту відкритих з'єднань до БД.                 |
| **`prisma-upgrade-v7`**                                    | Керівництво з міграції та сумісності з Prisma v7: breaking changes                            | Оновлення ORM або збої типів       | Розв'язання breaking changes, оновлення конфігурації `prisma.config.ts`.                              |
| **`prisma-compute`**                                       | Розгортання та хостинг compute середовищ для сервісів з Prisma                                | Етап 4; інфраструктура             | Налаштування середовища виконання бекенд-сервісу та автоматичного масштабування.                      |
| **`postgresql-optimization`**                              | JSONB з GIN індексами, масиви (`@>`), повнотекстовий пошук, партиції                          | Етап 4; оптимізація швидкодії      | Збереження сирих параметрів товарів у JSONB, агрегація статистики, прискорення запитів.               |
| **`postgresql-code-review`**                               | Поглиблений аудит SQL/Prisma: RLS, CHECK констрейнти, тригери, каскади                        | Етап 5; проміжне рев'ю             | Перевірка каскадного видалення товарів при видаленні фіду (`ON DELETE CASCADE`).                      |
| **`contract-first-api`**                                   | Єдине джерело контрактів у `@smartfeed/shared`, Zod схеми валідації запитів/відповідей        | Етап 2, 4; контракти API           | Усунення розриву між NestJS DTO та клієнтськими моделями, синхронізація Swagger.                      |
| **`integrate-backend`**                                    | Контракти DTO, синхронізація статусів помилок, узгодження з фронтендом                        | Етап 2, 4; стиковка з UI           | Формування стандартизованих кодів помилок (`QUOTA_EXCEEDED`), єдині DTO у `@smartfeed/shared`.        |
| **`api-security-best-practices`**                          | OWASP API Security: фіксовані алгоритми JWT, SSRF захист, валідація URL                       | Етап 1, 4; безпека ендпоінтів      | Завантаження фідів за URL (блокування приватних/loopback IP), захист від BOLA/IDOR.                   |
| **`better-auth-security-best-practices`**                  | Безпека ключів (≥120 біт ентропії), CSRF токени, trusted origins, cookies                     | Етап 4; безпека авторизації        | Захист JWT секретів, валідація походження запитів, ротація рефреш-токенів у БД.                       |
| **`api-security-testing`**                                 | Автоматизоване тестування безпеки: фаззінг, спроби ін'єкцій, байпасів ролей                   | Етап 3, 6; безпекові E2E тести     | Тести на спробу доступу звичайного користувача до ендпоінтів `SUPER_ADMIN`.                           |
| **`firebase-security-rules-auditor`**                      | Аудит політик сховища та хмарних правил доступу                                               | Етап 4; S3/MinIO інтеграції        | Перевірка безпеки presigned URL у `StorageModule`, запобігання публічному витоку каталогів.           |
| **`security-best-practices`**                              | Мовно-специфічний аналіз безпеки NestJS/TypeScript, нуль CWE-78                               | Етап 4, 5; безпековий аудит        | Заборона `exec` з конкатенацією рядків, заміна на `execFile(binary, [args], { shell: false })`.       |
| **`observability-opentelemetry`**                          | Наскрізне трейсування (W3C traceparent), структурований JSON логер Pino, зв'язок з Sentry     | Етап 1, 4, 7; спостережуваність    | Прокидання traceId з UI в BullMQ через AsyncLocalStorage, маскування паролів у логах, алертинг.       |
| **`performance-budget`**                                   | Бенчмарки обробки фідів (100k SKU < 5 хв), ліміти пам'яті воркерів (<512MB RAM), latency      | Етап 1, 3, 6; бюджети сервісів     | Бенчмарки SAX парсингу, memory-leak тести, контроль часу виконання SQL-запитів (p95 < 50ms).          |
| **`ai-sdk`**                                               | Інтеграція Vercel AI SDK для бекенд-пайплайнів генерації та валідації                         | Етап 4; AI функції                 | Автоматичне збагачення товарних даних, нормалізація категорій через AI-моделі.                        |
| **`inversion-exercise`**                                   | Моделювання відмов: "Що станеться при збої сервера посеред транзакції?"                       | Етап 1; аналіз ризиків             | Перевірка відкату транзакцій при обриві з'єднання під час пакетного імпорту.                          |
| **`scale-game`**                                           | Тестування екстремальних навантажень бекенду (100k товарів, 100 паралельних запитів)          | Етап 1; масштабованість            | Проектування черг BullMQ для запобігання переповненню RAM при імпорті великих XML фідів.              |
| **`collision-zone-thinking`**                              | Аналіз меж: Desktop нативний SQLite (Tauri) vs Cloud NestJS API                               | Етап 1; архітектурні межі          | Сувора заборона прокидання локальних операцій товарного каталогу десктопу в NestJS API.               |
| **`simplification-cascades`**                              | Архітектурне спрощення: заміна надлишкових шарів на чисті CQRS хендлери                       | Етап 2; планування                 | Видалення проміжних сервісів-проксі на користь прямої обробки у `*Handler`.                           |
| **`meta-pattern-recognition`**                             | Уніфікація патернів між сервісами (кешування, ретраї черг)                                    | Етап 2; архітектура                | Єдиний стандарт підключення Redis та обробки ретраїв у всіх воркерах BullMQ.                          |
| **`preserving-productive-tensions`**                       | Баланс між суворою консистентністю (ACID) та асинхронною швидкодією                           | Етап 2; проектування               | Виділення фінансових операцій у транзакції, а парсингу каталогів — в асинхронні черги.                |
| **`writing-plans`** & **`executing-plans`**                | Формування плану у `plans/active/` з 4-шаровим захистом та покрокове виконання                | Етап 2; планування                 | Будь-яка зміна бекенду понад 1 файл: затвердження архітектури до написання коду.                      |
| **`invariant-checklist-generator`**                        | Формування обов'язкових інваріантів до коду (каскади, лічильники, квоти)                      | Етап 1, 6; верифікація інваріантів | Перевірка каскадного видалення товарів, списання квот і захисту від осиротілих рядків у БД.           |
| **`subagent-driven-development`**                          | Делегування незалежних завдань бекенду (DTO, Handler, E2E тест) субагентам                    | Етап 2, 4; паралельні задачі       | Розподіл завдань між спеціалізованими субагентами для прискорення розробки.                           |
| **`dispatching-parallel-agents`**                          | Конкурентний аудит та виправлення помилок у різних модулях бекенду                            | Етап 7; дебаг інцидентів           | Одночасне дослідження логів Redis та блокувань PostgreSQL при навантаженні.                           |
| **`remembering-conversations`**                            | Пошук рішень щодо структури БД, угод найменування та бізнес-правил                            | Етап 1; пам'ять проекту            | Згадування причини введення CUID замість UUID або специфіки налаштування `@prisma/adapter-pg`.        |
| **`test-driven-development`**                              | Залізний цикл TDD: RED тест падає -> GREEN реалізація -> REFACTOR чистий код                  | Етап 3, 4; TDD розробка            | Написання тесту з Supertest та реальним підключенням до БД до створення бізнес-логіки.                |
| **`mock-real-parity-testing`**                             | Гарантія паритету між реальними API відповідями та локальними SQLite/mock моделями            | Етап 2, 3; паритет середовищ       | Перевірка ідентичності структури DTO, лічильників та каскадних видалень для обох середовищ.           |
| **`seed-and-fixtures-factory`**                            | Фабрики тестових даних, потокові генератори XML/CSV та ієрархічний teardown (`cleanDatabase`) | Етап 3; тестові фікстури           | Генерація реалістичних фідів на 10k-100k SKU, фабрики User/Org/License, 100% очищення після тестів.   |
| **`e2e-scenario-matrix`**                                  | Матриця 4D сценаріїв: перевірка операцій (Create, Filter, Cascade Delete) по мовах            | Етап 3; проектування тестів        | Повне покриття всіх комбінацій операцій над фідів і товарів у Jest/Supertest E2E тестах.              |
| **`property-based-and-mutation-testing`**                  | Property-Based тестування парсерів (`fast-check`) та мутаційні тести (Stryker)                | Етап 3, 5; надійність алгоритмів   | Фаззінг XML/CSV потоків з битими символами, перевірка живучості тестів проти мутацій коду.            |
| **`testing-anti-patterns`**                                | Заборона тестування моків; обов'язковий `cleanDatabase` з FK-ієрархією                        | Етап 3; якість тестів              | Очищення БД у `beforeAll` та `afterAll`, виключення витоку тестових даних між сьютами.                |
| **`condition-based-waiting`**                              | Очікування завершення асинхронних задач через опитування умов замість `sleep`                 | Етап 3, 6; E2E тести               | Очікування появи результатів обробки черги BullMQ через циклічний `expect.poll`.                      |
| **`session-handoff`**                                      | Збереження стану задачі в `plans/active/<task>.state.md`                                      | Етап 0, 8; збереження контексту    | Компакція довгої сесії, відновлення роботи без повторного читання репозиторію.                        |
| **`systematic-debugging`** & **`root-cause-tracing`**      | 4-фазний дебаг: відтворення тестом -> трейсинг до першопричини -> чистий фікс                 | Етап 7; усунення багів             | Розслідування падіння транзакції або блокування пулу з'єднань під навантаженням.                      |
| **`when-stuck-problem-solving-dispatch`**                  | Алгоритм виходу з глухого кута при зависанні тестів або складних збоях                        | Етап 7; критичний глухий кут       | Діагностика взаємних блокувань (deadlocks) у PostgreSQL транзакціях.                                  |
| **`typescript-advanced-types`**                            | Generics, Conditional/Mapped types, Type Guards у DTO та хендлерах                            | Етап 2; контракти                  | Сувора типізація фільтрів, безпечні вибірки, повне усунення небезпечного `as any`.                    |
| **`turborepo`**                                            | Оптимізація пайплайнів білду та кешування бекенду у монорепо                                  | Етап 5; збірка та CI               | Перевірка чистоти збірки через `pnpm --filter @smartfeed/backend-api build`.                          |
| **`using-git-worktrees`**                                  | Ізольовані робочі дерева Git для безпечного тестування міграцій                               | Етап 4; експерименти               | Перевірка руйнівних міграцій бази даних в окремому ізольованому worktree.                             |
| **`finishing-a-development-branch`**                       | Фіналізація гілки: підготовка чистого злиття, контроль тегів версій                           | Етап 8; реліз                      | Підготовка бекенд-модуля до злиття в `main` та синхронізація версій.                                  |
| **`release-and-rollback`**                                 | Управління релізами (SemVer), генерація CHANGELOG, smoke-чеки API, стратегія відкату          | Етап 8; релізи та деплой           | Автоматизовані перевірки `/api/health`, `/api/plans`, нуль руйнівних змін БД при Rollback на Railway. |
| **`firecrawl-parse`**                                      | Дослідження структури зовнішніх постачальників для генерації парсерів                         | Етап 1; інтеграції                 | Парсинг зразків XML/CSV каталогів для створення точних схем імпорту.                                  |
| **`fullstack-code-review`**                                | Комплексний аудит архітектури, CQRS меж, безпеки та стилю коду                                | Етап 5, 8; рев'ю                   | Контроль ліміту <250–300 рядків на файл, відсутність inline-типів, перевірка DTO.                     |
| **`adver-review`**                                         | Змагальний стрес-тест: симуляція TOCTOU гонок та спроб обходу квот                            | Етап 6; стрес-тест                 | 10 паралельних запитів на запрошення в команду для перевірки `OrganizationMutex`.                     |
| **`requesting-code-review`** & **`code-review-reception`** | Самоперевірка за чеклистом та професійне реагування на зауваження                             | Етап 5; фіналізація                | Виконання 11 пунктів обов'язкового чек-листа до звітування користувачу.                               |
| **`verification-before-completion`**                       | Фінальна верифікація: тайпчек, білд shared, повний прогін E2E                                 | Етап 8; фінішний гейт              | `pnpm --filter @smartfeed/backend-api exec tsc --noEmit` + повний запуск E2E тестів.                  |

---

## 🧬 10. Контур самопрокачування бекенд-агента (Self-Evolution & Continuous Skill Upgrade Protocol)

Коли бекенд-інженер виявляє дефект, неврахований бізнес-кейс (як-от видалення зв'язаних товарів при видаленні фіду), антипатерн безпеки або нову вимогу користувача, **яких ще немає в інструкціях чи правилах**, він зобов'язаний запустити цикл самопрокачування:

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
    │    • Скіли: systematic-debugging, root-cause-tracing, inversion-exercise      │
    │    • Чому база або сервіс дозволили цей стан? Якого шару валідації бракувало? │
    │    • Як вирішити системно (ON DELETE CASCADE, Mutex, execFile)?               │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 3. КОДИФІКАЦІЯ ЧЕРЕЗ SKILL-CREATOR & WRITING-SKILLS                           │
    │    • Оновлення існуючого підскіла в .agents/skills/sub-skills/<skill>/        │
    │    • Або створення нового підскіла через skill-creator:                       │
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
    │    • Оновлення таблиці Anti-Patterns у backend/SKILL.md та agents_backend.md  │
    │    • Повідомлення agents_review для включення в чеклист аудиту                │
    │    • Оновлення навігаційної матриці в .agents/AGENTS.md                       │
    └───────────────────────────────────────────────────────────────────────────────┘
```
