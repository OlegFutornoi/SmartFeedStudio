import { test, expect } from '@playwright/test';

test.describe('Desktop App — Авторизація, Реєстрація, Мультимовність та Захищені Маршрути', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to start from clean state
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test('перевірка захисту роутів: неавторизованого користувача при переході на / редиректить на /auth/login', async ({
    page,
  }) => {
    await page.goto('/');

    // Should be automatically redirected to login page
    await expect(page.getByTestId('login-page')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('login-button')).toBeVisible();
    await expect(page.getByTestId('register-link')).toBeVisible();
  });

  test('неуспішна авторизація: введення невірних даних та локалізований вивід помилки (UA & EN)', async ({
    page,
  }) => {
    // Mock backend API 401 response for invalid credentials
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 401,
          message: 'Invalid email or password',
          error: 'Unauthorized',
        }),
      });
    });

    await page.goto('/auth/login');
    await expect(page.getByTestId('login-page')).toBeVisible();

    // Fill incorrect login details in Ukrainian
    await page.getByTestId('email-input').fill('wrong@user.com');
    await page.getByTestId('password-input').fill('WrongPass123!');
    await page.getByTestId('login-button').click();

    // Verify error alert appears with localized Ukrainian message
    await expect(page.getByTestId('error-alert')).toBeVisible();
    await expect(page.getByTestId('error-message')).toHaveText('Невірний email або пароль');

    // Switch to English and verify error is translated to English
    await page.getByTestId('language-toggle').click();
    await expect(page.getByTestId('error-message')).toHaveText('Invalid email or password');

    // Verify user stays on login page
    await expect(page.getByTestId('login-page')).toBeVisible();
  });

  test('успішна авторизація: заповнення форми, клік "Login", редирект на /, перевірка даних та logout', async ({
    page,
  }) => {
    const mockUser = {
      id: 'usr-e2e-100',
      email: 'admin@smartfeed.studio',
      fullName: 'Super Administrator',
      role: 'SUPER_ADMIN',
    };

    // Mock successful login API endpoint
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: mockUser,
          tokens: {
            accessToken: 'mock-valid-access-token-12345',
            refreshToken: 'mock-valid-refresh-token-67890',
            tokenType: 'Bearer',
            expiresIn: 900,
          },
        }),
      });
    });

    // Mock get profile endpoint
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    });

    await page.goto('/auth/login');

    // Fill form using strictly data-testid locators
    await page.getByTestId('email-input').fill('admin@smartfeed.studio');
    await page.getByTestId('password-input').fill('AdminPassword123!');
    await page.getByTestId('login-button').click();

    // Verify successful redirect to home page
    await expect(page.getByTestId('home-page')).toBeVisible();

    // Verify latest suppliers section is rendered
    await expect(page.getByTestId('latest-suppliers-section')).toBeVisible();

    // Verify logout functionality via user dropdown
    await page.getByTestId('sidebar-user-trigger').click();
    await page.getByTestId('logout-button').click();
    await expect(page.getByTestId('login-page')).toBeVisible();
  });

  test('перехід на сторінку реєстрації та успішна реєстрація нового акаунту з назвою компанії', async ({
    page,
  }) => {
    const newUser = {
      id: 'usr-new-200',
      email: 'newuser@smartfeed.studio',
      fullName: 'Новий Користувач',
      role: 'USER',
      organization: {
        id: 'org-new-200',
        name: 'Rozetka Sellers Pro',
        role: 'OWNER',
      },
    };

    // Mock register API endpoint
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          user: newUser,
          tokens: {
            accessToken: 'mock-new-user-access-token',
            refreshToken: 'mock-new-user-refresh-token',
            tokenType: 'Bearer',
            expiresIn: 900,
          },
        }),
      });
    });

    // Mock get profile endpoint
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(newUser),
      });
    });

    // Start at login page and navigate to register via link
    await page.goto('/auth/login');
    await page.getByTestId('register-link').click();

    // Verify registration page is displayed
    await expect(page.getByTestId('register-page')).toBeVisible();
    await expect(page.getByTestId('signup-card')).toBeVisible();
    await expect(page.getByTestId('company-name-input')).toBeVisible();

    // Fill registration form using data-testid locators including companyName
    await page.getByTestId('name-input').fill('Новий Користувач');
    await page.getByTestId('company-name-input').fill('Rozetka Sellers Pro');
    await page.getByTestId('email-input').fill('newuser@smartfeed.studio');
    await page.getByTestId('password-input').fill('SecurePassword123!');
    await page.getByTestId('confirm-password-input').fill('SecurePassword123!');
    await page.getByTestId('signup-button').click();

    // Verify successful registration redirects to home page
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByTestId('sidebar-user-organization')).toContainText(
      'Rozetka Sellers Pro',
    );
  });

  test('мультимовність: динамічне перемикання між українською (UA) та англійською (EN) мовами', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await expect(page.getByTestId('language-toggle')).toBeVisible();

    // Initial default language is Ukrainian
    await expect(page.getByTestId('login-button')).toHaveText('Увійти');

    // Click language toggle to switch to English
    await page.getByTestId('language-toggle').click();
    await expect(page.getByTestId('login-button')).toHaveText('Login');
    await expect(page.getByTestId('register-link')).toHaveText('Sign up');

    // Click language toggle again to switch back to Ukrainian
    await page.getByTestId('language-toggle').click();
    await expect(page.getByTestId('login-button')).toHaveText('Увійти');
    await expect(page.getByTestId('register-link')).toHaveText('Зареєструватися');
  });

  test('перевірка роботи перемикача тем (Dark / Light Theme Toggle)', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByTestId('theme-toggle')).toBeVisible();

    // Click theme toggle
    await page.getByTestId('theme-toggle').click();

    // Verify page remains intact
    await expect(page.getByTestId('login-page')).toBeVisible();
  });
});
