# Playwright & @axe-core Automated Accessibility Integration

## 1. Канонічний патерн тесту доступності

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('A11y Audit: Key User Flows', () => {
  test('Catalog page should have 0 WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/feeds');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['color-contrast-enhanced']) // залишаємо базовий AA 4.5:1
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.error(
        '[A11y Violations Found]:',
        JSON.stringify(accessibilityScanResults.violations, null, 2),
      );
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Modal dialog should have 0 a11y violations when opened', async ({ page }) => {
    await page.goto('/feeds');
    await page.click('[data-testid="create-feed-btn"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const dialogScan = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();

    expect(dialogScan.violations).toEqual([]);
  });
});
```

## 2. Аналіз та звітність порушень

Кожне порушення в масиві `violations` містить:

- `id`: назва правила (наприклад, `button-name`, `color-contrast`, `aria-roles`)
- `impact`: ступінь важливості (`critical`, `serious`, `moderate`, `minor`)
- `nodes`: конкретні HTML селектори порушників з порадами щодо виправлення (`helpUrl`).
