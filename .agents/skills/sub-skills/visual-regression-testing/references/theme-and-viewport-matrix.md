# Visual Matrix: Themes, Viewports & Solid Sticky Headers

## 1. Автоматизований тест 100% Solid Sticky Header

Один із головних візуальних дефектів — прозорий `thead.sticky.top-0`, коли рядки таблиці прокручуються під ним і текст нашаровується один на одного:

```typescript
import { test, expect } from '@playwright/test';
import { disableAnimations } from './deterministic-ui-states';

test('Verify 100% solid sticky table header under scroll', async ({ page }) => {
  await page.goto('/feeds');
  await page.waitForLoadState('networkidle');
  await disableAnimations(page);

  const tableHeader = page.locator('table thead');
  await expect(tableHeader).toBeVisible();

  // 1. Скріншот шапки в початковому стані (до скролу)
  await expect(tableHeader).toHaveScreenshot('sticky-header-initial.png');

  // 2. Прокручуємо таблицю вниз на 300px так, щоб рядки пішли під шапку
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(100);

  // 3. Скріншот шапки ПІД ЧАС скролу — шапка зобов'язана бути 100% непрозорою
  await expect(tableHeader).toHaveScreenshot('sticky-header-scrolled.png');

  // 4. Перевірка обчисленого кольору фону: заборонено transparent або rgba(..., 0)
  const bgColor = await tableHeader.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });
  expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(bgColor).not.toBe('transparent');
});
```

## 2. Матриця розширень (Responsive Viewports)

```typescript
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

for (const vp of VIEWPORTS) {
  test(`Layout visual check on ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/feeds');
    await disableAnimations(page);
    await expect(page).toHaveScreenshot(`feeds-${vp.name}.png`);
  });
}
```
