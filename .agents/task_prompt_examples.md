# 🎯 SmartFeed Studio — Приклади та Шаблони Постановки Задач

> **Файл розташування:** [`.agents/task_prompt_examples.md`](./task_prompt_examples.md)  
> **Призначення:** Практичне керівництво для розробника, як ставити задачі агентам (**Frontend**, **Backend**, **Review**, **Fullstack**), щоб автоматично активувати відповідні майстер-скіли та підскіли без втрати інженерної якості.

---

## 🧭 1. Як викликати Агентів та Скіли через `@`

В інтерфейсі Antigravity IDE символ `@` відкриває меню прив'язки контексту:

1. **Спосіб 1: Через меню `@` (Rules)**
   - Наберіть `@agents_` у вікні чату — зі списку **Rules** з'являться:
     - `@agents_frontend` — спеціалізований фронтенд-агент (8 етапів, `apps/desktop`, `apps/admin-portal`).
     - `@agents_backend` — спеціалізований бекенд-агент (8 етапів, NestJS CQRS, Prisma, PostgreSQL).
     - `@agents_review` — спеціалізований агент аудиту та якості (8 етапів, безпека, БД, UX).
     - `@agents_devops` — спеціалізований агент DevOps, міграцій БД без простою, Docker та релізів.
     - `@agents_qa` — спеціалізований агент QA, навантажувальних бенчмарків 100k+ SKU, хаос-тестування та паритету.
   - Виберіть потрібне правило, натисніть `Enter` і додайте опис задачі.

2. **Спосіб 2: Через текстовий префікс (якщо без `@`)**
   - Можна просто писати: `Працюй як agents_frontend: ...` або `Режим agents_backend: ...`. Оскільки правила знаходяться у `.agents/rules/`, агент вже має їх у своєму контексті.

---

## 💻 2. Фронтенд: Готові Промпти (`@agents_frontend`)

> **Активовані скіли:** `frontend`, `ui-ux-pro-max`, `shadcn`, `tailwind-design-system`, `vercel-react-best-practices`, `condition-based-waiting`, `playwright-best-practices`, `visual-regression-testing`, `accessibility-testing`, `mock-real-parity-testing`.

### Промпт 2.1: Створення нового розділу / екрану

```text
@agents_frontend Розроби новий розділ «Журнал аудиту дій» (/audit-logs) в apps/desktop:
1. Таблиця подій: дата, користувач, дія, IP-адреса, статус.
2. Solid Sticky Header для thead таблиці (bg-card, border-b).
3. Фільтри за датою та типом події в тулбарі.
4. Модульність: декомпозиція на субкомпоненти <250 рядків кожен.
5. 100% i18n (UA та EN локалізація у locales/).
6. 100% @/ імпорти, жодного relative import.
7. Playwright E2E тест з перевіркою перемикання мов та відсутності дублів запитів.
```

### Промпт 2.2: Редизайн модального вікна / форми

```text
@agents_frontend Проведи рефакторинг та редизайн модального вікна експорту каналів (apps/desktop):
1. Стилізація строго за семантичними токенами Zinc (0 off-scheme purple/pink кольорів).
2. Використовуй компоненти shadcn (Dialog, Form, Input, Select, Badge).
3. In-flight дедуплікація запитів через useRef (zero redundant calls).
4. Інтерактивний симулятор розрахунку комісії маркетплейсу.
5. Додай accessibility-тест (axe-core WCAG перевірка контрасту та фокус-пасток).
```

### Промпт 2.3: Виправлення бага у віртуалізованій таблиці

```text
@agents_frontend Виправ витік висоти та стрибки скролу у VirtualizedProductsGrid (apps/desktop):
1. Проаналізуй re-renders та оптимізуй хуки через useCallback і useMemo.
2. Переконайся, що mock-драйвер та локальний SQLite повертають ідентичні дані (mock-real parity).
3. Додай visual regression тест Playwright для перевірки залипання шапки таблиці при скролі.
```

---

## ⚙️ 3. Бекенд: Готові Промпти (`@agents_backend`)

> **Активовані скіли:** `backend`, `nestjs-best-practices`, `defense-in-depth-validation`, `supabase-postgres-best-practices`, `prisma-postgres`, `idempotency-and-outbox`, `streaming-large-feeds`, `contract-first-api`, `db-migrations-zero-downtime`.

### Промпт 3.1: Новий CQRS ендпоінт та модель бази даних

```text
@agents_backend Реалізуй CQRS модуль управління API-ключами інтеграцій (/api-keys) у services/backend-api:
1. Спільний контракт: створи DTO та Zod-схеми у packages/shared (pnpm build:shared).
2. Модель Prisma: нова сутність ApiKey з @@map("api_keys"), CUID PK, 100% FK індексами та timestamptz.
3. 4-шаровий захист: class-validator у DTO, ліміт ключів за тарифом, Guard перевірки ролі, транзакція Prisma.
4. Commands: CreateApiKeyCommand, RevokeApiKeyCommand. Queries: GetApiKeysQuery.
5. TDD RED: напиши E2E тест з обов'язковим teardown через cleanDatabase у beforeAll/afterAll.
6. Жодних файлів >300 рядків, 100% @/ path aliases.
```

### Промпт 3.2: Потоковий SAX-імпорт великих фідів (100k+ SKU)

```text
@agents_backend Оптимізуй парсер XML фідів у services/backend-api через потоковий SAX-підхід:
1. Застосуй streaming-large-feeds з контролем пам'яті через backpressure та чанками по 500 SKU.
2. Черга задач BullMQ з retry-політикою та експоненційним jitter.
3. Захист операцій через ідемпотентний ключ (idempotency-and-outbox у Redis).
4. Напиши Jest тест на обробку 10,000 мокових SKU без витоків пам'яті.
```

### Промпт 3.3: Безпечна міграція бази даних без простою

```text
@agents_backend Створи zero-downtime міграцію для додавання поля barcode_type до таблиці products:
1. Застосуй 3-фазний патерн Expand/Contract (db-migrations-zero-downtime).
2. Додай колонку як nullable з дефолтним значенням, створи індекс через CREATE INDEX CONCURRENTLY.
3. Онови Prisma клієнт (prisma generate), перевір сумісність з існуючими записами.
```

---

## 🔍 4. Код-Рев'ю та Аудит: Готові Промпти (`@agents_review`)

> **Активовані скіли:** `fullstack-code-review`, `adver-review`, `postgresql-code-review`, `performance-budget`, `skill-health-audit`, `verification-before-completion`.

### Промпт 4.1: Комплексний інженерний аудит модуля

```text
@agents_review Проведи повний 8-етапний аудит якості та безпеки для модуля білінгу (licenses & payments):
1. Перевір CQRS ізоляцію, відсутність циклічних імпортів та чистоту DTO.
2. Перевір PostgreSQL схему на наявність індексів на всіх FK, timestamptz, snake_case.
3. Проведи adversarial стрес-тест на паралельні запити (race conditions) при списанні квот або оплаті.
4. Перевір дотримання гардрайлів: жодного файлу >300 рядків, жодного ../ імпорту, 0 порожніх catch {}.
5. Якщо є дефекти — сформуй план покращення у plans/active/remediation_billing.md.
```

### Промпт 4.2: Аудит продуктивності та бюджетів

```text
@agents_review Проаналізуй продуктивність головного дашборду та сторінки каталогів:
1. Застосуй performance-budget: перевір кількість SQL-запитів (відсутність N+1), розмір бандла, час рендера.
2. Перевір, що при завантаженні сторінки кожен API ендпоінт викликається строго 1 раз (Zero Duplicates).
3. Переконайся у відсутності витоків пам'яті у React-хуках та WebSockets/SSE підключеннях.
```

---

## 🚀 5. DevOps & Релізи: Готові Промпти (`@agents_devops`)

> **Активовані скіли:** `release-and-rollback`, `db-migrations-zero-downtime`, `supabase-postgres-best-practices`, `prisma-cli`, `prisma-postgres`, `tauri-v2-security-and-ipc`, `turborepo`, `task-router`, `lessons-learned-registry`, `project-context-map`, `session-handoff`.

### Промпт 5.1: Zero-Downtime міграція БД

```text
@agents_devops Підготуй та виконай безпечну міграцію схеми БД:
1. Застосуй патерн Expand / Contract (нова колонка як nullable).
2. Створи індекси через CREATE INDEX CONCURRENTLY.
3. Обов'язково встанови SET lock_timeout = '2s'.
4. Склади покроковий Rollback Runbook у разі збою.
```

### Промпт 5.2: Перевірка та рестарт хмарних сервісів Railway

```text
@agents_devops Перевір стан бекенду на Railway через Railway MCP:
1. Виклич railway status та get-status.
2. Проаналізуй логи на наявність 5xx помилок (http-error-rate, get-logs).
3. Перевір відповідність змінних середовища (list-variables).
```

### Промпт 5.3: Реліз нової версії (SemVer)

```text
@agents_devops Проведи повну підготовку релізу v1.19.0:
1. Перевір guardrails (pnpm build, tsc --noEmit, 0 relative imports).
2. Збери валідацію нативних бінарників Tauri v2.
3. Підготуй changelog та онови версії в package.json.
```

---

## 🧪 6. QA, Навантаження & Хаос: Готові Промпти (`@agents_qa`)

> **Активовані скіли:** `e2e-scenario-matrix`, `playwright-best-practices`, `performance-budget`, `streaming-large-feeds`, `accessibility-testing`, `visual-regression-testing`, `task-router`, `lessons-learned-registry`, `project-context-map`, `session-handoff`.

### Промпт 6.1: Побудова 6D тест-матриці та генерація E2E тестів

```text
@agents_qa Побудуй 6D матрицю та згенеруй набір тестів для сутності «Постачальник»:
1. Охопи 6 вимірів: Happy Path, Edge, Error, Boundaries, i18n, Cascade Deletions.
2. Переконайся, що в тестах є суворий assert: expect(name).not.toBe('Постачальник').
3. Забезпеч teardown через cleanDatabase у beforeAll/afterAll.
```

### Промпт 6.2: Стрес-тест парсингу 100k+ SKU та контроль пам'яті

```text
@agents_qa Проведи навантажувальний бенчмарк потокового парсингу великого каталогу:
1. Згенеруй тестовий XML фід на 100,000 SKU (~250MB).
2. Запусти імпорт та зафіксуй динаміку споживання Node.js heap пам'яті.
3. Перевір захист від OOM завдяки SAX stream backpressure.
```

### Промпт 6.3: Хаос-тестування конкурентних мутацій (Race Conditions)

```text
@agents_qa Перевір систему на стійкість до гонок пам'яті:
1. Запусти 20 паралельних запитів на списання одного і того ж пакету кредитів.
2. Переконайся, що mutex-блокування відпрацьовують без від'ємного балансу.
3. Перевір відсутність подвійного виклику refresh token при паралельних 401 відповідях.
```

---

## ⚡ 7. Наскрізні Фічі (Fullstack Feature)

```text
@agents_backend @agents_frontend Реалізуй повний наскрізний цикл для фічі «Користувацькі теги товарів»:
1. Контракт: Zod-схеми та DTO у packages/shared (CreateTagDto, ProductTag).
2. Бекенд: міграція Prisma, CQRS команди створення/прив'язки тегів у services/backend-api, 4-шаровий захист.
3. Фронтенд: UI бейджі та селектор тегів у картці товару (apps/desktop), локалізація UA ⇄ EN.
4. Паритет: підтримка тегів у локальному SQLite та mock-драйвері десктопа (100% Data Parity).
5. Тести: Jest E2E на бекенді + Playwright сценарій на додавання та фільтрацію товарів за тегом на клієнті.
6. Guardrails: tsc --noEmit (0 помилок), pnpm lint (0 помилок, max-lines <= 300, 0 relative imports).
```

---

## ⚡ 8. Швидкі тригери підскілів (Автоматичні та Ручні)

> **💡 Автоматичний режим:** Усі перелічені підскіли **вже вбудовані у 8-етапний життєвий цикл** кожного агента (`@agents_frontend`, `@agents_backend`, `@agents_review`, `@agents_devops`, `@agents_qa`). При виклику агента вони запускаються **автоматично** на відповідних етапах:
>
> - **Етап 1**: `task-router` (мінімізація контексту) + `lessons-learned-registry` (перевірка відомих помилок).
> - **Етап 2**: звірка з `project-context-map` (контракти та CQRS-модулі).
> - **Етап 4 / 6**: `e2e-scenario-matrix` (генерація 6-вимірної матриці тестів) + `skill-health-audit` (аудит цілісності скілів).
> - **Етап 8**: `project-context-map` (оновлення топології) + `session-handoff` (фіксація зліпку сесії).
>
> **🛠 Точковий ручний режим:** Якщо вам потрібно запустити підскіл окремо без повного циклу задачі, скористайтеся швидкими фразами:

| Задача                           | Коли запускати                                      | Що написати агенту                                                                        |
| :------------------------------- | :-------------------------------------------------- | :---------------------------------------------------------------------------------------- |
| **Маршрутизація скілів**         | На старті нової задачі для вибору фокусу            | `Використай task-router для оцінки задачі: <опис>`                                        |
| **Перевірка відомих помилок**    | Перед правками чутливих зон (Auth, Quotas, Streams) | `Звернися до lessons-learned-registry перед внесенням змін у <модуль>`                    |
| **Карта архітектури**            | Після створення нових сервісів/модулів              | `Онови project-context-map після додавання нового сервісу`                                |
| **Генерація тестів за матрицею** | На етапі тестування сутностей                       | `Склади e2e-scenario-matrix для сутності Постачальник та згенеруй відсутні кейси`         |
| **Аудит здоров'я скілів**        | Для профілактики 99 скілів та symlinks              | `Запусти skill-health-audit для перевірки всіх 99 скілів, symlinks та відсутності дублів` |
| **Збереження стану сесії**       | Перед закриттям чату або передачею в новий          | `Створи session-handoff для поточної активної задачі`                                     |
