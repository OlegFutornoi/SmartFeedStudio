# Тести захисту маршрутів Admin Portal (UI Access Control) (`tests/access/`)

Цей модуль містить тести веб-інтерфейсу Admin Portal (`http://localhost:3001`), які перевіряють клієнтський захист маршрутів, роботу компонента `AuthGuard` та ізоляцію адмін-панелі від неавторизованих відвідувачів і користувачів з роллю `USER`.

---

## Команди запуску

### Запуск усіх UI-тестів у цій папці

```bash
npx playwright test server/admin/tests/access --project=server-admin
```

### Запуск конкретного файлу

```bash
npx playwright test server/admin/tests/access/admin-portal-access.spec.ts --project=server-admin
```

### Запуск з відкриттям браузера (UI-режим)

```bash
npx playwright test server/admin/tests/access --project=server-admin --headed
```

### Перегляд HTML-звіту після виконання

```bash
pnpm exec playwright show-report reports/html
```

---

## Перелік тестів

### Позитивні тести (Positive Scenarios)

Файл конфігурації сесії: [server-admin.setup.ts](file:///Users/oleg/AQA/SmartFeedStudio/e2e/server/admin/setup/server-admin.setup.ts)

1. **Легітимний вхід Super Admin через веб-форму:**
   - **Опис:** Суперадмін вводить валідний email та пароль на сторінці `/login`, проходить автентифікацію та отримує доступ до панелі управління.
   - **Очікуваний результат:** Успішний редирект до адмін-панелі, збереження токена та стану сесії у `storageState`.

---

### Негативні тести та обмеження прав доступу (Negative Scenarios)

Файл тестів: [admin-portal-access.spec.ts](file:///Users/oleg/AQA/SmartFeedStudio/e2e/server/admin/tests/access/admin-portal-access.spec.ts)

1. **TC-SEC-00-10 (Частина 1): Неавторизований відвідувач при переході на `/users`:**
   - **Опис:** Анонімний користувач відкриває браузер без збережених токенів чи сесії та здійснює прямий перехід на захищену URL-адресу `http://localhost:3001/users`.
   - **Очікуваний результат:** `AuthGuard` миттєво перехоплює запит і редиректить відвідувача на сторінку входу `/login`.
   - **Перевірка UI:** Заголовок сторінки входу (h1) стає видимим, адмінський інтерфейс не завантажується.

2. **TC-SEC-00-10 (Частина 2): Користувач з роллю `USER` намагається відкрити адмін-розділ `/users`:**
   - **Опис:** Попередньо створюється тестовий користувач зі стандартною роллю `Role.USER` (через API-клієнт із 4-шаровою валідацією `assertSuccessResponse`). Його токен підставляється у `localStorage` браузера перед відкриттям сторінки `/users`.
   - **Очікуваний результат:** Клієнтський `AuthGuard` перевіряє роль `user.role === 'USER'`, блокує доступ до адмінки та виселяє користувача на `/login`.
   - **Перевірка безпеки даних:** Елементи таблиці користувачів (`table`) повністю відсутні в DOM-дереві (`not.toBeVisible()`).
