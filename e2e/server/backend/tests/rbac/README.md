# Тести контролю доступу та безпеки адмінки (RBAC / BFLA) (`tests/rbac/`)

Цей модуль містить суворо розділені тести перевірки контролю доступу до конфіденційних ендпоінтів управління користувачами (`/api/users`), ліцензіями та статистикою платформи за стандартами **OWASP API Security Top 10**.

Згідно з інваріантом `pw-api`:

- **`rbac.positive.spec.ts`** — виключно легітимний доступ Super Admin з відповідями `200 OK`.
- **`rbac.negative.spec.ts`** — виключно негативні тести несанкціонованого доступу з відповідями `401 Unauthorized` та `403 Forbidden`.

---

## Команди запуску

### Запуск усіх тестів у цій папці

```bash
npx playwright test server/backend/tests/rbac
```

### Запуск виключно позитивних тестів (200 OK)

```bash
npx playwright test server/backend/tests/rbac/rbac.positive.spec.ts
```

### Запуск виключно негативних тестів (401 / 403)

```bash
npx playwright test server/backend/tests/rbac/rbac.negative.spec.ts
```

### Запуск з перевіркою стабільності (3 повтори, 2 потоки)

```bash
npx playwright test server/backend/tests/rbac --repeat-each=3 --workers=2
```

### Перегляд HTML-звіту після виконання

```bash
pnpm exec playwright show-report reports/html
```

---

## Перелік тестів

### Позитивні тести (Positive Scenarios) — [rbac.positive.spec.ts](file:///Users/oleg/AQA/SmartFeedStudio/e2e/server/backend/tests/rbac/rbac.positive.spec.ts)

1. **TC-SEC-00-09: Легітимний авторизований доступ Super Admin до списку клієнтів (`GET /api/users`):**
   - **Опис:** Перевірка отримання списку зареєстрованих клієнтів адміністратором платформи.
   - **Очікуваний статус:** `200 OK`.
   - **Схема:** `UsersListResponseSchema` (масив клієнтів з ролями `USER`/`ADMIN`).

2. **TC-SEC-00-09: Легітимний доступ Super Admin до статистики користувачів (`GET /api/users/stats`):**
   - **Опис:** Отримання агрегованої статистики користувачів та активних ліцензій.
   - **Очікуваний статус:** `200 OK`.
   - **Схема:** `UsersStatsSchema`.

3. **TC-SEC-00-09: Легітимний доступ Super Admin до огляду дашборду (`GET /api/users/dashboard-overview`):**
   - **Опис:** Отримання зведеного дашборду аналітики та останніх операцій.
   - **Очікуваний статус:** `200 OK`.
   - **Схема:** `DashboardOverviewSchema`.

---

### Негативні тести та блокування несанкціонованого доступу (Negative Scenarios) — [rbac.negative.spec.ts](file:///Users/oleg/AQA/SmartFeedStudio/e2e/server/backend/tests/rbac/rbac.negative.spec.ts)

1. **TC-SEC-00-05: Спроба неавторизованого доступу до списку користувачів (Unauthenticated):**
   - **Опис:** Анонімний клієнт без токена намагається отримати список клієнтів (`GET /api/users`).
   - **Очікуваний статус:** `401 Unauthorized`.

2. **TC-SEC-00-06: Спроба доступу звичайного користувача до списку клієнтів (BFLA / Role Guard):**
   - **Опис:** Користувач зі стандартною роллю `USER` намагається відкрити `/api/users`.
   - **Очікуваний статус:** `403 Forbidden`.

3. **TC-SEC-00-07: Спроба звичайного користувача отримати статистику або огляд адмінки:**
   - **Опис:** Користувач з роллю `USER` викликає `/api/users/stats` та `/api/users/dashboard-overview`.
   - **Очікуваний статус:** `403 Forbidden` для обох запитів.

4. **TC-SEC-00-08: Спроба звичайного користувача змінити статус чи видалити акаунт суперадміна (IDOR / BOLA):**
   - **Опис:** Спроба модифікації (`PATCH /api/users/{superadminId}/status`) або видалення (`DELETE /api/users/{superadminId}`) з правами `USER`.
   - **Очікуваний статус:** `403 Forbidden` для обох операцій.
