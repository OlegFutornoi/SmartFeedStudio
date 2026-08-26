import { test, expect } from '@playwright/test';

test.describe('Desktop App — Відновлення та Скидання Паролю (Password Recovery E2E)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to guarantee complete test isolation
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test('перехід зі сторінки логіну на сторінку відновлення паролю за посиланням "Забули пароль?"', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await expect(page.getByTestId('login-page')).toBeVisible();

    // Verify forgot password link exists and click it
    const forgotLink = page.getByTestId('forgot-password-link');
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();

    // Verify navigation to forgot-password page
    await expect(page.getByTestId('forgot-password-page')).toBeVisible();
    await expect(page.getByTestId('forgot-password-card')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('send-reset-button')).toBeVisible();
    await expect(page.getByTestId('back-to-login-link')).toBeVisible();
  });

  test('повернення зі сторінки відновлення паролю на форму логіну', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await expect(page.getByTestId('forgot-password-page')).toBeVisible();

    await page.getByTestId('back-to-login-link').click();
    await expect(page.getByTestId('login-page')).toBeVisible();
  });

  test('неуспішний запит відновлення паролю (неіснуючий email): перевірка локалізованого виводу помилки (UA & EN)', async ({
    page,
  }) => {
    // Mock 200 response without resetToken (simulating unregistered user lookup)
    await page.route('**/api/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'If this email is registered, password reset instructions have been sent.',
        }),
      });
    });

    await page.goto('/auth/forgot-password');
    await page.getByTestId('email-input').fill('test@ii.com');
    await page.getByTestId('send-reset-button').click();

    // Verify error alert appears in Ukrainian
    await expect(page.getByTestId('error-alert')).toBeVisible();
    await expect(page.getByTestId('error-message')).toHaveText(
      'Користувача з такою електронною адресою не знайдено',
    );

    // Switch language to English and verify error is dynamically translated to English
    await page.getByTestId('language-toggle').click();
    await expect(page.getByTestId('error-message')).toHaveText(
      'User with this email address was not found',
    );
  });

  test('успішний запит відновлення паролю: плавний автоматичний перехід до форми встановлення нового паролю', async ({
    page,
  }) => {
    const mockResetToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-reset-token-xyz-123';

    // Mock successful forgot-password response
    await page.route('**/api/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Success',
          resetToken: mockResetToken,
        }),
      });
    });

    await page.goto('/auth/forgot-password');
    await page.getByTestId('email-input').fill('user@smartfeed.studio');
    await page.getByTestId('send-reset-button').click();

    // Verify automatically navigated to reset-password page with token handled internally
    await expect(page.getByTestId('reset-password-page')).toBeVisible();
    await expect(page.getByTestId('reset-password-card')).toBeVisible();
    await expect(page.getByTestId('new-password-input')).toBeVisible();
    await expect(page.getByTestId('confirm-password-input')).toBeVisible();
    await expect(page.getByTestId('reset-password-button')).toBeVisible();
  });

  test('валідація форми встановлення нового паролю: короткий пароль та неспівпадіння паролів', async ({
    page,
  }) => {
    await page.goto('/auth/reset-password?token=mock-sample-token');
    await expect(page.getByTestId('reset-password-page')).toBeVisible();

    // 1. Test short password (< 8 chars)
    await page.getByTestId('new-password-input').fill('short');
    await page.getByTestId('confirm-password-input').fill('short');
    await page.getByTestId('reset-password-button').click();

    await expect(page.getByTestId('error-alert')).toBeVisible();
    await expect(page.getByTestId('error-message')).toHaveText(
      'Пароль повинен містити щонайменше 8 символів',
    );

    // 2. Test passwords mismatch
    await page.getByTestId('new-password-input').fill('SecurePassword123!');
    await page.getByTestId('confirm-password-input').fill('MismatchPassword999!');
    await page.getByTestId('reset-password-button').click();

    await expect(page.getByTestId('error-alert')).toBeVisible();
    await expect(page.getByTestId('error-message')).toHaveText('Паролі не співпадають');
  });

  test('успішне встановлення нового паролю: збереження, повернення на вхід та вхід з новим паролем', async ({
    page,
  }) => {
    const mockUser = {
      id: 'usr-reset-101',
      email: 'user.reset@smartfeed.studio',
      fullName: 'Updated User',
      role: 'USER',
    };

    // Mock reset-password endpoint
    await page.route('**/api/auth/reset-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Password has been reset successfully',
        }),
      });
    });

    // Mock login endpoint
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: mockUser,
          tokens: {
            accessToken: 'mock-new-access-token-777',
            refreshToken: 'mock-new-refresh-token-888',
            tokenType: 'Bearer',
            expiresIn: 900,
          },
        }),
      });
    });

    // Mock me endpoint
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    });

    await page.goto('/auth/reset-password?token=valid-reset-jwt-token');
    await page.getByTestId('new-password-input').fill('BrandNewPassword123!');
    await page.getByTestId('confirm-password-input').fill('BrandNewPassword123!');
    await page.getByTestId('reset-password-button').click();

    // Verify success banner appears
    await expect(page.getByTestId('success-alert')).toBeVisible();
    await expect(page.getByTestId('success-message')).toContainText('Ваш пароль успішно змінено');

    // Wait for redirect to login page
    await expect(page.getByTestId('login-page')).toBeVisible({ timeout: 5000 });

    // Perform login with new password
    await page.getByTestId('email-input').fill('user.reset@smartfeed.studio');
    await page.getByTestId('password-input').fill('BrandNewPassword123!');
    await page.getByTestId('login-button').click();

    // Verify successful login
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByTestId('user-email')).toContainText('user.reset@smartfeed.studio');
  });

  test('мультимовність та перемикання теми на всіх сторінках відновлення паролю (Повна локалізація UA ⇄ EN)', async ({
    page,
  }) => {
    // 1. Forgot password page full i18n
    await page.goto('/auth/forgot-password');
    await expect(page.getByTestId('send-reset-button')).toHaveText('Продовжити');
    await expect(page.getByTestId('email-input')).toHaveAttribute('placeholder', 'm@example.com');

    // Switch to English
    await page.getByTestId('language-toggle').click();
    await expect(page.getByTestId('send-reset-button')).toHaveText('Continue');
    await expect(page.getByTestId('back-to-login-link')).toHaveText('Back to login');

    // Toggle theme
    await page.getByTestId('theme-toggle').click();
    await expect(page.getByTestId('forgot-password-card')).toBeVisible();

    // 2. Reset password page full i18n
    await page.goto('/auth/reset-password?token=mock-token');
    // Initial page load is Ukrainian
    await expect(page.getByTestId('reset-password-button')).toHaveText('Змінити пароль');
    await expect(page.getByTestId('new-password-input')).toHaveAttribute(
      'placeholder',
      '••••••••••••',
    );
    await expect(page.getByTestId('confirm-password-input')).toHaveAttribute(
      'placeholder',
      '••••••••••••',
    );

    // Switch to English
    await page.getByTestId('language-toggle').click();
    await expect(page.getByTestId('reset-password-button')).toHaveText('Change Password');
    await expect(page.getByTestId('back-to-login-link')).toHaveText('Back to login');

    // Switch back to Ukrainian
    await page.getByTestId('language-toggle').click();
    await expect(page.getByTestId('reset-password-button')).toHaveText('Змінити пароль');
  });
});
