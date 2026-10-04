import { test, expect } from '@e2e/fixtures/test';
import { mockNavigationItems } from '@e2e/fixtures/test-data';
import { mockPlans, mockLicenses } from '@e2e/fixtures/api-contracts-mock-data';

test.describe('API Contract — Точні URL до бекенду', () => {
  test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('[REGRESSION] /plans/admin — коректний URL без /all суфіксу', async ({
    page,
    plansPage,
  }) => {
    const requestedUrls: string[] = [];

    await page.route('**/api/plans/admin*', async (route) => {
      requestedUrls.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPlans),
      });
    });
    await page.route('**/api/plans*', async (route) => {
      requestedUrls.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPlans),
      });
    });

    await plansPage.goto();
    await expect(plansPage.pageTitle).toBeVisible();

    const badUrl = requestedUrls.find((u) => u.includes('/plans/admin/all'));
    expect(badUrl, `❌ REGRESSION: frontend called deprecated /plans/admin/all`).toBeUndefined();

    const correctUrl = requestedUrls.find((u) => u.includes('/plans/admin') && !u.includes('/all'));
    expect(correctUrl, `❌ Frontend did NOT call /plans/admin`).toBeDefined();
  });

  test('[CONTRACT] /users/stats — коректний URL ендпоінту статистики', async ({
    page,
    dashboardPage,
  }) => {
    const requestedUrls: string[] = [];

    await page.route('**/api/users/stats*', async (route) => {
      requestedUrls.push(route.request().url());
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

    const statsCall = requestedUrls.find((u) => u.includes('/users/stats'));
    expect(statsCall, `❌ /users/stats was never called`).toBeDefined();

    const wrongPaths = requestedUrls.filter(
      (u) => u.includes('/users/all') || u.includes('/stats/all'),
    );
    expect(wrongPaths.length, `❌ Called wrong URL paths: ${wrongPaths}`).toBe(0);
  });

  test('[CONTRACT] /licenses/admin — коректний URL без /all суфіксу', async ({
    page,
    licensesPage,
  }) => {
    const requestedUrls: string[] = [];

    await page.route('**/api/licenses/admin*', async (route) => {
      requestedUrls.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLicenses),
      });
    });

    await licensesPage.goto();
    await expect(licensesPage.pageTitle).toBeVisible();

    const wrongUrl = requestedUrls.find(
      (u) => u.includes('/licenses/admin/all') || u.includes('/licenses/all'),
    );
    expect(wrongUrl, `❌ REGRESSION: called deprecated URL: ${wrongUrl}`).toBeUndefined();

    const correctUrl = requestedUrls.find((u) => u.includes('/licenses/admin'));
    expect(correctUrl, `❌ Frontend did NOT call /licenses/admin`).toBeDefined();
  });

  test('[CONTRACT] /navigation/admin — коректний URL без /all суфіксу', async ({
    page,
    navigationPage,
  }) => {
    const requestedUrls: string[] = [];

    await page.route('**/api/navigation/admin*', async (route) => {
      requestedUrls.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockNavigationItems),
      });
    });

    await navigationPage.goto();
    await navigationPage.expectPageTitle('Навігація');
    await navigationPage.expectItemInList('Дашборд');

    const wrongUrl = requestedUrls.find(
      (u) => u.includes('/navigation/all') && !u.includes('/navigation/admin'),
    );
    expect(wrongUrl, `❌ REGRESSION: called /navigation/all which returns 404`).toBeUndefined();

    const correctUrl = requestedUrls.find((u) => u.includes('/navigation/admin'));
    expect(correctUrl, `❌ Frontend did NOT call /navigation/admin`).toBeDefined();
  });
});
