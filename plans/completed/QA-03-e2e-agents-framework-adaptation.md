# 📋 Задача QA-03: Адаптація та очищення агентської інфраструктури `e2e/.agents` та автономний цикл задач `e2e/tasks/`

> **Тип:** QA-задача (`QA-`)  
> **Статус:** 🟢 Виконано (Completed) — 25.10.2026  
> **Відповідальний агент:** `@agents_qa`  
> **Ціль:**
>
> 1. Проаналізувати та очистити папку `e2e/.agents` від залишків чужого проєкту (`insurance-e2e`, фінансові та страхові ліди, Lark, YouTrack).
> 2. Зберегти всі фундаментальні правила та вимоги до автотестів (4-layer response defense, user-facing locators, anti-testing theater, title-to-payload parity, clean teardown, strict typing).
> 3. Створити автономну структуру ведення задач всередині `e2e/`: `e2e/tasks/active/`, `e2e/tasks/completed/`, `e2e/tasks/README.md`.
> 4. Навчити агентів з `e2e/.agents` створювати задачі за конвенцією `qa-fe-<номер>-<назва>.md` (для UI/Desktop/Admin) та `qa-be-<номер>-<назва>.md` (для API/LocalDB/Backend).
> 5. Оновити `e2e/.agents/mcp_config.json` до повного набору з 9 MCP-серверів проєкту.

---

## 1. Аналіз структури `e2e/.agents`

### 1.1. Що є чужим (підлягає видаленню)

- **18 Lark-скілів:** `lark-approval`, `lark-apps`, `lark-attendance`, `lark-base`, `lark-calendar`, `lark-contact`, `lark-doc`, `lark-drive`, `lark-event`, `lark-im`, `lark-mail`, `lark-markdown`, `lark-meeting`, `lark-minutes`, `lark-note`, `lark-okr`, `lark-openapi-explorer`, `lark-shared`.
- **YouTrack:** `youtrack-reader` (не використовується у проєкті).
- **Insurance backend:** `ibpm-error` (домен страхування iBPM/CRM/EWA/AIWA).
- **Вузькоспецифічні скрипти з `pw-*`:**
  - `pw-plan/scripts/inspect-osago-wizard.ts`, `pw-plan/scripts/inspect-travel-flow.ts`
  - `pw-pom/scripts/explore-greencard-wizard.js`, `pw-pom/scripts/inspect-v3-wizard.ts`
  - `pw-heal/scripts/debug-catalog.finance.ts`, `pw-heal/scripts/dump-minfin-v3-flow.ts`, `pw-heal/scripts/verify-greencard-triggers.js`, `pw-heal/scripts/verify-flow.ts`, `pw-heal/scripts/track-wizard-datalayer.js`
  - `pw-mock/scripts/osago-lead-api-runner.js`, `pw-mock/scripts/travel-lead-api-runner.js`

### 1.2. Що зберігається та адаптується під SmartFeed Studio

- Усі правила в `e2e/.agents/rules/`:
  - `gemini-pravel.md`: обов'язковий `data-testid`, заборона fallback-chaining, детерміновані стани DOM (`data-state`).
  - `gemini-rules.md`: 4-layer response defense, title-to-payload parity, user-facing locators, заборона `waitForTimeout`, перехід на `e2e/tasks/active/qa-fe-<номер>`.
  - `gemini-context.md` та `gemini-context2.md`: адаптація топології під 4 напрямки SmartFeed Studio (`server/backend`, `server/admin`, `local/backend`, `local/desktop`), строга типізація, ізоляція даних.
- Агенти: `agent-planner.md`, `agent-author.md`, `agent-reviewer.md`, `agent-triage.md`, `agent-refactor.md`, `agent-skill.md`.
- Ключові скіли Playwright: `pw-api`, `pw-arch`, `pw-codemod`, `pw-data`, `pw-debug-rca`, `pw-heal`, `pw-mock`, `pw-payment` (адаптація до WayForPay/checkout), `pw-plan`, `pw-pom`, `pw-review`, `pw-schema-sync`, `pw-test-designer`, `pw-triage`, `pw-visual`, `pw-a11y`, `playwright-*`, `flakiness-detector`, `rules-enforcer`, `test-author`, `code-review`, `code-simplification`, `skill-creator`.

---

## 2. Покроковий план виконання

### Крок 1. Оновлення `e2e/.agents/mcp_config.json`

- Синхронізувати конфігурацію MCP з `.agents/mcp_config.json` (всі 9 серверів: `context7`, `firecrawl`, `github`, `playwright`, `postgres`, `railway`, `redis`, `sentry`, `shadcn`).

### Крок 2. Видалення чужих скілів та страхових скриптів

- Видалити 18 папок `lark-*`.
- Видалити `youtrack-reader` та `ibpm-error`.
- Видалити залишкові страхові скрипти з `pw-plan/scripts/`, `pw-pom/scripts/`, `pw-heal/scripts/`, `pw-mock/scripts/`.

### Крок 3. Створення автономної системи задач `e2e/tasks/`

- Створити директорії `e2e/tasks/active/` та `e2e/tasks/completed/`.
- Створити `e2e/tasks/README.md` з регламентом, статусами та нумерацією задач (`qa-fe-<номер>-<назва>.md` та `qa-be-<номер>-<назва>.md`).
- Оновити скрипт `plan-manager.js` у `e2e/.agents/skills/test-author/scripts/` для роботи з `tasks/active/` та `tasks/completed/` замість `Plan/activ/`.

### Крок 4. Адаптація документації та конфігурацій агентів

- Оновити `e2e/.agents/AGENTS.md`: змінити назву на SmartFeed Studio E2E, переписати топологію на 4 напрямки (`server/backend`, `server/admin`, `local/backend`, `local/desktop`), оновити життєвий цикл на створення задач у `tasks/active/qa-fe-...`.
- Оновити `e2e/.agents/rules/gemini-rules.md`, `gemini-context.md`, `gemini-context2.md`.
- Оновити визначення агентів (`agent-*.md`) та `prompt-examples.md`.
- Адаптувати `e2e/.agents/skills/pw-payment/SKILL.md` (WayForPay / checkout замість Portmone/OSAGO).

### Крок 5. Верифікація та перевірка цілісності

- Перевірити відсутність залишкових посилань на `insurance-e2e`, `finance.ua`, `minfin.ua`, `osago`, `greencard`, `lark`.
- Запустити `pnpm verify:fast` для гарантії цілісності всього монорепозиторію.
