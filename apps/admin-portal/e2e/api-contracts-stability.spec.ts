import { test, expect } from '@e2e/fixtures/test';
import { mockNavigationItems } from '@e2e/fixtures/test-data';
import { mockPlans, mockLicenses } from '@e2e/fixtures/api-contracts-mock-data';

test.describe('Stability & Performance — Відсутність 404 та задвоєних запитів', () => {
  const setupApiMocks = async (page: import('@playwright/test').Page) => {
    await page.route('**/api/users/stats*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalUsers: 5,
          activeLicenses: 4,
          superAdminsCount: 1,
          standardUsersCount: 4,
        }),
      }),
    );
    await page.route('**/api/users?*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.route('**/api/users', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.route('**/api/plans/admin*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPlans),
      }),
    );
    await page.route('**/api/plans*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPlans),
      }),
    );
    await page.route('**/api/licenses/admin*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLicenses),
      }),
    );
    await page.route('**/api/navigation/admin*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockNavigationItems),
      }),
    );
  };

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('дашборд — завантажується без 404/500 помилок', async ({ page, dashboardPage }) => {
    const apiErrors: string[] = [];
    page.on('response', (resp) => {
      if (resp.url().includes('/api/') && (resp.status() === 404 || resp.status() >= 500)) {
        apiErrors.push(`${resp.status()} → ${resp.url()}`);
      }
    });

    await setupApiMocks(page);
    await dashboardPage.goto();
    await expect(dashboardPage.welcomeBanner).toBeVisible();

    expect(apiErrors).toHaveLength(0);
  });

  test('сторінка тарифних планів — завантажується без 404/500 помилок', async ({
    page,
    plansPage,
  }) => {
    const apiErrors: string[] = [];
    page.on('response', (resp) => {
      if (resp.url().includes('/api/') && (resp.status() === 404 || resp.status() >= 500)) {
        apiErrors.push(`${resp.status()} → ${resp.url()}`);
      }
    });

    await setupApiMocks(page);
    await plansPage.goto();
    await expect(plansPage.pageTitle).toBeVisible();

    expect(apiErrors).toHaveLength(0);
  });

  test('сторінка ліцензій — завантажується без 404/500 помилок', async ({ page, licensesPage }) => {
    const apiErrors: string[] = [];
    page.on('response', (resp) => {
      if (resp.url().includes('/api/') && (resp.status() === 404 || resp.status() >= 500)) {
        apiErrors.push(`${resp.status()} → ${resp.url()}`);
      }
    });

    await setupApiMocks(page);
    await licensesPage.goto();
    await expect(licensesPage.pageTitle).toBeVisible();

    expect(apiErrors).toHaveLength(0);
  });

  test('сторінка навігації — завантажується без 404/500 помилок', async ({
    page,
    navigationPage,
  }) => {
    const apiErrors: string[] = [];
    page.on('response', (resp) => {
      if (resp.url().includes('/api/') && (resp.status() === 404 || resp.status() >= 500)) {
        apiErrors.push(`${resp.status()} → ${resp.url()}`);
      }
    });

    await setupApiMocks(page);
    await navigationPage.goto();
    await expect(navigationPage.pageTitle).toBeVisible();

    expect(apiErrors).toHaveLength(0);
  });

  test('сторінка користувачів — завантажується без 404/500 помилок', async ({
    page,
    usersPage,
  }) => {
    const apiErrors: string[] = [];
    page.on('response', (resp) => {
      if (resp.url().includes('/api/') && (resp.status() === 404 || resp.status() >= 500)) {
        apiErrors.push(`${resp.status()} → ${resp.url()}`);
      }
    });

    await setupApiMocks(page);
    await usersPage.goto();
    await expect(usersPage.headerTitle).toBeVisible();

    expect(apiErrors).toHaveLength(0);
  });

  test('дашборд — /users/stats викликається рівно 1 раз', async ({ page, dashboardPage }) => {
    const statsCallCount = { count: 0 };

    await page.route('**/api/users/stats*', async (route) => {
      statsCallCount.count++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalUsers: 1,
          activeLicenses: 1,
          superAdminsCount: 1,
          standardUsersCount: 0,
        }),
      });
    });
    await page.route('**/api/users?*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.route('**/api/users', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );

    await dashboardPage.goto();
    await expect(dashboardPage.welcomeBanner).toBeVisible();

    expect(statsCallCount.count).toBe(1);
  });

  test('сторінка планів — /plans/admin викликається рівно 1 раз', async ({ page, plansPage }) => {
    const plansAdminCallCount = { count: 0 };

    await page.route('**/api/plans/admin*', async (route) => {
      plansAdminCallCount.count++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPlans),
      });
    });
    await page.route('**/api/plans*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPlans),
      });
    });

    await plansPage.goto();
    await expect(plansPage.pageTitle).toBeVisible();

    expect(plansAdminCallCount.count).toBe(1);
  });

  test('сторінка ліцензій — /licenses/admin викликається рівно 1 раз', async ({
    page,
    licensesPage,
  }) => {
    const licensesCallCount = { count: 0 };

    await page.route('**/api/licenses/admin*', async (route) => {
      licensesCallCount.count++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLicenses),
      });
    });

    await licensesPage.goto();
    await expect(licensesPage.pageTitle).toBeVisible();

    expect(licensesCallCount.count).toBe(1);
  });
});
