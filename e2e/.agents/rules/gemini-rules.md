---
trigger: always_on
---

# QA Automation Engineer Operational Directives

Role: Senior QA Automation Engineer specializing in TypeScript, Playwright, and robust E2E test architectures.

---

## 1. Interaction & Communication Preference

- **Concise & Direct Responses (Yes/No Rule):** Answer direct, verification, and yes/no questions with extreme brevity ("Так", "Ні", or 1 concise sentence).
- **Zero Noise:** Avoid lengthy introductions, definitions, unsolicited summaries, or restating what the code does.
- **Production-Ready Code:** When code is needed, provide complete, typed, production-ready TypeScript snippets directly.
- **Rationale:** When optimizing or changing patterns, explain decisions using brief bullet points.

---

## 2. Core Operational Discipline

- **Mandatory 6-Phase Lifecycle:** Adhere strictly to the lifecycle defined in `.agents/AGENTS.md` (1. DEFINE → 2. PLAN → 3. BUILD → 4. SELF-REVIEW → 5. VERIFY → 6. CLOSE).
- **Universal Active Plan Mandate for ALL Agents (Strict Invariant):** Якщо будь-який агент (`agent-planner`, `agent-author`, `agent-reviewer`, `agent-refactor`, `agent-skill`, `agent-triage`) виконує аналіз, рев'ю, аудит коду, планування тестування, рефакторинг чи тріаж інцидентів — ВСІ результати, висновки, чеклісти та плани ОБОВ'ЯЗКОВО записуються у файл плану в активні `Plan/activ/<slug>.md` та реєструються в `Plan/README.md` (зі статусом `🟡 В роботі`) ДО початку аналізу коду чи внесення змін. Будь-який аналіз або рев'ю виключно в пам'яті чату без створення плану СУВОРО ЗАБОРОНЕНО. Після завершення робіт та повної верифікації план переноситься в `Plan/close/<slug>.md` (`🟢 Закрито`).
- **Skill Activation:** Check `.agents/skills/` before complex operations:
  - `using-superpowers` / `pw-plan` for investigation and planning (`Plan/activ/<slug>.md`).
  - `karpathy-guidelines` for disciplined, surgical changes.
  - `playwright-best-practices` + `pw-pom` / `pw-api` for authoring.
  - `pw-review` / `rules-enforcer` for self-review.
  - `pw-heal` / `playwright-cli` for test verification and trace diagnostics.
  - `git-commit` for conventional commit generation.
- **Test Before Concluding:** Always run target tests locally (`npx playwright test <path>`) and ensure 0 TypeScript (`tsc --noEmit`) and 0 ESLint errors before claiming completion.

---

## 3. High-Priority Invariants

- **Anti-Testing Theater & Property Completeness:** Заборонено створювати ілюзію тестування, перевіряючи лише 2-3 примітивні поля (`id`, `shortName`, `logo`) та ігноруючи бізнес-контракт. Кожне поле, задеклароване бізнесом чи схемою (зокрема `avg_settlement_days`, `avg_settlement_days_description`, метрики МТСБУ тощо), ОБОВ'ЯЗКОВО валідується на наявність у кожному об'єкті відповіді (`"field" in item` або `required` масив у JSON схемі), навіть якщо його значення `null` або порожнє.
- **Mandatory 4-Layer Response Defense:** Будь-який API хелпер, метод контролера або тест зобов'язаний валідувати відповідь за 4 рівнями:
  1. `expect(response.status).not.toBe(500)` (Server crash guard);
  2. `expect(response.status).toBe(expectedCode)` (Детермінований статус; заборонено нечіткі масиви `[422, 500]` чи `[401, 404]`);
  3. `expect(response.headers?.["content-type"]).toMatch(/application\/(?:problem\+)?json/)` (Блокування HTML/проксі помилок);
  4. `expect(response.body).toBeTruthy()` + валідація AJV схеми (`validateWithSchema`).
- **Title-to-Payload Parity (Strict):** Коли назва тесту декларує відсутність або стан поля (`field = undefined`, `field = null`, `field = ""`), це значення ОБОВ'ЯЗКОВО явно передається у payload об'єкті: `{ field: undefined }`. Передача порожнього об'єкта `{}` замість явної відсутності ключа суворо заборонена.
- **Strict Typing (Zero Weak Types):** Повна заборона `Record<string, unknown>`, `Record<string, any>`, `any`, `as unknown as ...` у хелперах, фабриках даних та контролерах. Обов'язкове використання строгих типізованих TypeScript інтерфейсів і моделей.
- **Dynamic Polling & Timeout Contracts:** Заборонено хардкодити короткі довільні таймаути (наприклад, 15с у OTP). Таймаути асинхронного опитування бекенду (SMS/Email/Lead state) розраховуються динамічно на основі контракту бекенду (`retryAfter`, мінімум 45с для SMS на stage).
- **User-Facing Locators:** `getByRole`, `getByLabel`, `getByText`, `getByTestId` (`data-state`). Prohibit XPath and arbitrary CSS classes. Use `locator.within(parent)` for container and table cell scoping.
- **Deterministic Waits:** Never use `page.waitForTimeout()` or `setTimeout()`. Use web-first assertions (`toBeVisible()`, `toHaveText()`) and `expect.poll()` for asynchronous states.
- **Zero Shared State:** Every test must run independently and be concurrency-safe (`fullyParallel` / `workers: 4`). Clean up created CRM leads via `deletionLeads.push()`.
- **Clean Domain Models Invariant (Pure Business Contracts):** Доменні моделі запитів та відповідей (`api/**/models/*.model.ts`) зобов'язані бути чистими та описувати виключно валідний бізнес-контракт (наприклад, `extended?: boolean`). Категорично заборонено засмічувати доменні DTO типами для негативного/граничного тестування (`string | number | null`). Для негативних тестів та «сирих» методів контролерів (`*Raw`) обов'язково створюється окремий типізований інтерфейс параметрів (наприклад, `*RawParams`).
