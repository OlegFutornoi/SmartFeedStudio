# Playwright Visual Snapshots & Baseline Calibration

## 1. Канонічний патерн тесту скріншота

```typescript
import { test, expect } from '@playwright/test';
import { disableAnimations, maskDynamicElements } from './deterministic-ui-states';

test.describe('Visual Regression: Tariff Plans Page', () => {
  test('should match visual baseline in light mode', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Заморожуємо рендер для 100% детермінізму
    await disableAnimations(page);

    // Звірка зі знімком
    await expect(page).toHaveScreenshot('pricing-page-light.png', {
      maxDiffPixelRatio: 0.01, // не більше 1% розбіжності пікселів
      animations: 'disabled',
      mask: [page.locator('[data-testid="last-synced-time"]')],
    });
  });

  test('should match visual baseline in dark mode', async ({ page }) => {
    await page.goto('/pricing');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForLoadState('networkidle');
    await disableAnimations(page);

    await expect(page).toHaveScreenshot('pricing-page-dark.png', {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
      mask: [page.locator('[data-testid="last-synced-time"]')],
    });
  });
});
```

## 2. Оновлення еталонних знімків (Baselines)

При навмисній зміні дизайну еталонні скріншоти оновлюються командою:

```bash
pnpm test:desktop --update-snapshots
# або
pnpm test:admin --update-snapshots
```

## 3. Чеклист для надійних скріншотів

- [ ] Вказано `maxDiffPixelRatio: 0.01` або `maxDiffPixels: 50`.
- [ ] Використовується `animations: 'disabled'`.
- [ ] Шрифти повністю завантажені (`await page.evaluate(() => document.fonts.ready)`).
