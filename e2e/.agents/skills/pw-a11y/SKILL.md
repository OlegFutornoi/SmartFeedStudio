---
name: pw-a11y
description: Accessibility (a11y) testing skill for SmartFeed Studio E2E. Use when writing accessibility audits, integrating @axe-core/playwright, verifying WCAG compliance, checking ARIA roles/labels, keyboard navigation (Tab/Enter/Space), and screen-reader accessibility on dialogs, data tables, and forms.
---

# Accessibility & Inclusion Testing (`pw-a11y`)

Standards for WCAG 2.1 (Level AA) accessibility compliance, keyboard navigation audits, and `@axe-core/playwright` integration in SmartFeed Studio E2E.

---

## 1. Automated Accessibility Audit with AxeBuilder

```typescript
import { expect } from '@playwright/test';
import { test } from '@/core/fixtures/base.fixture';
import AxeBuilder from '@axe-core/playwright';

test(
  'Accessibility audit for Admin Portal dashboard',
  { tag: ['@server-admin', '@a11y'] },
  async ({ page }) => {
    await page.goto('/dashboard');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  },
);
```

---

## 2. Keyboard Navigation Audit

- Verify that all modal dialogs, select dropdowns, and buttons are accessible via `Tab` / `Shift+Tab`.
- Ensure pressing `Escape` closes modals and dropdowns without triggering side effects.
- Verify focus indicators are visible on interactive components.
