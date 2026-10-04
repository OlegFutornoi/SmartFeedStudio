# Keyboard Navigation, Tab Order & Modal Focus Traps

## 1. Тестування послідовності `Tab` та `Shift+Tab`

Усі інтерактивні елементи повинні фокусуватися в логічному порядку (зверху-вниз, зліва-направо):

```typescript
import { test, expect } from '@playwright/test';

test('Keyboard Tab navigation sequence in Feed creation form', async ({ page }) => {
  await page.goto('/feeds/new');
  await page.waitForLoadState('networkidle');

  // Починаємо з першого поля
  await page.keyboard.press('Tab');
  await expect(page.locator('input[name="feedName"]')).toBeFocused();

  // Наступний Tab — селект постачальника
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-testid="supplier-select"]')).toBeFocused();

  // Shift+Tab — повернення назад
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('input[name="feedName"]')).toBeFocused();
});
```

## 2. Автоматична валідація Focus Trap у модалках

```typescript
test('Modal Focus Trap should not leak outside dialog', async ({ page }) => {
  await page.goto('/feeds');
  await page.click('[data-testid="open-settings-modal"]');

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();

  // Фокус має бути всередині діалогу
  const activeInside = await page.evaluate(() => {
    const el = document.activeElement;
    return !!el?.closest('[role="dialog"]');
  });
  expect(activeInside).toBe(true);

  // Табаємо 10 разів — фокус ніколи не повинен вийти в фонове вікно
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    const stillInside = await page.evaluate(() => {
      return !!document.activeElement?.closest('[role="dialog"]');
    });
    expect(stillInside).toBe(true);
  }

  // Escape закриває модалку
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});
```

## 3. Видимий фокус (Visible Focus Indicator)

```css
/* Еталонне правило в Tailwind / globals.css */
button:focus-visible,
input:focus-visible,
[role='button']:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}
```
