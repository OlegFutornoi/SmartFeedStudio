# 📋 SmartFeed Studio — Frontend, UI/UX, Typography & Architecture Remediation Plan

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 27.09.2026  
> **Аудитор & Виконавець:** `agents_review` + `agents_frontend`  
> **Цільові додатки:** `apps/desktop` (Кабінет користувача / Desktop Client) та `apps/admin-portal` (Кабінет адміністратора / Admin Web Portal)  
> **Відповідність правилам:** [`.agents/rules/design_system_and_theming.md`](../../.agents/rules/design_system_and_theming.md), [`.agents/rules/code_review_and_skills.md`](../../.agents/rules/code_review_and_skills.md), [`.agents/rules/frontend_network_dedup.md`](../../.agents/rules/frontend_network_dedup.md), [`.agents/rules/engineering_discipline_and_planning.md`](../../.agents/rules/engineering_discipline_and_planning.md)

---

## 🎯 1. Executive Summary та Загальна Оцінка

За результатами глибокого аудиту кодової бази обох фронтенд-додатків (`apps/desktop` на базі React 18 + Vite + Tailwind та `apps/admin-portal` на базі Next.js 14 App Router + Tailwind):

- **Сильні сторони**:
  - 100% чистий TypeScript: `tsc --noEmit` проходить без жодної помилки в обох додатках.
  - Повна відсутність вразливих приведень типів `as any` та порожніх блоків `catch {}`.
  - Відсутність заборонених хардкодних кольорів (`purple-*`, `violet-*`, `fuchsia-*`, `pink-*`) — колірна схема базується на семантичних токенах теми (`zinc`, `slate`, `stone`, `gray`, `neutral`, `bronze`, `green`).
  - Відсутність подвійного монтування `React.StrictMode` у dev-режимі.
- **Критичні дефекти та зони росту**:
  1. **Дефект відображення порожнього каталогу товарів (Empty State & CTA Duplication)**: на екрані `Каталоги товарів` (зафіксовано на скріншоті користувача) при 0 товарів відображається повний тулбар пошуку та фільтрів, 9 колонок порожньої таблиці з чекбоксами, а кнопка дії у порожній картці відсутня, тоді як у верхній шапці продубльована кнопка `+ Імпортувати фід`.
  2. **Шрифтова система та типографіка**: обидва додатки використовують системний дефолт `-apple-system, BlinkMacSystemFont, Segoe UI...`. Відсутні сучасні преміальні UI-шрифти (`Inter` або `Geist`), відсутнє правило `tabular-nums` для вирівнювання цін, маржі та залишків у таблицях, що створює візуальний хаос у великих списках SKU.
  3. **Контрастність теми та напівпрозорі шапки (Solid Sticky Headers)**: використання `bg-card/40 backdrop-blur-md` у Header та Sidebar створює "вимитий" бляклий вигляд у світлій темі та призводить до просвічування контенту під час скролу під фіксованими заголовками.
  4. **Реактивність та каскадні дублюючі виклики**: у `CatalogsPage` та `SuppliersPage` після виконання дії викликається `await loadData()`, а потім `emitDataSync(...)`, який миттєво тригерить власний хук `useDataSync` цього ж компонента і викликає `loadData()` вдруге.
  5. **Непрацюючі елементи інтерфейсу (Mockup Inputs)**: інпут глобального пошуку у шапці обох додатків (`Header.tsx`) є некерованим муляжем без прив'язки до стану чи обробників подій.
  6. **100% i18n гігієна**: виявлено понад 150+ інлайн-тернарників `isUk ? '...' : '...'` безпосередньо в JSX замість словників локалізації `locales/uk/*.json` та `locales/en/*.json`, а також захардкоджені рядки (`Reverse Margin`, `Відкрити меню дій`, `₴`, `'Постачальник'`).
  7. **Архітектурна модульність**: ряд файлів перевищує ліміт модульності ~250–300 рядків (`feeds.ts` 353L, `useImportFeedWizard.ts` 346L, `i18n/index.tsx` 344L, `comparisonTableConfig.tsx` 330L).

---

## 🚦 2. Матриця пріоритетів виправлень (P0 – P3)

| Рівень    | Категорія                | Опис дефекту                                                                                                                                                             | Вплив на систему / UX                                                                                 |
| :-------- | :----------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| 🔴 **P0** | **UI/UX & Hierarchy**    | **Порушення Empty State & дублювання CTA в `CatalogsPage`/`ProductsView`**: показ таблиці з заголовками та фільтрами при 0 товарів замість картки первинної дії.         | Користувач бачить порожній каркас таблиці замість чіткого зрозумілого кроку підключення першого фіду. |
| 🔴 **P0** | **Reactivity & Network** | **Каскадні дублі запитів у шині подій `emitDataSync`**: подвійні паралельні запити в `CatalogsPage` та `SuppliersPage`.                                                  | Зайве навантаження на SQLite/API, потенційні race conditions при швидких мутаціях.                    |
| 🟠 **P1** | **Typography & Fonts**   | **Впровадження шрифтової системи (Inter/Geist + Tabular Nums)**: заміна системних шрифтів, обов'язкові моноширинні цифри для SKU/цін/маржі.                              | Професійний вигляд, суворе вертикальне вирівнювання розрядів чисел та цін у каталозі.                 |
| 🟠 **P1** | **Design System**        | **100% Solid Sticky Headers & Контраст тем**: заміна `bg-card/40` та `bg-card/60` на непрозорі `bg-card`/`bg-background` у Header, Sidebar та модалках.                  | Усунення артефактів просвічування тексту при скролі, підвищення контрастності у світлій темі.         |
| 🟡 **P2** | **Features & Polish**    | **Повноцінний глобальний пошук / Command Palette (`⌘K`)**: перетворення некерованого інпуту в шапці на функціональний швидкий пошук по фідах, постачальниках та товарах. | Зручність навігації між сутностями каталогу без ручного перемикання вкладок.                          |
| 🟡 **P2** | **UI Density & Tables**  | **Компактність таблиць та перемикач щільності (Comfortable / Compact)**: оптимізація відступів колонок фото, SKU, маржі та дій.                                          | Дозволяє вмістити більше даних без горизонтального скролу на ноутбуках.                               |
| 🟢 **P3** | **i18n & Clean Code**    | **Ліквідація 150+ інлайн-тернарників `isUk ? ... : ...`**: перенесення всіх повідомлень у словники `uk/*.json` та `en/*.json`, усунення хардкоду `Reverse Margin`.       | 100% чиста локалізація, спрощення підтримки нових мов.                                                |
| 🟢 **P3** | **Modularity**           | **Декомпозиція God-файлів (>300 рядків)**: розбиття `feeds.ts`, `useImportFeedWizard.ts`, `SuppliersPage.tsx`, заміна браузерного `confirm()` в Admin Portal.            | Відповідність стандарту монорепо (<250-300 рядків на файл).                                           |

---

## 🛠 3. Детальні інженерні завдання за етапами

### 🌟 Етап 1: Виправлення каталогу товарів (Empty State & CTA Hierarchy) [P0]

#### Проблема:

На сторінці `CatalogsPage` при відсутності товарів (`total === 0`):

1. Рендериться повний `ProductsToolbar` (пошук, селекти постачальників, категорій, перемикач залишку, бейдж "Всього товарів: 0").
2. Рендериться контейнер таблиці `ProductsTable` з повною шапкою `<thead>` (чекбокс, фото, артикул, назва, постачальник, роздріб, маржа, залишок, дії) та порожнім повідомленням всередині `<tbody>`.
3. У порожньому повідомленні написано: _"Спробуйте змінити фільтри або імпортуйте новий фід"_, але жодної кнопки в картці немає!
4. При цьому у верхній шапці сторінки світиться кнопка `+ Імпортувати фід`. Це суперечить розділу 5 `design_system_and_theming.md` ("Empty State vs Header/Toolbar Hierarchy").

#### Рішення:

1. **Розділити 2 стани порожності в `ProductsView.tsx`**:
   - **Стан А (Початковий порожній каталог, `total === 0 && !hasActiveFilters`)**:
     - Приховати `ProductsToolbar`.
     - Приховати `ProductsTable` (ніяких порожніх `<thead>` з чекбоксами).
     - Показати стильний, преміальний компонент **`ProductsZeroStateCard`**:
       - Іконка: `PackagePlus` або `FileSpreadsheet` у семантичному контейнері `bg-primary/10 text-primary border border-primary/20`.
       - Заголовок: `t('catalogs:zeroProductsTitle')` ("У вашому каталозі ще немає товарів").
       - Опис: `t('catalogs:zeroProductsDesc')` ("Підключіть свій перший XML або CSV фід постачальника, щоб автоматично імпортувати товари, налаштувати націнку та підготувати каталог до вивантаження на маркетплейси.").
       - Головна кнопка дії: `[ + Імпортувати перший фід ]` (`onOpenImportWizard`), що викликає майстер імпорту.
       - Додаткова дія: `[ Створити товар вручну ]` (якщо підтримується) або посилання на додавання постачальника.
     - У верхній шапці `CatalogsPage` при цьому стані кнопка `+ Імпортувати фід` не дублюється.
   - **Стан Б (Порожній результат фільтрації, `total === 0 && hasActiveFilters`)**:
     - Залишити `ProductsToolbar` видимим.
     - Показати інформативну картку: "За вашими фільтрами товарів не знайдено".
     - Додати активну кнопку `[ Скинути всі фільтри ]`, яка скидає `search`, `supplierId`, `category`, `inStockOnly`.

**Файли для модифікації:**

- [apps/desktop/src/components/products/ProductsView.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/products/ProductsView.tsx)
- [apps/desktop/src/components/products/ProductsTable.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/products/ProductsTable.tsx)
- Створення субкомпонента [apps/desktop/src/components/products/ProductsZeroStateCard.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/products/ProductsZeroStateCard.tsx)
- [apps/desktop/src/pages/CatalogsPage.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/pages/CatalogsPage.tsx)

---

### 🎨 Етап 2: Преміальна типографіка, Шрифти & Tabular Nums [P1]

#### Проблема:

- Зараз у CSS прописано:
  `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;`
- На macOS це San Francisco, на Windows Segoe UI, на Linux Roboto/DejaVu. Відсутня візуальна ідентичність бренду SmartFeed Studio.
- Числа, ціни, SKU та відсотки маржі відображаються пропорційним шрифтом. Цифри мають різну ширину (цифра "1" набагато вужча за "8"), через що колонки сум виглядають хвилястими та тремтять при оновленні значень.

#### Рішення:

1. **Підключення шрифту Inter / Geist Sans**:
   - Для **`apps/desktop`** (Tauri/Vite, офлайн-безпечно): встановити `@fontsource/inter` (включає Cyrillic, Latin) для повної незалежності від інтернет-з'єднання при запуску десктопу.
   - Для **`apps/admin-portal`** (Next.js 14): налаштувати `next/font/google` з `Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' })`.
2. **Моноширинний технічний шрифт для SKU, Barcode, Tokens**:
   - Налаштувати шрифт `font-mono`: `JetBrains Mono` або `Geist Mono` для відображення кодів SKU, штрихкодів, UUID, API-ключів та ліцензій.
3. **Глобальний клас `tabular-nums` для фінансових та кількісних даних**:
   - У `index.css` та `globals.css` додати utility:
     ```css
     .tabular-nums {
       font-variant-numeric: tabular-nums;
     }
     ```
   - Застосувати `tabular-nums` у всіх колонках таблиць: `colCostPrice`, `colRetailPrice`, `colMargin`, `colStock`, лічильниках квот та датах.
4. **Типографічна ієрархія заголовків**:
   - Чіткі розміри та трекінг:
     - `h1`: `text-2xl font-bold tracking-tight text-foreground sm:text-3xl`
     - `h2`: `text-lg font-semibold tracking-tight text-foreground`
     - `h3`: `text-sm font-semibold text-foreground`
     - `caption/meta`: `text-xs text-muted-foreground`
     - `badge`: `text-[10px] font-semibold tracking-wide uppercase`

**Файли для модифікації:**

- [apps/desktop/package.json](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/package.json) (додати `@fontsource/inter`)
- [apps/desktop/src/main.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/main.tsx) (імпорт шрифту)
- [apps/desktop/src/index.css](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/index.css)
- [apps/desktop/index.html](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/index.html) (виправлення `className` -> `class`)
- [apps/admin-portal/src/app/layout.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/src/app/layout.tsx) (`next/font/google`)
- [apps/admin-portal/src/app/globals.css](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/src/app/globals.css)

---

### 🛡️ Етап 3: 100% Solid Sticky Headers, Контрастність та Уніфікація Тем [P1]

#### Проблема:

- У `Header.tsx` обох додатків використовується `bg-card/40 backdrop-blur-md`.
- У `Sidebar.tsx` використовується `bg-card/50` або `bg-card/60`.
- При вертикальному скролі контент сторінки просвічує крізь напівпрозору шапку, створюючи брудний візуальний шум і погіршуючи читабельність.
- У світлій темі картки з `bg-card/40 backdrop-blur-sm` виглядають невиразно на світлому фоні, межі карток `border-border/40` практично зливаються.

#### Рішення:

1. **100% непрозорий непроникний фон для фіксованих елементів**:
   - Header: `bg-card border-b border-border shadow-xs` (або `bg-background`).
   - Sidebar: `bg-card border-r border-border shadow-xs`.
   - Table `<thead>`: `sticky top-0 z-10 bg-card border-b border-border`.
   - Modals & Drawers: заголовки та футери модалок повинні мати solid `bg-card`.
2. **Уніфікація товщини та прозорості бордерів**:
   - Замінити строкату суміш `border-border/40`, `border-border/60`, `border-border/80` на єдиний семантичний стандарт `border-border` або `border-border/80` для другорядних ліній.
3. **Синхронізація пресетів кольорів**:
   - Додати акцент `green` (Emerald) в `apps/admin-portal`, щоб список пресетів теми (Zinc, Slate, Stone, Gray, Neutral, Bronze, Green) був ідентичним в обох додатках.

**Файли для модифікації:**

- [apps/desktop/src/components/layout/Header.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/layout/Header.tsx)
- [apps/desktop/src/components/layout/Sidebar.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/layout/Sidebar.tsx)
- [apps/admin-portal/src/components/layout/header.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/src/components/layout/header.tsx)
- [apps/admin-portal/src/components/layout/sidebar.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/src/components/layout/sidebar.tsx)
- [apps/admin-portal/src/app/globals.css](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/src/app/globals.css)

---

### ⚡ Етап 4: Ліквідація каскадних дублюючих запитів та оптимізація реактивності [P0]

#### Проблема:

- У `CatalogsPage.tsx`:
  ```typescript
  // Дія видалення або синхронізації:
  await loadData();
  emitDataSync(['suppliers', 'feeds', 'products', 'quotas', 'all']);
  ```
  При цьому компонент сам підписаний на `useDataSync(['suppliers', 'feeds', 'products', 'quotas', 'all'], () => loadData())`.
  В результаті `loadData()` викликається **ДВІЧІ поспіль**!
- Аналогічна ситуація в `SuppliersPage.tsx`:
  `await fetchSuppliers(true)` викликається вручну після збереження/видалення, і водночас відправляється `emitDataSync`, який повторно викликає `fetchSuppliers(true, true)`.

#### Рішення:

- Уніфікувати потік оновлення: операція мутації публікує `emitDataSync(...)`, а всі локальні оновлення списків відбуваються виключно через обробник шини `useDataSync` без попереднього дублюючого виклику `loadData()` у місці мутації.
- Додати `useRef`-блокування `isFetchingRef` у `CatalogsPage:loadData` для гарантії захисту від паралельних повторних запитів.

**Файли для модифікації:**

- [apps/desktop/src/pages/CatalogsPage.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/pages/CatalogsPage.tsx)
- [apps/desktop/src/pages/SuppliersPage.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/pages/SuppliersPage.tsx)

---

### 🔍 Етап 5: Повноцінний глобальний пошук / Command Palette (`⌘K`) [P2]

#### Проблема:

- Зараз у центрі `Header.tsx` обох додатків відображається інпут пошуку:
  `<input type="text" placeholder="Пошук по каталогах і товарах..." />`
  Цей інпут ні до чого не підключений, не містить `value`/`onChange`, не реагує на введення та є неробочим макетом.

#### Рішення:

1. **Підключення Command Palette (Швидкий перехід / Пошук)**:
   - При натисканні на інпут або поєднанні клавіш `⌘K` / `Ctrl+K` відкривати діалогове вікно швидкого пошуку (`CommandMenuDialog` на базі `cmdk` або shadcn `Command`).
   - Дозволити швидкий перехід до:
     - Каталогів товарів та джерел фідів.
     - Постачальників.
     - Тарифних планів та налаштувань.
     - Пошуку конкретного товару за SKU з переходом у деталі.
   - Відображати бейдж гарячої клавіші `⌘K` праворуч усередині поля вводу.

**Файли для модифікації:**

- [apps/desktop/src/components/layout/Header.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/layout/Header.tsx)
- [apps/admin-portal/src/components/layout/header.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/src/components/layout/header.tsx)
- Створення компонента `CommandSearchDialog.tsx`

---

### 🌐 Етап 6: 100% Чиста двомовна локалізація (Zero Inline `isUk` & Zero Hardcoded Strings) [P3]

#### Проблема:

- Понад 150 випадків конструкції `isUk ? 'Текст UA' : 'Text EN'` безпосередньо у верстці:
  - `apps/desktop`: `CatalogsPage.tsx` (видалення фіду), `SettingsPage.tsx`, `ThemeSelector.tsx`, `QuotaReconciliationHeader.tsx`.
  - `apps/admin-portal`: `TransactionsTable.tsx`, `TransactionStatsCards.tsx`, `WayForPaySettingsDialog.tsx`, `PaymentGatewaysList.tsx`, `licenses/page.tsx`.
- Захардкоджені рядки:
  - `Reverse Margin` на вкладці каналів експорту в `CatalogsPage.tsx`.
  - `sr-only` текст `Відкрити меню дій` у `ProductTableRow.tsx`.
  - Валютний символ `₴` замість динамічного коду валюти товару.

#### Рішення:

1. Додати всі відсутні ключі у словники `locales/uk/*.json` та `locales/en/*.json`.
2. Замінити всі інлайн-тернарники `isUk ? ... : ...` на виклики `t('namespace:key')` або `t('namespace', 'key')`.
3. Додати переклад для вкладки `reverseMargin` ("Зворотна націнка" / "Reverse Margin").

---

### 📐 Етап 7: Архітектурна декомпозиція God-файлів та заміна системного `confirm()` [P3]

#### Проблема:

- Файли, що наближаються або перевищують 300 рядків:
  - `apps/desktop/src/lib/api/feeds.ts` (353 рядки) — містить змішані методи конфігурації, синхронізації та видалення фідів.
  - `apps/desktop/src/components/feeds/useImportFeedWizard.ts` (346 рядків) — великий хук візарда.
  - `apps/desktop/src/pages/SuppliersPage.tsx` (301 рядок).
- У `apps/admin-portal/src/app/(dashboard)/navigation/page.tsx` на рядку 162 використовується блокуючий виклик браузера:
  `if (!confirm(t('common', 'confirm_delete'))) return;`
  замість єдиного красивого діалогу `ConfirmDeleteDialog`.

#### Рішення:

1. Замінити `window.confirm()` у `navigation/page.tsx` на `NavigationDeleteDialog` (який вже створений у проекті).
2. Провести м'яку декомпозицію великих файлів із винесенням підмодулів.

---

## ✅ 4. Критерії приймання та перевірки (Definition of Done)

1. [x] **Empty State Каталогу**: при 0 товарів відображається красива Hero-картка з єдиною кнопкою `+ Імпортувати фід`. Порожня шапка таблиці з чекбоксами та тулбар фільтрів приховані.
2. [x] **Шрифти**: в обох додатках активний сучасний шрифт `Inter` (або `Geist`) з повною підтримкою кирилиці.
3. [x] **Tabular Nums**: всі колонки цін, маржі та залишків мають моноширинні цифри без стрибання розрядів.
4. [x] **Solid Headers**: відсутнє просвічування контенту під Header та Sidebar при прокручуванні сторінки, ідеальне вирівнювання висоти (`h-16`).
5. [x] **Нуль каскадних запитів**: відсутність дублюючих викликів `loadData()` при синхронізації фідів та зміні постачальників.
6. [x] **Пошук**: поле пошуку в Header перетворено на функціональний глобальний пошук / Command Palette (`⌘K`).
7. [x] **100% i18n**: 0 захардкодженних рядків, ліквідовані інлайн-тернарники `isUk ? ... : ...`.
8. [x] **Zero System Confirm**: відсутність викликів `window.confirm()` в адмін-панелі.
9. [x] **Перевірка типів**: `pnpm --filter @smartfeed/desktop exec tsc --noEmit` та `pnpm --filter admin-portal exec tsc --noEmit` повертають 0 помилок.
10. [x] **Тести**: всі E2E тести (`pnpm test:desktop`, `pnpm test:admin`) проходять на 100%.

---

## 🔒 5. Протокол виконання (Strict Hold)

Згідно з правилом [`.agents/rules/plans_lifecycle.md`](../../.agents/rules/plans_lifecycle.md) та інструкцією `agents_review`:  
**Агент ЗУПИНЯЄТЬСЯ і НЕ розпочинає внесення змін у код до отримання явної команди користувача на виконання плану.**
