# 📜 План реалізації: Модальні вікна юридичних документів, CMS в адмінці та усунення скролу на сторінках авторизації (`legal_pages_cms_and_auth_viewport_cleanup`)

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 10.10.2026  
> **Цільові додатки:** `apps/desktop`, `apps/admin-portal`, `services/backend-api`, `packages/shared`  
> **Відповідність гайдам:** [`agents_frontend.md`](file:///Users/oleg/AQA/SmartFeedStudio/.agents/references/agents_frontend.md) · [`agents_backend.md`](file:///Users/oleg/AQA/SmartFeedStudio/.agents/references/agents_backend.md) · [`ui-ux-pro-max`](file:///Users/oleg/AQA/SmartFeedStudio/.agents/skills/ui-ux-pro-max/SKILL.md) · [`design_system_and_theming.md`](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/design_system_and_theming.md)

---

## 🔍 1. Проблематика та завдання користувача

1. **Видалення зайвої кнопки**:
   - Прибрано тестову кнопку `✨ Швидкий вхід (Demo Admin)` з форми входу (`LoginForm.tsx`).
2. **Ліквідація вертикального скролу (100% Viewport Fit)**:
   - Сторінки `/auth/login` та `/auth/register` ідеально вміщуються в один екран без смуги вертикального прокручування (`h-screen max-h-screen overflow-hidden`, оптимізовані відступи `py-2.5`, `gap-2.5`).
3. **Модальні вікна замість битих посилань (Zero Broken Links)**:
   - Клік на `Умови використання` / `Політика конфіденційності` (в чекбоксі реєстрації) та `Terms of Service` / `Privacy Policy` (у футері) відкриває модальне вікно `LegalDocumentModal.tsx`.
   - Вміст містить повноцінні стандартні юридичні документи для SaaS/e-commerce платформи українською та англійською мовами.
4. **CMS юридичних документів в адмін-панелі (`apps/admin-portal`) та бекенді**:
   - Модель `LegalDocument` у базі даних (PostgreSQL + Prisma).
   - Ендпоінти REST API (`/api/legal/document/:slug` публічний, `/api/legal/admin/*` для адмінів).
   - Розділ у панелі адміністратора: `/legal`, таблиця документів, модальне вікно редагування текстів (UA / EN), перемикач публікації.
   - Десктоп-клієнт використовує стандартні тексти з надійним локальним фолбеком (offline-first).

---

## 🏛 2. Бюджет модульності компонентів (<250 рядків на файл)

| Компонент / Файл                                                                                                                         | Призначення                                                                                    | Фактичний розмір |
| :--------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- | :--------------: |
| [`LegalDocumentModal.tsx`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/auth/LegalDocumentModal.tsx)               | Діалогове вікно з табами «Умови використання» / «Політика конфіденційності», UA/EN, фолбек     |   ~145 рядків    |
| [`default-legal-content.ts`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/auth/default-legal-content.ts)           | Стандартні вичерпні юридичні тексти для SaaS платформи двома мовами                            |   ~195 рядків    |
| [`AuthSplitLayout.tsx`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/auth/AuthSplitLayout.tsx)                     | Оптимізація висоти, `h-screen overflow-hidden`, підключення модалки до футера                  |    ~95 рядків    |
| [`LoginForm.tsx`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/login-form.tsx)                                     | Видалення demo admin кнопки, компактні відступи                                                |   ~150 рядків    |
| [`SignupForm.tsx`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/signup-form.tsx)                                   | Компактні поля без скролу, клікабельні посилання на модалку в чекбоксі                         |   ~245 рядків    |
| [`AuthHeroShowcase.tsx`](file:///Users/oleg/AQA/SmartFeedStudio/apps/desktop/src/components/auth/AuthHeroShowcase.tsx)                   | Оптимізація вертикального ритму для 100vh                                                      |   ~140 рядків    |
| **Backend & Admin CMS**                                                                                                                  |                                                                                                |                  |
| `schema.prisma`                                                                                                                          | Модель `LegalDocument` (`slug`, `titleUk`, `titleEn`, `contentUk`, `contentEn`, `isPublished`) |    ~20 рядків    |
| `legal.controller.ts`                                                                                                                    | REST контролер для перегляду та редагування документів                                         |    ~75 рядків    |
| `legal.service.ts`                                                                                                                       | Сервіс з авто-сідом базових документів у БД                                                    |   ~140 рядків    |
| [`LegalDocumentsTable.tsx`](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/src/components/legal/LegalDocumentsTable.tsx)       | Таблиця документів в адмінці                                                                   |   ~130 рядків    |
| [`EditLegalDocumentModal.tsx`](file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/src/components/legal/EditLegalDocumentModal.tsx) | Модалка редагування контенту документа двома мовами                                            |   ~215 рядків    |
| [`page.tsx`](<file:///Users/oleg/AQA/SmartFeedStudio/apps/admin-portal/src/app/(dashboard)/legal/page.tsx>)                              | Сторінка управління документами в адмінці                                                      |   ~120 рядків    |

---

## 🛡 3. Чеклист критеріїв готовності (DoD)

- [x] Кнопка Demo Admin відсутня на сторінці входу.
- [x] Сторінки входу та реєстрації вміщуються у 100vh без смуг прокрутки.
- [x] При натисканні на будь-яке посилання умов або конфіденційності відкривається стильна модалка з повною інформацією.
- [x] В адмін-панелі доступне редагування текстів документів (`/legal`).
- [x] 0 помилок у `tsc --noEmit` в усіх пакетах.
- [x] 100% тестів пройдено (7/7 Playwright тестів `apps/desktop/e2e/auth.spec.ts`).
