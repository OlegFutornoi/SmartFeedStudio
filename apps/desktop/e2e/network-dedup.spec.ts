import { test, expect } from '@playwright/test';
import { setupSuppliersFeedsRoutes } from '@e2e/fixtures/suppliers-feeds-mock-data';
import { mockPlans } from '@e2e/fixtures/plans-mock-data';

test.describe('Desktop Network Request Deduplication & Optimization (FE-09, FE-10, FE-14)', () => {
  test.beforeEach(async ({ page }) => {
    await setupSuppliersFeedsRoutes(page);

    await page.route('**/api/navigation*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'item-1',
            key: 'dashboard',
            labelUk: 'Дашборд',
            labelEn: 'Dashboard',
            path: '/',
            isVisible: true,
            requiredRoles: ['USER'],
            targetApp: 'DESKTOP',
          },
          {
            id: 'item-2',
            key: 'plans',
            labelUk: 'Тарифи',
            labelEn: 'Plans',
            path: '/plans',
            isVisible: true,
            requiredRoles: ['USER'],
            targetApp: 'DESKTOP',
          },
        ]),
      });
    });

    await page.route('**/api/plans', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPlans),
      });
    });

    await page.route('**/api/page-guides/assistant/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          name: 'SmartFeed AI',
          roleUk: 'AI Асистент',
          roleEn: 'AI Assistant',
          badgeUk: 'Асистент',
          badgeEn: 'Assistant',
        }),
      });
    });

    await page.route('**/api/page-guides/dashboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          route: '/',
          titleUk: 'Дашборд',
          titleEn: 'Dashboard',
          icon: 'LayoutDashboard',
          summaryUk: 'Огляд показників',
          summaryEn: 'Metrics overview',
        }),
      });
    });

    await page.route('**/api/page-guides/plans', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          route: '/plans',
          titleUk: 'Тарифні плани',
          titleEn: 'Plans & Pricing',
          icon: 'CreditCard',
          summaryUk: 'Огляд тарифів',
          summaryEn: 'Pricing overview',
        }),
      });
    });
  });

  test('1. Navigating to Plans page fires at most 1 /licenses/my request', async ({ page }) => {
    let licenseMyRequests = 0;

    page.on('request', (req) => {
      if (req.url().includes('/api/licenses/my') && req.method() === 'GET') {
        licenseMyRequests++;
      }
    });

    await page.goto('/plans');
    await expect(page.getByTestId('plans-page')).toBeVisible();

    await page.waitForTimeout(400);

    // Assert strictly deduplicated (FE-09 and FE-10)
    expect(licenseMyRequests).toBeLessThanOrEqual(1);
  });

  test('2. Navigating to Home page loads suppliers without redundant duplicate requests', async ({
    page,
  }) => {
    let suppliersGetRequests = 0;

    page.on('request', (req) => {
      const url = req.url();
      if (
        (url.includes('/api/suppliers') || url.includes(':4000/api/suppliers')) &&
        !url.includes('/api/suppliers/') &&
        !url.includes('.ts') &&
        req.method() === 'GET'
      ) {
        suppliersGetRequests++;
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    expect(suppliersGetRequests).toBeLessThanOrEqual(1);
  });

  test('3. Navigating across tabs reuses in-memory cache with zero duplicate requests (FE-14)', async ({
    page,
  }) => {
    let plansRequests = 0;
    let notFoundErrors = 0;

    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/plans') && !url.includes('.ts') && req.method() === 'GET') {
        plansRequests++;
      }
    });

    page.on('response', (res) => {
      if (res.status() === 404 && res.url().includes('/api/')) {
        notFoundErrors++;
      }
    });

    // 1. Visit Plans page
    await page.goto('/plans');
    await expect(page.getByTestId('plans-page')).toBeVisible();
    expect(plansRequests).toBe(1);

    // 2. Click sidebar navigation to Dashboard
    await page.getByTestId('nav-item-dashboard').click();
    await expect(page.getByTestId('home-page')).toBeVisible();

    // 3. Click sidebar navigation back to Plans
    await page.getByTestId('nav-item-plans').click();
    await expect(page.getByTestId('plans-page')).toBeVisible();

    await page.waitForTimeout(300);

    // Assert cache hit: plansRequests remains strictly 1 (FE-14)
    expect(plansRequests).toBe(1);
    expect(notFoundErrors).toBe(0);
  });
});
