# 🎨 План модернізації сторінок входу та реєстрації (`modern_split_auth_redesign`)

> **Статус:** 📋 **В очікуванні підтвердження користувача (Planning Phase)**  
> **Дата створення:** 10.10.2026  
> **Цільові додатки:** `apps/desktop` (Tauri v2 + React 18)  
> **Відповідність гайдам:** [`agents_frontend.md`](file:///Users/oleg/AQA/SmartFeedStudio/.agents/references/agents_frontend.md) · [`ui-ux-pro-max`](file:///Users/oleg/AQA/SmartFeedStudio/.agents/skills/ui-ux-pro-max/SKILL.md) · [`design_system_and_theming.md`](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/design_system_and_theming.md) · [`emil-design-eng`](file:///Users/oleg/AQA/SmartFeedStudio/.agents/skills/emil-design-eng/SKILL.md)

---

## 🔍 1. Проблематика та концепція дизайну

Поточні сторінки авторизації (`LoginPage.tsx`, `RegisterPage.tsx`) є простими центрованими картками на порожньому фоні.
Згідно з референсом користувача, проектується сучасний **двоколонковий спліт-лейкаут (Split-Screen Auth)**:

1. **Ліва колонка (Форма авторизації / реєстрації)**:
   - Брендована шапка з фірмовим логотипом `Layers` (`SmartFeed Studio`).
   - Елегантна типографіка заголовків та описів без громіздких карток.
   - Поля інпутів із вбудованими іконками (`Mail`, `Lock`, `User`, `Building2`).
   - Перемикач видимості паролю (Eye `Show`/`Hide`).
   - Чекбокс «Запам'ятати мене» (`Keep me logged in`).
   - Кнопка дій з інтерактивним індикатором завантаження.
   - Підвал з копірайтом SmartFeed Studio та системними посиланнями.
   - Глобальні перемикачі мови (`LanguageToggle`) та теми (`ThemeToggle`) у правому верхньому куті.

2. **Права колонка (Інтерактивне Hero-Showcase з анімацією)**:
   - Стильний фон з тонкою сіткою та м'яким радіальним градієнтом (`bg-muted/40`).
   - Головний бейдж `SmartFeed Studio 2.0` та заголовок «Керування каталогами нового покоління».
   - **Тематична SVG/CSS анімація потоку товарних фідів (Live Feed Stream Pipeline)**:
     - Вхідні вузли постачальників (`XML / CSV Feeds`).
     - Центральний процесорний вузол `SmartFeed Engine` з пульсуючим неоновим ореолом.
     - Вихідні канали маркетплейсів (`Rozetka`, `Prom`, `Epicentr`).
   - Плаваючі бейджі ключових метрик: `⚡ 100k+ SKU / хв`, `🔒 Encrypted SQLite`, `🤖 AI Enrichment`.

---

## 🏛 2. Бюджет модульності компонентів (<250 рядків на файл)

Щоб дотриматися ліміту модульності та чистоти архітектури, моноліт не створюється:

| Компонент / Файл                                                                                                       | Призначення                                                                             | Очікуваний розмір |
| :--------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :---------------: |
| [`AuthSplitLayout.tsx`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/auth/AuthSplitLayout.tsx)   | 2-колонковий каркас, адаптивність (на мобільних права колонка плавно приховується)      |    ~120 рядків    |
| [`AuthHeroShowcase.tsx`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/auth/AuthHeroShowcase.tsx) | Інтерактивна права колонка з SVG-анімацією товарного потоку, метриками та мікро-пульсом |    ~180 рядків    |
| [`LoginForm.tsx`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/login-form.tsx)                   | Модернізована форма входу з перемикачем паролю, чекбоксом та збереженням data-testid    |    ~160 рядків    |
| [`SignupForm.tsx`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/signup-form.tsx)                 | Модернізована форма реєстрації з полями компанії та індикатором надійності              |    ~190 рядків    |
| [`LoginPage.tsx`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/pages/auth/LoginPage.tsx)                    | Лаконічна обгортка сторінки логіну через `AuthSplitLayout`                              |    ~30 рядків     |
| [`RegisterPage.tsx`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/pages/auth/RegisterPage.tsx)              | Лаконічна обгортка сторінки реєстрації через `AuthSplitLayout`                          |    ~30 рядків     |

---

## 📐 3. Архітектура та стилістика (100% Theme Harmony)

- **Семантичні токени теми**: `bg-background`, `bg-muted/30`, `text-foreground`, `text-muted-foreground`, `border-border/60`, `primary`.
- **Повна заборона**: hardcoded кольорів (`purple-*`, `blue-500`, тощо).
- **Плавні пружинні анімації**: CSS keyframes для плаваючих карток (`@keyframes float { 0%, 100% { transform: translateY(0px) } 50% { transform: translateY(-6px) } }`).
- **100% двомовна локалізація**: додавання ключів у `locales/uk/auth.json` та `locales/en/auth.json`.
- **100% збереження контрактів Playwright**: усі селектори (`data-testid="email-input"`, `password-input`, `login-button`, `error-alert`, тощо) повністю зберігаються.

---

## 🛡 4. Чеклист валідації та критерії готовності (DoD)

- [ ] Усі нові та модифіковані компоненти вкладаються у бюджет **<250 рядків** на файл.
- [ ] 0 відносних імпортів (лише `@/` path aliases).
- [ ] 0 помилок у `tsc --noEmit` (`pnpm --filter @smartfeed/desktop exec tsc --noEmit`).
- [ ] 100% проходження автотестів `apps/desktop/e2e/auth.spec.ts` (`pnpm --filter @smartfeed/desktop exec playwright test e2e/auth.spec.ts`).
- [ ] Перевірено роботу у світлій та темній темах (Light / Dark).
- [ ] Перевірено перемикання мов (UA ⇄ EN) на всіх текстових блоках форми та Hero-Showcase.
