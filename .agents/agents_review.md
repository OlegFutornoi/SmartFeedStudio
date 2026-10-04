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

## 🚦 Етап 0 (обов'язковий): Router, Реєстр уроків і Карта проєкту

Перед Етапом 1 агент **зобов'язаний**:

0. Якщо існує `plans/active/<task>.state.md` — почати з нього ([`session-handoff`](skills/sub-skills/session-handoff/SKILL.md)); наприкінці сесії/перед компакцією — оновити його.
1. Прочитати [`task-router`](skills/sub-skills/task-router/SKILL.md) і обрати мінімальний набір скілів.
2. Прогнати код через **усі** інваріанти з [`lessons-learned-registry`](skills/sub-skills/lessons-learned-registry/references/registry.md) — це готовий чеклист повторних помилок.
3. Орієнтуватись за [`project-context-map`](skills/sub-skills/project-context-map/references/map.md).
4. Кожну нову знахідку, якої немає в реєстрі, — записати в реєстр і закріпити через [`automated-guardrails-ci`](skills/sub-skills/automated-guardrails-ci/SKILL.md).

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

## 🧰 9. Операційна матриця всіх підскілів аудитора (Що, Коли, В яких випадках)

| Підскіл                                                      | Що робить (Функціонал)                                                              | Коли активується (Фаза/Тригер)     | В яких конкретних випадках застосовується                                                                |
| :----------------------------------------------------------- | :---------------------------------------------------------------------------------- | :--------------------------------- | :------------------------------------------------------------------------------------------------------- |
| **`fullstack-code-review`**                                  | Головний оркестратор комплексного аудиту кодової бази                               | Етап 2, 8; будь-який аудит         | Перевірка CQRS меж, реактивності React, схеми PostgreSQL, 100% i18n, тестової ізоляції.                  |
| **`adver-review`**                                           | Змагальний стрес-тест (adversarial review), пошук дір безпеки                       | Етап 6; доведення дефектів         | Симуляція гонок потоків (TOCTOU), спроб обходу квот, підробки tenantId, ресурсної задухи.                |
| **`requesting-code-review`**                                 | Контроль чек-листів та дисципліни підготовки рев'ю                                  | Етап 8; здача аудиту               | Перевірка повноти самоінспекції інженерів перед передачею коду користувачу.                              |
| **`code-review-reception`**                                  | Протокол прийняття критики: технічна строгість, нуль сліпої згоди                   | Етап 8; обговорення                | Верифікація зауважень фактами з коду, виключення поверхневих та неперевірених правок.                    |
| **`verification-before-completion`**                         | Залізний гейт перевірки: тайпчек, збірка shared, прогін тестів                      | Етап 8; фіналізація                | Запуск `tsc --noEmit` по всіх пакетах, `pnpm build:shared`, підтвердження нульового ризику.              |
| **`api-security-best-practices`**                            | Аудит за стандартом OWASP API Security Top 10                                       | Етап 3; аудит ендпоінтів           | Перевірка захисту від SSRF при завантаженні фідів за URL, фіксація алгоритмів JWT.                       |
| **`better-auth-security-best-practices`**                    | Аудит конфігурацій аутентифікації, ентропії ключів та сесій                         | Етап 3; безпека сесій              | Перевірка безпеки зберігання секретів (≥120 біт), налаштувань CORS, CSRF, cookie flags.                  |
| **`api-security-testing`**                                   | Тестування API на вразливості через автоматизовані сценарії                         | Етап 6; стрес-тести                | Спроба звичайного користувача виконати операції тарифів або змінити чужу організацію.                    |
| **`firebase-security-rules-auditor`**                        | Аудит політик доступу до хмарних сховищ                                             | Етап 3; безпека сховища            | Перевірка прав presigned URL у `StorageModule`, захист приватних зліпків фідів у S3.                     |
| **`security-best-practices`**                                | Фреймворк-специфічний аудит NestJS/TypeScript, нуль CWE-78                          | Етап 3, 5; безпека коду            | Виявлення небезпечних викликів `child_process.exec`, вимагання `execFile` з масивом аргументів.          |
| **`defense-in-depth-validation`**                            | Контроль наявності 4 рівнів перевірки в кожній мутації                              | Етап 3; захист даних               | Перевірка наявності DTO валідаторів, лімітів підписки, RBAC гуардів та DB FK констрейнтів.               |
| **`contract-first-api`**                                     | Аудит єдиних Zod/DTO контрактів у `@smartfeed/shared`, нуль дрифту API              | Етап 2, 3; контракти та API        | Перевірка повної типізації клієнт-сервер, відсутності ad-hoc inline DTO та breaking changes.             |
| **`streaming-large-feeds`**                                  | Аудит безпеки стрімів великих фідів (100k+ SKU), backpressure та захисту від OOM    | Етап 3, 5; стрімінг та парсинг     | Перевірка відсутності читання всього XML в RAM, наявності `pause/resume` та безпечного `pipeline`.       |
| **`idempotency-and-outbox`**                                 | Аудит ідемпотентності мутацій, Transactional Outbox та ізоляції в BullMQ DLQ        | Етап 3, 5; надійність та черги     | Перевірка заборони викликів черг всередині `$transaction`, наявності `idempotencyKey` та DLQ.            |
| **`sentry-backend-bugs`**                                    | Пошук прихованих рантайм-пасток за реальними інцидентами                            | Етап 3; стабільність бекенду       | Виявлення пропущених `await`, неперевірених null-зв'язків, витоків пам'яті у стрімах фідів.              |
| **`subscription-lifecycle`**                                 | Контроль бізнес-правил тарифних планів та квот організацій                          | Етап 3; бізнес-логіка              | Перевірка блокування створення товарів понад ліміт тарифу, grace-періодів, даунгрейдів.                  |
| **`supabase-postgres-best-practices`**                       | Аудит схеми PostgreSQL: 100% FK індекси, snake_case, timestamptz                    | Етап 5; аудит БД                   | Виявлення відсутніх індексів на зовнішніх ключах, OFFSET пагінації, N+1 запитів.                         |
| **`neon-postgres`**                                          | Аудит serverless-параметрів Postgres, пулів з'єднань, пошуку                        | Етап 5; інфраструктура БД          | Перевірка налаштування триграмного пошуку `pg_trgm`, індексів GIN, зв'язку з `pgvector`.                 |
| **`prisma-client-api`**                                      | Аудит запитів Prisma: виявлення `as any`, небезпечних вибірок                       | Етап 5; ORM аудит                  | Пошук `where: { ... } as any`, контроль ізоляції та транзакційної безпеки `$transaction`.                |
| **`prisma-cli`**                                             | Контроль стану міграцій, генерації клієнта та сідінгу                               | Етап 5; міграції БД                | Перевірка актуальності `schema.prisma` та чистоти накачування міграцій без дрифту.                       |
| **`db-migrations-zero-downtime`**                            | Аудит Zero-Downtime міграцій: Expand/Contract, `lock_timeout`, online backfill      | Етап 5; безпека міграцій           | Захист від блокувань `AccessExclusiveLock`, перевірка `CREATE INDEX CONCURRENTLY` та dual-write.         |
| **`prisma-postgres`**                                        | Аудит конфігурації адаптера `@prisma/adapter-pg` та пулу `pg.Pool`                  | Етап 5; пул БД                     | Запобігання вичерпанню пулу з'єднань під час паралельної обробки черг BullMQ.                            |
| **`prisma-upgrade-v7`**                                      | Аудит сумісності з Prisma v7, перевірка конфігурації                                | При зміні версій ORM               | Контроль сумісності конфігураційного файлу `prisma.config.ts` та адаптерів.                              |
| **`prisma-compute`**                                         | Контроль параметрів розгортання та хостингу сервісів з Prisma                       | Етап 5; хмарний деплой             | Перевірка коректності конфігурацій хмарного середовища виконання.                                        |
| **`postgresql-optimization`**                                | Аудит використання розширених можливостей PostgreSQL                                | Етап 5; оптимізація швидкодії      | Перевірка індексації JSONB через GIN, віконних функцій, партиціонування каталогів.                       |
| **`postgresql-code-review`**                                 | Експертна перевірка SQL-запитів, CHECK констрейнтів, тригерів                       | Етап 5; рев'ю бази даних           | Перевірка наявності `ON DELETE CASCADE` для запобігання осиротілим товарам при видаленні фідів.          |
| **`ui-ux-pro-max`**                                          | Контроль преміального UI: 100% Solid Sticky Headers, нуль дублів CTA                | Етап 4; аудит інтерфейсу           | Перевірка непрозорості шапок таблиць, приховування тулбар-кнопок при empty state, шрифтів.               |
| **`tailwind-design-system`**                                 | Контроль гармонії тем: 100% семантичні токени, нуль off-scheme кольорів             | Етап 4; дизайн-система             | Пошук хардкодних `purple-*`, `violet-*`, `pink-*`, перевірка адаптації під темну тему.                   |
| **`web-design-guidelines`**                                  | Аудит Web Interface Guidelines: a11y, tabular-nums, видимий фокус                   | Етап 4; доступність                | Перевірка наявності `aria-label` на кнопках-іконках, `tabular-nums` для цін та артикулів.                |
| **`modern-web-guidance`**                                    | Перевірка використання сучасних веб-стандартів замість костилів                     | Етап 4; стандарти вебу             | Контроль використання семантичних тегів HTML5, відсутності застарілих JS-поліфілів.                      |
| **`vercel-react-best-practices`**                            | Аудит продуктивності React: усунення зайвих ререндерів                              | Етап 4; продуктивність UI          | Перевірка відсутності подвійного монтування `React.StrictMode`, чистоти масивів `useCallback`.           |
| **`vercel-composition-patterns`**                            | Контроль масштабованої композиції React компонентів                                 | Етап 2, 4; архітектура UI          | Виявлення компонентів із пропс-пеклом (>15 пропсів), вимога Compound Components.                         |
| **`design-taste-frontend`** & **`design-taste-frontend-v1`** | Оцінка естетичної якості, типографіки та балансу інтерфейсу                         | Етап 4; візуальний аудит           | Виявлення "дефолтного AI вигляду", перевірка контрастності та ієрархії шрифтів.                          |
| **`beautiful-design`** & **`frontend-design`**               | Контроль WOW-ефекту, мікроанімацій та візуальної гармонії                           | Етап 4; полірування UI             | Перевірка плавності переходів, м'яких тіней, відсутності різких стрибків елементів.                      |
| **`tauri-v2-security-and-ipc`**                              | Аудит безпеки Tauri v2: Capabilities, IPC scopes, OS Keychain, SQLCipher            | Етап 3, 4; безпека десктопу        | Перевірка захисту від Path Traversal (`canonicalize`), зберігання токенів у Keychain, валідація IPC.     |
| **`emil-design-eng`**                                        | Аудит мікро-взаємодій, тактильного відгуку та оптимістичного UI                     | Етап 4; деталі взаємодії           | Перевірка плавності розкриття акордеонів, модалок, реакції кнопок на натискання.                         |
| **`canvas-design`**                                          | Аудит 2D Canvas компонентів для генерації графіки та бейджів                        | Етап 4; графіка                    | Контроль продуктивності рендерингу графіків цін та товарних прев'ю.                                      |
| **`image`**                                                  | Аудит графічних ресурсів: формати, стиснення WebP, адаптивність                     | Етап 4; медіа-аудит                | Перевірка оптимізації ілюстрацій та заглушок відсутніх фото товарів.                                     |
| **`brainstorming-ideas-into-designs`**                       | Аналіз повноти перетворення бізнес-ідеї на інженерні специфікації                   | Етап 1, 7; оцінка концепцій        | Перевірка відповідності реалізованого рішення первинній ідеї користувача.                                |
| **`webapp-testing`**                                         | Інтерактивна верифікація веб-інтерфейсу через Playwright                            | Етап 4, 6; живий аудит             | Візуальна перевірка сторінок через Playwright MCP без потреби у `browser_subagent`.                      |
| **`visual-regression-testing`**                              | Аудит візуальної регресії: Playwright snapshots, 100% Solid Sticky Headers          | Етап 4, 6; візуальний аудит        | Перевірка непрозорості шапок таблиць під час скролу, гармонія темної теми, заморозка анімацій.           |
| **`accessibility-testing`**                                  | Аудит доступності a11y (WCAG 2.1 AA): контраст (≥4.5:1), Tab-фокус, ARIA семантика  | Етап 4, 6; a11y аудит              | Перевірка `axe-core` звітів, відсутності фокус-пасток, наявності `aria-label` для кнопок-іконок.         |
| **`performance-budget`**                                     | Аудит бюджетів швидкодії: розмір JS (<200KB), час TTI/LCP, швидкість SAX-імпорту    | Етап 2, 4, 6; аудит продуктивності | Виявлення важких бібліотек у бандлі, перевірка чанкінгу, ліміти RAM (<512MB) воркерів імпорту.           |
| **`test-driven-development`**                                | Контроль циклу розробки через тестування (RED/GREEN)                                | Етап 6; культура тестів            | Перевірка наявності падаючого тесту-доказу перед фіксацією знайденого дефекту.                           |
| **`mock-real-parity-testing`**                               | Аудит 100% паритету між Mock/SQLite даними та реальним бекенд сервером              | Етап 4, 6; паритет середовищ       | Виявлення витоку технічних назв колонок, розходжень у лічильниках чи каскадному видаленні.               |
| **`seed-and-fixtures-factory`**                              | Аудит фабрик тестових даних, чистоти фікстур та наявності авто-teardown             | Етап 4, 6; якість фікстур          | Перевірка наявності `cleanDatabase` у тестах, відсутності захардкоджених ID, паритету генераторів фідів. |
| **`e2e-scenario-matrix`**                                    | Аудит тестового покриття за 4D матрицею (Сутність × Дія × Режим × Мова)             | Етап 6; повнота тестів             | Виявлення неперевірених операцій, відсутності тестів каскадного видалення або другої локалі.             |
| **`testing-anti-patterns`**                                  | Виявлення фіктивних тестів: заборона тестування моків, перевірка очищення БД        | Етап 6; якість тестів              | Перевірка наявності `cleanDatabase` у тестах та заборони витоку тестових даних.                          |
| **`property-based-and-mutation-testing`**                    | Аудит мутаційної стійкості тестів (Stryker) та фаззингу парсерів (`fast-check`)     | Етап 6; глибина тестів             | Перевірка, що мутанти в бізнес-логіці знищуються, а парсери витримують битий XML/CSV.                    |
| **`condition-based-waiting`**                                | Пошук довільних таймаутів `sleep()` в тестах                                        | Етап 6; аудит тестів               | Вимога заміни штучних затримок на `waitForResponse` або `expect.poll`.                                   |
| **`session-handoff`**                                        | Аудит наявності та актуальності `plans/active/<task>.state.md`                      | Етап 0, 8; збереження стану        | Контроль фіксації прогресу та інваріантів перед завершенням сесій та компакцією.                         |
| **`systematic-debugging`** & **`root-cause-tracing`**        | Методологія розслідування дефектів та доведення причин збоїв                        | Етап 6; трейсинг багів             | Пошук точного джерела виникнення помилки замість поверхневого маскування симптому.                       |
| **`observability-opentelemetry`**                            | Аудит наскрізної спостережуваності: W3C traceparent, Pino JSON логи, Sentry зв'язок | Етап 3, 6; аудит трейсингу         | Перевірка прокидання traceId від UI через BullMQ до БД, відсутність відкритих паролів у логах.           |
| **`when-stuck-problem-solving-dispatch`**                    | Допомога при розборі складних незрозумілих системних багів                          | Етап 6; складні дефекти            | Вибір оптимальної стратегії розслідування при взаємних блокуваннях чи збоях компіляції.                  |
| **`inversion-exercise`**                                     | Аналіз від зворотного: «Де система зламається в першу чергу?»                       | Етап 1; стрес-моделювання          | Пошук небезпечних припущень розробників (наприклад, що мережа завжди стабільна).                         |
| **`scale-game`**                                             | Стрес-тестування на масштабі: 0, 1, 50,000 елементів                                | Етап 1, 6; масштабованість         | Перевірка поведінки системи при гігабайтних фідах або падінні бази даних.                                |
| **`collision-zone-thinking`**                                | Аудит меж: нативний SQLite десктопу проти хмарного NestJS API                       | Етап 1, 2; межі систем             | Контроль ізоляції локальних операцій товарного каталогу від серверного API.                              |
| **`simplification-cascades`**                                | Архітектурне спрощення надлишково складних конструкцій                              | Етап 2, 7; рефакторинг             | Рекомендація спрощення архітектури замість підтримки зайвих проміжних сервісів.                          |
| **`meta-pattern-recognition`**                               | Виявлення крос-системних архітектурних антипатернів                                 | Етап 2; аналіз патернів            | Пошук повторюваних дефектів у різних модулях для системного усунення.                                    |
| **`preserving-productive-tensions`**                         | Збереження цінних архітектурних вимог при пошуку рішень                             | Етап 1, 7; вирішення конфліктів    | Знаходження балансу між суворою безпекою та швидкістю обробки каталогів.                                 |
| **`tracing-knowledge-lineages`**                             | Відстеження еволюції архітектурних правил та уникнення старих помилок               | Етап 1; історія рішень             | Розуміння історичних причин введення правил (наприклад, заборони relative imports).                      |
| **`remembering-conversations`**                              | Пошук попередніх рішень та затверджених вимог користувача                           | Етап 1; контекст                   | Перевірка коду на відповідність раніше домовленим стандартам та правилам проекту.                        |
| **`writing-plans`** & **`executing-plans`**                  | Формування детермінованого плану виправлень у `plans/active/`                       | Етап 7; планування фіксів          | Складання `plans/active/remediation_<target>.md` з критеріями DoD та пріоритетами P0-P3.                 |
| **`invariant-checklist-generator`**                          | Контроль виконання всіх сформульованих інваріантів перед апрувом задачі             | Етап 5, 8; верифікація якості      | Перевірка наявності доказів за всіма пунктами INV-N (каскади, лічильники, імпорти `@/`, i18n).           |
| **`subagent-driven-development`**                            | Планування виконання виправлень через спеціалізованих субагентів                    | Етап 7; організація робіт          | Декомпозиція виправлень на незалежні задачі для бекенд- та фронтенд-агентів.                             |
| **`dispatching-parallel-agents`**                            | Одночасний аудит незалежних модулів монорепозиторію                                 | Етап 1; паралельний аудит          | Конкурентний аудит безпеки бекенду та доступності UI адмін-порталу.                                      |
| **`typescript-advanced-types`**                              | Аудит якості типів: виявлення `any`, небезпечних приведень `as`                     | Етап 2; строгість типізації        | Вимога заміни `any` на узагальнені типи Generics або Type Guards.                                        |
| **`turborepo`**                                              | Аудит налаштувань монорепозиторію, кешування та графів залежностей                  | Етап 2; монорепо                   | Перевірка коректності конфігурації `turbo.json` та зв'язків між пакетами.                                |
| **`using-git-worktrees`**                                    | Використання ізольованих worktree для перевірки коду без зміни робочого стану       | Етап 1; безпечна інспекція         | Запуск аудиту підозрілої гілки в окремому ізольованому робочому каталозі.                                |
| **`finishing-a-development-branch`**                         | Контроль правильності завершення гілок та чистоти історії Git                       | Етап 8; реліз-контроль             | Перевірка тегів SemVer, відсутності брудних комітів та дотримання Conventional Commits.                  |
| **`release-and-rollback`**                                   | Аудит процедур релізу (SemVer), верифікація пост-деплойного smoke та плану Rollback | Етап 8; аудит релізів              | Контроль зворотної сумісності БД (Expand/Contract), перевірка готовності плану відкату без втрати даних. |
| **`firecrawl-parse`**                                        | Дослідження структури сторонніх сайтів та документації                              | Етап 1; дослідження                | Перевірка відповідності API-клієнтів офіційній документації зовнішніх систем.                            |
| **`ai-sdk`**                                                 | Аудит інтеграції та безпеки використання Vercel AI SDK                              | Етап 3; безпека AI                 | Перевірка відсутності витоку конфіденційних даних у системні промпти LLM.                                |

---

## 🧬 10. Контур самопрокачування та еволюції аудитора через skill-creator (Audit & Rule Synthesis Protocol)

Коли аудитор під час інспекції виявляє новий клас системних дефектів, антипатерн архітектури або повторювану помилку команди, **яких ще немає в правилах чи підскілах**, він зобов'язаний ініціювати процес самопрокачування екосистеми:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │           КОНТУР САМОПРОКАЧУВАННЯ ТА ЕВОЛЮЦІЇ АУДИТОРА (SELF-EVOLUTION LOOP)           │
 └──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 1. ДЕТЕКЦІЯ: ВИЯВЛЕННЯ СИСТЕМНОГО ДЕФЕКТУ АБО АНТИПАТЕРНУ                     │
    │    • Повторювана помилка в кількох модулях (наприклад, неповне видалення в БД)│
    │    • Порушення правил імпортів чи декомпозиції (моноліти >300 рядків)         │
    │    • Новий клас вразливостей (SSRF, гонки квот, витоки пам'яті стрімів)       │
    │    • Нові вимоги користувача до якості чи поведінки агентів                   │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 2. СИНТЕЗ ПРАВИЛА ТА КОРІННОЇ ПРИЧИНИ (ROOT CAUSE SYNTHESIS)                   │
    │    • Скіли: root-cause-tracing, systematic-debugging, inversion-exercise      │
    │    • Чому жоден з наявних чеклистів не заблокував цей брак?                   │
    │    • Яку архітектурну або тестову перевірку потрібно додати в інваріанти?     │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 3. КОДИФІКАЦІЯ ЧЕРЕЗ SKILL-CREATOR & WRITING-SKILLS                           │
    │    • Якщо дефект специфічний для домену:                                      │
    │      -> Оновити підскіл у .agents/skills/sub-skills/<skill>/                  │
    │      -> Або створити новий спеціалізований підскіл через skill-creator        │
    │      -> Створити валідний відносний симлінк у .claude/skills/                 │
    │    • Якщо правило фундаментальне:                                             │
    │      -> Додати новий пункт у відповідне правило .agents/rules/*.md (<12k)     │
    │      -> Додати пункт у чеклист code_review_and_skills.md                      │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 4. АВТОМАТИЗОВАНЕ ЗАКРІПЛЕННЯ В АУДИТ-ТЕСТАХ (TEST LOCK-IN)                   │
    │    • Створити тест-доказ (adver-review, testing-anti-patterns), що ловить брак│
    │    • Додати перевірку в CI або лінтер (якщо можливо автоматизувати)           │
    │    • Тепер жоден агент не зможе здати задачу з цим дефектом!                  │
    └───────────────────────────────────────┬───────────────────────────────────────┘
                                            │
    ┌───────────────────────────────────────▼───────────────────────────────────────┐
    │ 5. МИТТЄВА СИНХРОНІЗАЦІЯ ДЛЯ ВСІЄЇ ЕКОСИСТЕМИ АГЕНТІВ                         │
    │    • Оновити чеклисти в agents_review.md, agents_backend.md, agents_frontend  │
    │    • Оновити навігаційну матрицю в .agents/AGENTS.md                          │
    │    • Включити перевірку в наступні плани remediation_*.md                     │
    └───────────────────────────────────────────────────────────────────────────────┘
```
