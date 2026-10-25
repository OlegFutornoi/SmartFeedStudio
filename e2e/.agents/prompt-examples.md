# Шаблони та приклади постановки задач для Агентів (`prompt-examples.md`)

Цей документ містить готові стандартизовані шаблони промптів для запуску агентів у пакеті `@smartfeed/e2e`:

1. **[Агент-Планувальник (Task Planner & Architecture Strategist)](file://e2e/.agents/agent-planner.md)**
2. **[Агент-Творець Тестів (Test Author)](file://e2e/.agents/agent-author.md)**
3. **[Агент-Рев'юер (Code Reviewer & Gatekeeper)](file://e2e/.agents/agent-reviewer.md)**
4. **[Агент-Тріажер (Debug & Triage Specialist)](file://e2e/.agents/agent-triage.md)**
5. **[Агент-Рефактор (Refactoring & Tech-Debt Specialist)](file://e2e/.agents/agent-refactor.md)**
6. **[Агент-Архітектор Скілів (Skill Architect & Optimizer)](file://e2e/.agents/agent-skill.md)**

---

## 1. Приклади постановки задач для Агента 1 (Test Author)

Використовуйте ці шаблони, коли потрібно створити новий автотест або покрити новий модуль.

### Приклад 1.1: Створення нового UI тесту (Admin Portal або Desktop)

```markdown
Дій як Агент-Творець за інструкцією [e2e/.agents/agent-author.md](file://e2e/.agents/agent-author.md).

Потрібно автоматизувати новий E2E UI сценарій для SmartFeed Studio:

1. Напрямок: Admin Portal (проект `server-admin`, URL `:3000`).
2. Задача: Перевірка створення та списку постачальників у CRM.
3. Сценарій:
   - Відкрити сторінку постачальників.
   - Відкрити діалог створення постачальника, заповнити обов'язкові поля.
   - Зберегти та перевірити появу рядка в таблиці зі статусом ACTIVE.
4. Обов'язкові вимоги:
   - Пройти повний 6-фазний життєвий цикл:
     - Фаза 1 (DEFINE)
     - Фаза 2 (PLAN у e2e/tasks/active/qa-fe-01-suppliers-crud.md та реєстрація в e2e/tasks/README.md)
     - Фаза 3 (BUILD)
     - Фаза 4 (SELF-REVIEW)
     - Фаза 5 (VERIFY: pnpm e2e:server:admin)
     - Фаза 6 (CLOSE: переміщення в e2e/tasks/completed/).
   - Тільки аліас `@/` (`@/core/fixtures/base.fixture`, `@/server/admin/pages/...`).
   - Тільки user-facing локатори (`getByRole`, `getByTestId`). Жодного XPath або CSS-класів.
   - Жодних `waitForTimeout` — тільки web-first асерції (`toBeVisible`).
```

---

### Приклад 1.2: Створення нового API тесту (Server API або Local DB)

```markdown
Дій як Агент-Творець за інструкцією [e2e/.agents/agent-author.md](file://e2e/.agents/agent-author.md).

Необхідно покрити API-тестами ендпоінти локальної бази SQLite:

1. Напрямок: Local Backend (`local-backend`, `POST http://localhost:5001/api/invoke`).
2. Задача:
   - Створити позитивний тест CRUD операцій постачальника (`upsert_supplier`, `list_suppliers`, `delete_supplier`).
   - Валідувати 4-layer response defense (`not.toBe(500)` -> 200 -> JSON -> типізований результат `LocalDbCommandMap`).
3. Обов'язкові вимоги:
   - Створити задачу `e2e/tasks/active/qa-be-01-local-db-suppliers.md`.
   - Жодних `any` чи `Record<string, any>`.
   - Перевірити прогін через `pnpm e2e:local:backend`.
```

---

## 2. Приклад постановки задач для Агента 2 (Code Reviewer)

```markdown
Дій як Агент-Рев'юер за інструкцією [e2e/.agents/agent-reviewer.md](file://e2e/.agents/agent-reviewer.md).

Проведи строгий 4-етапний аудит останніх змін автотестів у `e2e/`:

1. Створи аудит-задачу в `e2e/tasks/active/qa-fe-review-<slug>.md` та зареєструй у `e2e/tasks/README.md`.
2. Перевір:
   - 0 відносних імпортів вище поточного каталогу (тільки `@/`).
   - 0 `waitForTimeout` та 0 `force: true`.
   - 4-layer response defense на всіх HTTP викликах.
   - Title-to-Payload parity.
   - Ізоляція тестових даних (відсутність хардкоджених ID/email).
3. Запусти перевірку типів: `pnpm --filter @smartfeed/e2e typecheck`.
4. Надай звіт з вердиктом `🟢 APPROVED` або `🔴 REJECTED`.
```

---

## 3. Приклад постановки задач для Агента 3 (Debug & Triage)

```markdown
Дій як Агент-Тріажер за інструкцією [e2e/.agents/agent-triage.md](file://e2e/.agents/agent-triage.md).

Тест впав під час прогону `pnpm e2e:server:backend`.

1. Створи задачу `e2e/tasks/active/qa-be-triage-<name>.md` та зареєструй у `e2e/tasks/README.md`.
2. Перевір health сервісів (`GET :4000/api/health`).
3. Проаналізуй Playwright trace та network dump.
4. Класифікуй збій за однією з 5 категорій: `APP_BUG`, `TEST_BUG`, `ENV_DOWN`, `DATA_STALE`, `FLAKY`.
5. Сформуй структурований звіт з кроками відтворення та діями.
```
