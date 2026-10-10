# 💨 Post-Deployment Smoke — Перевірка працездатності після деплою

## 1. Автоматизований Smoke-сьют API

Після деплою в середовище (Staging/Production) запускається швидка перевірка основних вузлів:

```bash
#!/bin/bash
set -e

TARGET_URL=${1:-"http://localhost:4000"}

echo "🔍 Перевірка життєздатності API: $TARGET_URL"

# 1. Healthcheck ендпоінт
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/api/health" || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Помилка healthcheck: отримано HTTP $HTTP_CODE"
  exit 1
fi
echo "✅ /api/health відповідає 200 OK"

# 2. Документація Swagger
DOCS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/api/docs" || echo "000")
if [ "$DOCS_CODE" != "200" ] && [ "$DOCS_CODE" != "301" ]; then
  echo "⚠️ Попередження: Swagger docs повернув HTTP $DOCS_CODE"
fi

# 3. Перевірка публічних тарифних планів (перевірка зв'язку з PostgreSQL)
PLANS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/api/plans" || echo "000")
if [ "$PLANS_CODE" != "200" ]; then
  echo "❌ Помилка доступу до БД через /api/plans: HTTP $PLANS_CODE"
  exit 1
fi
echo "✅ /api/plans відповідає 200 OK (PostgreSQL з'єднання активне)"
```

---

## 2. Playwright Headless Smoke для UI

Мінімальний швидкий тест (<30 сек), що перевіряє завантаження фронтенду без білих екранів (WSOD):

```typescript
import { test, expect } from '@playwright/test';

test.describe('Production Smoke Verification', () => {
  test('Головна сторінка відкривається без консольних помилок', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);

    // Перевірка рендерингу критичних елементів
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();

    // Жодних неперехоплених помилок JS
    expect(consoleErrors).toHaveLength(0);
  });
});
```

---

## 3. Матриця критеріїв успішності (Go / No-Go)

| Критерій               | Допустиме значення | Дія при порушенні                         |
| :--------------------- | :----------------- | :---------------------------------------- |
| **HTTP Error Rate**    | < 0.1%             | Негайне перемикання трафіку (Rollback)    |
| **API Latency (p95)**  | < 300 ms           | Попередження, аналіз профілювання запитів |
| **DB Connection Pool** | < 70% ліміту       | Перевірка відсутності витоків з'єднань    |
| **Console JS Errors**  | 0 критичних        | Блокування релізу фронтенду               |
