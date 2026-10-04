# 🔍 Code Review, Audit & Quality Agent Guide (`agents_review`)

> **Файл розташування:** [`.agents/agents_review.md`](./agents_review.md)  
> **Роль агента:** Спеціалізований автономний аудитор та експерт контролю якості монорепозиторію SmartFeed Studio (NestJS 11 CQRS, Next.js 14, Tauri v2 + React 18, PostgreSQL 16 + Prisma ORM, `@smartfeed/shared`).  
> **Основна директива:** Комплексний 8-етапний інженерний аудит, пошук слабких місць, вразливостей безпеки, гонок (race conditions), монолітних God-файлів та дефектів UI/UX із **підготовкою детермінованого плану покращення (Remediation Plan)** у `plans/active/` згідно з правилами проекту.

---

## 🏛 1. Обов'язкова відповідність правилам проекту (`.agents/rules/`)

Під час аудиту будь-якої частини кодової бази агент **ЗОБОВ'ЯЗАНИЙ** інспектувати дотримання всіх модульних правил SmartFeed Studio:

| Правило                                                                                      | Критерії інспекції та фокус перевірки агента                                                                                                                                                                                                                                                                                                                                                                                   |
| :------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**`code_review_and_skills.md`**](rules/code_review_and_skills.md)                           | **Pre-commit Self-Review**: контроль 11 обов'язкових пунктів якості (CQRS, 4 шари валідації, розмір файлів, нуль `as any`, нуль dead code, 100% i18n, нуль сміття в БД, тайпчек, відсутність off-scheme кольорів, нуль дублюючих CTA).                                                                                                                                                                                         |
| [**`engineering_discipline_and_planning.md`**](rules/engineering_discipline_and_planning.md) | **Architecture & Scalability > Speed & Naive Simplicity**: виявлення швидких костилів та антипатернів. **Бюджет модульності**: прапорець невідповідності на будь-який файл >250–300 рядків (**Zero God-Files**). **Zero Silent Failures**: виявлення порожніх блоків `catch {}`. **Zero `as any`**. **Safe OS Exec (CWE-78)**: заборона `exec` з конкатенацією рядків. **Mutex Concurrency**: `OrganizationMutex` на квотах.   |
| [**`postgres_skills.md`**](rules/postgres_skills.md)                                         | **Бази даних & Prisma**: **100% FK Indexes** (`@@index([fkColumn])`). **100% snake_case mapping** (`@@map("snake_case")`, `@map("column_name")`). Усі часові мітки `timestamptz`. Заборона `OFFSET` пагінації. **Zero N+1** запитів. **Короткі транзакції** `$transaction` (без S3/HTTP). Первинні ключі `@default(cuid())`. Наявність GIN `pg_trgm` індексів для `ILIKE` пошуку.                                              |
| [**`design_system_and_theming.md`**](rules/design_system_and_theming.md)                     | **UI/UX Стандарти**: **100% Theme Harmony** (нуль хардкодних кольорів `purple-*`, `violet-*`, `pink-*`, `fuchsia-*`). **100% Solid Sticky Headers** (`thead.sticky.top-0` та шапки модалок мають непрозорий фон `bg-card`/`bg-background`). **Zero Duplicate Action / CTA Buttons** (приховувати тулбар-кнопки при наявності кнопки в empty state). Очищення довгих URL від параметрів. Блокування кнопок при вичерпанні квот. |
| [**`frontend_network_dedup.md`**](rules/frontend_network_dedup.md)                           | **Zero-Duplicate API Calls**: виявлення повторних або каскадних запитів. Обов'язковий захист через `useRef` (`isFetchingRef`, `lastFetchedTokenRef`). Заборона подвійного монтування `React.StrictMode` у dev. Заборона каскадних `/auth/me` одразу після логіну. Тонкі масиви залежностей `useCallback`.                                                                                                                      |
| [**`testing_and_quality.md`**](rules/testing_and_quality.md)                                 | **Тестування та якість**: **Zero Test Data Leftovers** (обов'язковий `cleanDatabase`). **Real Business Invariants**: сувора заборона фіктивних тестів; обов'язкова перевірка реальних назв сутностей (`not.toBe('Постачальник')`) та каскадного видалення. **100% i18n**. Git commit/push тільки за явною командою.                                                                                                            |
| [**`rules.md`**](rules/rules.md)                                                             | **Native vs Cloud**: ізоляція нативного клієнта (`apps/desktop` Tauri + SQLite) від хмарного API (`services/backend-api` NestJS). **100% Parity**: повний збіг логіки/даних між локальним (Mock/SQLite) та серверним режимами. **Zero Orphaned Data Policy**: обов'язковий аналіз усіх кейсів життєвого циклу, каскадне видалення зв'язаних сутностей (`ON DELETE CASCADE`).                                                   |
| [**`plans_lifecycle.md`**](rules/plans_lifecycle.md)                                         | **Життєвий цикл планів**: формування плану покращення у `plans/active/remediation_<target>.md`. Заборона передчасного внесення змін у код до узгодження плану користувачем. Переведення у `plans/completed/` лише після 100% проходження тестів.                                                                                                                                                                               |
| [**`wiki_and_documentation.md`**](rules/wiki_and_documentation.md)                           | **Синхронізація документації**: перевірка актуальності WIKI та таблиць покриття E2E тестів у `README.md` та `AGENTS.md`.                                                                                                                                                                                                                                                                                                       |
| [**`commands.md`**](rules/commands.md)                                                       | **Команди та порти**: API (`:4000`), Admin (`:3000`), Desktop (`:1420`). Заборона `browser_subagent`. Використання Playwright MCP для візуальної інспекції та перевірки Swagger UI.                                                                                                                                                                                                                                            |

---

## 🧭 2. Повний 8-етапний життєвий цикл рев'ю та аудиту

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                      ЖИТТЄВИЙ ЦИКЛ АУДИТУ AGENTS_REVIEW                                │
 └──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 1. 🔍 РОЗВІДКА ТА ВИЗНАЧЕННЯ МЕЖ АУДИТУ (RECONNAISSANCE & SCOPE)              │
    │    • Аналіз змінених файлів (git diff) або цільового доменного модуля         │
    │    • Розділення контекстів: Cloud NestJS vs Desktop Tauri SQLite, UI vs API   │
    │    • Скіли: inversion-exercise, scale-game, collision-zone-thinking           │
    │    • MCP: context7 (актуальні API docs), firecrawl (CVE, OWASP патерни)       │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 2. ⚙️ АРХІТЕКТУРНИЙ АУДИТ ТА CQRS ДЕКОМПОЗИЦІЯ                                │
    │    • Межі модулів (UsersModule чистий, зв'язок через CommandBus/QueryBus)     │
    │    • Контроль ліміту рядків: виявлення God-файлів (>250–300 рядків)           │
    │    • Спільні контракти в @smartfeed/shared (0 inline типів, 0 дублів DTO)     │
    │    • Скіли: fullstack-code-review, nestjs-best-practices, backend-patterns    │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 3. 🛡️ БЕЗПЕКОВИЙ АУДИТ ТА 4-ШАРОВИЙ ЗАХИСТ (DEFENSE-IN-DEPTH)                 │
    │    • Шар 1 (DTO class-validator), Шар 2 (Квоти/лицензії + OrganizationMutex)  │
    │    • Шар 3 (Guards/RBAC + CWE-78 execFile check), Шар 4 (Prisma FKs/Trx)      │
    │    • Пошук витоків: 0 empty catch {}, 0 as any, 0 passwordHash у відповідях    │
    │    • Скіли: defense-in-depth-validation, sentry-backend-bugs, subscription-lc │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 4. 💻 ФРОНТЕНД, UI/UX ТА МЕРЕЖЕВИЙ АУДИТ (FRONTEND & UX INSPECTION)           │
    │    • 100% Theme Harmony (нуль off-scheme кольорів: purple/violet/pink/fuchsia)│
    │    • 100% Solid Sticky Headers (thead.sticky.top-0 має solid bg-card)         │
    │    • Zero Duplicate CTAs, дедуплікація запитів (useRef guards), 100% i18n     │
    │    • MCP: Playwright MCP (live скріншоти, інспекція DOM, без browser_subagent)│
    │    • MCP: shadcn (перевірка UI компонентів через get_audit_checklist)          │
    │    • Скіли: ui-ux-pro-max, tailwind-design-system, vercel-react-best-practices│
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 5. 🐘 АУДИТ БАЗИ ДАНИХ, ІНДЕКСІВ ТА ЗАПИТІВ (POSTGRESQL & PRISMA)             │
    │    • 100% індекси на FK (@@index([fkColumn])), snake_case mapping (@@map)     │
    │    • Курсорна пагінація замість OFFSET, ліквідація N+1 запитів, timestamptz   │
    │    • Короткі транзакції $transaction (без HTTP/S3 всередині)                  │
    │    • Скіли: supabase-postgres-best-practices, prisma-client-api, postgresql-code-review│
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 6. ⚔️ ЗМАГАЛЬНИЙ СТРЕС-ТЕСТ ТА ДОКАЗ ДЕФЕКТІВ (ADVERSARIAL STRESS-TESTING)    │
    │    • 6 векторів атак: Concurrency/Races (TOCTOU), IDOR, Resource Starvation   │
    │    • ПРАВИЛО ДОКАЗУ: підтвердження бага автоматизованим тестом або тайпчеком  │
    │    • СУВОРА ЗАБОРОНА САМОВІЛЬНИХ ФІКСІВ (тільки виявлення та фіксація)        │
    │    • Скіли: adver-review, testing-anti-patterns, condition-based-waiting      │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 7. 📋 СКЛАДАННЯ ДЕТЕРМІНОВАНОГО ПЛАНУ ПОКРАЩЕННЯ (REMEDIATION PLAN)           │
    │    • Створення плану у plans/active/remediation_<target>.md                   │
    │    • Пріоритезація P0-P3, критерії готовності (DoD), архітектурні рішення     │
    │    • Скіли: writing-plans, executing-plans, simplification-cascades           │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 8. 🛡️ ФІНАЛЬНИЙ ЗВІТ АУДИТУ ТА HAND-OFF ПРОТОКОЛ                              │
    │    • Структурований звіт: Executive Summary, матриця ризиків, точні посилання │
    │    • Перевірка: tsc --noEmit, pnpm build:shared, pnpm format                  │
    │    • Передача плану розробникам на погодження користувачем                    │
    │    • Скіли: code-review-reception, requesting-code-review, verification       │
    └───────────────────────────────────────────────────────────────────────────────┘
```

---

## 📌 Етап 1: Розвідка та визначення меж аудиту (Reconnaissance & Scope)

Перш ніж аналізувати код, агент визначає точні межі та контекст перевірки.

### 🔍 Ключові дії етапу 1:

1. **Визначення області змін**:
   - Які файли модифіковано: `git status -s` або `git diff --name-only HEAD~1`.
   - Якщо проводиться системний аудит модуля — визначити всі файли доменної області (контролери, хендлери, UI, моделі Prisma).
2. **Розмежування рантаймів**:
   - Чи не потрапив код десктопного каталогу в хмарний бекенд?
   - Чи не викликає клієнт NestJS ендпоінти там, де має працювати локальний SQLite десктопу?
3. **Аналіз граничних станів**:
   - Застосувати [**`inversion-exercise`**](skills/sub-skills/inversion-exercise/SKILL.md): «Що станеться при збої мережі під час збереження?», «Де криється гонка при подвійному кліку?».
   - Застосувати [**`scale-game`**](skills/sub-skills/scale-game/SKILL.md): «Як код поведеться на 50,000 товарів, при порожній БД, при назві компанії на 500 символів?».

### 🔌 MCP інструменти етапу 1:

- **`context7`**: перевірка актуальної документації залучених бібліотек (Prisma, NestJS, BullMQ, Radix UI).
- **`firecrawl`**: дослідження відомих вразливостей (CVE, OWASP Broken Access Control, Server-Side Request Forgery).

---

## ⚙️ Етап 2: Архітектурний аудит та CQRS декомпозиція (Architecture & CQRS)

_Скіли: [fullstack-code-review](skills/sub-skills/fullstack-code-review/SKILL.md) · [nestjs-best-practices](skills/sub-skills/nestjs-best-practices/SKILL.md) · [backend-patterns](skills/sub-skills/backend-patterns/SKILL.md)_

### 📐 Чеклист архітектурного аудиту:

1. **Ізоляція модулів NestJS CQRS**:
   - `UsersModule` виконує **виключно** операції з базою даних через Prisma. Жодного імпорту JWT, Passport чи `auth.controller` у `UsersModule`.
   - `AuthModule` взаємодіє з користувачами **виключно** через `CommandBus` (`CreateUserCommand`) та `QueryBus` (`GetUserByEmailQuery`).
   - Побічні ефекти (видача ліцензій, відправка листів) запускаються через події `EventBus` (`UserCreatedEvent`).
2. **Бюджет модульності (<250–300 рядків на файл)**:
   - Перевірити розмір кожного контролера, хендлера, сервісу та компонента.
   - **Червоний прапорець**: будь-який монолітний файл на 400+ рядків фіксується як архітектурний дефект (God-File), що підлягає обов'язковій декомпозиції в плані ремедіації.
3. **Єдине джерело правди (`@smartfeed/shared`)**:
   - Усі DTO, Zod-схеми та Enums повинні імпортуватися з `@smartfeed/shared`.
   - Відсутність дублювання DTO між клієнтом та сервером, нуль анонімних inline-типів.
4. **Відсутність циклічних залежностей (Circular Dependencies)**:
   - Модулі не повинні утворювати циклічні посилання. Сервіси реєструються як `@Injectable()` сінглтони.

---

## 🛡️ Етап 3: Безпековий аудит та 4-шаровий захист (Security & 4-Layer Defense)

_Скіли: [defense-in-depth-validation](skills/sub-skills/defense-in-depth-validation/SKILL.md) · [sentry-backend-bugs](skills/sub-skills/sentry-backend-bugs/SKILL.md) · [subscription-lifecycle](skills/sub-skills/subscription-lifecycle/SKILL.md) · [backend-development](skills/sub-skills/backend-development/SKILL.md) · [api-security-best-practices](skills/sub-skills/api-security-best-practices/SKILL.md) · [better-auth-security-best-practices](skills/sub-skills/better-auth-security-best-practices/SKILL.md) · [security-best-practices](skills/sub-skills/security-best-practices/SKILL.md) · [firebase-security-rules-auditor](skills/sub-skills/firebase-security-rules-auditor/SKILL.md)_

Аудитор детально перевіряє реалізацію 4-рівневого захисту на кожному ендпоінті:

### 🛡️ Інспекція 4 шарів захисту:

1. **Шар 1 (DTO / Input Validation)**:
   - Чи кожна властивість DTO має декоратори `class-validator`?
   - Чи налаштовано `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`?
   - **Дефект**: нетипізований `@Body() body: unknown` або DTO без валідаторів (призводить до тихого видалення полів пайпом).
2. **Шар 2 (Доменні правила, квоти та м'ютекси)**:
   - Чи перевіряються ліміти підписки організації (seats, SKU, AI credits, S3 storage)?
   - Чи захищені чутливі операції мутацій від **TOCTOU race conditions** за допомогою `OrganizationMutex.runExclusive(...)`?
3. **Шар 3 (Guards, RBAC & Tenant Scoping)**:
   - Наявність `@UseGuards(JwtAuthGuard, RolesGuard, RequireActiveLicenseGuard)`.
   - **IDOR / Tenant Isolation**: чи перевіряється, що `resource.organizationId === user.organizationId`? Користувач однієї компанії не має права читати чи змінювати ресурси іншої.
   - **CWE-78 Command Injection**: перевірка викликів зовнішніх процесів. Тільки `execFile(binary, [args], { shell: false })`. Використання `exec` з конкатенацією рядків — критична вразливість P0!
   - Безпека паролів: тільки Argon2id або bcrypt. Жодного plain-text або MD5/SHA1.
4. **API Security аудит ([api-security-best-practices](skills/sub-skills/api-security-best-practices/SKILL.md))**:
   - Перевірка JWT контракту: фіксований алгоритм, issuer, audience, заборона вибору алгоритму від клієнта.
   - Авторизація на рівні ресурсу та тенанту (не лише рольова).
   - Zod/class-validator валідація тіла запиту (заборона `12abc` як ID 12).
   - Rate limiting з правильною IP-ключом (IPv6-aware), атомарний counter+expiration.
   - Захист від SSRF, DNS rebinding, file upload вразливостей.
5. **Auth безпека ([better-auth-security-best-practices](skills/sub-skills/better-auth-security-best-practices/SKILL.md))**:
   - Секрети не коротші 32 символів з ентропією ≥120 біт.
   - CSRF захист, trusted origins, безпечна конфігурація cookies та сесій.
   - Шифрування OAuth токенів, audit logging.
6. **Загальний безпековий рев'ю ([security-best-practices](skills/sub-skills/security-best-practices/SKILL.md))**:
   - Мовно-специфічний аудит для TypeScript/NestJS та React за документами з `references/`.
   - Генерація повного security report з пріоритезацією за севериті.
7. **Шар 4 (Database & Sentry Bug Prevention)**:
   - **Zero Silent Failures**: пошук порожніх блоків `catch {}`. Кожен блок зобов'язаний містити структурований лог або викидати доменний HTTP виняток.
   - **Zero `as any`**: пошук приведень до `any`, особливо у `where` блоках Prisma.
   - **Null checks на зв'язках**: захист від `TypeError: Cannot read property of null` на зв'язаних сутностях (`user.organization?.name`).
   - Відсутність витоку секретів: поле `passwordHash` ніколи не повинно повертатися у відповідях API (використання `@Exclude()` або явних маперів).

---

## 💻 Етап 4: Фронтенд, UI/UX та мережевий аудит (Frontend, UI/UX & Network)

_Скіли: [ui-ux-pro-max](skills/sub-skills/ui-ux-pro-max/SKILL.md) · [tailwind-design-system](skills/sub-skills/tailwind-design-system/SKILL.md) · [vercel-react-best-practices](skills/sub-skills/vercel-react-best-practices/SKILL.md) · [web-design-guidelines](skills/sub-skills/web-design-guidelines/SKILL.md) · [integrate-backend](skills/sub-skills/integrate-backend/SKILL.md)_

### 🎨 Чеклист UI/UX та продуктивності:

1. **100% Theme Harmony & Заборона Off-Scheme кольорів ([design_system_and_theming.md](rules/design_system_and_theming.md))**:
   - Повний пошук захардкодженних кольорів:
     ```bash
     grep -rnE "purple-|violet-|fuchsia-|pink-" apps/
     ```
   - Усі кольори мають використовувати семантичні токени теми (`primary`, `card`, `background`, `border`, `muted`).
2. **100% Solid Sticky Headers**:
   - Шапки таблиць (`thead.sticky.top-0`), тулбари та заголовки модальних вікон повинні мати **100% непрозорий solid-фон** (`bg-card`, `bg-background`).
   - Напівпрозорі `bg-card/40`, `bg-background/50` — блокуючий візуальний дефект.
3. **Zero Duplicate Action / CTA Buttons**:
   - Якщо на порожньому екрані картка empty-state містить кнопку дії, кнопка у верхньому тулбарі **повинна приховуватися**.
4. **Zero-Duplicate Network Calls ([frontend_network_dedup.md](rules/frontend_network_dedup.md))**:
   - Захист провайдерів та хуків вибірки даних через `useRef` (`isFetchingRef`, `lastFetchedTokenRef`).
   - Відсутність подвійного виклику `/auth/me` одразу після логіну.
   - Відсутність UI-стейту (`isUk`, `theme`) у масивах залежностей `useCallback` для мережевих запитів.
5. **100% Bilingual i18n & Повна локалізація ([testing_and_quality.md](rules/testing_and_quality.md))**:
   - Пошук захардкодженних рядків та перевірка наявності ключів в `locales/uk/*.json` і `locales/en/*.json`.
   - Перевірка HTML-атрибутів `title={t('...')}` та `aria-label={t('...')}`.
   - Мапінг помилок бекенду через `getErrorMessage(err, t)`.
6. **Інспекція через Playwright MCP**:
   - Візуальна оцінка живого інтерфейсу (`browser_navigate`, `browser_take_screenshot`).
   - 🛑 **Заборона `browser_subagent`**: тільки прямі виклики інструментів Playwright MCP.

---

## 🐘 Етап 5: Аудит бази даних, індексів та запитів (Database & Prisma)

_Скіли: [supabase-postgres-best-practices](skills/sub-skills/supabase-postgres-best-practices/SKILL.md) · [prisma-client-api](skills/sub-skills/prisma-client-api/SKILL.md) · [prisma-postgres](skills/sub-skills/prisma-postgres/SKILL.md) · [postgresql-optimization](skills/sub-skills/postgresql-optimization/SKILL.md) · [postgresql-code-review](skills/sub-skills/postgresql-code-review/SKILL.md)_

### 🐘 Чеклист інспекції PostgreSQL & Prisma ([postgres_skills.md](rules/postgres_skills.md)):

1. **100% Foreign Key Indexes**:
   - Кожне поле foreign key у моделях `schema.prisma` зобов'язане мати явний індекс `@@index([fkColumn])`.
2. **Snake_case Mapping**:
   - Усі моделі мають `@@map("snake_case")`, усі колонки `@map("column_name")`.
3. **Часові мітки**:
   - Усі поля дат `DateTime` мають мапитися на `timestamptz`.
4. **Продуктивність запитів**:
   - Заборона `OFFSET` пагінації для великих каталогів товарів — обов'язкова курсорна пагінація (`WHERE createdAt < cursor LIMIT N`).
   - **Zero N+1**: ліквідація циклічних звернень до БД всередині масивів (використання batch `findMany({ where: { id: { in: ids } } })` або `include`).
   - Текстовий пошук `ILIKE`: наявність індексів `GIN` з розширенням `pg_trgm`.
5. **Транзакційна гігієна**:
   - Блоки `$transaction()` повинні бути максимально короткими і містити **виключно** операції з БД. Заборонено виклики зовнішніх API, відправку пошти чи генерацію S3 URL всередині транзакцій.
6. **Розширена оптимізація PostgreSQL ([postgresql-optimization](skills/sub-skills/postgresql-optimization/SKILL.md))**:
   - JSONB операції з GIN індексами для збереження метаданих.
   - Масиви PostgreSQL, віконні функції (аналітика, агрегації).
   - Повнотекстовий пошук `tsvector`/`tsquery`.
   - Partitioning, materialized views, моніторинг та профілювання запитів.
7. **Спеціалізований PostgreSQL Code Review ([postgresql-code-review](skills/sub-skills/postgresql-code-review/SKILL.md))**:
   - **JSONB Best Practices**: індексація JSONB через GIN (`(data->'status')`), запити через containment-оператори `@>`, CHECK-констрейнти на структуру JSONB.
   - **Операції з масивами**: GIN індекси на масиви, оператори `@>`, заборона неефективної конкатенації масивів у циклах.
   - **Дизайн типів та схеми**: `CITEXT` для case-insensitive полів (email), `TIMESTAMPTZ` для дат, `ENUM` типи замість вільних рядків `VARCHAR`, кастомні `DOMAIN` з валідацією.
   - **Оптимізація функцій та тригерів**: виконання тригерів тільки при змінах `WHEN (OLD.* IS DISTINCT FROM NEW.*)`, усунення повільних функцій у PL/pgSQL.
   - **Безпека та RLS**: Row Level Security (`ENABLE ROW LEVEL SECURITY`) для ізоляції чутливих таблиць, гранулярні привілеї замість надлишкових прав.

---

## ⚔️ Етап 6: Змагальний стрес-тест та доказ дефектів (Adversarial Testing)

_Скіл: [adver-review](skills/sub-skills/adver-review/SKILL.md) · [api-security-testing](skills/sub-skills/api-security-testing/SKILL.md)_

Аудитор діє за принципом **«код вважається дефектним, доки не доведено протилежне»**.

### 🛑 4 залізні закони змагального рев'юера:

1. **Zero Fixes (Сувора заборона виправлення)**:
   - Аудитор **НІКОЛИ НЕ правитиме продакшн-код** під час аудиту.
   - Мета — виявити дефект, довести його існування та скласти план виправлення.
2. **Proof by Automated Test (Доказ падаючим тестом)**:
   - Будь-яка виявлена критична вразливість, гонка чи баг граничного стану повинна бути підтверджена:
     - Або автоматизованим тестом, який зараз **ПАДАЄ (RED)** (`test/adversarial/<target>.adversarial-spec.ts`).
     - Або відтворюваною командою компілятора (`tsc --noEmit`), лінтера чи викликом API.
   - Теоретичні та голослівні зауваження без фактів суворо заборонені.
3. **Zero Test Leftovers**:
   - Усі створені стрес-тести зобов'язані використовувати `cleanDatabase` у `beforeAll` та `afterAll`.
4. **6 векторів атаки**:
   - **Vector A: Concurrency & Races**: паралельний шторм запитів для обходу квот ліцензій.
   - **Vector B: Fuzzing & Boundaries**: негативні числа, переповнення лімітів SKU, неочікувані `null`.
   - **Vector C: Auth & Tenant IDOR**: спроба користувача компанії А змінити сутності компанії Б.
   - **Vector D: State Lifecycle**: переривання операцій на середині кроку, витоки незбережених стейтів.
   - **Vector E: Resource Starvation**: важкі неіндексовані вибірки, вичерпання пулу з'єднань БД.
   - **Vector F: Frontend Fragility**: переривання запитів, швидкі подвійні кліки, відсутність обробки помилок.
5. **API Security Testing ([api-security-testing](skills/sub-skills/api-security-testing/SKILL.md))**:
   - Перевірка вразливостей за OWASP API Security Top 10 (2023): BOLA/IDOR, mass assignment, SSRF, broken function-level auth.
   - Тестування з двома наборами креденшелів (різні тенанти) для доведення IDOR.
   - ID tampering, excessive data exposure, обхід rate limits.

---

## 📋 Етап 7: Складання детермінованого плану покращення (Remediation Plan)

_Скіли: [writing-plans](skills/sub-skills/writing-plans/SKILL.md) · [executing-plans](skills/sub-skills/executing-plans/SKILL.md) · [simplification-cascades](skills/sub-skills/simplification-cascades/SKILL.md)_

За результатами аудиту агент формує системний план у відповідності до [plans_lifecycle.md](rules/plans_lifecycle.md).

### 📁 Структура плану ремедіації:

Файл плану створюється за шляхом:  
`plans/active/remediation_<feature_or_module_name>.md`

### 📐 Обов'язкові розділи плану:

1. **Мета та діагностика**: стислий опис виявлених дефектів із посиланнями на файли та рядки коду.
2. **Матриця пріоритетів**:
   - 🔴 **P0 (Блокуючі / Критичні)**: безпекові діри (CWE-78, IDOR), гонки даних (TOCTOU), витоки паролів.
   - 🟠 **P1 (Високі)**: порушення CQRS меж, God-файли (>300 рядків), N+1 запити, відсутність FK індексів.
   - 🟡 **P2 (Середні)**: off-scheme кольори, напівпрозорі sticky headers, дублюючі CTA, неповний i18n.
   - 🟢 **P3 (Низькі)**: рефакторинг констант, мікрооптимізація селекторів, документація.
3. **Покрокові завдання реалізації**:
   - Кожне завдання містить: точний файл для зміни, опис зміни, контракт DTO/інтерфейсу, критерії готовності (DoD).
   - Бюджет модульності: декомпозиція великих файлів одразу прописується у плані.
4. **Критерії верифікації (Verification Gates)**:
   - Список тестів, які мають пройти (100% pass).
   - Команди перевірки типів та форматування.

---

## 🛡️ Етап 8: Фінальний звіт аудиту та Hand-off протокол (Audit Report)

_Скіли: [code-review-reception](skills/sub-skills/code-review-reception/SKILL.md) · [requesting-code-review](skills/sub-skills/requesting-code-review/SKILL.md) · [verification-before-completion](skills/sub-skills/verification-before-completion/SKILL.md)_

Після завершення аудиту та збереження плану агент презентує користувачу фінальний звіт:

### 📊 Структура фінальної відповіді:

1. **Executive Summary**: загальна оцінка кодової бази (архітектурна зрілість, рівень ризику).
2. **Ключові знахідки за категоріями**:
   - Безпека & 4-шаровий захист
   - Архітектура & God-файли
   - База даних & Продуктивність
   - UI/UX & Дизайн-система
3. **Посилання на створений план покращення**:
   - Посилання на створений артефакт `plans/active/remediation_<target>.md`.
4. **Запит схвалення користувача**:
   - Агент зупиняється і запитує згоду користувача на перехід до виконання плану (`agents_backend` або `agents_frontend`).

---

## 🧰 Зведена таблиця використання інструментів аудиту за етапами

| Етап                       | Ключові скіли                                                                                                                 | MCP інструменти                    | Артефакти та дії                                  |
| :------------------------- | :---------------------------------------------------------------------------------------------------------------------------- | :--------------------------------- | :------------------------------------------------ |
| **1. Розвідка меж**        | `inversion-exercise`, `scale-game`, `collision-zone-thinking`, `preserving-productive-tensions`, `tracing-knowledge-lineages` | `context7`, `firecrawl`            | Визначення target files, git diff                 |
| **2. Архітектурний аудит** | `fullstack-code-review`, `nestjs-best-practices`                                                                              | `context7`                         | Перевірка меж CQRS, ліміту <250 рядків            |
| **3. Безпека & 4 шари**    | `defense-in-depth`, `sentry-backend-bugs`, `api-security-bp`, `better-auth-security-bp`, `security-bp`                        | `firecrawl` (OWASP)                | Пошук CWE-78, IDOR, TOCTOU, 0 any, 0 empty catch  |
| **4. Фронтенд & UX**       | `ui-ux-pro-max`, `tailwind-design-system`, `vercel-react`, `security-best-practices`                                          | `playwright` (MCP), `shadcn` (MCP) | Sticky headers, Theme tokens, Zero dups, i18n     |
| **5. БД & Prisma**         | `supabase-postgres-best-practices`, `prisma-client-api`, `postgresql-optimization`                                            | `context7` (Prisma)                | 100% FK індекси, snake_case @@map, 0 N+1, timestz |
| **6. Стрес-тест (Adver)**  | `adver-review`, `api-security-testing`, `testing-anti-patterns`                                                               | —                                  | Написання падаючих тестів-доказів (RED)           |
| **7. План покращення**     | `writing-plans`, `executing-plans`, `simplification-cascades`                                                                 | —                                  | Генерація `plans/active/remediation_*.md`         |
| **8. Фінальний звіт**      | `code-review-reception`, `requesting-code-review`, `verification`                                                             | —                                  | Звіт користувачу та очікування команди на старт   |
