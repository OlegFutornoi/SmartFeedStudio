# Тести автентифікації та реєстрації API (tests/auth/)

Цей модуль містить суворо розділені end-to-end тести публічних ендпоінтів реєстрації (POST /api/auth/register), автентифікації (POST /api/auth/login) та отримання поточного профілю (GET /api/auth/me).

Згідно з інваріантом pw-api:

- auth.positive.spec.ts — виключно позитивні сценарії з відповідями 200 OK та 201 Created.
- auth.negative.spec.ts — виключно негативні тести з відповідями 400 Bad Request та 409 Conflict.

---

## Команди запуску

### Запуск усіх тестів у цій папці

```bash
npx playwright test server/backend/tests/auth
```

### Запуск виключно позитивних тестів (200 / 201)

```bash
npx playwright test server/backend/tests/auth/auth.positive.spec.ts
```

### Запуск виключно негативних тестів (400 / 409)

```bash
npx playwright test server/backend/tests/auth/auth.negative.spec.ts
```

### Запуск з перевіркою стабільності проти флакінесу (3 повтори, 2 потоки)

```bash
npx playwright test server/backend/tests/auth --repeat-each=3 --workers=2
```

### Перегляд HTML-звіту після виконання

```bash
pnpm exec playwright show-report reports/html
```

---

## Перелік тестів

### Позитивні тести (Positive Scenarios) — auth.positive.spec.ts

1. **TC-AUTH-00-01: Легітимна реєстрація нового користувача:**
   - Опис: Реєстрація з валідними email, паролем та іменем.
   - Очікуваний статус: 201 Created.
   - Заголовки: content-type: application/json, x-content-type-options: nosniff.
   - Схема: AuthResponseSchema (перевірка accessToken, refreshToken, tokenType: 'Bearer', роль USER).

2. **TC-AUTH-00-02: Легітимна автентифікація створеного користувача (POST /api/auth/login):**
   - Опис: Вхід за дійсними обліковими даними щойно створеного користувача.
   - Очікуваний статус: 200 OK.
   - Схема: AuthResponseSchema.

3. **TC-AUTH-00-03: Отримання профілю поточного користувача (GET /api/auth/me):**
   - Опис: Перевірка цілісності даних профілю за згенерованим Bearer-токеном.
   - Очікуваний статус: 200 OK.
   - Схема: UserProfileSchema.

4. **TC-AUTH-00-04: Реєстрація з допустимими складними Unicode / українськими символами в імені:**
   - Опис: Перевірка збереження складних імен (наприклад, Дмитро О'Браєн-Ковальчук).
   - Очікуваний статус: 201 Created.
   - Схема: AuthResponseSchema.

---

### Негативні тести та атаки (Negative Scenarios) — auth.negative.spec.ts

1. **TC-SEC-00-01: Спроба передачі забороненого поля role: SUPER_ADMIN (Mass Assignment Defense):**
   - Опис: Зловмисник намагається передати поле role у відкритому запиті реєстрації.
   - Очікуваний статус: 400 Bad Request (відхилення шлюзом ValidationPipe через forbidNonWhitelisted: true).
   - Повідомлення: "property role should not exist".
   - Безпековий інваріант: Атака відхиляється на шлюзі, жоден акаунт не створюється.

2. **TC-SEC-00-02: Захист від перезапису акаунта суперадміна (Account Takeover / Collision):**
   - Опис: Спроба реєстрації на існуючий email суперадміна.
   - Очікуваний статус: 409 Conflict.
   - Безпековий інваріант: Чинний обліковий запис залишається незмінним.

3. **TC-SEC-00-03: Гранична матриця некоректних даних реєстрації (Malformed Inputs):**
   - Опис: Перевірка реакції валідатора DTO на невалідні вхідні дані:
     - Некоректний формат email (без @).
     - Некоректний формат email (без імені користувача @missing-user.com).
     - Пароль коротший за 8 символів.
     - Порожній об'єкт {}.
     - Відсутнє поле password.
     - Явні значення email: undefined, password: undefined.
   - Очікуваний статус: 400 Bad Request для кожного випадку без виключень.
