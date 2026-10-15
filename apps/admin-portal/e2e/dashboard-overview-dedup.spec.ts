import { test, expect } from '@e2e/fixtures/test';
import type { AdminDashboardOverviewDto } from '@smartfeed/shared';

test.describe('Admin Portal — Dashboard Overview Aggregated Endpoint (FE-11)', () => {
  const mockOverview: AdminDashboardOverviewDto = {
    stats: {
      totalUsers: 99,
      activeLicenses: 85,
      superAdminsCount: 3,
      standardUsersCount: 96,
    },
    recentUsers: [],
    paymentStats: {
      totalRevenueUah: 150000,
      successfulCount: 45,
      pendingCount: 2,
      declinedCount: 1,
      averageCheckUah: 3333,
      successRatePercent: 95,
    },
    recentTransactions: [],
    recentLicenses: [],
  };

  test('Dashboard loads via single aggregated overview endpoint without individual roundtrips', async ({
    page,
    dashboardPage,
  }) => {
    let overviewCount = 0;
    let individualStatsCount = 0;
    let paymentsStatsCount = 0;

    await page.route('**/api/users/dashboard-overview*', async (route) => {
      overviewCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockOverview),
      });
    });

    await page.route('**/api/users/stats*', async (route) => {
      individualStatsCount++;
      await route.fulfill({ status: 200, body: '{}' });
    });

    await page.route('**/api/payments/stats*', async (route) => {
      paymentsStatsCount++;
      await route.fulfill({ status: 200, body: '{}' });
    });

    await dashboardPage.goto();
    await expect(dashboardPage.overviewPage).toBeVisible();

    // Verify stats from aggregated endpoint are rendered
    await expect(dashboardPage.statValueTotalUsers).toContainText('99');

    // Verify aggregated call happened exactly once and individual endpoints were skipped
    expect(overviewCount).toBe(1);
    expect(individualStatsCount).toBe(0);
    expect(paymentsStatsCount).toBe(0);
  });
});
