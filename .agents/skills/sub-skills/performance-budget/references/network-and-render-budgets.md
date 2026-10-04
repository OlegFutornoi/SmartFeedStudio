# Network & Render Budgets: Zero Duplicate Calls

## 1. Залізний Playwright тест: Ровно 1 виклик API на сторінку

Будь-який ключовий екран тестується на відсутність подвійних викликів ендпоінтів:

```typescript
import { test, expect } from '@playwright/test';

test('Verify Zero Duplicate API Calls on Feeds page load', async ({ page }) => {
  let feedsCallCount = 0;
  let plansCallCount = 0;

  page.on('request', (req) => {
    if (req.url().includes('/api/feeds') && req.method() === 'GET') {
      feedsCallCount++;
    }
    if (req.url().includes('/api/plans') && req.method() === 'GET') {
      plansCallCount++;
    }
  });

  await page.goto('/feeds');
  await page.waitForLoadState('networkidle');

  // Інваріант: рівно 1 виклик на кожен ресурс
  expect(feedsCallCount, 'GET /api/feeds повинен викликатися рівно 1 раз').toBe(1);
  expect(plansCallCount, 'GET /api/plans повинен викликатися рівно 1 раз').toBe(1);
});
```

## 2. In-Flight Request Deduplication через `useRef`

Якщо кілька компонентів сторінки запитують одні й ті самі дані:

```typescript
export function useSharedDataFetcher<T>(fetchFn: () => Promise<T>) {
  const inFlightPromiseRef = useRef<Promise<T> | null>(null);

  const fetchData = useCallback(async () => {
    if (inFlightPromiseRef.current) {
      return inFlightPromiseRef.current; // Повертаємо існуючий проміс
    }

    try {
      inFlightPromiseRef.current = fetchFn();
      const result = await inFlightPromiseRef.current;
      return result;
    } finally {
      inFlightPromiseRef.current = null;
    }
  }, [fetchFn]);

  return { fetchData };
}
```

## 3. Бюджет рендерингу (React.memo та ізоляція)

- Рендеринг списку товарів (до 500 рядків без віртуалізації): **< 16 мс** (60 FPS).
- Списки понад 500 рядків: **обов'язкове використання віртуалізації** (`@tanstack/react-virtual`).
