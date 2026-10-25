---
name: pw-a11y
description: Accessibility (a11y) testing skill for insurance-e2e (finance.ua / minfin.ua). Use when writing accessibility audits, integrating @axe-core/playwright, verifying WCAG compliance, checking ARIA roles/labels, keyboard navigation (Tab/Enter/Space), and screen-reader accessibility on calculator and checkout forms.
---

# Accessibility & Inclusion Testing (`pw-a11y`)

Standards for WCAG 2.1 (Level AA) accessibility compliance, keyboard navigation audits, and `@axe-core/playwright` integration in `insurance-e2e`.

---

## 1. Automated Accessibility Audit with AxeBuilder

```typescript
import { expect } from '@playwright/test';
import { e2eTest } from '@/fixtures/index';
import AxeBuilder from '@axe-core/playwright';

e2eTest(
  'Accessibility audit for OSAGO calculator',
  { tag: ['@finance', '@osago', '@a11y'] },
  async ({ finance, page }) => {
    await finance.landingPage.open();
    await finance.landingPage.toBeLoaded();

    const results = await new AxeBuilder({ page })
      .include("[data-gtm-ea='LandingMainContent']")
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  },
);
```

---

## 2. Keyboard Navigation Testing

Verify form usability via keyboard alone across checkout and wizard forms:

- Focus Progression: `page.keyboard.press("Tab")` moves focus sequentially through interactive elements.
- Element Activation: `Enter` or `Space` triggers selected buttons, toggles checkboxes, and expands selects.
- Modal Dismissal: `Escape` closes active modal overlays (`Wizard.modal.ts`, `FullscreenModal.component.ts`).

Example:

```typescript
await page.keyboard.press('Tab');
await expect(page.getByRole('button', { name: 'Розрахувати' })).toBeFocused();
await page.keyboard.press('Enter');
```

---

## 3. Core Accessibility Invariants

1. Headings: Exactly one `<h1>` per view with sequential `<h2>`-`<h6>` hierarchy.
2. Form Labels: Every interactive input must have an associated `<label>` or `aria-label`.
3. Image Semantics: Meaningful `alt` descriptions on content images; empty `alt=""` for decorative assets.
4. Focus Traps: Modal dialogs must trap keyboard focus within the dialog container while open.
5. Contrast & Visual Cues: Errors must never rely solely on color; include textual error messages and icons.
