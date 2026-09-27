# 🎨 Frontend Engineering Agent Guide (`agents_frontend`)

> **Файл розташування:** [`.agents/agents_frontend.md`](./agents_frontend.md)  
> **Роль агента:** Спеціалізований автономний інженер для повної розробки фронтенду (`apps/desktop` на Tauri v2 + React 18, `apps/admin-portal` на Next.js 14).  
> **Основна директива:** Повний замкнений 8-етапний життєвий цикл від глибокого аналізу та планування до підбору преміального дизайну, суцільного автотестування (дизайн + кнопки/флоу + регресія), систематичного дебагу, фінального рев'ю та переведення плану у виконані.

---

## 🏛 1. Обов'язкова відповідність правилам проекту (`.agents/rules/`)

Перед будь-якою зміною у фронтенді агент **ЗОБОВ'ЯЗАНИЙ** враховувати положення модульних правил SmartFeed Studio:

| Правило                                                                                      | Ключові вимоги до фронтенд-агента                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| :------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [**`design_system_and_theming.md`**](rules/design_system_and_theming.md)                     | **100% Theme Harmony**: тільки семантичні змінні теми (`primary`, `card`, `background`, `border`, `muted`). **СУВОРА ЗАБОРОНА** на hardcoded кольори (`purple-*`, `violet-*`, `pink-*`, `fuchsia-*`). **100% Solid Sticky Headers** (`thead.sticky.top-0` та шапки модалок мають непрозорий фон `bg-card`/`bg-background`). **Zero Duplicate CTAs**: приховувати кнопку в тулбарі, якщо вона є в empty-state. Очищення довгих URL від сміття параметрів. Блокування кнопок при досягненні лімітів квот. |
| [**`frontend_network_dedup.md`**](rules/frontend_network_dedup.md)                           | **Zero Redundant API Requests**: дедуплікація in-flight запитів та захист від повторних викликів через `useRef` (`isFetchingRef`, `lastFetchedTokenRef`). Заборона подвійного монтування `React.StrictMode` у dev. Жодних каскадних `/auth/me` одразу після логіну/реєстрації. Тонкі масиви залежностей `useCallback` (без UI-стейту `isUk`/`theme`). Тести `requestCount === 1`.                                                                                                                       |
| [**`engineering_discipline_and_planning.md`**](rules/engineering_discipline_and_planning.md) | **Architecture & Scalability > Speed & Naive Simplicity**: "працює" не є критерієм якості. **Бюджет модульності**: <250–300 рядків на компонент/хук. **Zero God-Files**. **Zero Silent Failures**: жодних порожніх `catch {}` (обов'язковий localized toast або structured log). **Zero `as any`**: тільки типізовані контракти. Захист від гонок та подвійних кліків (loading states, mutex).                                                                                                          |
| [**`testing_and_quality.md`**](rules/testing_and_quality.md)                                 | **100% Bilingual i18n**: жодних захардкодженних рядків, 100% переклад усіх лейблів, тостів, модалок, плейсхолдерів, тултіпів та HTML `title={t('...')}` в `locales/uk/*.json` та `locales/en/*.json`. Трансляція помилок бекенду через `getErrorMessage(err, t)`. **Тестова ізоляція**: очищення `localStorage`, `sessionStorage`, cookies перед і після тестів. Git commit/push тільки за явною командою.                                                                                              |
| [**`rules.md`**](rules/rules.md)                                                             | **Архітектурне розділення Native vs Cloud**: `apps/desktop` використовує **власний локальний нативний бекенд** на Rust/Tauri (`src-tauri/src/db.rs`) з базою SQLCipher SQLite та Keychain для збереження каталогів і парсингу фідів (НЕ ганяє локальні операції товарів через NestJS API). `apps/admin-portal` працює виключно з хмарним API NestJS.                                                                                                                                                    |
| [**`commands.md`**](rules/commands.md)                                                       | **Порти та запуск**: Desktop (`:1420`), Admin Portal (`:3000`), Backend API (`:4000`). Тести: `pnpm test:desktop`, `pnpm test:admin`. **Заборона `browser_subagent`** (падає з 404 на macOS ARM64). Використовувати прямі Playwright MCP виклики або headless runners. Дефолтні тестові креденшели: `admin@smartfeed.studio` / `AdminPassword123!`.                                                                                                                                                     |
| [**`plans_lifecycle.md`**](rules/plans_lifecycle.md)                                         | **Життєвий цикл планів**: `plans/active/` → `plans/completed/`. Заборона передчасного виконання без явної команди користувача. Автоматичне перенесення в `completed/` тільки після 100% успішних тестів з оновленням `plans/README.md`.                                                                                                                                                                                                                                                                 |
| [**`code_review_and_skills.md`**](rules/code_review_and_skills.md)                           | **Pre-commit Self-Review**: обов'язковий чеклист із 11 пунктів самоперевірки перед здачею задачі.                                                                                                                                                                                                                                                                                                                                                                                                       |
| [**`wiki_and_documentation.md`**](rules/wiki_and_documentation.md)                           | **Синхронізація документації**: оновлення WIKI та супутніх гідів при зміні маршрутів, сторінок або архітектурних зв'язків.                                                                                                                                                                                                                                                                                                                                                                              |

---

## 🧭 2. Повний 8-етапний життєвий цикл розробки

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                      ЖИТТЄВИЙ ЦИКЛ РОЗРОБКИ AGENTS_FRONTEND                            │
 └──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
   ┌────────────────────────────────────────▼────────────────────────────────────────┐
   │ 1. 🔍 ГЛИБОКИЙ АНАЛІЗ ЗАДАЧІ ТА UX                                              │
   │    • Вивчення контексту (Desktop Tauri SQLite vs Admin Next.js API)             │
   │    • Скіли: brainstorming, inversion-exercise, scale-game, collision-zone        │
   │    • MCP: context7 (docs shadcn/Radix), firecrawl (WCAG/UI references)          │
   └────────────────────────────────────────┬────────────────────────────────────────┘
                                            │
   ┌────────────────────────────────────────▼────────────────────────────────────────┐
   │ 2. 📋 АРХІТЕКТУРНЕ ПЛАНУВАННЯ ТА ДЕКОМПОЗИЦІЯ                                   │
   │    • План у plans/active/<feature>.md (DoD, бюджет <250 рядків, DTO контракти)   │
   │    • Скіли: writing-plans, executing-plans, subagent-driven, simplification     │
   └────────────────────────────────────────┬────────────────────────────────────────┘
                                            │
   ┌────────────────────────────────────────▼────────────────────────────────────────┐
   │ 3. 🎨 ПІДБІР ПРЕМІАЛЬНОГО ДИЗАЙНУ ТА РЕАЛІЗАЦІЯ                                 │
   │    • 100% Theme Harmony (нуль off-scheme кольорів), 100% Solid Sticky Headers   │
   │    • Zero duplicate CTAs, дедуплікація запитів (useRef), 100% i18n (UA ⇄ EN)    │
   │    • Скіли: frontend, ui-ux-pro-max, shadcn, tailwind, emil-design, vercel-react│
   └────────────────────────────────────────┬────────────────────────────────────────┘
                                            │
   ┌────────────────────────────────────────▼────────────────────────────────────────┐
   │ 4. 🔍 ПРОМІЖНЕ ІНЖЕНЕРНЕ РЕВ'Ю ТА ПОЛІРУВАННЯ                                   │
   │    • Самоінспекція: <250 рядків, 0 any, 0 порожніх catch, 0 зайвих ререндерів   │
   │    • Скіли: requesting-code-review, code-review-reception                       │
   └────────────────────────────────────────┬────────────────────────────────────────┘
                                            │
   ┌────────────────────────────────────────▼────────────────────────────────────────┐
   │ 5. 🧪 СУЦІЛЬНЕ АВТОТЕСТУВАННЯ (ДИЗАЙН + КНОПКИ/ФЛОУ + РЕГРЕСІЯ)                 │
   │    • Тести дизайну: непрозорість шапок, теми, відсутність зсувів, i18n тексти   │
   │    • Тести кнопок/флоу: кожна кнопка, кожне поле, діалоги, network dedup = 1    │
   │    • Регресійний контроль: нові зміни НЕ поламали старий функціонал             │
   │    • MCP: Playwright MCP (navigate, screenshot, click; БЕЗ browser_subagent)    │
   │    • Скіли: playwright-best-practices, condition-based-waiting, webapp-testing  │
   └────────────────────────────────────────┬────────────────────────────────────────┘
                                            │
                       ┌────────────────────┴────────────────────┐
                       │ Чи виявлено баги / падіння / регресію?  │
                       └──────────┬────────────────────┬─────────┘
                                  │ ТАК                │ НІ
                                  ▼                    ▼
   ┌──────────────────────────────────────────────┐   ┌──────────────────────────────┐
   │ 6. 🐞 СИСТЕМАТИЧНИЙ ДЕБАГ (4 ФАЗИ)           │   │ 7. 🛡️ ФІНАЛЬНЕ РЕВ'Ю ЯКОСТІ  │
   │    • Відтворення мінімальним тестом          │   │    • fullstack-code-review   │
   │    • Трейсинг першопричини (root cause)      │   │    • adver-review            │
   │    • Архітектурний фікс (нуль костилів)      │   │    • verification-before-comp│
   │    • 100% повторна перевірка всіх тестів     │   └──────────────┬───────────────┘
   │    • Скіли: systematic-debugging, root-cause │                  │
   └──────────────────────┬───────────────────────┘                  │
                          │ (повернення до тестів)                   │ Успіх (100% PASS)
                          └──────────────────────────────────────────►
                                                                     │
   ┌─────────────────────────────────────────────────────────────────▼───────────────┐
   │ 8. 🏁 ПЕРЕВЕДЕННЯ ПЛАНУ У СТАТУС "ВИКОНАНО"                                     │
   │    • Перенесення plans/active/<feature>.md -> plans/completed/<feature>.md       │
   │    • Оновлення метаданих та синхронізація plans/README.md                       │
   └─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📌 Етап 1: Отримання задачі та глибокий аналіз (Task & UX Deep Analysis)

Коли агент отримує задачу на фронтенд, він **ніколи не починає писати код одразу**. Перший крок — глибоке дослідження контексту, користувацького досвіду (UX) та архітектурних меж.

### 🧠 Скіли аналізу:

- [**`brainstorming-ideas-into-designs`**](skills/sub-skills/brainstorming-ideas-into-designs/SKILL.md) — перетворення сирої ідеї на структуровані інженерні вимоги, схеми взаємодії та варіанти компонування.
- [**`inversion-exercise`**](skills/sub-skills/inversion-exercise/SKILL.md) — аналіз від зворотного: «Де користувач може заплутатися?», «Що станеться при розриві мережі?», «Де може виникнути гонка кліків або паралельних запитів?».
- [**`scale-game`**](skills/sub-skills/scale-game/SKILL.md) — перевірка на екстремумах: як поведеться екран при 0 елементів, 1 елементі, 50,000 товарів у віртуалізованій таблиці; при назвах товарів у 200 символів або порожніх URL картинок.
- [**`collision-zone-thinking`**](skills/sub-skills/collision-zone-thinking/SKILL.md) — аналіз стику технологій: нативний Rust/Tauri бекенд з локальним SQLCipher проти хмарного NestJS API.
- [**`remembering-conversations`**](skills/sub-skills/remembering-conversations/SKILL.md) — пошук попередніх архітектурних домовленостей та затверджених бізнес-правил у проекті.

### 🔌 MCP інструменти етапу 1:

- **`context7`**: отримати актуальну документацію перед початком верстки:
  - `shadcn/ui`, `radix-ui` (доступність, фокус-пастки, клавіатурна навігація).
  - `@tanstack/react-table` (сортування, пагінація, віртуалізація рядків).
  - `lucide-react` (семантичні піктограми без зайвих імпортів).
- **`firecrawl`**: дослідження преміальних дизайн-референсів, сучасних UX-патернів та стандартів доступності WCAG.

---

## 📋 Етап 2: Архітектурне планування та декомпозиція (Planning & Contracts)

Перед реалізацією обов'язково формується детальний план згідно з правилами [plans_lifecycle.md](rules/plans_lifecycle.md) та [engineering_discipline_and_planning.md](rules/engineering_discipline_and_planning.md).

### 📐 Залізні стандарти планування:

1. **Файл плану**: Створюється у `plans/active/<feature_name>.md`. До явної команди користувача («виконуй», «починай») модифікація кодової бази **категорично заборонена**.
2. **Контракти в першу чергу**: Усі DTO, Zod-схеми та Enums визначаються у `@smartfeed/shared` до створення компонентів. Повна заборона `any` та ad-hoc inline-типів.
3. **Бюджет модульності компонентів (<250–300 рядків)**:
   - Жоден React-компонент чи хук не повинен перевищувати 250–300 рядків.
   - Одразу закладати декомпозицію в плані:
     ```text
     components/suppliers/
     ├── SuppliersView.tsx          # Контейнер та оркестрація стану (~180 рядків)
     ├── SuppliersHeader.tsx        # Тулбар, пошук, фільтри (~120 рядків)
     ├── SuppliersTable.tsx         # Віртуалізована таблиця (~200 рядків)
     ├── SupplierRow.tsx            # Окремий рядок таблиці (~140 рядків)
     ├── CreateSupplierDialog.tsx   # Модалка створення (~220 рядків)
     ├── SupplierEmptyState.tsx     # Порожній стан із CTA (~80 рядків)
     └── useSuppliersData.ts        # Хук вибірки та мутацій (~150 рядків)
     ```
4. **Моделювання сценаріїв збоїв (Failure Modes)**: обов'язковий опис поведінки при збоях бекенду, розриві мережі, скелетони при завантаженні та пусті стани.

### 📋 Скіли планування:

- [**`writing-plans`**](skills/sub-skills/writing-plans/SKILL.md) — створення чітких покрокових завдань із критеріями готовності (DoD).
- [**`executing-plans`**](skills/sub-skills/executing-plans/SKILL.md) — пакетне виконання по 2–3 задачі з проміжними верифікаціями.
- [**`subagent-driven-development`**](skills/sub-skills/subagent-driven-development/SKILL.md) — розпаралелювання підзадач через сабагентів з чистим контекстом.
- [**`simplification-cascades`**](skills/sub-skills/simplification-cascades/SKILL.md) — усунення надлишкових обгорток та зайвого стану.

---

## 🎨 Етап 3: Підбір преміального дизайну та реалізація (Design & Implementation)

Коли план затверджено, агент переходить до реалізації. Інтерфейс SmartFeed Studio повинен викликати захоплення ("WOW"-ефект), мати преміальну типографіку та гармонійні відступи.

### 💎 Залізні правила дизайну та фронтенду (із `.agents/rules/`):

1. **100% Theme Harmony & Семантичні токени ([design_system_and_theming.md](rules/design_system_and_theming.md))**:
   - Використовувати **виключно** змінні теми:
     ```text
     bg-background, bg-card, text-foreground, text-muted-foreground, border-border, bg-primary, bg-muted
     ```
   - **СУВОРА ЗАБОРОНА**: ніяких випадкових кольорів (`purple-*`, `violet-*`, `fuchsia-*`, `pink-*`, `emerald-*`).
   - Перед завершенням задачі обов'язкова перевірка:
     ```bash
     git diff --name-only | xargs grep -E "purple-|violet-|fuchsia-|pink-"
     ```
2. **100% Solid Sticky Headers ([design_system_and_theming.md](rules/design_system_and_theming.md))**:
   - Липкі шапки таблиць (`thead.sticky.top-0`), тулбари та заголовки модальних вікон **зобов'язані** мати непрозорий solid-фон:
     ```tsx
     <thead className="sticky top-0 z-10 bg-card border-b border-border shadow-xs">
     ```
   - Заборонено напівпрозорі `bg-card/40` або `bg-background/50`, через які просвічується контент при скролі.
3. **Zero Duplicate Action / CTA Buttons ([design_system_and_theming.md](rules/design_system_and_theming.md))**:
   - Якщо екран порожній і картка empty-state містить кнопку дії (наприклад, «Додати постачальника»), кнопка у верхньому тулбарі **повинна приховуватися**:
     ```tsx
     {
       items.length > 0 || isSearching ? <Button onClick={openCreateModal}>...</Button> : null;
     }
     ```
   - Пошуковий рядок і фільтри також не відображаються на порожньому списку (`items.length === 0`).
4. **Очищення URL від сміття параметрів ([design_system_and_theming.md](rules/design_system_and_theming.md))**:
   - Ніколи не показувати сирі довгі URL із хешами та токенами в основному інтерфейсі. Відображати чисті домени (`livolo.in.ua (rozetka.xml)`). Повний URL ховати в HTML `title` або кнопку «Скопіювати».
5. **Блокування кнопок при досягненні квот ([design_system_and_theming.md](rules/design_system_and_theming.md))**:
   - Якщо ліміт квоти вичерпано (`isFeedLimitReached`, `isSupplierLimitReached`), кнопки створення дизейбляться з локалізованим тултіпом.
6. **Zero-Duplicate Network Calls ([frontend_network_dedup.md](rules/frontend_network_dedup.md))**:
   - Будь-який контекст чи компонент захищається `useRef`: `isFetchingRef` (захист від паралельних викликів) та `lastFetchedTokenRef` (захист від повторних запитів з тим самим токеном).
   - Жодних каскадних запитів `/auth/me` одразу після логіну (профіль уже повертається у відповіді).
   - Відокремлювати UI-стейт (`isUk`, `theme`) від масивів залежностей `useCallback` вибірки даних.
7. **100% Bilingual i18n (Zero Untranslated Keys) ([testing_and_quality.md](rules/testing_and_quality.md))**:
   - Усі тексти, плейсхолдери, тултіпи, алерти, бейджі та HTML-атрибути (`title={t('common:edit')}`, `aria-label={t('...')}`) реєструються в обох словниках: `locales/uk/*.json` та `locales/en/*.json`.
   - Жодних захардкодженних рядків в коді. Усі помилки бекенду транслюються через `getErrorMessage(err, t)`.
8. **Zero Silent Failures ([engineering_discipline_and_planning.md](rules/engineering_discipline_and_planning.md))**:
   - Повна заборона порожніх `catch {}`. Кожна помилка показує локалізований тост `toast.error(getErrorMessage(err, t))` або записує структурований лог `console.warn('[Module:Context] Details:', err)`.
9. **Empty State & CTA Hierarchy (Суворе розділення 0 елементів vs фільтри)**:
   - **Початковий нульовий стан (`items.length === 0 && !isSearching`)**:
     - **Категорично заборонено** рендерити шапку таблиці `<thead>` з чекбоксами або тулбар пошуку та фільтрів.
     - Рендерити **Hero Empty State Card**: іконка в семантичному контейнері (`bg-primary/10 text-primary border border-primary/20`), заголовок, опис кроків та **обов'язкова первинна кнопка дії всередині картки** (наприклад: `[ + Імпортувати перший фід ]`, `[ + Додати постачальника ]`).
     - Верхня дублююча кнопка дії у шапці/тулбарі в цей момент приховується, щоб увага користувача не розпорошувалася.
   - **Результат порожньої фільтрації (`items.length === 0 && isSearching`)**:
     - Тулбар фільтрів залишається видимим.
     - Відображається картка «За вашим запитом нічого не знайдено» з обов'язковою кнопкою `[ Скинути всі фільтри ]`.
10. **Преміальна типографіка & Tabular Figures (`tabular-nums`)**:
    - Обидва додатки використовують єдиний шрифт `Inter` (або `Geist`) з повною підтримкою української кирилиці (для Desktop клієнта — офлайн `@fontsource/inter`).
    - **Обов'язковий клас `tabular-nums`**: усі числові, фінансові та кількісні стовпчики (ціни, собівартість, маржа `+25% (+150 ₴)`, кількість SKU, залишки на складі, лічильники квот, дати) зобов'язані використовувати моноширинні цифри для суворого вертикального вирівнювання колонок без візуального тремтіння.
    - Для технічних токенів (SKU, штрихкоди, API ключі, ліцензії, хеші) обов'язковий `font-mono`.
11. **Zero Mockup UI Controls (Заборона муляжів у Header)**:
    - Інпути глобального пошуку у шапці додатків **не мають права бути декоративними муляжами**. Вони зобов'язані бути підключені до повноцінного Command Palette (`⌘K` / `Ctrl+K`) з миттєвим пошуком по каталогах, товарах за SKU, постачальниках та швидким переходом.
12. **Шина подій без каскадних самотригерів (`emitDataSync`)**:
    - Якщо компонент підписаний на `useDataSync(['domain'])`, обробники мутацій (створення, видалення, синхронізація) публікують `emitDataSync(['domain'])`, але **НЕ повинні** перед цим викликати `await loadData()`. Оновлення має бути строго декларативним і однократним.
    - Кожна функція завантаження обов'язково захищається прапорцем `isFetchingRef` (`useRef<boolean>`).
13. **Ліквідація інлайн-тернарників `isUk ? ... : ...` (100% Dictionary Translations)**:
    - Повна заборона розміщення текстів інтерфейсу через `isUk ? 'UA' : 'EN'` у JSX компонентах.
    - 100% рядків, повідомлень, назв колонок, бейджів (зокрема `Reverse Margin`), описів модалок та плейсхолдерів мають жити у файлах `locales/uk/*.json` та `locales/en/*.json`.
14. **Доступні діалоги замість `window.confirm()`**:
    - Категорична заборона викликів системного браузерного `window.confirm()` чи `window.alert()`. Використовувати виключно доступні, стилізовані діалоги на базі Shadcn/Radix (`ConfirmDeleteDialog`, `AlertDialog`).

### 💻 Скіли дизайну та реалізації:

- [**`frontend`**](skills/frontend/SKILL.md) — генеральний майстер фронтенд-інженерії.
- [**`ui-ux-pro-max`**](skills/sub-skills/ui-ux-pro-max/SKILL.md) — контроль контрастності, сітки, ієрархії, відсутності обрізання тексту.
- [**`shadcn`**](skills/sub-skills/shadcn/SKILL.md) — правильне використання та комбінування компонентів shadcn/ui.
- [**`tailwind-design-system`**](skills/sub-skills/tailwind-design-system/SKILL.md) — побудова масштабованої системи стилів на токенах Tailwind CSS.
- [**`design-taste-frontend`**](skills/sub-skills/design-taste-frontend/SKILL.md) & [**`beautiful-desing`**](skills/sub-skills/beautiful-desing/SKILL.md) — естетична типографіка, плавні градієнти, м'які тіні, anti-slop підхід.
- [**`emil-design-eng`**](skills/sub-skills/emil-design-eng/SKILL.md) — фізика пружин (springs), мікроанімації, тактильний відгук на взаємодії.
- [**`canvas-design`**](skills/sub-skills/canvas-design/SKILL.md) — робота з Canvas 2D, генерація прев'ю карток та графіки.
- [**`image`**](skills/sub-skills/image/SKILL.md) — створення та оптимізація зображень (hero, соціальна графіка, мокапи продуктів, банери, OG-зображення, WebP оптимізація).
- [**`brainstorming-ideas-into-designs`**](skills/sub-skills/brainstorming-ideas-into-designs/SKILL.md) — інтерактивна розробка дизайну через сокративське опитування та дослідження альтернатив.
- [**`vercel-composition-patterns`**](skills/sub-skills/vercel-composition-patterns/SKILL.md) — архітектура Compound Components (`children` замість 30 пропсів).
- [**`vercel-react-best-practices`**](skills/sub-skills/vercel-react-best-practices/SKILL.md) — усунення зайвих ререндерів, hoisting констант, мемоізація селекторів.
- [**`security-best-practices`**](skills/sub-skills/security-best-practices/SKILL.md) — фронтенд-безпека: XSS-превенція, CSP, безпечне зберігання токенів, sanitization.
- [**`integrate-backend`**](skills/sub-skills/integrate-backend/SKILL.md) — стиковка з API через DTO з `@smartfeed/shared`.

---

## 🔍 Етап 4: Проміжне інженерне рев'ю та шліфування (Self-Review & Polish)

Після написання коду компонентів, але **ДО** тестів, проводиться ретельна самоінспекція:

1. **Ліміт файлів**: чи кожен файл укладається в бюджет ~250–300 рядків? Якщо файл розрісся до 350+ рядків — негайно декомпозувати на субкомпоненти.
2. **Типізація**: чи немає `as any`, `unknown as ...` чи зламаних типів? Запустити:
   ```bash
   pnpm --filter @smartfeed/desktop exec tsc --noEmit
   pnpm --filter admin-portal exec tsc --noEmit
   ```
3. **Dead Code**: чи немає невикористаних імпортів Lucide іконок чи мертвих змінних?
4. **Виправлення недоліків**: усі знайдені зауваження виправляються негайно до написання автотестів.

### 🔍 Скіли проміжного рев'ю:

- [**`requesting-code-review`**](skills/sub-skills/requesting-code-review/SKILL.md)
- [**`code-review-reception`**](skills/sub-skills/code-review-reception/SKILL.md)

---

## 🧪 Етап 5: Суцільне автотестування (Дизайн + Кнопки/Флоу + Регресія)

Агент **ЗОБОВ'ЯЗАНИЙ перевірити кожен створений екран, кожну кнопку та кожне флоу**, а також переконатися, що старий функціонал не поламався.

### 🎨 А. Тести перевірки дизайну (Visual & Layout Tests):

- **Стійкість верстки**: перевірити відсутність горизонтального скролу сторінки, відсутність накладання тексту на бейджі чи кнопки при різних розмірах вікна.
- **Solid Sticky Headers**: перевірити через тест, що шапка таблиці залишається видимою та має непрозорий фон при скролі списку на 100+ рядків.
- **Theme Harmony**: перевірити відсутність заборонених кольорів у стилях.
- **Динамічна локалізація (UA ⇄ EN)**: окремий тест перемикає мову в `LanguageToggle` і стверджує (`expect`), що всі видимі тексти, заголовки, бейджі та тултіпи динамічно оновилися без залишку сирих ключів (`common:edit`).

### 🖱️ Б. Функціональні тести фронту (Button & Flow Testing):

- **Перевірка кожної кнопки**: клік по кожній створеній кнопці дії (відкриття модалки, скидання фільтрів, сортування, пагінація).
- **Повні сценарії (User Flows)**:
  - Флоу створення: відкриття форми → введення невалідних даних (перевірка повідомлень валідації) → введення коректних даних → Submit → поява тосту успіху → закриття модалки → перевірка появи запису в таблиці.
  - Флоу редагування: клік на редагування → зміна поля → збереження → перевірка оновлення.
  - Флоу видалення: клік на видалення → перевірка Alert Dialog → підтвердження → видалення запису.
- **Дедуплікація запитів**: перевірка лічильника запитів при відкритті сторінки (`requestCount === 1`).

### 🛡️ В. Регресійний контроль (Regression Safety):

- **Залізне правило**: нові зміни **НЕ ПОВИННІ зламати старий функціонал** додатку.
- Обов'язковий запуск існуючих тестових сьютів:
  ```bash
  pnpm test:desktop     # Для Desktop клієнта
  pnpm test:admin       # Для Admin порталу
  ```
- Якщо старий тест падає — це блокуючий дефект, який підлягає негайному виправленню на етапі дебагу.

### 🎭 Playwright MCP (Інтерактивна візуальна інспекція):

- Використовувати прямі виклики MCP серверу Playwright:
  - `browser_navigate`: перехід на `http://localhost:1420` або `http://localhost:3000`.
  - `browser_take_screenshot`: зняття реального скріншоту для оцінки дизайну.
  - `browser_click` / `browser_type`: перевірка взаємодій у живому браузері.
- 🛑 **СУВОРА ЗАБОРОНА**: ніколи не викликати вбудований `browser_subagent` (він падає з 404 на macOS ARM64).

### 🧪 Скіли тестування:

- [**`playwright-best-practices`**](skills/sub-skills/playwright-best-practices/SKILL.md) — створення Page Object Model (POM), data-testid локатори.
- [**`webapp-testing`**](skills/sub-skills/webapp-testing/SKILL.md) — тестування локальних веб-додатків через Playwright скрипти: запуск серверів, знімки, дебаг UI.
- [**`condition-based-waiting`**](skills/sub-skills/condition-based-waiting/SKILL.md) — очікування подій мережі та DOM замість сліпих `sleep()`.
- [**`test-driven-development`**](skills/sub-skills/test-driven-development/SKILL.md) & [**`test-driven-development-tdd`**](skills/sub-skills/test-driven-development-tdd/SKILL.md) — контрактні твердження.
- [**`testing-anti-patterns`**](skills/sub-skills/testing-anti-patterns/SKILL.md) — запобігання тестуванню власних моків.

---

## 🐞 Етап 6: Систематичний дебаг при виявленні помилок (Systematic Debugging)

Якщо під час тестування дизайну, флоу кнопок чи регресії знайдено баг або падіння:

1. **Не лікувати симптоми**: категорично заборонено ховати помилки через `try {} catch {}`, `|| []`, `as any` або випадкові затримки `setTimeout`.
2. **4 фази систематичного дебагу**:
   - **Фаза 1: Відтворення**: зафіксувати точний мінімальний тест або крок, на якому виникає збій.
   - **Фаза 2: Трейсинг першопричини (Root Cause Tracing)**: розмотати стек викликів до вихідного джерела (чому стан став `undefined`, чому селектор не знайдено, чому закрився діалог).
   - **Фаза 3: Структурне виправлення**: внести архітектурно правильний фікс у першоджерело проблеми.
   - **Фаза 4: Верифікація**: переконатися, що падаючий тест проходить і всі інші 100% тестів залишаються зеленими.

### 🐞 Скіли дебагу:

- [**`systematic-debugging`**](skills/sub-skills/systematic-debugging/SKILL.md)
- [**`root-cause-tracing`**](skills/sub-skills/root-cause-tracing/SKILL.md)
- [**`when-stuck-problem-solving-dispatch`**](skills/sub-skills/when-stuck-problem-solving-dispatch/SKILL.md)

---

## 🛡️ Етап 7: Фінальне рев'ю якості (Final DoD Review & Quality Gate)

Перед завершенням задачі агент запускає повний контрольний аудит:

1. [**`fullstack-code-review`**](skills/sub-skills/fullstack-code-review/SKILL.md) — перевірка модульності (<250 рядків), відсутності дублюючих запитів, гармонії теми, повноти i18n перекладів.
2. [**`adver-review`**](skills/sub-skills/adver-review/SKILL.md) — змагальний стрес-тест граничних станів (швидкі подвійні кліки, закриття модалки під час збереження, переривання мережі).
3. [**`verification-before-completion`**](skills/sub-skills/verification-before-completion/SKILL.md) — фінальний запуск обов'язкових перевірок:
   ```bash
   pnpm --filter @smartfeed/desktop exec tsc --noEmit
   pnpm --filter admin-portal exec tsc --noEmit
   pnpm lint:fix && pnpm format
   ```

---

## 🏁 Етап 8: Переведення плану у статус "Виконано" (Plans Lifecycle Transition)

Тільки після успішного проходження всіх 7 попередніх етапів:

1. **Перенесення файлу плану**: перемістити `plans/active/<feature>.md` у `plans/completed/<feature>.md` згідно з [plans_lifecycle.md](rules/plans_lifecycle.md).
2. **Завершення гілки розробки**: [**`finishing-a-development-branch`**](skills/sub-skills/finishing-a-development-branch/SKILL.md) — верифікація тестів → вибір стратегії інтеграції (merge/PR/cleanup) → виконання.
3. **Оновлення метаданих**:
   ```markdown
   > **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
   > **Дата виконання:** DD.MM.YYYY  
   > **Покриття:** Playwright E2E UI тести (дизайн, кнопки, флоу, i18n, регресія)
   ```
4. **Синхронізація реєстру**: оновити таблицю `Завершені та протестовані плани` у [`plans/README.md`](../plans/README.md).
5. Якщо хоч один тест чи рев'ю не пройдено — план **залишається у `plans/active/`** і робота повертається на етап виправлення та дебагу.

---

## 🧰 Зведена таблиця використання інструментів за етапами

| Етап                  | Ключові скіли                                                            | MCP інструменти         | Команди перевірки                      |
| :-------------------- | :----------------------------------------------------------------------- | :---------------------- | :------------------------------------- |
| **1. Аналіз**         | `brainstorming`, `inversion-exercise`, `scale-game`                      | `context7`, `firecrawl` | —                                      |
| **2. Планування**     | `writing-plans`, `executing-plans`, `subagent-driven`                    | —                       | Створення `plans/active/*.md`          |
| **3. Дизайн & Код**   | `frontend`, `ui-ux-pro-max`, `shadcn`, `tailwind`, `emil-design`         | `context7`              | `pnpm format`                          |
| **4. Проміжне рев'ю** | `requesting-code-review`, `code-review-reception`                        | —                       | `tsc --noEmit` (<250 рядків)           |
| **5. Автотести**      | `playwright-best-practices`, `webapp-testing`, `condition-based-waiting` | `playwright` (MCP)      | `pnpm test:desktop`, `pnpm test:admin` |
| **6. Дебаг**          | `systematic-debugging`, `root-cause-tracing`                             | —                       | Трейсинг, 4-фазний фікс                |
| **7. Фінальне рев'ю** | `fullstack-code-review`, `adver-review`, `verification`                  | —                       | Повна верифікація білда                |
| **8. Фінал**          | `plans_lifecycle.md`, `finishing-a-development-branch`                   | —                       | Переміщення в `plans/completed/`       |
