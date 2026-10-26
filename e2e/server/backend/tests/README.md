# Серверні API-тести бекенду (`e2e/server/backend/tests/`)

Ця директорія містить модульні end-to-end тести для NestJS API бекенду (`http://localhost:4001/api`), які виконуються проти ізольованої тестової бази PostgreSQL (`localhost:5433/smartfeed_test_db`).

---

## Команди запуску

### Запуск усіх тестів бекенду

```bash
pnpm --filter @smartfeed/e2e test:server:backend
```

_або через Playwright CLI:_

```bash
npx playwright test server/backend --project=server-backend
```

### Запуск з перевіркою стабільності проти флакінесу (3 повтори, 2 воркери)

```bash
npx playwright test server/backend --project=server-backend --repeat-each=3 --workers=2
```

### Відкриття останнього HTML-звіту

```bash
pnpm exec playwright show-report reports/html
```

---

## Структура підкаталогів

| Каталог                                                                          | Опис модуля                                                                                   | Документація                                                                                     |
| :------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| [`auth/`](file:///Users/oleg/AQA/SmartFeedStudio/e2e/server/backend/tests/auth/) | Тести автентифікації, реєстрації, захисту від Mass Assignment та валідації вхідних даних      | [auth/README.md](file:///Users/oleg/AQA/SmartFeedStudio/e2e/server/backend/tests/auth/README.md) |
| [`rbac/`](file:///Users/oleg/AQA/SmartFeedStudio/e2e/server/backend/tests/rbac/) | Тести контролю доступу (RBAC / BFLA), захисту конфіденційних адмінських даних та IDOR-аудитів | [rbac/README.md](file:///Users/oleg/AQA/SmartFeedStudio/e2e/server/backend/tests/rbac/README.md) |

---

## Стандарти 4-рівневого захисту (4-Layer Defense)

Кожен API-тест виконує обов'язкові 4 рівні верифікації через хелпери [response.assertions.ts](file:///Users/oleg/AQA/SmartFeedStudio/e2e/core/assertions/response.assertions.ts):

1. **Crash Guard:** Перевірка `not.toBe(500)`.
2. **Точний статус-код:** Тільки детерміновані очікування (`200`, `201`, `400`, `401`, `403`, `409`) без плаваючих масивів.
3. **Заголовки:** Перевірка `content-type: application/json` та `x-content-type-options: nosniff`.
4. **Рантайм-схема:** Валідація тіла запиту через Zod-схеми в [schemas.ts](file:///Users/oleg/AQA/SmartFeedStudio/e2e/core/contracts/schemas.ts) або стандарту RFC 7807 для помилок.
