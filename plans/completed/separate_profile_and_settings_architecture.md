# 🎨 Архітектурний план: Розділення «Профілю» та «Налаштувань» на незалежні розділи (Desktop & Admin)

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 10.10.2026  
> **Гілка:** `feat/shadcn-dashboard-01-design`  
> **Відповідальні агенти:** `agents_review` (Аудит) + `agents_frontend` (UI/UX Реалізація)  
> **Референс дизайну:** [shadcn dashboard-01 & settings layout](https://ui.shadcn.com/view/new-york-v4/dashboard-01)

---

## 🔍 1. Проблема та системний аналіз (Discovery & Audit)

### 1.1. Вирішена проблема (Антипатерн змішування контекстів)

- Раніше як у Desktop Client (`apps/desktop`), так і в Admin Portal (`apps/admin-portal`), персональні дані облікового запису та системні налаштування були змішані на одній сторінці `/settings`:
  - На одній сторінці одночасно відображалися: аватарка користувача, його ім'я, email, форма зміни пароля, і тут же — палітра тем, радіус заокруглення інтерфейсу, вибір локальної робочої папки сховища, налаштування платіжних шлюзів тощо.
  - У меню профілю внизу бічної панелі (сайдбара) клік на пункт «Обліковий запис» перенаправляв на сторінку «Налаштування» (`/settings`), що викликало плутанину.

### 1.2. Реалізована модель: Чітке розділення обов'язків (Separation of Concerns)

1. **Розділ «Профіль» (`/profile`) — Персональний контур користувача**:
   - Відображає виключно дані поточного акаунта: аватар з можливістю завантаження/видалення (`ProfileAvatarCard`), ПІБ, email, системну роль (SUPER_ADMIN, ADMIN, USER), приналежність до компанії/організації (`ProfileDetailsCard`).
   - Безпека облікового запису: форма зміни пароля користувача з валідацією (`ChangePasswordCard` в Admin Portal), статус захисту ключів (SQLCipher / OS Keychain у Desktop).
   - Жодних сторонніх налаштувань інтерфейсу чи системних платіжних конфігурацій.

2. **Розділ «Налаштування» (`/settings`) — Контур параметрів системи та робочого простору**:
   - Містить лише параметри, які користувач або адміністратор може конфігурувати для роботи програми:
     - **Зовнішній вигляд (Appearance)**: колірна тема (Zinc, Slate, Stone, Neutral, Gray), світлий/темний/системний режим, Border Radius Token (0px, 4px, 8px, 12px) через `ThemeSelector`.
     - **База даних та сховище (Database & Storage)** (для Desktop): вибір та перенесення локальної папки сховища, статус SQLCipher, розмір SQLite бази, резервні копії (`SettingsStorageTab`).
     - **Платіжні системи (Payment Gateways)** (для Admin): огляд та налаштування WayForPay, платіжних реквізитів (`/settings/payments`).
     - **AI Інтеграції (AI Providers)** (для Admin): OpenAI, Anthropic Claude, Google Gemini (`/settings/ai`).

3. **Оновлення навігації та меню користувача (Sidebar Dropdown Menu)**:
   - У дропдауні аватара внизу сайдбара чітко розмежовані дії:
     - 👤 **Профіль** (`/profile`) — перехід до персональних даних.
     - ⚙️ **Налаштування** (`/settings`) — перехід до параметрів системи/інтерфейсу.
     - 💳 **Тарифи та ліцензії** (`/plans`) — білінг та квоти.
     - 🚪 **Вийти з системи** — логаут.
   - У бічній панелі (сайдбарі) пункт меню `Налаштування` веде на `/settings`.

---

## 🏛 2. Модифіковані компоненти та файли

### 📱 2.1. Desktop Client (`apps/desktop`)

- [ProfileAvatarCard.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/profile/ProfileAvatarCard.tsx): аватар, прев'ю, завантаження з WebP компресією, видалення аватара.
- [ProfileDetailsCard.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/profile/ProfileDetailsCard.tsx): персональні дані, email, роль, організація, Keychain-безпека.
- [ProfilePage.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/pages/ProfilePage.tsx): контейнер сторінки `/profile` (`data-testid="profile-page"`).
- [SettingsPage.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/pages/SettingsPage.tsx): суто налаштування (вкладки Зовнішній вигляд та База даних/сховище, <85 рядків).
- [App.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/App.tsx): зареєстровано маршрут `/profile`.
- [Header.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/layout/Header.tsx): додано метадані `/profile` для хлібних крихт.
- [SidebarUserProfile.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/layout/SidebarUserProfile.tsx): розділено пункти «Профіль» та «Налаштування».
- [CommandSearchDialog.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/layout/CommandSearchDialog.tsx): додано `nav-profile` пункт для швидкого пошуку.

### 🖥 2.2. Admin Portal (`apps/admin-portal`)

- [page.tsx](<file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/src/app/(dashboard)/profile/page.tsx>): сторінка `/profile` адміністратора (`ProfileInfoCard` + `ChangePasswordCard`).
- [page.tsx](<file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/src/app/(dashboard)/settings/page.tsx>): хаб налаштувань (`ThemeCustomizer` + інтеграції Payments & AI).
- [header.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/src/components/layout/header.tsx): додано метадані `/profile` для хлібних крихт.
- [SidebarUserProfile.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/src/components/layout/SidebarUserProfile.tsx): розділено пункти «Профіль» та «Налаштування».
- [AdminCommandSearchDialog.tsx](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/src/components/layout/AdminCommandSearchDialog.tsx): додано `nav-profile` у швидкий пошук.

---

## 🧪 3. Результати верифікації та тестів (100% Pass)

- **TypeScript Typecheck**:
  - `pnpm --filter admin-portal exec tsc --noEmit` — 0 помилок.
  - `pnpm --filter @smartfeed/desktop exec tsc --noEmit` — 0 помилок.
- **Admin Portal Playwright Suite**:
  - `pnpm test:admin` — 66/66 passed (100%).
- **Desktop Client Playwright Suite**:
  - `pnpm test:desktop` — 94/94 passed (100%).
- **Форматування**:
  - `pnpm format` виконано успішно.
