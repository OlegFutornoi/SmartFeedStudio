# Playwright Frontend Testing Guide

Best practices for writing deterministic, isolated, and fast Playwright E2E tests for `apps/desktop` and `apps/admin-portal`.

## 1. Browser Automation Execution Policy

> [!CAUTION]
> STRICT PROHIBITION OF `browser_subagent`:
> Never invoke `browser_subagent` or `open_browser_url`. Run automated tests directly using local browser binaries via:
>
> - `pnpm e2e:local:desktop`
> - `pnpm e2e:server:admin`

## 2. Page Object Model (POM) Architecture

Organize tests using Page Objects to separate page interactions from assertions:

```typescript
// tests/pages/feeds.page.ts
import { Page, Locator } from '@playwright/test';

export class FeedsPage {
  readonly page: Page;
  readonly emptyStateCard: Locator;
  readonly createFeedButton: Locator;
  readonly tableRows: Locator;
  readonly feedNameInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emptyStateCard = page.locator('[data-testid="empty-state-card"]');
    this.createFeedButton = page.locator('[data-testid="btn-create-feed"]');
    this.tableRows = page.locator('[data-testid="feed-table-row"]');
    this.feedNameInput = page.locator('[data-testid="input-feed-name"]');
  }

  async goto() {
    await this.page.goto('/feeds');
    await this.page.waitForLoadState('networkidle');
  }
}
```

## 3. Dedicated Bilingual UI Localization Test (UA <-> EN)

Every new view must assert dynamic language switching without hardcoded fallbacks:

```typescript
test('dynamically translates all view elements when switching UA <-> EN', async ({ page }) => {
  await page.goto('/catalogs');

  // 1. Assert Ukrainian locale content rendered
  await expect(page.locator('h1')).toHaveText(ukDict.catalogs.title);
  await expect(page.locator('[data-testid="th-name"]')).toHaveText(ukDict.catalogs.nameColumn);
  await expect(page.locator('[data-testid="btn-create"]')).toHaveText(ukDict.catalogs.createButton);

  // 2. Switch to English
  await page.locator('[data-testid="lang-switch-en"]').click();

  // 3. Assert English translation
  await expect(page.locator('h1')).toHaveText('Feed Catalogs');
  await expect(page.locator('[data-testid="th-name"]')).toHaveText('Name');
  await expect(page.locator('[data-testid="btn-create"]')).toHaveText('Create Catalog');
});
```

## 4. Automated Network Deduplication Test

Assert that API endpoints are called strictly 1 time upon page navigation:

```typescript
test('loads catalog data with strictly 1 network request (zero duplicates)', async ({ page }) => {
  let requestCount = 0;

  page.on('request', (req) => {
    if (req.url().includes('/api/catalogs') && req.method() === 'GET') {
      requestCount++;
    }
  });

  await page.goto('/catalogs');
  await page.waitForSelector('[data-testid="catalogs-table"]');

  // Must be strictly 1 request - zero duplicates
  expect(requestCount).toBe(1);
});
```

## 5. Complete Test Isolation & State Cleanup

Prevent state leakage between test cases:

```typescript
test.beforeEach(async ({ context }) => {
  // Clear cookies and storage
  await context.clearCookies();
});

test.afterEach(async ({ page }) => {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});
```

## 6. Condition-Based Waiting (Zero Arbitrary Sleeps)

```typescript
// BAD: Arbitrary sleep creates flaky and slow tests
await page.waitForTimeout(3000);

// GOOD: Wait for specific condition or response
await Promise.all([
  page.waitForResponse((res) => res.url().includes('/api/feeds') && res.status() === 201),
  page.locator('[data-testid="btn-submit"]').click(),
]);

await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
```
