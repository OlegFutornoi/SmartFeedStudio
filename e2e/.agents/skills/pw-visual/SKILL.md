---
name: pw-visual
description: Visual regression & snapshot testing skill for SmartFeed Studio E2E. Use when writing or auditing snapshot tests, using toHaveScreenshot, masking dynamic elements (dates, timers, generated IDs), or configuring snapshot tolerance options (threshold, maxDiffPixels).
---

# Visual Regression & Snapshot Testing (`pw-visual`)

Visual snapshot testing, dynamic element masking, and tolerance configurations for SmartFeed Studio E2E.

---

## 1. Visual Snapshots via `toHaveScreenshot`

```typescript
import { test, expect } from '@/core/fixtures/base.fixture';

test(
  'Visual regression of Admin Portal header',
  { tag: ['@server-admin', '@visual'] },
  async ({ page }) => {
    await page.goto('/dashboard');
    const header = page.getByTestId('admin-header');
    await expect(header).toBeVisible();

    await expect(header).toHaveScreenshot('admin-header.png', {
      maxDiffPixelRatio: 0.05,
    });
  },
);
```

---

## 2. Dynamic Element Masking

- Always mask dynamic elements (timestamps, random IDs, dynamic currencies):
  ```typescript
  await expect(page).toHaveScreenshot('dashboard.png', {
    mask: [page.getByTestId('dynamic-timestamp'), page.getByTestId('currency-rates-widget')],
  });
  ```
