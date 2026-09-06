import { test, expect } from '@playwright/test';
import { DesktopLoginPage } from './pages/login.page';
import { DesktopSettingsPage } from './pages/settings.page';

test.describe('Desktop App — Сучасні теми shadcn/ui та монохромна схема за замовчуванням (POM)', () => {
  const mockUser = {
    id: 'usr-theme-test',
    email: 'themetest@smartfeed.studio',
    fullName: 'Theme Test User',
    role: 'USER',
  };

  const mockNavigationItems = [
    {
      id: 'item-dashboard',
      key: 'dashboard',
      labelUk: 'Дашборд',
      labelEn: 'Dashboard',
      path: '/',
      icon: 'LayoutDashboard',
      order: 1,
      isVisible: true,
      requiredRoles: ['USER', 'ADMIN', 'SUPER_ADMIN'],
      requiredPlan: null,
      targetApp: 'DESKTOP',
    },
    {
      id: 'item-settings',
      key: 'settings',
      labelUk: 'Налаштування',
      labelEn: 'Settings',
      path: '/settings',
      icon: 'Settings',
      order: 2,
      isVisible: true,
      requiredRoles: ['USER', 'ADMIN', 'SUPER_ADMIN'],
      requiredPlan: null,
      targetApp: 'DESKTOP',
    },
  ];

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });

    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: mockUser,
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            tokenType: 'Bearer',
            expiresIn: 900,
          },
        }),
      });
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    });

    await page.route('**/api/navigation?app=DESKTOP', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockNavigationItems),
      });
    });

    await page.route('**/api/licenses/my', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          planType: 'PRO',
          isActive: true,
          aiCredits: 500,
          maxXmlLimit: 50000,
          canCloudBackup: true,
        }),
      });
    });
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('дефолтна тема: ініціалізація автентичної монохромної теми Zinc та dark mode', async ({
    page,
  }) => {
    const loginPage = new DesktopLoginPage(page);
    await loginPage.goto();
    await loginPage.login(mockUser.email, 'ValidPassword123!');

    const settingsPage = new DesktopSettingsPage(page);
    await settingsPage.goto();
    await expect(settingsPage.settingsPage).toBeVisible();

    // Verify root html attributes for defaults (monochrome zinc & dark)
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);
    await expect(htmlElement).toHaveAttribute('data-accent', 'zinc');
    await expect(settingsPage.accentDropdownTrigger).toContainText(/Zinc/);
  });

  test('перемикання тем підсвічування: Dark -> Light -> Dark', async ({ page }) => {
    const loginPage = new DesktopLoginPage(page);
    await loginPage.goto();
    await loginPage.login(mockUser.email, 'ValidPassword123!');

    const settingsPage = new DesktopSettingsPage(page);
    await settingsPage.goto();
    await expect(settingsPage.settingsPage).toBeVisible();

    // Switch to Light
    await settingsPage.setMode('light');
    await expect(page.locator('html')).toHaveClass(/light/);

    // Switch back to Dark
    await settingsPage.setMode('dark');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('випадаючий список тем shadcn: вибір сланцевої, кам’яної, бронзи та повернення до Zinc', async ({
    page,
  }) => {
    const loginPage = new DesktopLoginPage(page);
    await loginPage.goto();
    await loginPage.login(mockUser.email, 'ValidPassword123!');

    const settingsPage = new DesktopSettingsPage(page);
    await settingsPage.goto();
    await expect(settingsPage.settingsPage).toBeVisible();

    // 1. Select Slate
    await settingsPage.selectAccentColor('slate');
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'slate');
    await expect(settingsPage.accentDropdownTrigger).toContainText(/Slate/);

    // 2. Select Stone (Warm Gray / Stone)
    await settingsPage.selectAccentColor('stone');
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'stone');
    await expect(settingsPage.accentDropdownTrigger).toContainText(/Stone/);

    // 3. Select Bronze (Dark Metallic Bronze)
    await settingsPage.selectAccentColor('bronze');
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'bronze');
    await expect(settingsPage.accentDropdownTrigger).toContainText(/Bronze/);

    // 4. Return to Default Zinc
    await settingsPage.selectAccentColor('zinc');
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'zinc');
    await expect(settingsPage.accentDropdownTrigger).toContainText(/Zinc/);

    // Verify localStorage persistence
    const savedAccent = await page.evaluate(() => localStorage.getItem('smartfeed_theme_accent'));
    expect(savedAccent).toBe('zinc');
  });

  test('глобальне масштабування радіусів: дефолтний 8px, перемикання на 0px (Sharp), 4px, 12px та збереження в localStorage', async ({
    page,
  }) => {
    const loginPage = new DesktopLoginPage(page);
    await loginPage.goto();
    await loginPage.login(mockUser.email, 'ValidPassword123!');

    const settingsPage = new DesktopSettingsPage(page);
    await settingsPage.goto();
    await expect(settingsPage.settingsPage).toBeVisible();

    const html = page.locator('html');

    // 1. Verify Default (0.5 / 8px)
    await expect(html).toHaveAttribute('data-radius', '0.5');
    await expect(settingsPage.radiusSegmentedControl).toBeVisible();

    // 2. Select 0px (Sharp / Гострий)
    await settingsPage.selectRadius('0');
    await expect(html).toHaveAttribute('data-radius', '0');
    let savedRadius = await page.evaluate(() => localStorage.getItem('smartfeed_theme_radius'));
    expect(savedRadius).toBe('0');

    // Verify computed CSS variable on root element
    let rootRadiusVar = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--radius').trim(),
    );
    expect(rootRadiusVar).toBe('0rem');

    // 3. Select 4px (Compact)
    await settingsPage.selectRadius('0.25');
    await expect(html).toHaveAttribute('data-radius', '0.25');
    savedRadius = await page.evaluate(() => localStorage.getItem('smartfeed_theme_radius'));
    expect(savedRadius).toBe('0.25');

    rootRadiusVar = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--radius').trim(),
    );
    expect(rootRadiusVar).toBe('0.25rem');

    // 4. Select 12px (Soft)
    await settingsPage.selectRadius('0.75');
    await expect(html).toHaveAttribute('data-radius', '0.75');
    savedRadius = await page.evaluate(() => localStorage.getItem('smartfeed_theme_radius'));
    expect(savedRadius).toBe('0.75');

    // 5. Return to 8px (Modern / Harmonic)
    await settingsPage.selectRadius('0.5');
    await expect(html).toHaveAttribute('data-radius', '0.5');
    savedRadius = await page.evaluate(() => localStorage.getItem('smartfeed_theme_radius'));
    expect(savedRadius).toBe('0.5');
  });

  test('двомовність налаштувань радіусу: переклад міток та бейджа при перемиканні UA ⇄ EN', async ({
    page,
  }) => {
    const loginPage = new DesktopLoginPage(page);
    await loginPage.goto();
    await loginPage.login(mockUser.email, 'ValidPassword123!');

    const settingsPage = new DesktopSettingsPage(page);
    await settingsPage.goto();
    await expect(settingsPage.settingsPage).toBeVisible();

    // Assert Ukrainian labels
    await expect(page.locator('text=Радіус заокруглення')).toBeVisible();
    await expect(page.locator('text=Глобально')).toBeVisible();

    // Switch to English
    await page.locator('button:has-text("English (EN)")').click();
    await expect(page.locator('text=Border Radius')).toBeVisible();
    await expect(page.locator('text=Global')).toBeVisible();

    // Switch back to Ukrainian
    await page.locator('button:has-text("Українська (UA)")').click();
    await expect(page.locator('text=Радіус заокруглення')).toBeVisible();
    await expect(page.locator('text=Глобально')).toBeVisible();
  });
});
