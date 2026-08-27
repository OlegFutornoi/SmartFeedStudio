import { test, expect } from './fixtures/test';

test.describe('Admin Portal — Authentication & Localization (POM)', () => {
  // Clear token for unauthenticated login tests
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('smartfeed_admin_token');
    });
  });

  test('should render login page with localized elements and language switcher', async ({
    loginPage,
  }) => {
    await loginPage.goto();

    // Verify brand heading and Ukrainian initial state
    await loginPage.expectTitle('SmartFeed Studio');
    await expect(loginPage.cardTitle).toContainText('Вхід для адміністратора');

    // Switch language to English
    await loginPage.header.switchLanguage();
    await expect(loginPage.cardTitle).toContainText('Administrator Sign In');

    // Switch back to Ukrainian
    await loginPage.header.switchLanguage();
    await expect(loginPage.cardTitle).toContainText('Вхід для адміністратора');
  });

  test('should display translated error message on invalid credentials', async ({
    loginPage,
    page,
  }) => {
    await page.route('**/api/auth/login*', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 401,
          message: 'Invalid credentials',
        }),
      });
    });

    await loginPage.goto();
    await loginPage.login('wrong@admin.com', 'WrongPassword123!');
    await loginPage.expectLoginError('Невірний email або пароль');
  });

  test('should reject login for regular USER role with access denied alert', async ({
    loginPage,
    page,
  }) => {
    await page.route('**/api/auth/login*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tokens: {
            accessToken: 'mock-user-token',
            refreshToken: 'mock-user-refresh',
          },
          user: {
            id: 'user-123',
            email: 'client@company.com',
            fullName: 'Regular Client',
            role: 'USER',
          },
        }),
      });
    });

    await loginPage.goto();
    await loginPage.login('client@company.com', 'ClientPassword123!');
    await loginPage.expectLoginError(
      'Доступ заборонено. Вхід дозволено лише адміністраторам системи.',
    );
    expect(page.url()).toContain('/login');
  });
});
