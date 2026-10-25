# Шаблони та приклади постановки задач для Агентів (`prompt-examples.md`)

Цей документ містить готові стандартизовані шаблони промптів для запуску агентів:

1. **[Агент-Планувальник (Task Planner & Architecture Strategist)](file:///Users/oleg/AQA/insurance-e2e/.agents/agent-planner.md)**
2. **[Агент-Творець Тестів (Test Author)](file:///Users/oleg/AQA/insurance-e2e/.agents/agent-author.md)**
3. **[Агент-Рев'юер (Code Reviewer & Gatekeeper)](file:///Users/oleg/AQA/insurance-e2e/.agents/agent-reviewer.md)**
4. **[Агент-Тріажер (Debug & Triage Specialist)](file:///Users/oleg/AQA/insurance-e2e/.agents/agent-triage.md)**
5. **[Агент-Рефактор (Refactoring & Tech-Debt Specialist)](file:///Users/oleg/AQA/insurance-e2e/.agents/agent-refactor.md)**
6. **[Агент-Архітектор Скілів (Skill Architect & Optimizer)](file:///Users/oleg/AQA/insurance-e2e/.agents/agent-skill.md)**

---

## 1. Приклади постановки задач для Агента 1 (Test Author)

Використовуйте ці шаблони, коли потрібно створити новий тест, автоматизувати нову сторінку або розібратися зі зламаним/флакаючим тестом.

### Приклад 1.1: Створення нового E2E UI тесту (Повний цикл)

```markdown
Дій як Агент-Творець за інструкцією [.agents/agent-author.md](file:///Users/oleg/AQA/insurance-e2e/.agents/agent-author.md).

Потрібно автоматизувати новий E2E сценарій для Finance.ua OSAGO:

1. Домен: Finance.ua (проект `finance`, префікс `PagePrefix.OSAGO_UA`).
2. Задача: Проходження воронки оформлення поліса ОСЦПВ для авто з київською реєстрацією (Зона 1, об'єм 1600-2000 см³, категорія В2).
3. Сценарій:
   - Відкрити лендінг, розрахувати за параметрами авто.
   - У каталозі вибрати першу страхову компанію без франшизи (0 грн).
   - Заповнити персональні дані клієнта (ПІБ, валідний ІПН, телефон, email).
   - Дійди до екрану підписання OTP.
4. Обов'язкові вимоги:
   - Пройти повний 6-фазний життєвий цикл: Фаза 1 (DEFINE) -> Фаза 2 (PLAN & CONSTRAINTS у Plan/activ/osago-b2-flow.md) -> Фаза 3 (BUILD) -> Фаза 4 (SELF-REVIEW & PARITY) -> Фаза 5 (VERIFY & HEAL) -> Фаза 6 (CLOSE & SHIP).
   - Суворо дотримуйся [.agents/rules/](file:///Users/oleg/AQA/insurance-e2e/.agents/rules):
     - Тільки аліас `@/` для зовнішніх імпортів (`@/fixtures/index`, `@/utils`).
     - Тільки user-facing локатори (`getByRole`, `getByLabel`, `data-state`). Жодного XPath або CSS-класів.
     - Жодних `waitForTimeout` — тільки web-first асерції або `expect.poll`.
     - Додати реєстрацію ліда в `deletionLeads.push(...)`.
   - Запусти тест локально через CLI і переконайся, що він зелений (`PASSED`).
```

---

### Приклад 1.2: Створення нового E2E API тесту (CRM + Lead Lifecycle)

```markdown
Дій як Агент-Творець за інструкцією [.agents/agent-author.md](file:///Users/oleg/AQA/insurance-e2e/.agents/agent-author.md).

Необхідно покрити API-тестами новий ендпоінт CRM для GreenCard:

1. Домен: API (`apiTest`, проект `api`, теги `@api`, `@crm`, `@greencard`).
2. Задача:
   - Створити позитивний тест життєвого циклу ліда GreenCard (Lead -> Draft -> Offer) із валідацією AJV-схеми та перевіркою Data Parity.
   - Створити негативні тести за матрицею помилок:
     - 401: Запит без авторизації.
     - 404: Запит із неіснуючим `leadKey`.
     - 422: Запит із пустим тілом `{}` та запит із невалідним номером авто.
3. Обов'язкові вимоги:
   - Використовуй скіли `pw-test-designer`, `pw-api`, `pw-schema-sync`.
   - Жодних нечітких перевірок `expect([422, 500]).toContain(status)`. Тільки точні коди `expect(res.status).toBe(422)`.
   - Логіку конструювання payload винеси у `support/flow.helpers.ts`. У spec-файлі мають бути лише виклики тестів.
   - Запусти тест через `npx playwright test tests/api/... --project=api` і переконайся у статусі PASSED.
```

---

### Приклад 1.3: RCA-дебаг та виправлення зламаного / флакаючого тесту

```markdown
Дій як Агент-Творець за інструкцією [.agents/agent-author.md](file:///Users/oleg/AQA/insurance-e2e/.agents/agent-author.md).

Тест падає на STAGE-середовищі:

- Файл тесту: `tests/finance/osago/pages/catalog.finance.ts`
- Симптом: Таймаут під час переходу з модалки візарда до каталогу.
- Задача:
  1. Запустити тест із записом трейсу: `npx playwright test tests/finance/osago/pages/catalog.finance.ts --trace on`.
  2. Застосувати скіл `pw-debug-rca` та скрипт `scripts/extract-trace.py` або `scripts/parse-trace.js` для пошуку причини.
  3. Детерміновано визначити рівень збою:
     - Чи це 500 помилка бекенду / EWA?
     - Чи це перекритий оверлей / backdrop / z-index?
     - Чи це React re-render та зникнення фокусу?
  4. Застосувати точкове виправлення (Surgical change) БЕЗ додавання `page.waitForTimeout()` і БЕЗ `click({ force: true })`.
  5. Переконатися, що повторний прогін стабільно зелений.
```

---

## 2. Приклади постановки задач для Агента 2 (Code Reviewer & Gatekeeper)

Використовуйте ці шаблони, коли код тесту або Page Object вже написаний, і перед мерджем/комітом потрібен безкомпромісний аудит якості.

### Приклад 2.1: Повний аудит нового або зміненого тесту (Pre-commit Audit)

```markdown
Дій як Агент-Рев'юер за інструкцією [.agents/agent-reviewer.md](file:///Users/oleg/AQA/insurance-e2e/.agents/agent-reviewer.md).

Проведи строгий аудит якості наступного файлу тесту та його хелперів:

- Цільовий файл: `tests/finance/osago/pages/promo-code.finance.ts`
- Допоміжний файл: `tests/finance/osago/pages/support/promo.helpers.ts`

Виконай 4-кроковий цикл:

1. Крок 1 (Аудит правил через `rules-enforcer`):
   - Перевір імпорти: чи є порушення `@/` Rule (`../../../../`)?
   - Перевір селектори: чи немає `xpath=`, CSS-класів, `placeholder*=` або `#react-select`?
   - Перевір actionability: чи немає `click({ force: true })`, `evaluate(e => e.click())`, `mouse.click(0, 0)`?
   - Перевір асинхронність: чи немає `page.waitForTimeout()`?
   - Запусти `npx tsc --noEmit`.
2. Крок 2 (Аудит стабільності через `flakiness-detector`):
   - Чи захищені навігаційні кнопки візарда фільтром `:visible`?
   - Чи перевірено готовність усіх інпутів перед заповненням?
   - Чи закриваються модалки через `Escape`?
3. Крок 3 (Аудит бізнес-покриття через `pw-test-designer`):
   - Чи зареєстровано лід у `deletionLeads.push()`?
   - Чи перевіряється бізнес-результат (зміна ціни після промокоду), а не лише завантаження сторінки?
4. Крок 4 (Вердикт через `review-feedback-loop`):
   - Якщо є зауваження CRITICAL або MAJOR — надай Actionable Fix Report із блоками Before/After.
   - Якщо зауважень немає — вистави резолюцію `✅ APPROVED`.
```

---

### Приклад 2.2: Аудит API тесту на чистоту контрактів та статус-кодів

```markdown
Дій як Агент-Рев'юер за інструкцією [.agents/agent-reviewer.md](file:///Users/oleg/AQA/insurance-e2e/.agents/agent-reviewer.md).

Перевір пул API-тестів у директорії `tests/api/crm/`:

1. Застосуй `rules-enforcer` та `pw-api`:
   - Чи відсутні нечіткі масиви статусів `expect([422, 500]).toContain(...)` або `[200, 201]`?
   - Чи валідуються відповіді через AJV JSON-схеми?
   - Чи немає використання `: any`, `as any` або `Record<string, any>`?
   - Чи перевіряється Data Parity (збереження полів ліда)?
2. Сформуй звіт про знайдені антипатерни із точними рядками коду.
```

---

### Приклад 2.3: Комплексний аудит тестового сьюту на флакиність (Flakiness Audit)

```markdown
Дій як Агент-Рев'юер за інструкцією [.agents/agent-reviewer.md](file:///Users/oleg/AQA/insurance-e2e/.agents/agent-reviewer.md).

Проведи ревізію стабільності тестів у папці `tests/minfin/osago/`:

1. Активуй скіл `flakiness-detector`.
2. Знайди потенційні Race Conditions:
   - Використання `Promise.race` без наступного `expect.poll`.
   - Використання `page.reload()` як першої лінії retry.
   - Нестабільні кліки по елементах, що можуть перекриватися плаваючим банером або хедером.
3. Надай список файлів із ризиками нестабільності та точковими рекомендаціями щодо їх усунення.
```

---

## 3. Приклад парної роботи двох агентів (Feedback Loop)

Коли ви хочете запустити повний тандем двох агентів в одній розмові:

```markdown
Сценарій для двох агентів:

Етап 1: [Агент-Творець agent-author.md]

- Створити новий тест для перевірки пільгових категорій (Пенсіонер - 50% знижка) на Finance.ua.
- Створити план у Plan/activ/osago-privilege.md.
- Написати Page Object методи та spec-файл `tests/finance/osago/pages/privilege.finance.ts`.
- Добитися зеленого прогону через `npx playwright test`.

Етап 2: [Агент-Рев'юер agent-reviewer.md]

- Взяти створені файли та провести аудит через `rules-enforcer` і `flakiness-detector`.
- Сформувати Actionable Fix Report.

Етап 3: [Агент-Творець agent-author.md]

- Застосувати виправлення (Surgical changes).

Етап 4: [Агент-Рев'юер agent-reviewer.md]

- Підтвердити `✅ APPROVED` та передати у `git-commit`.
```

---

## 4. Приклади постановки задач для Агента 3 (Debug & Triage)

```markdown
Дій як Агент-Тріажер за інструкцією [.agents/agent-triage.md](file:///Users/oleg/AQA/insurance-e2e/.agents/agent-triage.md).

У нас впав нічний прогін на STAGE:

- Папка з артефактами: `test-results/`
- Задача:
  1. Перевірити доступність сервісів через `env-healthcheck.ts`.
  2. Розібрати трейси упалих тестів через `parse-trace.js` та `extract-trace.py`.
  3. Детерміновано класифікувати кожен збій: APP_BUG, TEST_BUG, ENV_DOWN, DATA_STALE, або FLAKY.
  4. Сформувати підсумковий звіт у `Plan/activ/triage-nightly-stage.md`.
  5. Якщо падіння спричинене бекендом (500/502) — розмітити тест як fixme, НЕ редагуючи селектори!
```

---

## 5. Приклади постановки задач для Агента 4 (Refactoring & Tech-Debt)

```markdown
Дій як Агент-Рефактор за інструкцією [.agents/agent-refactor.md](file:///Users/oleg/AQA/insurance-e2e/.agents/agent-refactor.md).

Потрібно виконати пакетну міграцію імпортів на аліас `@/`:

1. Модуль: `app-finance/pages/osago/`
2. Правило: C1 (заміна відносних імпортів `../../../../` на `@/`).
3. Вимоги:
   - Не чіпати інші файли та не змінювати логіку тестів.
   - Запустити `npm run typecheck` та `npm run lint`.
   - Запустити `node .agents/skills/rules-enforcer/scripts/scan-violations.cjs --changed` (має бути 0 CRITICAL).
   - Запустити smoke-тест: `npx playwright test tests/finance/osago/pages/catalog.finance.ts`.
   - Сформувати атомарний коміт: `refactor(finance): migrate osago page imports to @/ alias`.
```

---

## 6. Приклади інтеграції з Lark (Enterprise Collaboration)

### Приклад 6.1: Розслідування збою з надсиланням картки у Lark та бекапом трейсу в Drive

```markdown
@agent-triage
Розслідуй падіння тесту `tests/api/ibpm/finance/osago/kyc/pos-07.api.ts` на стенді review2.

1. Проведи повну діагностику через `pw-debug-rca` та `ibpm-error`.
2. Завантаж `test-results/**/trace.zip` у хмару через `lark-drive`.
3. Відправ інтерактивну картку інциденту з посиланням на трейс і причиною збою у QA-чат через `lark-im`.
4. Зафіксуй новий дефект у таблиці багів через `lark-base`.
```

---

### Приклад 6.2: Рев'ю та запит на погодження (Approval) для запуску на Production

```markdown
@agent-reviewer
Проведи повний аудит змін у PR перед запуском моніторингового сьюту на PROD:

1. Перевір код на відсутність антипатернів через `rules-enforcer` та `flakiness-detector`.
2. Створи офіційний запит на погодження прод-запуску `ALLOW_PROD_TESTS=1` через `lark-approval`.
3. Після схвалення опублікуй картку з вердиктом у канал релізів через `lark-im`.
```

---

### Приклад 6.3: Синхронізація тест-дизайну та живих специфікацій у Lark Base / Docs

```markdown
@agent-author
Після реалізації нового API сьюту OSAGO KYC:

1. Синхронізуй створену матрицю граничних значень (Boundary & Nullability Matrix) у таблицю Test Coverage у `lark-base`.
2. Створи живий документ зі специфікацією Lead Flow (7 етапів) у корпоративній Wiki через `lark-doc`.
```

---

## 7. Приклади створення та оптимізації скілів (/skill-creator)

Використовуйте ці шаблони, коли потрібно створити новий скіл для агента, рефакторити існуючий за принципом Progressive Disclosure або оптимізувати тригери у frontmatter.

### Приклад 7.1: Створення нового скіла з нуля за методологією /skill-creator

```markdown
@agent-skill
Створи новий скіл для автоматизації перевірки лідів у CRM:

1. Назва скіла: `crm-lead-auditor` у `.agents/skills/crm-lead-auditor/`.
2. Методологія: суворо слідуй `/skill-creator` (`.agents/skills/skill-creator/SKILL.md`).
3. Вимоги до структури (Progressive Disclosure):
   - `SKILL.md`: Frontmatter з наполягаючим (pushy) описом + інструкція до 300 рядків.
   - `references/`: винеси довідник статусів лідів EWA та CRM у `lead-statuses.md`.
   - `evals/evals.json`: підготуй 3 реалістичні тест-промпти для перевірки роботи скіла.
4. Після створення зареєструй скіл у `.agents/AGENTS.md`.
```

---

### Приклад 7.2: Аудит та рефакторинг існуючого скіла (Progressive Disclosure)

```markdown
@agent-skill
Проведи рефакторинг та оптимізацію скіла `.agents/skills/pw-api/`:

1. Застосуй стандарти `/skill-creator` та Progressive Disclosure Level 3.
2. Скороти `SKILL.md` (має бути < 400 рядків), винісши великі JSON-схеми та шаблони DTO у `references/api-schemas.md` та `references/dto-models.md`.
3. Переконайся, що в інструкціях пояснено "чому" (Theory of Mind), без зайвих капсових заборон.
4. Запусти `npm run lint` та перевір відсутність регресії.
```

---

### Приклад 7.3: Оптимізація frontmatter опису для точного тригерингу

```markdown
@agent-skill
Оптимізуй тригери для скіла `.agents/skills/pw-payment/`:

1. Використовуючи `/skill-creator` (розділ Description Optimization), склади 20 eval-запитів:
   - 10 should-trigger (різноманітні формулювання користувача про оплати, Portmone, LiqPay, 3DS, чек-аут).
   - 10 should-not-trigger (тонкі "near-miss" запити, наприклад розрахунок ціни без переходу до оплати).
   - Онови frontmatter `description` у `SKILL.md` найбільш ефективним варіантом для усунення undertriggering.
```

---

## 8. Приклади постановки задач для Агента Планування (Task Planner & Architecture Strategist)

Використовуйте ці шаблони, коли перед написанням коду або тесту потрібно детально декомпозувати фічу, зафіксувати граничні матриці, узгодити контракти або підготувати повноцінний план тестування.

### Приклад 8.1: Дослідження вимог та архітектурне планування нового E2E або API флоу

```markdown
@agent-planner
Склади детальний план тестування для нової фічі "Оформлення ДГО з франшизою 0 грн на Finance.ua":

1. Проведи Phase 1 (Forensic Intake): вивчи Swagger/схеми та бізнес-вимоги, витягни всі контрактні поля та валідаційні обмеження.
2. Склади вичерпну таблицю вимог (Requirements Traceability Matrix) та чеклист полів контракту в плані, щоб подальші агенти не пропустили жодної вимоги.
3. Побудуй 7-фазний Lead Flow та матрицю граничних перевірок (Boundary & Nullability Matrix) через `pw-test-designer`.
4. Зафіксуй архітектурні інваріанти через `constraint-driven-development`.
5. Створи файл плану в `Plan/activ/dgo-zero-franchise-flow.md` та зареєструй у `Plan/README.md` зі статусом 🟡 В роботі.
6. Зафіксуй чіткий Definition of Done, команди верифікації та передай виконання на @agent-author.
```

### Приклад 8.2: Декомпозиція складної рефакторинг-задачі

```markdown
@agent-planner
Декомпозуй задачу міграції застарілих API тестів `tests/api/ibpm/` у нову структуру:

1. Розбий міграцію на атомарні ізольовані пакети (< 10-15 файлів на пакет).
2. Для кожного пакету визнач контрактні залежності, схеми AJV та DTO моделі.
3. Сформуй поетапний план `Plan/activ/ibpm-migration-breakdown.md` та передай виконання на @agent-refactor.
```
