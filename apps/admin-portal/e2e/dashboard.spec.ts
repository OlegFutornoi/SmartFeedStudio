import { test, expect } from './fixtures/test';
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

    await page.route('**/api/users?limit=5*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRecentUsers),
      });
    });

    await page.route('**/api/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRecentUsers),
      });
    });
  });

  test('відображення віджетів дашборду, метрик та списку останніх користувачів', async ({
    dashboardPage,
  }) => {
    await dashboardPage.goto();

    // 1. Привітальний банер
    await expect(dashboardPage.welcomeBanner).toBeVisible();
    await expect(dashboardPage.welcomeTitle).toContainText('Вітаємо');

    // 2. Картки метрик
    await expect(dashboardPage.statValueTotalUsers).toContainText('42');
    await expect(dashboardPage.statValueActiveLicenses).toContainText('38');
    await expect(dashboardPage.statCardStorage).toBeVisible();
    await expect(dashboardPage.statCardDatabase).toBeVisible();

    // 3. Таблиця останніх користувачів
    await expect(dashboardPage.recentUsersCard).toBeVisible();
    await expect(dashboardPage.recentUsersTitle).toHaveText('Останні зареєстровані користувачі');
    await expect(dashboardPage.page.getByTestId('recent-user-row-usr-01')).toContainText(
      'Олександр Коваленко',
    );
    await expect(dashboardPage.page.getByTestId('recent-user-row-usr-02')).toContainText(
      'Марина Шевченко',
    );

    // 4. Швидкі дії
    await expect(dashboardPage.quickActionsPanel).toBeVisible();
    await expect(dashboardPage.securityNotice).toBeVisible();
  });

  test('динамічне перемикання мови дашборду UA ⇄ EN та перевірка перекладу всіх елементів', async ({
    dashboardPage,
  }) => {
    await dashboardPage.goto();

    // 1. Початковий стан: Українська
    await expect(dashboardPage.welcomeSubtitle).toHaveText(
      'Огляд активності користувачів, ліцензій та хмарного сховища SmartFeed Studio',
    );
    await expect(dashboardPage.statCardTotalUsers).toContainText('Всього користувачів');
    await expect(dashboardPage.statCardActiveLicenses).toContainText('Активні ліцензії');
    await expect(dashboardPage.actionBtnLicenses).toContainText('Керування ліцензіями');
    await expect(dashboardPage.actionBtnChangePwd).toContainText('Змінити мій пароль');

    // 2. Перемикаємо на Англійську
    await dashboardPage.toggleLanguage();

    // 3. Перевірка оновлення всіх елементів англійською
    await expect(dashboardPage.welcomeTitle).toContainText('Welcome');
    await expect(dashboardPage.welcomeSubtitle).toHaveText(
      'Overview of users activity, customer licenses, and SmartFeed Studio cloud storage',
    );
    await expect(dashboardPage.statCardTotalUsers).toContainText('Total Users');
    await expect(dashboardPage.statCardActiveLicenses).toContainText('Active Licenses');
    await expect(dashboardPage.recentUsersTitle).toHaveText('Recently Registered Users');
    await expect(dashboardPage.actionBtnLicenses).toContainText('Manage licenses');
    await expect(dashboardPage.actionBtnChangePwd).toContainText('Change my password');
    await expect(dashboardPage.securityNoticeTitle).toHaveText('Admin Security');

    // 4. Повернення на Українську
    await dashboardPage.toggleLanguage();
    await expect(dashboardPage.welcomeTitle).toContainText('Вітаємо');
    await expect(dashboardPage.recentUsersTitle).toHaveText('Останні зареєстровані користувачі');
  });

  test('відкриття діалогу зміни пароля з блоку швидких дій', async ({ dashboardPage }) => {
    await dashboardPage.goto();

    // Клік по кнопці "Змінити мій пароль"
    await dashboardPage.actionBtnChangePwd.click();
    await expect(dashboardPage.changePasswordModal).toBeVisible();

    // Закриття діалогу
    await dashboardPage.page.getByRole('button', { name: 'Скасувати' }).click();
    await expect(dashboardPage.changePasswordModal).not.toBeVisible();
  });
});
