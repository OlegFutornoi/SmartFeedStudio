# 📋 Задача QA-BE-00: Синхронізація OpenAPI схеми, типізація API-клієнтів, негативні тести реєстрації та аудит безпеки доступу до адмінки (RBAC / BFLA)

> **Префікс / ID:** `qa-be-00`  
> **Статус:** 🟢 Виконано (Completed) — 25.10.2026  
> **Відповідальний агент:** `@agents_qa`  
> **Напрямок:** `Server / Backend` (`e2e/server/backend/tests/`) та `Server / Admin` (`e2e/server/admin/tests/`)  
> **Цільове середовище:** Ізольований тестовий контур (NestJS API `http://localhost:4001/api`, PostgreSQL `localhost:5433/smartfeed_test_db`, Mailpit `http://localhost:8025`, Admin Portal `http://localhost:3001`)

---

## 1. Мета та архітектурний контекст

Забезпечити фундамент автотестування для всього проєкту `e2e/` через:

1. **Синхронізацію контракту**: вивантаження актуальної OpenAPI схеми з бекенду Swagger (`/api/docs-json`) та автоматична генерація суворої TypeScript-типізації запитів і відповідей (`e2e/core/contracts/api.generated.ts`).
2. **Конфігурація Super Admin**: фіксація облікових даних суперадміна в оточенні (`.env`), сид суперадміна в ізольованій тестовій базі (`smartfeed_test_db` на порті `5433`).
3. **Негативні тести реєстрації та спроби ескалації привілеїв (Privilege Escalation / Mass Assignment)**: перевірка, чи не дозволяє публічний ендпоінт `POST /api/auth/register` призначити роль `SUPER_ADMIN` або перезаписати акаунт суперадміна.
4. **Сек'юріті-тести доступу до адмін-даних (BFLA / BOLA / Broken Access Control за OWASP Top 10)**: автоматизоване підтвердження, що неавторизований відвідувач або звичайний користувач `USER` не можуть отримати доступ до списку користувачів (`GET /api/users`), їхніх ліцензій, статистики чи адмін-панелі.

---

## 2. Поетапний план реалізації

### Етап 1: Вивантаження OpenAPI схеми та автогенерація типізації контрактів

- [x] **1.1. Скрипт синхронізації OpenAPI**:
  - Створено `scripts/sync-openapi.mjs`, який скачує актуальну специфікацію Swagger з `http://localhost:4001/api/docs-json` (або `http://localhost:4000/api/docs-json`) і зберігає її у файл `e2e/schema/openapi.json`.
- [x] **1.2. Інтеграція генератора TypeScript-типів**:
  - Підключено `openapi-typescript` у `e2e/package.json`.
  - Додано скрипт `"openapi:generate": "openapi-typescript ./schema/openapi.json -o ./core/contracts/api.generated.ts"`.
  - Згенеровано 100% типізовані схеми для запитів (Body, Query, Params) та відповідей (200, 201, 400, 401, 403, 409).
- [x] **1.3. Створення базового типізованого API-клієнта**:
  - Оновлено `e2e/server/backend/clients/auth.client.ts` та створено `e2e/server/backend/clients/users.client.ts` з використанням згенерованих типів.

---

### Етап 2: Фіксація облікових даних Super Admin в оточенні та базі

- [x] **2.1. Оновлення конфігурації оточення**:
  - Внесено в `e2e/.env.example` та `e2e/config/env.ts`:
    - `E2E_SUPERADMIN_EMAIL=superadmin@smartfeed.local`
    - `E2E_SUPERADMIN_PASSWORD=SuperAdminPassword123!`
    - `E2E_SUPERADMIN_NAME="E2E Super Admin"`
- [x] **2.2. Забезпечення сиду Super Admin у тестову базу (`5433`)**:
  - Оновлено `scripts/sync-server-e2e-db.mjs`, щоб при сиді створювався користувач з роллю `Role.SUPER_ADMIN`, валідним хешем пароля та персональною організацією (без витоку реальних паролів у код скриптів).

---

### Етап 3: Негативні тести реєстрації (Negative Tests & Privilege Escalation)

Файл специфікації: `e2e/server/backend/tests/auth/auth-negative-security.spec.ts`

- [x] **TC-SEC-00-01: Спроба підвищення привілеїв через Mass Assignment (`role: SUPER_ADMIN`)**:
  - Дія: `POST /api/auth/register` з тілом `{ email: "attacker@smartfeed.local", password: "Password123!", role: "SUPER_ADMIN" }`.
  - Очікуваний результат: система захищає контур — поле `role` ігнорується, і створений юзер має роль `Role.USER`.
- [x] **TC-SEC-00-02: Захист від перезапису акаунта суперадміна (Account Takeover / Collision)**:
  - Дія: `POST /api/auth/register` з email діючого суперадміна (`superadmin@smartfeed.local`) та довільним паролем.
  - Очікуваний результат: статус `409 Conflict`, хеш пароля та роль суперадміна в базі залишаються незмінними.
- [x] **TC-SEC-00-03: Негативні валідаційні кейси реєстрації (Malformed Inputs)**:
  - Реєстрація з некоректним email, коротким паролем (<8 символів), порожнім тілом (`{}`) та відсутніми полями.
  - Очікуваний результат: статус `400 Bad Request` з масивом помилок валідації.
- [x] **TC-SEC-00-04: Ін'єкційні вектори (XSS / SQLi Payloads)**:
  - Реєстрація з XSS та SQLi у полі `fullName`.
  - Перевірка: бекенд санітизує або безпечно зберігає текст без виконання/помилок 500.

---

### Етап 4: Сек'юріті-тести доступу до адмін-даних (BFLA / Broken Access Control)

Файл специфікації: `e2e/server/backend/tests/rbac/rbac-admin-security.spec.ts`

- [x] **TC-SEC-00-05: Спроба неавторизованого доступу до списку користувачів (Unauthenticated)**:
  - Дія: `GET /api/users` без токена `Authorization`.
  - Очікуваний результат: статус `401 Unauthorized`. Жодні персональні дані не повертаються.
- [x] **TC-SEC-00-06: Спроба доступу звичайного користувача до списку клієнтів (BFLA / Role Guard)**:
  - Дія: логін звичайного користувача з роллю `USER`.
  - Виконання запиту: `GET /api/users` з Bearer-токеном звичайного користувача.
  - Очікуваний результат: статус `403 Forbidden` з повідомленням "Forbidden: Admin access required".
- [x] **TC-SEC-00-07: Спроба звичайного користувача отримати статистику або огляд адмінки**:
  - Дія: `GET /api/users/stats` та `GET /api/users/dashboard-overview` з токеном `USER`.
  - Очікуваний результат: статус `403 Forbidden`.
- [x] **TC-SEC-00-08: Спроба звичайного користувача змінити статус чи видалити акаунт суперадміна (IDOR)**:
  - Дія: `PATCH /api/users/{superadminId}/status` та `DELETE /api/users/{superadminId}` з токеном `USER`.
  - Очікуваний результат: статус `403 Forbidden`.
- [x] **TC-SEC-00-09: Легітимний авторизований доступ Super Admin**:
  - Дія: логін суперадміна (`POST /api/auth/login`), запит `GET /api/users`.
  - Очікуваний результат: статус `200 OK`, повертається список користувачів, дані валідуються проти згенерованого DTO-контракту OpenAPI.
- [x] **TC-SEC-00-10: Перевірка захисту маршрутів Admin Portal у браузері**:
  - Файл: `e2e/server/admin/tests/access/admin-portal-access.spec.ts`
  - Неавторизований користувач переходить на `http://localhost:3001/users`: автоматичний редирект на `/login`.
  - Користувач з роллю `USER` входить у систему та намагається відкрити `/users`: інтерфейс блокує доступ (редирект на `/login`), у DOM відсутні дані інших користувачів.

---

## 3. Файлова структура робіт

```
e2e/
├── schema/
│   └── openapi.json                  # Завантажена актуальна OpenAPI специфікація
├── core/
│   └── contracts/
│       └── api.generated.ts          # Автогенеровані TypeScript-типи з OpenAPI
├── server/
│   ├── backend/
│   │   ├── clients/
│   │   │   ├── auth.client.ts        # Оновлений клієнт з OpenAPI типізацією
│   │   │   └── users.client.ts       # Клієнт адмінських запитів (/api/users)
│   │   └── tests/
│   │       ├── auth/
│   │       │   └── auth-negative-security.spec.ts # Негативні тести реєстрації та ролей
│   │       └── rbac/
│   │           └── rbac-admin-security.spec.ts    # Аудит безпеки доступу до даних (BFLA)
│   └── admin/
│       └── tests/
│           └── access/
│               └── admin-portal-access.spec.ts    # UI-перевірка захисту адмін-порталу
scripts/
└── sync-openapi.mjs                  # Скрипт вивантаження та генерації схеми
```

---

## 4. Критерії готовності (DoD)

1. [x] Згенеровано `e2e/schema/openapi.json` та `e2e/core/contracts/api.generated.ts` без ручних псевдотипів.
2. [x] Облікові дані суперадміна зафіксовані в `e2e/config/env.ts` та присутні в тестовій базі `5433` (без хардкоду секретів у скриптах).
3. [x] Усі тест-кейси `TC-SEC-00-01` – `TC-SEC-00-10` реалізовано згідно з 4-шаровим захистом перевірок (`assertSuccessResponse`, `assertErrorResponse`):
   - Шар 1 (Crash Guard): `expect(res.status()).not.toBe(500)`.
   - Шар 2 (Deterministic Status): сувора точна відповідність статус-кодів (`201`, `200`, `400`, `401`, `403`, `409`) без нечітких масивів.
   - Шар 3 (Security & Protocol Headers): обов'язкова перевірка `content-type: application/json` та заголовка захисту `x-content-type-options: nosniff`.
   - Шар 4 (Runtime Contract Schema Validation): рантайм-перевірка тіла відповіді через Zod-схеми (`AuthResponseSchema`, `UserProfileSchema`, `UsersListResponseSchema`, `UsersStatsSchema`, `DashboardOverviewSchema`) та стандартної структури помилок NestJS/RFC 7807.
4. [x] Жодних відносних імпортів — 100% `@/*` аліаси (`CORE-01`).
5. [x] Прогін `pnpm e2e:server` завершується з детальним звітом безпеки (14 passed, 100%).
6. [x] Стабільність: `npx playwright test server/backend --repeat-each=3 --workers=2` (29 passed, 0 flakiness).
7. [x] `pnpm --filter @smartfeed/e2e typecheck` проходить із 0 помилок.
