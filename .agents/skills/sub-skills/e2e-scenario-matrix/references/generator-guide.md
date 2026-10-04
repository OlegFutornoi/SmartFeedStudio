# Generator Guide — Трансляція матриці в Playwright тести

## 1. Структура файлу тестів

Файл тесту іменується за доменом: `apps/desktop/e2e/<entity>-lifecycle.spec.ts`.

## 2. Шаблон генерації тестів

```typescript
import { test, expect } from '@playwright/test';

const testEnvironments = [
  { name: 'Mock Mode', path: '?mock=true' },
  { name: 'Real API Mode', path: '' },
];

const locales = ['uk', 'en'] as const;

for (const env of testEnvironments) {
  for (const locale of locales) {
    test.describe(`[${env.name}] [Locale: ${locale}] Feeds & Products Flow`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(`/${locale}/feeds${env.path}`);
      });

      test('full lifecycle: create -> verify counters -> delete cascade', async ({ page }) => {
        // 1. Створення / Імпорт
        // 2. Перевірка оновлення лічильників
        // 3. Перевірка конкретних назв замість заголовків колонок
        // 4. Каскадне видалення
        // 5. Перевірка, що лічильники зменшились
      });
    });
  }
}
```
