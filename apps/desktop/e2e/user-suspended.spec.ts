import { test, expect } from '@playwright/test';

test.describe('Desktop App — Блокування призупиненого користувача (User Suspended Blocker)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test('призупинений користувач (isActive: false) бачить UserSuspendedBlocker, а НЕ налаштування бази чи закінчення ліцензії', async ({
    page,
  }) => {
    // Seed authenticated session for a suspended user
    await page.addInitScript(() => {
      const mockUser = {
        id: 'user-suspended-1',
        email: 'suspended@store.com',
        fullName: 'Suspended Merchant',
        role: 'USER',
        isActive: false,
      };
      window.localStorage.setItem('smartfeed_access_token', 'mock-token-suspended');
      window.localStorage.setItem('smartfeed_user_profile', JSON.stringify(mockUser));
      window.localStorage.setItem('smartfeed_workspace_initialized', 'true');
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 403,
          code: 'USER_SUSPENDED',
          message: 'User account has been suspended by administration. Please contact support.',
        }),
      });
    });

    await page.goto('/');

    // 1. Verify UserSuspendedBlocker is visible
    const blocker = page.getByTestId('user-suspended-blocker');
    await expect(blocker).toBeVisible();

    // 2. Verify FirstRunWorkspaceSetupDialog is NOT shown
    await expect(page.getByTestId('workspace-setup-dialog')).not.toBeVisible();
    await expect(page.getByText('Налаштування локальної бази даних')).not.toBeVisible();

    // 3. Verify ExpiredPlanBlocker is NOT shown
    await expect(page.getByTestId('expired-plan-blocker')).not.toBeVisible();
    await expect(page.getByText('Немає активної ліцензії')).not.toBeVisible();

    // 4. Verify title & email
    await expect(page.getByTestId('suspended-title')).toHaveText('Обліковий запис призупинено');
    await expect(blocker).toContainText('suspended@store.com');
    await expect(page.getByTestId('contact-support-button')).toBeVisible();

    // 5. Test logout button
    await page.getByTestId('suspended-logout-button').click();
    await expect(page.getByTestId('login-page')).toBeVisible();
  });

  test('перевірка динамічного 403 USER_SUSPENDED від бекенду та двомовності (UA ⇄ EN)', async ({
    page,
  }) => {
    // Start with active user session
    await page.addInitScript(() => {
      const mockUser = {
        id: 'user-active-becoming-suspended',
        email: 'merchant@store.com',
        fullName: 'Active Merchant',
        role: 'USER',
        isActive: true,
      };
      window.localStorage.setItem('smartfeed_access_token', 'token-active-123');
      window.localStorage.setItem('smartfeed_user_profile', JSON.stringify(mockUser));
      window.localStorage.setItem('smartfeed_workspace_initialized', 'true');
    });

    // Mock backend returning 403 USER_SUSPENDED on /auth/me
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 403,
          code: 'USER_SUSPENDED',
          message: 'User account has been suspended by administration. Please contact support.',
        }),
      });
    });

    await page.goto('/');

    // Blocker should activate
    const blocker = page.getByTestId('user-suspended-blocker');
    await expect(blocker).toBeVisible();
    // Switch to English language and verify localization
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('smartfeed-set-language', { detail: 'en' }));
    });
    await expect(page.getByTestId('suspended-title')).toHaveText('Account Suspended');
    await expect(page.getByTestId('user-suspended-blocker')).toBeVisible();
  });

  test('інтерактивний спотлайт-блюр бекдроп (SpotlightBlurBackdrop) рендерить розмитий фон та активує спотлайт при русі миші', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const mockUser = {
        id: 'user-spotlight-test',
        email: 'spotlight@store.com',
        fullName: 'Spotlight Merchant',
        role: 'USER',
        isActive: false,
      };
      window.localStorage.setItem('smartfeed_access_token', 'mock-token-spotlight');
      window.localStorage.setItem('smartfeed_user_profile', JSON.stringify(mockUser));
      window.localStorage.setItem('smartfeed_workspace_initialized', 'true');
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 403,
          code: 'USER_SUSPENDED',
          message: 'User account has been suspended by administration.',
        }),
      });
    });

    await page.goto('/');

    // 1. Verify SpotlightBlurBackdrop container and frosted blur mask
    const backdrop = page.getByTestId('spotlight-blur-backdrop');
    await expect(backdrop).toBeVisible();

    const underlay = page.getByTestId('spotlight-underlay-content');
    await expect(underlay).toBeVisible();
    await expect(underlay).toHaveClass(/pointer-events-none/);

    const blurMask = page.getByTestId('spotlight-blur-mask');
    await expect(blurMask).toBeVisible();

    // 2. Move mouse across backdrop to trigger dynamic spotlight ring
    await backdrop.hover({ position: { x: 100, y: 100 } });
    await page.mouse.move(250, 250);

    const ring = page.getByTestId('spotlight-ring');
    await expect(ring).toBeVisible();
  });
});
