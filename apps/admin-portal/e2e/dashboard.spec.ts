import { test, expect } from '@e2e/fixtures/test';
import { UserListItemDto, UsersStatsDto, Role, PlanType } from '@smartfeed/shared';

test.describe('Admin Portal — Головний Дашборд та Інтернаціоналізація (POM E2E)', () => {
  const mockStats: UsersStatsDto = {
    totalUsers: 42,
    activeLicenses: 38,
    superAdminsCount: 2,
    standardUsersCount: 40,
  };

  const mockRecentUsers: UserListItemDto[] = [
    {
      id: 'usr-01',
      email: 'alex@example.com',
      fullName: 'Олександр Коваленко',
      role: Role.USER,
      createdAt: '2026-08-01T10:00:00.000Z',
      license: {
        licenseKey: 'SF-PRO-1234',
        planType: PlanType.PRO,
        maxXmlLimit: 50000,
        aiCredits: 500,
        isActive: true,
      },
    },
    {
      id: 'usr-02',
      email: 'marina@example.com',
      fullName: 'Марина Шевченко',
      role: Role.ADMIN,
      createdAt: '2026-08-05T12:30:00.000Z',
      license: null,
    },
  ];

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/users/stats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStats),
      });
    });

    await page.route('**/api/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRecentUsers),
      });
    });

    await page.route('**/api/payments/stats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalRevenueUah: 18450,
          successfulCount: 12,
          pendingCount: 1,
          declinedCount: 0,
          averageCheckUah: 1537.5,
          successRatePercent: 100,
        }),
      });
    });

    await page.route('**/api/payments/transactions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          transactions: [
            {
              id: 'tx-01',
              orderReference: 'ORD-9901',
              amount: 1500,
              status: 'APPROVED',
              planCode: 'PRO',
              billingInterval: 'MONTHLY',
              provider: 'WayForPay',
              userFullName: 'Олександр Коваленко',
              userEmail: 'alex@example.com',
              createdAt: '2026-08-01T10:00:00.000Z',
            },
          ],
          total: 1,
        }),
      });
    });

    await page.route('**/api/licenses/admin*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'lic-01',
            licenseKey: 'SF-PRO-1234',
            planType: 'PRO',
            maxXmlLimit: 50000,
            aiCredits: 500,
            isActive: true,
            createdAt: '2026-08-01T10:00:00.000Z',
            user: {
              id: 'usr-01',
              email: 'alex@example.com',
              fullName: 'Олександр Коваленко',
            },
          },
        ]),
      });
    });
  });

  test('відображення віджетів дашборду, метрик та списку останніх користувачів', async ({
    dashboardPage,
  }) => {
    await dashboardPage.goto();

    // 1. Картки метрик (shadcn dashboard-01)
    await expect(dashboardPage.statValueTotalUsers).toContainText('42');
    await expect(dashboardPage.statValueActiveLicenses).toContainText('38');
    await expect(dashboardPage.statCardStorage).toBeVisible();
    await expect(dashboardPage.statCardDatabase).toBeVisible();

    // 2. Графік активності
    await expect(dashboardPage.page.getByTestId('admin-activity-chart-card')).toBeVisible();

    // 3. Таблиця останніх користувачів (повна ширина)
    await expect(dashboardPage.recentUsersCard).toBeVisible();
    await expect(dashboardPage.recentUsersTitle).toHaveText('Останні зареєстровані користувачі');
    await expect(dashboardPage.page.getByTestId('recent-user-row-usr-01')).toContainText(
      'Олександр Коваленко',
    );
    await expect(dashboardPage.page.getByTestId('recent-user-row-usr-02')).toContainText(
      'Марина Шевченко',
    );
  });

  test('динамічне перемикання мови дашборду UA ⇄ EN та перевірка перекладу всіх елементів', async ({
    dashboardPage,
  }) => {
    await dashboardPage.goto();

    // 1. Початковий стан: Українська
    await expect(dashboardPage.statCardTotalUsers).toContainText('Всього користувачів');
    await expect(dashboardPage.statCardActiveLicenses).toContainText('Активні ліцензії');
    await expect(dashboardPage.recentUsersTitle).toHaveText('Останні зареєстровані користувачі');
    await expect(dashboardPage.page.getByRole('button', { name: /Користувачі/ })).toBeVisible();
    await expect(
      dashboardPage.page.getByRole('button', { name: /Останні транзакції/ }),
    ).toBeVisible();
    await expect(dashboardPage.page.getByRole('button', { name: /Ліцензії/ })).toBeVisible();

    // 2. Перемикаємо на Англійську
    await dashboardPage.toggleLanguage();

    // 3. Перевірка оновлення всіх елементів англійською
    await expect(dashboardPage.statCardTotalUsers).toContainText('Total Users');
    await expect(dashboardPage.statCardActiveLicenses).toContainText('Active Licenses');
    await expect(dashboardPage.recentUsersTitle).toHaveText('Recently Registered Users');
    await expect(dashboardPage.page.getByRole('button', { name: /Users/ })).toBeVisible();
    await expect(
      dashboardPage.page.getByRole('button', { name: /Recent Transactions/ }),
    ).toBeVisible();
    await expect(dashboardPage.page.getByRole('button', { name: /Licenses/ })).toBeVisible();

    // 4. Повернення на Українську
    await dashboardPage.toggleLanguage();
    await expect(dashboardPage.statCardTotalUsers).toContainText('Всього користувачів');
    await expect(dashboardPage.recentUsersTitle).toHaveText('Останні зареєстровані користувачі');
  });

  test('динамічне перемикання вкладок дашборду (Користувачі ⇄ Транзакції ⇄ Ліцензії)', async ({
    dashboardPage,
  }) => {
    await dashboardPage.goto();

    // 1. Початковий стан — Користувачі
    await expect(dashboardPage.page.getByTestId('recent-user-row-usr-01')).toBeVisible();

    // 2. Перемикання на Транзакції
    await dashboardPage.page.getByRole('button', { name: /Останні транзакції/ }).click();
    await expect(dashboardPage.page.getByTestId('recent-users-title')).toHaveText(
      'Останні транзакції',
    );

    // 3. Перемикання на Ліцензії
    await dashboardPage.page.getByRole('button', { name: /Ліцензії/ }).click();
    await expect(dashboardPage.page.getByTestId('recent-users-title')).toHaveText(
      'Активні ліцензії',
    );

    // 4. Повернення на Користувачів
    await dashboardPage.page.getByRole('button', { name: /Користувачі/ }).click();
    await expect(dashboardPage.page.getByTestId('recent-user-row-usr-01')).toBeVisible();
  });

  test('паритет дизайн-системи: аватари клієнтів, відсутність сирих англійських статусів та смарагдовий колір успіху', async ({
    dashboardPage,
  }) => {
    await dashboardPage.goto();

    // 1. Вкладка "Користувачі"
    const userRow = dashboardPage.page.getByTestId('recent-user-row-usr-01');
    await expect(userRow).toBeVisible();
    await expect(userRow.locator('[data-testid="user-avatar"]').first()).toBeVisible();

    const userStatus = userRow.locator('[data-testid*="status-badge"]');
    await expect(userStatus).toBeVisible();
    await expect(userStatus).not.toContainText('Done');
    await expect(userStatus).not.toContainText('Active');
    await expect(userStatus).toContainText('Активний');
    await expect(userStatus).toHaveClass(/emerald/);

    // 2. Вкладка "Транзакції"
    await dashboardPage.page.getByRole('button', { name: /Останні транзакції/ }).click();
    const txRow = dashboardPage.page.locator('tbody tr').first();
    await expect(txRow).toBeVisible();
    await expect(txRow.locator('[data-testid="user-avatar"]').first()).toBeVisible();

    const txStatus = txRow.locator('[data-testid*="status-badge"]');
    await expect(txStatus).toBeVisible();
    await expect(txStatus).not.toContainText('APPROVED');
    await expect(txStatus).toContainText('Оплачено');
    await expect(txStatus).toHaveClass(/emerald/);

    // 3. Вкладка "Ліцензії"
    await dashboardPage.page.getByRole('button', { name: /Ліцензії/ }).click();
    const licRow = dashboardPage.page.locator('tbody tr').first();
    await expect(licRow).toBeVisible();
    await expect(licRow.locator('[data-testid="user-avatar"]').first()).toBeVisible();

    const licStatus = licRow.locator('[data-testid*="status-badge"]');
    await expect(licStatus).toBeVisible();
    await expect(licStatus).not.toContainText('Active');
    await expect(licStatus).not.toContainText('Suspended');
    await expect(licStatus).toContainText('Активна');
    await expect(licStatus).toHaveClass(/emerald/);
  });
});
