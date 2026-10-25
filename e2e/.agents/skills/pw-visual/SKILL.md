---
name: pw-visual
description: Visual regression & snapshot testing skill for insurance-e2e (finance.ua / minfin.ua). Use when writing or auditing snapshot tests, using expectElementSnapshot, toHaveScreenshot, masking dynamic elements (prices, dates, timers, lead keys), or configuring snapshot tolerance options (threshold, maxDiffPixels).
---

# Visual Regression & Snapshot Testing (`pw-visual`)

Visual snapshot testing, dynamic element masking, and tolerance configurations for `insurance-e2e`.

---

## 1. Component Snapshots via `expectElementSnapshot`

All components extending `BaseComponent` implement `expectElementSnapshot`:

```typescript
import { e2eTest } from '@/fixtures/index';

e2eTest(
  'Visual regression of OSAGO hero banner',
  { tag: ['@finance', '@osago', '@visual'] },
  async ({ finance }, testInfo) => {
    await finance.landingPage.open();
    await finance.landingPage.toBeLoaded();

    // Capture snapshot of component root
    await finance.landingPage.landingBanner.expectElementSnapshot(
      testInfo,
      finance.landingPage.landingBanner.root,
    );
  },
);
```

---

## 2. Dynamic Element Masking

Mask variable content that changes per execution to eliminate flakiness:

- Dynamic prices, discounts, and currency rates.
- Countdown timers (`CountDownTimer.component.ts`).
- Dynamic dates (policy start dates).
- Lead keys and order numbers (`lead.key`).

Example with mask locator:

```typescript
await component.expectElementSnapshot(
  testInfo,
  component.root,
  component.dynamicPriceLocator,
  50, // maxDiffPixels
);
```

---

## 3. Playwright Config Snapshot Tolerances

Global configurations in `playwright.config.ts`:

```typescript
expect: {
    toHaveScreenshot: {
        threshold: 0.35,
        maxDiffPixelRatio: 0.04,
        maxDiffPixels: 400
    }
}
```

Viewports:

- `finance` project: 1440x900
- `minfin` project: 1440x1200

---

## 4. Visual Testing Invariants

1. Prerequisite State: Always await `await component.toBeLoaded()` before taking snapshot.
2. Component Scope: Prefer isolated component snapshots over full-page snapshots.
3. Stable Animations: Await animations to settle prior to snapshot execution.
4. Clean Titles: Ensure test titles do not contain filesystem-reserved characters.
