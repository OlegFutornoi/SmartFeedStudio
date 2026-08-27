import { test, expect } from './fixtures/test';
import { TariffPlanDto, AdminLicenseItemDto, Role, PlanType } from '@smartfeed/shared';
import { mockNavigationItems } from './fixtures/test-data';

// ─────────────────────────────────────────────────────────────────────────────
// API CONTRACT, STABILITY & PERFORMANCE SUITE (POM E2E)
//
// Purpose:
// 1. Catch broken API endpoint URLs (e.g. /plans/admin/all vs /plans/admin)
// 2. Ensure zero 404/500 errors across all admin portal views
// 3. Ensure no duplicate API requests (verifying React StrictMode is disabled)
// ─────────────────────────────────────────────────────────────────────────────

const mockPlans: TariffPlanDto[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    code: 'STARTER',
    nameUk: 'Стартовий',
    nameEn: 'Starter',
    descriptionUk: 'Базовий тариф',
    descriptionEn: 'Basic plan',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'USD',
    maxXmlLimit: 1000,
    aiCredits: 50,
    canCloudBackup: false,
    isPopular: false,
    isActive: true,
    order: 1,
    durationDays: 7,
    maxFeedsLimit: 1,
    maxChannelsLimit: 1,
    syncFrequencyHours: 0,
    maxStorageGb: 0,
    maxTeamSeats: 1,
    maxSuppliersLimit: 1,
    hasApiAccess: false,
    hasWebhooks: false,
    hasFeedDiff: false,
    hasWhiteLabel: false,
    hasSso: false,
    hasAuditLog: false,
    hasCustomS3: false,
    hasPriorityAi: false,
    featuresUk: ['1,000 XML позицій'],
    featuresEn: ['1,000 XML items'],
  },
];

const mockLicenses: AdminLicenseItemDto[] = [
  {
    id: 'lic-001',
    userId: 'usr-001',
    licenseKey: 'SF-FREE-TEST-0001',
    planType: PlanType.STARTER,
    tariffPlanId: null,
    tariffPlanNameUk: 'Стартовий',
    tariffPlanNameEn: 'Starter',
    isActive: true,
    expiresAt: null,
    maxXmlLimit: 1000,
    aiCredits: 50,
    maxFeedsLimit: 1,
    maxChannelsLimit: 1,
    maxTeamSeats: 1,
    maxSuppliersLimit: 1,
    canCloudBackup: false,
    hasApiAccess: false,
    hasFeedDiff: false,
    hasWhiteLabel: false,
    hasSso: false,
    hasAuditLog: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    user: {
      id: 'usr-001',
      email: 'user@example.com',
      fullName: 'Тестовий Користувач',
      role: Role.USER,
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: API URL CONTRACT TESTS
// ─────────────────────────────────────────────────────────────────────────────

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

    // ASSERT: bad URL was NEVER called
    const badUrl = requestedUrls.find((u) => u.includes('/plans/admin/all'));
    expect(badUrl, `❌ REGRESSION: frontend called deprecated /plans/admin/all`).toBeUndefined();

    // ASSERT: the correct URL WAS called
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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: ZERO 404 / STABILITY TESTS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Stability — Критичні сторінки без 404 помилок', () => {
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

    expect(apiErrors, `❌ Dashboard page caused API errors:\n${apiErrors.join('\n')}`).toHaveLength(
      0,
    );
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

    expect(apiErrors, `❌ Plans page caused API errors:\n${apiErrors.join('\n')}`).toHaveLength(0);
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

    expect(apiErrors, `❌ Licenses page caused API errors:\n${apiErrors.join('\n')}`).toHaveLength(
      0,
    );
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

    expect(
      apiErrors,
      `❌ Navigation page caused API errors:\n${apiErrors.join('\n')}`,
    ).toHaveLength(0);
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

    expect(apiErrors, `❌ Users page caused API errors:\n${apiErrors.join('\n')}`).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: PERFORMANCE — No Duplicate Requests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Performance — Відсутність задвоєних API запитів', () => {
  test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('дашборд — /users/stats викликається рівно 1 раз (не задвоюється)', async ({
    page,
    dashboardPage,
  }) => {
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

    expect(
      statsCallCount.count,
      `❌ /users/stats called ${statsCallCount.count}x — expected exactly 1`,
    ).toBe(1);
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

    expect(
      plansAdminCallCount.count,
      `❌ /plans/admin called ${plansAdminCallCount.count}x — expected exactly 1`,
    ).toBe(1);
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

    expect(
      licensesCallCount.count,
      `❌ /licenses/admin called ${licensesCallCount.count}x — expected exactly 1`,
    ).toBe(1);
  });
});
