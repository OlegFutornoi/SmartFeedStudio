# 📈 Матриця Покриття Тестами — SmartFeed Studio

## 📊 Повний Звіт про Автоматизовані Тести (101 з 101 пройдено — 100% PASS)

> [!NOTE]
> Схему тарифів оновлено до 4-рівневої: **STARTER → GROWTH → PRO → ENTERPRISE** з квотами постачальників (`maxSuppliersLimit`). Реалізовано архітектуру Організацій, командних місць, розділено сторінки Тарифів та Ліцензій в адмін-панелі та додано підменю налаштувань. Усі тести оновлені та пройдені.

### 1. Бекенд API (Jest E2E — 62 тести)

> Команда запуску: `pnpm --filter @smartfeed/backend-api test:e2e`

| Файл тесту                           | Ендпоінти / Функціонал                                                                                                                                         | Кількість | Статус  |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | :-----: |
| `test/auth.e2e-spec.ts`              | `POST /auth/register`, `POST /auth/login`                                                                                                                      |    12     | ✅ PASS |
| `test/password-recovery.e2e-spec.ts` | `POST /auth/forgot-password`, `POST /auth/reset-password`                                                                                                      |     8     | ✅ PASS |
| `test/licenses.e2e-spec.ts`          | `GET /licenses/my` (STARTER auto-provisioning, quota fields), `POST /licenses/select-plan` (4-tier), dynamic duration, expiration, `RequireActiveLicenseGuard` |     7     | ✅ PASS |
| `test/organizations.e2e-spec.ts`     | `GET /organizations`, `GET /organizations/:id`, `PATCH /organizations/:id`, `GET /members`, `POST /members` (`maxTeamSeats`), `DELETE /members/:id`            |     8     | ✅ PASS |
| `test/users.e2e-spec.ts`             | `GET /users`, `GET /users/stats`, `POST /auth/change-password`                                                                                                 |     7     | ✅ PASS |
| `test/navigation.e2e-spec.ts`        | `GET /navigation`, `GET /navigation/admin`, `POST /navigation`, `PATCH /navigation/:id`, `DELETE /navigation/:id`                                              |     8     | ✅ PASS |
| `test/plans.e2e-spec.ts`             | `GET /plans`, `GET /plans/admin`, `POST /plans`, `PATCH /plans/:id`, `DELETE /plans/:id`, `GET /licenses/admin`                                                |    12     | ✅ PASS |

**Разом по бекенду: 62 тести — 62 passing**

---

### 2. Десктопний Клієнт (Playwright E2E — 22 тести)

> Команда запуску: `pnpm test:desktop`

| Файл тесту                      | Сценарії тестування                                                                                  | Кількість | Статус  |
| :------------------------------ | :--------------------------------------------------------------------------------------------------- | :-------: | :-----: |
| `e2e/auth.spec.ts`              | Захист роутів, 401 помилка, вхід, реєстрація з назвою компанії, мова UA/EN, тема                     |     6     | ✅ PASS |
| `e2e/password-recovery.spec.ts` | Форма відновлення, валідація токену, зміна паролю, вхід з новим паролем                              |     7     | ✅ PASS |
| `e2e/plans.spec.ts`             | Перегляд планів, зворотний відлік, вибір PRO, блокувальник `ExpiredPlanBlocker`, розблокування, i18n |     4     | ✅ PASS |
| `e2e/navigation.spec.ts`        | Сайдбар меню, фільтрація за ролями, згортання/розгортання                                            |     2     | ✅ PASS |
| `e2e/theme.spec.ts`             | Палітри shadcn (Zinc, Slate, Stone, Bronze), Dark/Light режим                                        |     3     | ✅ PASS |

**Разом по десктопу: 22 тести — 22 passing**

---

### 3. Адмін-Панель (Playwright E2E — 16 тестів)

> Команда запуску: `pnpm test:admin`

| Файл тесту               | Сценарії тестування                                                                        | Кількість | Статус  |
| :----------------------- | :----------------------------------------------------------------------------------------- | :-------: | :-----: |
| `e2e/auth.spec.ts`       | Форма входу адміна, локалізовані помилки                                                   |     2     | ✅ PASS |
| `e2e/plans.spec.ts`      | Автономна сторінка `/plans`: створення плану, редагування цін, видалення з діалогом        |     4     | ✅ PASS |
| `e2e/licenses.spec.ts`   | Реєстр виданих ліцензій на `/licenses`, кнопка оновлення таблиці                           |     2     | ✅ PASS |
| `e2e/navigation.spec.ts` | Головне меню (Тарифи/Ліцензії), симулятор ролей/планів, фільтри, мова, підменю Налаштувань |     7     | ✅ PASS |
| `e2e/theme.spec.ts`      | Ініціалізація теми за замовчуванням (Zinc) та динамічна зміна палітри                      |     2     | ✅ PASS |

**Разом по адмін-панелі: 17 тестів — 17 passing**

---

## 🏆 Загальний Підсумок: 101 тест — 100% зелені (Zero Regressions)
