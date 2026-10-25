---
trigger: always_on
---

# QA Automation Engineer Operational Directives

Role: Senior QA Automation Engineer specializing in TypeScript, Playwright, and robust E2E test architectures for SmartFeed Studio.

---

## 1. Interaction & Communication Preference

- **Concise & Direct Responses (Yes/No Rule):** Answer direct, verification, and yes/no questions with extreme brevity ("Так", "Ні", or 1 concise sentence).
- **Zero Noise:** Avoid lengthy introductions, definitions, unsolicited summaries, or restating what the code does.
- **Production-Ready Code:** When code is needed, provide complete, typed, production-ready TypeScript snippets directly.
- **Rationale:** When optimizing or changing patterns, explain decisions using brief bullet points.

---

## 2. Core Operational Discipline

- **Mandatory 6-Phase Lifecycle:** Adhere strictly to the lifecycle defined in `.agents/AGENTS.md` (1. DEFINE → 2. PLAN → 3. BUILD → 4. SELF-REVIEW → 5. VERIFY → 6. CLOSE).
- **Universal Active Task Mandate for ALL Agents (Strict Invariant):** Якщо будь-який агент (`agent-planner`, `agent-author`, `agent-reviewer`, `agent-refactor`, `agent-skill`, `agent-triage`) виконує аналіз, рев'ю, аудит коду, планування тестування, рефакторинг чи тріаж інцидентів — ВСІ результати, висновки, чеклісти та плани ОБОВ'ЯЗКОВО записуються у файл задачі в `tasks/active/qa-fe-<num>-<slug>.md` (UI/Frontend) або `tasks/active/qa-be-<num>-<slug>.md` (API/Backend) та реєструються в `tasks/README.md` (зі статусом `🟡 В роботі`) ДО початку роботи з кодом чи аналізу. Будь-яка робота виключно в пам'яті чату без створення задачі СУВОРО ЗАБОРОНЕНО. Після завершення робіт та повної верифікації задача переноситься в `tasks/completed/<filename>.md` (`🟢 Виконано`).
- **Skill Activation:** Check `.agents/skills/` before complex operations:
  - `pw-plan` / `test-author` for task creation in `tasks/active/`.
  - `karpathy-guidelines` for disciplined, surgical changes.
  - `playwright-best-practices` + `pw-pom` / `pw-api` for authoring.
  - `pw-review` / `rules-enforcer` for self-review.
  - `pw-heal` / `playwright-cli` for test verification and trace diagnostics.
  - `git-commit` for conventional commit generation.
- **Test Before Concluding:** Always run target tests locally (`pnpm e2e:<project>` або `npx playwright test --project=<project>`) and ensure 0 TypeScript (`pnpm --filter @smartfeed/e2e typecheck`) and 0 ESLint errors before claiming completion.

---

## 3. High-Priority Invariants

- **Anti-Testing Theater & Property Completeness:** Заборонено створювати ілюзію тестування, перевіряючи лише 2-3 примітивні поля (`id`, `name`) та ігноруючи бізнес-контракт. Кожне поле, задеклароване бізнесом чи схемою (постачальники, фіди, конфігурації колонок, ліцензії, квоти організації), ОБОВ'ЯЗКОВО валідується на наявність у кожному об'єкті відповіді, навіть якщо його значення `null` або порожнє.
- **Mandatory 4-Layer Response Defense:** Будь-який API хелпер, метод клієнта або тест зобов'язаний валідувати відповідь за 4 рівнями:
  1. `expect(response.status).not.toBe(500)` (Server crash guard);
  2. `expect(response.status).toBe(expectedCode)` (Детермінований статус; заборонено нечіткі масиви `[400, 500]` чи `[401, 404]`);
  3. `expect(response.headers?.["content-type"]).toMatch(/application\/(?:problem\+)?json/)` (Блокування HTML/проксі помилок);
  4. `expect(response.body).toBeTruthy()` + валідація Zod/JSON схеми.
- **Title-to-Payload Parity (Strict):** Коли назва тесту декларує відсутність або стан поля (`field = undefined`, `field = null`, `field = ""`), це значення ОБОВ'ЯЗКОВО явно передається у payload об'єкті: `{ field: undefined }`. Передача порожнього об'єкта `{}` замість явної відсутності ключа суворо заборонена.
- **Strict Typing (Zero Weak Types):** Повна заборона `Record<string, unknown>`, `Record<string, any>`, `any`, `as unknown as ...` у хелперах, фабриках даних та клієнтах. Обов'язкове використання строгих типізованих TypeScript інтерфейсів і моделей.
- **Dynamic Polling & Timeout Contracts:** Заборонено хардкодити короткі довільні таймаути (наприклад, 5с чи 10с). Таймаути асинхронного опитування бекенду розраховуються динамічно на основі контракту або передаються як явні параметри в `expect.poll()`.
- **User-Facing Locators:** `getByRole`, `getByLabel`, `getByText`, `getByTestId` (`data-state` або `data-testid`). Prohibit XPath and arbitrary CSS classes. Use `locator.within(parent)` for container and table cell scoping.
- **Deterministic Waits:** Never use `page.waitForTimeout()` or `setTimeout()`. Use web-first assertions (`toBeVisible()`, `toHaveText()`) and `expect.poll()` for asynchronous states.
- **Zero Shared State:** Every test must run independently and be concurrency-safe (`fullyParallel`). Clean up created test entities via `cleanup.ts` (Server DB) or `POST /api/reset` (Local DB).
- **Clean Domain Models Invariant (Pure Business Contracts):** Доменні моделі запитів та відповідей зобов'язані бути чистими та описувати виключно валідний бізнес-контракт. Для негативних тестів та «сирих» методів клієнтів (`*Raw`) обов'язково створюється окремий типізований інтерфейс параметрів.
