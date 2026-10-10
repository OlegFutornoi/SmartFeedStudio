# 🚀 План оптимізації та модернізації системи написання коду та агентських скілів

> **Файл плану:** `plans/completed/audit_and_optimize_agent_skills_system.md`  
> **Статус:** ✅ **Реалізовано, оптимізовано та верифіковано (100% тестів пройдено)**  
> **Дата виконання:** 09.10.2026  
> **Контекст:** Інтеграція набору `addyosmani/agent-skills`, ліквідація переповнення контексту Antigravity IDE, скорочення 127 скілів до ~26 елітних модулів, впровадження конвеєра `/build auto`, `/code-simplify`, `/interview-me`, `/doubt`.

---

## 📌 1. Діагностика поточної системи та виявлені критичні дефекти

### 🚨 Дефект №1: Вибивання майстер-скілів з контекстного бюджету Antigravity IDE

- **Симптом в IDE:**
  ```text
  The following items were excluded due to context budget limits:
  agy-customizations, antigravity-guide, backend, frontend, git-commit, review, skill-creator
  ```
- **Першопричина:**
  1. Каталог `.agents/` перенасичений монолітними файлами (`AGENTS.md` 75 KB, `agents_backend.md` 86 KB, `agents_frontend.md` 84 KB, `agents_review.md` 87 KB). В Antigravity IDE будь-який markdown-файл у корені `.agents/` розпізнається як глобальне правило (`rule`) і насильно інжектується в системний промпт. В результаті файл `.agents/AGENTS.md` обрізається на 51 KB, а ліміт промпту для метаданих скілів вичерпується.
  2. Загальна кількість скілів після завантаження Addy досягла **127 скілів** (25 Addy + 5 Master + 97 Sub-Skills), що фізично ламає індексатор скілів.

### 🚨 Дефект №2: Екстремальна фрагментація та дублювання (Overlapping Overkill)

- **14 фронтенд-дизайн скілів:** `design-taste-frontend` (1,304 рядки!), `design-taste-frontend-v1`, `beautiful-design`, `frontend-design`, `modern-web-guidance`, `web-design-guidelines`, `emil-design-eng`, `canvas-design`, `ui-ux-pro-max`, `tailwind-design-system`, `shadcn`, `image`, `vercel-composition-patterns`, `vercel-react-best-practices`. Агент губиться між 14 інструкціями з однаковими правилами про відступи та кольори.
- **10 скілів для баз даних:** `supabase-postgres-best-practices`, `neon-postgres`, `prisma-postgres`, `prisma-client-api`, `prisma-cli`, `prisma-compute`, `prisma-upgrade-v7`, `postgresql-code-review`, `postgresql-optimization`, `db-migrations-zero-downtime`.
- **10 філософських/мета-скілів:** `inversion-exercise`, `scale-game`, `collision-zone-thinking`, `meta-pattern-recognition`, `simplification-cascades`, `preserving-productive-tensions`, `tracing-knowledge-lineages`, `when-stuck-problem-solving-dispatch`, `getting-started-with-skills`, `sharing-skills`.

### 🚨 Дефект №3: Неактуальний та «чужий» баласт (Out of Domain)

- `firebase-security-rules-auditor` (85 рядків) — у SmartFeedStudio **немає Firebase**, бекенд на PostgreSQL + NestJS + Redis + MinIO.
- `neon-postgres` (280 рядків) — serverless branching Neon не використовується (у нас Docker PG + Railway).
- `prisma-compute` (192 рядки) — Prisma Accelerate compute не використовується.
- `prisma-upgrade-v7` (263 рядки) — Prisma версії 5/6, тимчасовий гайд v7 не є частиною робочого циклу.

---

## 💎 2. Що дає набір Addy Osmani (`addyosmani/agent-skills`) для написання коду

Набір Addy Osmani містить провідні світові інженерні практики, яких гостро бракувало в монорепозиторії:

1. **`/build auto` — Автономний безпечний цикл реалізації:**
   - Погодження плану один раз → агент реалізує задачі по черзі:
     `Acceptance Criteria → Context Load → RED (тест) → GREEN (код) → Regression Run → Build Check → Atomic Git Commit`.
   - Зупиняється лише при блокерах або ризикових операціях.
2. **`code-simplification` (`/code-simplify`):**
   - Скорочення складності без зміни поведінки: усунення вкладених тернарників, розбиття God-методів, позбавлення мертвого коду, обов'язковий запуск тестів після кожної мікро-зміни.
3. **`interview-me` (`/interview-me`):**
   - Допитування вимог по одному питанню за раз із гіпотезою та рівнем впевненості (Confidence Score 0–100%). Зупиняє агента від фантазування архітектури на неповних вимогах.
4. **`doubt-driven-development` (`/doubt`):**
   - Змагальний свіжий аудит нетривіальних рішень (схеми БД, міграції, токени, безпека, білінг) під кутом спростування («disprove, not approve»).
5. **`incremental-implementation`:**
   - Вертикальні слайси (Slice 0 Контракт → Slice 1 Бекенд → Slice 2 Фронтенд → Slice 3 E2E верифікація) замість горизонтального написання 500 рядків за раз.
6. **`browser-testing-with-devtools`:**
   - Жива інспекція браузера (DOM, консоль, мережа, Layout) через Chrome DevTools MCP сервер у доповнення до Playwright.
7. **5-осьове код-рев'ю (`code-review-and-quality`):**
   - Correctness, Readability, Architecture, Security, Performance.

---

## 🔬 3. Аналіз та вердикт щодо пакету `https://open.feishu.cn/lark-cli/skills/regular` (Feishu / Lark CLI)

Було виконано детальний аудит вмісту та технічних вимог пакету:

### Що це за набір:

- Офіційний інструментарій екосистеми **ByteDance Feishu / Lark** (китайський корпоративний месенджер та офісний пакет, аналог Slack + MS Office).
- Містить 21 скіл китайською мовою: `lark-im` (чати), `lark-mail` (пошта), `lark-meeting` (відеодзвінки), `lark-sheets` (таблиці), `lark-task` (задачі), `lark-wiki` (база знань), `lark-whiteboard` (дошка), `lark-okr` (цілі) тощо.

### Чому пряме встановлення категорично протипоказане:

1. **Вимагає відсутній у системі бінарник `lark-cli`**: кожен скіл жорстко прив'язаний до наявності закритої утиліти `lark-cli`, корпоративного китайського акаунту `open.feishu.cn` та токенів `tenant_access_token`. Без цього жодна команда не працює (`command not found`).
2. **100% Out of Domain**: SmartFeed Studio — це e-commerce платформа обробки фідів товарів на NestJS, Prisma, React та Tauri. У нас немає жодної прив'язки до корпоративного месенджера Feishu.
3. **Катастрофічне переповнення контексту IDE**: імпорт 21 скіла (понад 250 файлів китайською мовою) остаточно доб'є залишки контекстного бюджету Antigravity IDE, заблокувавши роботу робочих скілів.
4. **Биті відносні залежності**: скіли посилаються на `../lark-shared/SKILL.md` та `../lark-meeting/SKILL.md`, що викликає помилки індексації.

### 🛡️ Як ми посилюємо нашу систему (запозичені інженерні патерни без сміття):

1. **Принцип «Schema-First Discovery» (запозичено з Lark schema CLI)**:
   - Заборона для агента здогадуватися про параметри API/CLI. Усі DTO та параметри запитів повинні відкриватися та верифікуватися через єдине джерело істини — контракти та Zod-схеми в `@smartfeed/shared`.
2. **Строгий життєвий цикл та трекінг задач (Task Lifecycle)**:
   - Підсилення нашого `planning-and-lifecycle` та регламенту `plans/active/` чітким статусом кожної підзадачі (`TODO` → `IN_PROGRESS` → `VERIFIED` → `COMMITTED`).

---

## 🗺 4. Цільова матриця оптимізації (З 127 до 26 елітних скілів)

```text
 127 скілів (Хаос & Context Overflow)
    ├── 15 скілів ВИДАЛИТИ (Dead Weight / Out-of-Domain / Meta-Fluff)
    ├── 86 скілів КОНСОЛІДУВАТИ у 15 цільових ядер
    └── 26 ЕЛІТНИХ СКІЛІВ (Легкий контекст, 100% доступність в IDE)
```

### 🗑 Фаза 1: Скіли, які підлягають повному видаленню (15 скілів)

| Скіл                                     | Причина видалення                                                              |
| :--------------------------------------- | :----------------------------------------------------------------------------- |
| `firebase-security-rules-auditor`        | **Out of Domain**: у проекті відсутній Firebase.                               |
| `neon-postgres`                          | **Out of Domain**: використовується локальний Docker PG та Railway PG.         |
| `prisma-compute`                         | **Out of Domain**: Prisma Accelerate compute не використовується.              |
| `prisma-upgrade-v7`                      | **Неактуально**: тимчасова інструкція на майбутнє, засмічує активний контекст. |
| `getting-started-with-skills`            | **Meta-fluff**: загальні тексти онбордингу без коду.                           |
| `sharing-skills`                         | **Meta-fluff**: поширення скілів назовні не стосується коду SmartFeed.         |
| `pulling-updates-from-skills-repository` | **Meta-fluff**: надлишковий скрипт git pull.                                   |
| `gardening-skills-wiki`                  | **Надлишково**: покривається правилами документації та `skill-creator`.        |
| `tracing-knowledge-lineages`             | **Абстракція**: філософські роздуми про походження знань.                      |
| `preserving-productive-tensions`         | **Абстракція**: есе без інженерних інструкцій.                                 |
| `collision-zone-thinking`                | **Абстракція**: поглинається у загальні архітектурні інваріанти.               |
| `scale-game`                             | **Абстракція**: поглинається у `performance-budget`.                           |
| `inversion-exercise`                     | **Абстракція**: поглинається у `doubt-driven-development`.                     |
| `simplification-cascades`                | **Дублікат**: повністю замінюється практичним `code-simplification` Addy.      |
| `when-stuck-problem-solving-dispatch`    | **Надлишково**: покривається інженерними чеклистами.                           |

---

### 🧩 Фаза 2: Консолідація та злиття дублікатів (З 86 до 15 модулів)

#### 1. Фронтенд та UI/UX (з 14 до 3 скілів)

- **`ui-ux-pro-max` (Оновлений мастер-скіл UI):**
  - **Поглинає:** `shadcn`, `tailwind-design-system`, `design-taste-frontend`, `design-taste-frontend-v1`, `beautiful-design`, `frontend-design`, `canvas-design`, `web-design-guidelines`, `modern-web-guidance`, `frontend-ui-engineering` (Addy).
  - **Зміст:** Єдина вичерпна інструкція: семантичні токени (`--background`, `--card`, `--primary`), сувора заборона `purple-*`/`violet-*`, 100% Solid Sticky Headers (`thead.sticky.top-0`), відсутність дублюючих CTA, злиття класів через `cn()`, ARIA доступність, ліміт на розмір компонентів (<250-300 рядків).
- **`vercel-react-best-practices`:**
  - **Поглинає:** `vercel-composition-patterns`.
  - **Зміст:** Патерни Compound Components, усунення зайвих ререндерів, dedup мережевих запитів через `useRef`, вимкнення StrictMode double-mount, паралельні `Promise.all`.
- **`emil-design-eng` (Зберегти):**
  - **Зміст:** Фізика пружинних мікроанімацій, тактильний відгук, плавні акордеони та модалки.

#### 2. Бекенд та Бази Даних (з 10 до 3 скілів)

- **`prisma-postgres-mastery` (Нове єдине ядро БД):**
  - **Поглинає:** `supabase-postgres-best-practices`, `prisma-postgres`, `prisma-client-api`, `prisma-cli`, `db-migrations-zero-downtime`, `deprecation-and-migration` (Addy).
  - **Зміст:** 100% індекси на Foreign Keys, `timestamptz`, snake_case мапінг (`@@map`), пул з'єднань `@prisma/adapter-pg`, усунення N+1, захист від довгих `$transaction`, безпечні 3-фазні міграції Expand/Contract (`lock_timeout`, `CREATE INDEX CONCURRENTLY`).
- **`postgresql-optimization` (Зберегти & Поглибити):**
  - **Поглинає:** `postgresql-code-review`.
  - **Зміст:** GIN індекси `pg_trgm`, повнотекстовий пошук, JSONB containment (`@>`), профілювання через `EXPLAIN (ANALYZE, BUFFERS)`.
- **`nestjs-best-practices` (Зберегти):**
  - **Поглинає:** `backend-development`, `backend-patterns`.
  - **Зміст:** Суворий CQRS (Command/Query/Event Bus), валідація DTO `class-validator` (`whitelist: true`), централізовані фільтри `GlobalHttpExceptionFilter`, черги BullMQ, відсутність циклічних залежностей.

#### 3. Контроль якості, Рев'ю та Дебаг (з 11 до 3 скілів)

- **`code-review-and-audit` (Єдиний майстер аудиту якості):**
  - **Поглинає:** `fullstack-code-review`, `adver-review`, `requesting-code-review`, `code-review-reception`, `verification-before-completion`, `code-review-and-quality` (Addy).
  - **Зміст:** 5-осьове рев'ю (Correctness, Readability, Architecture, Security, Performance) + перевірка специфічних інваріантів SmartFeedStudio (ліміт <250-300 рядків, 100% двомовність i18n UA/EN, індекси PG, відсутність відносних імпортів `../`, очищення `cleanDatabase`).
- **`systematic-debugging` (Єдиний дебаг-майстер):**
  - **Поглинає:** `root-cause-tracing`, `condition-based-waiting`, `debugging-and-error-recovery` (Addy).
  - **Зміст:** 4-фазний цикл (відтворити мінімальним тестом → розкрутити стек назад → структурне архітектурне виправлення → 100% проходження тестів без мовчазних `catch {}`).
- **`code-simplification` (Новий скіл з Addy):**
  - **Зміст:** Чистий код без зміни поведінки, усунення заплутаних ланцюгів і God-функцій, тестування після кожної правки.

#### 4. Планування, Вимоги та Виконання (з 10 до 4 скілів)

- **`spec-and-interview`:**
  - **Поглинає:** `spec-driven-development` (Addy), `interview-me` (Addy), `brainstorming-ideas-into-designs`.
  - **Зміст:** Формування чітких специфікацій до написання коду; допитування вимог по 1 питанню за раз із гіпотезою при розмитих задачах.
- **`planning-and-lifecycle`:**
  - **Поглинає:** `writing-plans`, `executing-plans`, `planning-and-task-breakdown` (Addy), `invariant-checklist-generator`, `task-router`.
  - **Зміст:** Детерміновані плани у `plans/active/`, обов'язковий чеклист бізнес-інваріантів, фазове виконання, авто-переніс у `plans/completed/`.
- **`incremental-implementation` (З Addy):**
  - **Зміст:** Впровадження тонкими вертикальними слайсами (Контракт → API → UI → E2E) та автономний цикл `/build auto`.
- **`doubt-driven-development` (З Addy):**
  - **Зміст:** Змагальне перехресне опитування припущень перед зміною архітектури, безпеки чи БД.

#### 5. Тестування, Безпека & Інфраструктура (з 16 до 7 скілів)

- **`playwright-automation`:**
  - **Поглинає:** `playwright-best-practices`, `webapp-testing`, `visual-regression-testing`, `accessibility-testing`, `e2e-scenario-matrix`.
- **`browser-testing-with-devtools` (З Addy):**
  - **Зміст:** Інспекція в реальному часі через Chrome DevTools MCP.
- **`test-driven-development`:**
  - **Поглинає:** `testing-anti-patterns`, `mock-real-parity-testing`, `seed-and-fixtures-factory`.
- **`security-and-hardening`:**
  - **Поглинає:** `api-security-best-practices`, `api-security-testing`, `better-auth-security-best-practices`, `security-best-practices`.
- **`tauri-v2-security-and-ipc` (Зберегти):**
  - **Зміст:** Rust IPC команди, SQLCipher шифрування, Keychain збереження ключів.
- **`streaming-large-feeds` (Зберегти):**
  - **Зміст:** SAX/XML/CSV потоковий парсинг 100k+ SKU, backpressure, BullMQ.
- **`idempotency-and-outbox` (Зберегти):**
  - **Зміст:** `X-Idempotency-Key` у Redis, Transactional Outbox у Prisma.

#### 6. Монорепо, Git, Релізи & Скіли (з 11 до 4 скілів)

- **`git-commit` (Мастер):**
  - **Поглинає:** `git-workflow-and-versioning` (Addy).
  - **Зміст:** Zero-Broken-Build Gate (`pnpm verify:build`), Conventional Commits, SemVer тегування, авто-переніс планів.
- **`release-and-rollback`:**
  - **Поглинає:** `shipping-and-launch` (Addy).
- **`turborepo` (Зберегти):**
  - **Зміст:** Monorepo pipelines, `@smartfeed/shared` збірка, `pnpm --filter`.
- **`skill-creator` (Мастер):**
  - **Поглинає:** `writing-skills`, `testing-skills-with-subagents`, `skill-health-audit`.

---

## 🏆 5. Підсумковий реєстр 26 елітних скілів SmartFeed Studio

Після оптимізації система міститиме рівно **26 сфокусованих скілів**, які на 100% поміщаються в контекстний бюджет Antigravity IDE:

|   №    | Канонічна назва скіла               | Домен / Призначення                                  | Походження    |
| :----: | :---------------------------------- | :--------------------------------------------------- | :------------ |
| **1**  | **`backend`** (Master)              | 7-фазний життєвий цикл бекенд-розробки               | SmartFeed     |
| **2**  | **`frontend`** (Master)             | 7-фазний життєвий цикл фронтенд-розробки             | SmartFeed     |
| **3**  | **`git-commit`** (Master)           | Conventional commits, SemVer, релізи                 | SmartFeed     |
| **4**  | **`skill-creator`** (Master)        | Створення та евали скілів (поглинає аудит)           | SmartFeed     |
| **5**  | **`code-simplification`**           | Спрощення коду для ясності (clarity over cleverness) | Addy Osmani   |
| **6**  | **`interview-me`**                  | Допитування вимог по 1 питанню (Confidence %)        | Addy Osmani   |
| **7**  | **`doubt-driven-development`**      | Змагальний аудит нетривіальних рішень                | Addy Osmani   |
| **8**  | **`incremental-implementation`**    | Вертикальні слайси та цикл `/build auto`             | Addy Osmani   |
| **9**  | **`browser-testing-with-devtools`** | Chrome DevTools MCP інспекція DOM, console, net      | Addy Osmani   |
| **10** | **`code-review-and-audit`**         | 5-осьове рев'ю + інваріанти SmartFeed                | Консолідовано |
| **11** | **`systematic-debugging`**          | 4-фазний системний дебаг + Root Cause Tracing        | Консолідовано |
| **12** | **`prisma-postgres-mastery`**       | 100% FK індекси, CUID, pooling, Zero-Downtime        | Консолідовано |
| **13** | **`postgresql-optimization`**       | GIN pg_trgm, JSONB, tsvector, профілювання           | SmartFeed     |
| **14** | **`nestjs-best-practices`**         | CQRS, ValidationPipe, BullMQ, Exception Filters      | SmartFeed     |
| **15** | **`ui-ux-pro-max`**                 | shadcn, Tailwind токени, 100% Sticky Headers         | Консолідовано |
| **16** | **`vercel-react-best-practices`**   | React 18, request dedup, Compound components         | Консолідовано |
| **17** | **`emil-design-eng`**               | Пружинні мікроанімації, тактильні переходи           | SmartFeed     |
| **18** | **`spec-and-interview`**            | Специфікації до коду, аналіз вимог                   | Консолідовано |
| **19** | **`planning-and-lifecycle`**        | Плани у `plans/active/`, інваріанти, DoD             | Консолідовано |
| **20** | **`playwright-automation`**         | POM, bilingual UA/EN тести, dedup network            | Консолідовано |
| **21** | **`test-driven-development`**       | RED-GREEN-REFACTOR, Mock/Real паритет, teardown      | Консолідовано |
| **22** | **`security-and-hardening`**        | OWASP Top 10, BOLA/IDOR тести, захист токенів        | Консолідовано |
| **23** | **`tauri-v2-security-and-ipc`**     | Desktop native: SQLCipher, Keychain, IPC             | SmartFeed     |
| **24** | **`streaming-large-feeds`**         | Потоковий SAX парсинг 100k+ SKU, backpressure        | SmartFeed     |
| **25** | **`idempotency-and-outbox`**        | Redis idempotency key, Prisma outbox pattern         | SmartFeed     |
| **26** | **`turborepo`**                     | Monorepo pipelines, contracts `@smartfeed/shared`    | SmartFeed     |

---

## 🛠 6. Виправлення архітектури каталогів `.agents/` (Розблокування Antigravity IDE)

Щоб назавжди зняти помилку `The following items were excluded due to context budget limits`:

1. **Перенести великі довідники агентів у `.agents/references/`:**
   - Перенести `agents_backend.md` (86 KB) → `.agents/references/agents_backend.md`
   - Перенести `agents_frontend.md` (84 KB) → `.agents/references/agents_frontend.md`
   - Перенести `agents_review.md` (87 KB) → `.agents/references/agents_review.md`
   - Перенести `agents_devops.md` (14 KB) → `.agents/references/agents_devops.md`
   - Перенести `agents_qa.md` (15 KB) → `.agents/references/agents_qa.md`
   - Перенести `task_prompt_examples.md` (17 KB) → `.agents/references/task_prompt_examples.md`
     _Результат:_ Antigravity IDE перестане інжектувати ці 380 KB у системний промпт як правила!
2. **Стиснути `.agents/AGENTS.md`:**
   - Зменшити розмір з 75 KB до **~8-10 KB**, перетворивши його на компактний маршрутизатор та індекс 26 скілів.
3. **Оновити символічні посилання `.claude/skills/`:**
   - Створити актуальні симлінки тільки для 26 консолідованих скілів.
4. **Оновити `skills-lock.json` та `wiki/`:**
   - Синхронізувати документацію з новою компактною та потужною структурою.

---

## 📋 7. Покроковий план виконання (Task Checklist)

### Етап 1: Очищення мертвого баласту та вивільнення пам'яті IDE

- [x] 1.1. Створити каталог `.agents/references/` та перенести туди важкі довідкові файли (`agents_backend.md`, `agents_frontend.md`, `agents_review.md`, `agents_devops.md`, `agents_qa.md`, `task_prompt_examples.md`).
- [x] 1.2. Видалити 15 нерелевантних та застарілих скілів (`firebase-security-rules-auditor`, `neon-postgres`, `prisma-compute`, `prisma-upgrade-v7`, `getting-started-with-skills`, `sharing-skills`, `pulling-updates-from-skills-repository`, `gardening-skills-wiki`, `tracing-knowledge-lineages`, `preserving-productive-tensions`, `collision-zone-thinking`, `scale-game`, `inversion-exercise`, `simplification-cascades`, `when-stuck-problem-solving-dispatch`).
- [x] 1.3. Видалити нерелевантні дублікати з набору Addy (`shipping-and-launch`, `idea-refine`, `using-agent-skills`, `git-workflow-and-versioning`, `debugging-and-error-recovery`, `planning-and-task-breakdown`, `constraint-driven-development`, `frontend-ui-engineering`).

### Етап 2: Консолідація та створення цільових скілів

- [x] 2.1. Консолідувати фронтенд: створити єдиний `ui-ux-pro-max` (ввібравши shadcn, tailwind-tokens, sticky headers), оновити `vercel-react-best-practices`.
- [x] 2.2. Консолідувати бази даних: створити єдиний `prisma-postgres-mastery` (ввібравши FK indexes, snake_case, pooling, zero-downtime migrations).
- [x] 2.3. Консолідувати код-рев'ю: створити єдиний `code-review-and-quality` (5-осьовий аналіз Addy + архітектурні інваріанти SmartFeed).
- [x] 2.4. Інтегрувати золоті скіли Addy: `code-simplification`, `interview-me`, `doubt-driven-development`, `incremental-implementation`, `browser-testing-with-devtools`.
- [x] 2.5. Консолідувати тестування: об'єднати Playwright скіли у `playwright-automation`, оновити `systematic-debugging`.

### Етап 3: Реорганізація каталогів та виправлення контекстного бюджету

- [x] 3.1. Очистити каталог `.agents/skills/sub-skills/`, розмістивши всі робочі скіли безпосередньо в `.agents/skills/`.
- [x] 3.2. Регенерувати симлінки в `.claude/skills/` (100% робочих лінків без битих посилань).
- [x] 3.3. Переписати `.agents/AGENTS.md` у компактний навігатор (<10 KB).
- [x] 3.4. Оновити `skills-lock.json` та додати slash commands у `.claude/commands/` і `.agents/commands/`.

### Етап 4: Верифікація та синхронізація

- [x] 4.1. Перевірити, що всі посилання між скілами та правилами валідні (Broken links: 0).
- [x] 4.2. Перевірити проходження перевірок monorepo: `pnpm --filter @smartfeed/shared build` (Success).
- [x] 4.3. Оновити правила: заборона скидати вміст файлів у чат (Zero File Dumping in Chat).
- [x] 4.4. Перенести план у `plans/completed/audit_and_optimize_agent_skills_system.md` після успішного виконання.
