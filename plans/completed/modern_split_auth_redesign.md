# 🎨 План модернізації сторінок входу та реєстрації (`modern_split_auth_redesign`)

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 10.10.2026  
> **Цільові додатки:** `apps/desktop` (Tauri v2 + React 18)  
> **Відповідність гайдам:** [`agents_frontend.md`](file:///Users/oleg/AQA/SmartFeedStudio/.agents/references/agents_frontend.md) · [`ui-ux-pro-max`](file:///Users/oleg/AQA/SmartFeedStudio/.agents/skills/ui-ux-pro-max/SKILL.md) · [`design_system_and_theming.md`](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/design_system_and_theming.md) · [`emil-design-eng`](file:///Users/oleg/AQA/SmartFeedStudio/.agents/skills/emil-design-eng/SKILL.md)

---

## 🔍 1. Проблематика та концепція дизайну (High-Converting Split Auth)

Поточні сторінки авторизації (`LoginPage.tsx`, `RegisterPage.tsx`) були простими центрованими картками.
Згідно з референсом користувача (WowDash 2-column split) та бізнес-вимогою **«зробити так, щоб клієнта відразу тягнуло зареєструватися»**, реалізовано преміальний спліт-лейкаут у фірмовій стилістиці SmartFeed Studio:

1. **Ліва колонка (Висококонверсійна форма входу / реєстрації)**:
   - Брендований хедер з логотипом `Layers` (`SmartFeed Studio`) та підписом платформи.
   - Заголовки, орієнтовані на цінність: «Вхід до акаунту» / «Створити акаунт (Безкоштовно назавжди)».
   - Інпути з внутрішніми іконками (`Mail`, `Lock`, `User`, `Building2`).
   - Перемикач видимості пароля (`Eye` / `EyeOff`) на полях паролів.
   - Чекбокс «Запам'ятати мене» (`Remember me`).
   - Чекбокс згоди з правилами сервісу на сторінці реєстрації.
   - Індикатор надійності пароля (мінімум 8 символів).
   - Кнопка швидкого заповнення демо-доступу (`Demo Admin`) для миттєвого тестування.
   - 100% збереження всіх селекторів `data-testid` для E2E-тестів Playwright.

2. **Права колонка (Інтерактивне Hero-Showcase з анімацією та ціннісною пропозицією)**:
   - Сучасний фон у фірмовій темі (`bg-muted/30` з делікатним радіальним градієнтом).
   - Верхній рядок з інтегрованими перемикачами мови (`LanguageToggle`) та теми (`ThemeToggle`).
   - Головний бейдж: `✨ SmartFeed Studio 2.0` · `Enterprise Каталоги`.
   - Заголовок та підзаголовок, що б'ють у болі e-commerce продавців (автоматизація прайсів, нуль рутини в Excel, синхронізація залишків).
   - **Тематична інтерактивна схема товарного потоку (Live Feed Pipeline)**:
     - Джерела постачальників: `Brain`, `Websklad`, `B2B XML/CSV` (статус `● Синхронізовано`).
     - Ядро обробки `SmartFeed Engine` з пульсуючим неоновим ореолом та метриками (`⚡ 120 000+ SKU / хв`, `🔒 Encrypted SQLite`).
     - Канали експорту на маркетплейси: `Rozetka`, `Prom.ua`, `Epicentr`, `Shopify`.
   - **3 картки мотивації до негайної реєстрації (Conversion Drivers)**:
     - 💎 **Тариф Free назавжди**: 1 000 SKU без кредитної картки.
     - ⚡ **Неймовірна швидкість**: нативне ядро Rust, швидше за хмару у 10 разів.
     - 🛡️ **100% Приватність**: шифрування SQLCipher, постачальники та маржа захищені на вашому ПК.
   - Соціальний доказ: лічильник «2 400 000+ оновлень цін щодня · 99.98% точність залишків · Enterprise Ready →».

---

## 🏛 2. Бюджет модульності компонентів (<250 рядків на файл)

| Компонент / Файл                                                                                                       | Призначення                                                                            | Фактичний розмір |
| :--------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------- | :--------------: |
| [`AuthSplitLayout.tsx`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/auth/AuthSplitLayout.tsx)   | 2-колонковий каркас, адаптивність, шапка бренду, підвал                                |    ~75 рядків    |
| [`AuthHeroShowcase.tsx`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/auth/AuthHeroShowcase.tsx) | Інтерактивна права колонка: SVG/CSS Pipeline, переваги, метрики, соціальні докази      |   ~145 рядків    |
| [`LoginForm.tsx`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/login-form.tsx)                   | Модернізована форма входу з eye-toggle, іконками, remember me та швидким demo доступом |   ~185 рядків    |
| [`SignupForm.tsx`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/signup-form.tsx)                 | Модернізована форма реєстрації з eye-toggle, іконками, company name та валідацією      |   ~245 рядків    |
| [`LoginPage.tsx`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/pages/auth/LoginPage.tsx)                    | Лаконічна обгортка сторінки логіну через `AuthSplitLayout`                             |    ~15 рядків    |
| [`RegisterPage.tsx`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/pages/auth/RegisterPage.tsx)              | Лаконічна обгортка сторінки реєстрації через `AuthSplitLayout`                         |    ~15 рядків    |

---

## 📐 3. Архітектура та стилістика (100% Theme Harmony & Zero Hardcoded Colors)

- **Семантичні токени теми**: `bg-background`, `bg-card`, `bg-muted/30`, `text-foreground`, `text-muted-foreground`, `border-border`, `primary`, `ring`.
- **Повна заборона**: hardcoded кольорів (`purple-*`, `pink-*`, `blue-500` тощо).
- **100% двомовна локалізація**: синхронне додавання ключів у `locales/uk/auth.json` та `locales/en/auth.json`.
- **100% збереження контрактів Playwright**: збережено всі `data-testid` для E2E тестів.

---

## 🛡 4. Чеклист валідації та критерії готовності (DoD)

- [x] Усі нові та модифіковані компоненти вкладаються у бюджет **<250 рядків** на файл.
- [x] 0 відносних імпортів (лише `@/` path aliases).
- [x] 0 помилок у `tsc --noEmit` (`pnpm --filter @smartfeed/desktop exec tsc --noEmit`).
- [x] 100% проходження автотестів `apps/desktop/e2e/auth.spec.ts` (6 з 6 тестів пройдено).
- [x] Перевірено роботу у світлій та темній темах (Light / Dark).
- [x] Перевірено перемикання мов (UA ⇄ EN) на всіх текстових блоках форми та Hero-Showcase.
