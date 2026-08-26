# 📈 Матриця Покриття Тестами — SmartFeed Studio

## 📊 Повний Звіт про Автоматизовані Тести (96 з 96 пройдено — 100% PASS)

> [!NOTE]
> Схему тарифів оновлено до 4-рівневої: **STARTER → GROWTH → PRO → ENTERPRISE**. Реалізовано архітектуру Організацій та командних місць. Усі тести оновлені та пройдені.

### 1. Бекенд API (Jest E2E — 61 тест)

> Команда запуску: `pnpm --filter @smartfeed/backend-api test:e2e`

| Файл тесту                           | Ендпоінти / Функціонал                                                                                                                                         | Кількість | Статус  |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | :-----: |
| `test/auth.e2e-spec.ts`              | `POST /auth/register`, `POST /auth/login`                                                                                                                      |    12     | ✅ PASS |
| `test/password-recovery.e2e-spec.ts` | `POST /auth/forgot-password`, `POST /auth/reset-password`                                                                                                      |     8     | ✅ PASS |
| `test/licenses.e2e-spec.ts`          | `GET /licenses/my` (STARTER auto-provisioning, quota fields), `POST /licenses/select-plan` (4-tier), dynamic duration, expiration, `RequireActiveLicenseGuard` |     7     | ✅ PASS |
| `test/organizations.e2e-spec.ts`     | `GET /organizations`, `GET /organizations/:id`, `PATCH /organizations/:id`, `GET /members`, `POST /members` (`maxTeamSeats`), `DELETE /members/:id`            |     7     | ✅ PASS |
| `test/users.e2e-spec.ts`             | `GET /users`, `GET /users/stats`, `POST /auth/change-password`                                                                                                 |     7     | ✅ PASS |
| `test/navigation.e2e-spec.ts`        | `GET /navigation`, `GET /navigation/admin`, `POST /navigation`, `PATCH /navigation/:id`, `DELETE /navigation/:id`                                              |     8     | ✅ PASS |
| `test/plans.e2e-spec.ts`             | `GET /plans`, `GET /plans/admin`, `POST /plans`, `PATCH /plans/:id`, `DELETE /plans/:id`, `GET /licenses/admin`                                                |    12     | ✅ PASS |

**Разом по бекенду: 61 тест — 61 passing**

---

### 2. Десктопний Клієнт (Playwright E2E — 22 тести)

> Команда запуску: `pnpm test:desktop`

| Файл тесту                      | Сценарії тестування                                                                                  | Кількість | Статус  |
| :------------------------------ | :--------------------------------------------------------------------------------------------------- | :-------: | :-----: |
| `e2e/auth.spec.ts`              | Захист роутів, 401 помилка, вхід, реєстрація, мова UA/EN, тема                                       |     6     | ✅ PASS |
| `e2e/password-recovery.spec.ts` | Форма відновлення, валідація токену, зміна паролю, вхід з новим паролем                              |     7     | ✅ PASS |
| `e2e/plans.spec.ts`             | Перегляд планів, зворотний відлік, вибір PRO, блокувальник `ExpiredPlanBlocker`, розблокування, i18n |     4     | ✅ PASS |
| `e2e/navigation.spec.ts`        | Сайдбар меню, фільтрація за ролями, згортання/розгортання                                            |     2     | ✅ PASS |
| `e2e/theme.spec.ts`             | Палітри shadcn (Zinc, Slate, Stone, Bronze), Dark/Light режим                                        |     3     | ✅ PASS |

**Разом по десктопу: 22 тести — 22 passing**

---

### 3. Адмін-Панель (Playwright E2E — 13 тестів)

> Команда запуску: `pnpm test:admin`

| Файл тесту               | Сценарії тестування                                                  | Кількість | Статус  |
| :----------------------- | :------------------------------------------------------------------- | :-------: | :-----: |
| `e2e/auth.spec.ts`       | Форма входу адміна, локалізовані помилки                             |     2     | ✅ PASS |
| `e2e/licenses.spec.ts`   | Таблиця ліцензій, створення плану, редагування тривалості, видалення |     4     | ✅ PASS |
| `e2e/navigation.spec.ts` | Симулятор прав ролей/планів, фільтрація додатків, зміна мови         |     4     | ✅ PASS |
| `e2e/theme.spec.ts`      | Ініціалізація теми за замовчуванням та динамічна зміна палітри       |     3     | ✅ PASS |

**Разом по адмін-панелі: 13 тестів — 13 passing**

---

## 🏆 Загальний Підсумок: 96 тестів — 100% зелені (Zero Regressions)
