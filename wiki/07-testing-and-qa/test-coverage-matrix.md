# 📈 Матриця Покриття Тестами — SmartFeed Studio

## 📊 Повний Звіт про Автоматизовані Тести (209 з 209 пройдено — 100% PASS)

> [!NOTE]
> Реалізовано ієрархічне відображення користувачів (Власник + розгортання запрошених через accordion), модалку керування командою організації, 3-крапки меню дій (призупинення/відновлення, видалення користувача), поштовий сервіс (`MailModule`) та систему інвайтів, 4-рівневу сітку тарифів (STARTER → GROWTH → PRO → ENTERPRISE), розділені сторінки Тарифів та Ліцензій, 100% інтернаціоналізацію (i18n), Next.js App Router boundaries (`error.tsx`, `loading.tsx`, `not-found.tsx`), React Error Boundary для Desktop, та захист від дублювання запитів.

### 1. Бекенд API (Jest E2E — 114 тестів)

> Команда запуску: `pnpm --filter @smartfeed/backend-api test:e2e`

| Файл тесту                                 | Ендпоінти / Функціонал                                                                                                                                                                                                                              | Кількість | Статус  |
| :----------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | :-----: |
| `test/auth.e2e-spec.ts`                    | `POST /auth/register`, `POST /auth/login`                                                                                                                                                                                                           |    12     | ✅ PASS |
| `test/password-recovery.e2e-spec.ts`       | `POST /auth/forgot-password`, `POST /auth/reset-password`                                                                                                                                                                                           |     8     | ✅ PASS |
| `test/licenses.e2e-spec.ts`                | `GET /licenses/my`, `POST /licenses/select-plan`, `RequireActiveLicenseGuard`, `PATCH /licenses/:id/status` (Suspend/Resume), `DELETE /licenses/:id`                                                                                                |    14     | ✅ PASS |
| `test/organizations.e2e-spec.ts`           | `GET /organizations`, `GET /organizations/:id`, `PATCH /organizations/:id`, `GET /members`, `POST /members` (`maxTeamSeats`), `DELETE /members/:id`, корпоративний апгрейд, успадкування ліцензії, блокування при закінченні терміну та відновлення |    13     | ✅ PASS |
| `test/team-invitations.e2e-spec.ts`        | `POST /organizations/:id/invitations`, `GET /organizations/:id/invitations`, `DELETE /organizations/:id/invitations/:id`, `GET /invitations/:token`, `POST /invitations/accept`, 403 захист зміни тарифу для MEMBER, Mailpit доставка               |    11     | ✅ PASS |
| `test/users.e2e-spec.ts`                   | `GET /users`, `GET /users/stats`, `POST /users`, `PATCH /users/:id/status`, `DELETE /users/:id`, `SUPER_ADMIN` exclusion, `orgRoleFilter` (`OWNERS`, `MEMBERS`), `POST /auth/change-password`                                                       |    18     | ✅ PASS |
| `test/security-access-control.e2e-spec.ts` | RBAC захист адмінки, мульти-тенантна ABAC ізоляція організацій, заборона зміни тарифів для MEMBER (`ONLY_OWNER_CAN_CHANGE_PLAN`), валідація пароля при інвайті, S3 ізоляція за `userId`                                                             |    17     | ✅ PASS |
| `test/navigation.e2e-spec.ts`              | `GET /navigation`, `GET /navigation/admin`, `POST /navigation`, `PATCH /navigation/:id`, `DELETE /navigation/:id`                                                                                                                                   |     8     | ✅ PASS |
| `test/plans.e2e-spec.ts`                   | `GET /plans`, `GET /plans/admin`, `POST /plans`, `PATCH /plans/:id`, `DELETE /plans/:id`, `GET /licenses/admin`                                                                                                                                     |    12     | ✅ PASS |

**Разом по бекенду: 9 сьютів — 114 тестів — 114 passing (100%)**

---

### 2. Десктопний Клієнт (Playwright E2E — 34 тести)

> Команда запуску: `pnpm test:desktop`

| Файл тесту                      | Сценарії тестування                                                                                                                                                                       | Кількість | Статус  |
| :------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | :-----: |
| `e2e/auth.spec.ts`              | Захист роутів, 401 помилка, вхід, реєстрація з назвою компанії, мова UA/EN, тема                                                                                                          |     6     | ✅ PASS |
| `e2e/password-recovery.spec.ts` | Форма відновлення, валідація токену, зміна паролю, вхід з новим паролем                                                                                                                   |     7     | ✅ PASS |
| `e2e/plans.spec.ts`             | Перегляд планів, зворотний відлік, вибір PRO, блокувальник `ExpiredPlanBlocker`, розблокування, i18n                                                                                      |     4     | ✅ PASS |
| `e2e/team.spec.ts`              | Команда та воркспейс, квота місць (1/1, 2/3, 3/3, ∞), інвайти (токен-посилання, Nodemailer), список очікуваних інвайтів, видалення, readonly режим та приховання тарифів для MEMBER, i18n |     9     | ✅ PASS |
| `e2e/pages-resilience.spec.ts`  | Каталоги товарів, AI збагачення, хмарна синхронізація, i18n словники, обробка помилок `ErrorBoundary`                                                                                     |     3     | ✅ PASS |
| `e2e/navigation.spec.ts`        | Сайдбар меню, фільтрація за ролями, згортання/розгортання, пункт Команда                                                                                                                  |     2     | ✅ PASS |
| `e2e/theme.spec.ts`             | Палітри shadcn (Zinc, Slate, Stone, Bronze), Dark/Light режим                                                                                                                             |     3     | ✅ PASS |

**Разом по десктопу: 7 сьютів — 34 тести — 34 passing (100%)**

---

### 3. Адмін-Панель (Playwright E2E — 61 тест)

> Команда запуску: `pnpm test:admin`

| Файл тесту                  | Сценарії тестування                                                                                                                                                            | Кількість | Статус  |
| :-------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | :-----: |
| `e2e/api-contracts.spec.ts` | Точні бекенд URL без застарілих `/all`, стабільність сторінок без 404/500, дедуплікація запитів (строго 1 виклик на сторінку)                                                  |    12     | ✅ PASS |
| `e2e/auth.spec.ts`          | Форма входу адміна, локалізовані помилки, перемикач мови UA/EN, блокування входу не-адміністраторів з показом помилки                                                          |     3     | ✅ PASS |
| `e2e/dashboard.spec.ts`     | Головний дашборд: картки метрик, останні користувачі, швидкі дії, діалог пароля, динамічне перемикання мови UA ⇄ EN                                                            |     3     | ✅ PASS |
| `e2e/licenses.spec.ts`      | Реєстр ліцензій `/licenses`, пошук за ключем/email/ім'ям, фасетні фільтри (Тариф/Статус/S3), сортування, скидання, пустий стан, оптимістичне оновлення                         |     9     | ✅ PASS |
| `e2e/navigation.spec.ts`    | Головне меню (Тарифи/Ліцензії), симулятор ролей/планів, фільтри, мова, підменю Налаштувань (Профіль/AI/Платежі), зміна позицій пунктів меню                                    |     8     | ✅ PASS |
| `e2e/plans.spec.ts`         | Автономна сторінка `/plans`: створення плану, редагування цін, видалення з діалогом `PlanDeleteDialog`                                                                         |     4     | ✅ PASS |
| `e2e/settings.spec.ts`      | Налаштування: картка профілю, індикатори інфраструктури, валідація форми зміни пароля, динамічне перемикання мови UA ⇄ EN                                                      |     3     | ✅ PASS |
| `e2e/theme.spec.ts`         | Ініціалізація теми за замовчуванням (Zinc) та динамічна зміна палітри                                                                                                          |     2     | ✅ PASS |
| `e2e/users.spec.ts`         | Керування користувачами `/users`: ієрархія команд (шеврон-розгортання sub-rows), модалка команди, меню дій 3 крапки (призупинення/видалення), створення користувача, 100% i18n |    11     | ✅ PASS |

**Разом по адмін-панелі: 9 сьютів — 61 тест — 61 passing (100%)**

---

## 🏆 Загальний Підсумок

- **Усього автоматизованих тестів:** **155** (79 бекенд + 30 десктоп + 46 адмін)
- **Успішність:** **100% PASS**
- **Ізоляція та очищення (Zero Leftovers):** Всі тести очищають свої тимчасові дані у базі після виконання.
