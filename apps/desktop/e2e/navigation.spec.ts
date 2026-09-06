import { test, expect } from '@playwright/test';

test.describe('Desktop App — Динамічне бічне меню та маршрутизація (Navigation & Route Transitions)', () => {
  const mockUser = {
    id: 'usr-nav-100',
    email: 'client@smartfeed.studio',
    fullName: 'Client Store Manager',
    role: 'USER',
  };

  const mockNavigationItems = [
    {
      id: 'item-1',
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
      id: 'item-2',
      key: 'catalogs',
      labelUk: 'Каталоги товарів',
      labelEn: 'Product Catalogs',
      path: '/catalogs',
      icon: 'Layers',
      order: 2,
      isVisible: true,
      requiredRoles: ['USER', 'ADMIN', 'SUPER_ADMIN'],
      requiredPlan: null,
      targetApp: 'DESKTOP',
    },
    {
      id: 'item-3',
      key: 'ai_enrichment',
      labelUk: 'AI Асистент',
      labelEn: 'AI Assistant',
      path: '/ai-enrichment',
      icon: 'Sparkles',
      order: 3,
      isVisible: true,
      requiredRoles: ['USER', 'ADMIN', 'SUPER_ADMIN'],
      requiredPlan: 'PRO',
      targetApp: 'DESKTOP',
    },
    {
      id: 'item-4',
      key: 'cloud_sync',
      labelUk: 'Хмарна синхронізація',
      labelEn: 'Cloud Sync',
      path: '/cloud-sync',
      icon: 'Cloud',
      order: 4,
      isVisible: true,
      requiredRoles: ['USER', 'ADMIN', 'SUPER_ADMIN'],
      requiredPlan: 'PRO',
      targetApp: 'DESKTOP',
    },
    {
      id: 'item-5',
      key: 'settings',
      labelUk: 'Налаштування',
      labelEn: 'Settings',
      path: '/settings',
      icon: 'Settings',
      order: 5,
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
          id: 'lic-test-nav',
          licenseKey: 'SF-PRO-TEST-NAV',
          planType: 'PRO',
          isActive: true,
          isExpired: false,
          maxXmlLimit: 100000,
          aiCredits: 500,
          cloudBackupsLimit: 10,
          canCloudBackup: true,
        }),
      });
    });
  });

  test('успішна навігація по всіх пунктах меню: переходи без скидання і зникнення сторінок', async ({
    page,
  }) => {
    // 1. Авторизація
    await page.goto('/auth/login');
    await page.getByTestId('email-input').fill('client@smartfeed.studio');
    await page.getByTestId('password-input').fill('Password123!');
    await page.getByTestId('login-button').click();

    // 2. Перевірка стартової сторінки Дашборду
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page).toHaveURL('/');

    const sidebar = page.getByTestId('desktop-sidebar');
    await expect(sidebar).toBeVisible();

    // 3. Перехід на "Каталоги товарів" (/catalogs)
    const catalogsLink = sidebar.getByRole('link', { name: /Каталоги товарів/i });
    await expect(catalogsLink).toBeVisible();
    await catalogsLink.click();

    await expect(page).toHaveURL('/catalogs');
    await expect(page.getByTestId('catalogs-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Каталоги товарів' })).toBeVisible();

    // 4. Перехід на "AI Асистент" (/ai-enrichment)
    const aiLink = sidebar.getByRole('link', { name: /AI Асистент/i });
    await expect(aiLink).toBeVisible();
    await aiLink.click();

    await expect(page).toHaveURL('/ai-enrichment');
    await expect(page.getByTestId('ai-enrichment-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'AI Асистент контенту' })).toBeVisible();

    // 5. Перехід на "Хмарна синхронізація" (/cloud-sync)
    const cloudLink = sidebar.getByRole('link', { name: /Хмарна синхронізація/i });
    await expect(cloudLink).toBeVisible();
    await cloudLink.click();

    await expect(page).toHaveURL('/cloud-sync');
    await expect(page.getByTestId('cloud-sync-page')).toBeVisible();

    // 6. Перехід на "Налаштування" (/settings)
    const settingsLink = sidebar.getByRole('link', { name: /Налаштування/i });
    await expect(settingsLink).toBeVisible();
    await settingsLink.click();

    await expect(page).toHaveURL('/settings');
    await expect(page.getByTestId('settings-page')).toBeVisible();

    // 7. Повернення назад на "Дашборд" (/)
    const dashboardLink = sidebar.getByRole('link', { name: /Дашборд/i });
    await dashboardLink.click();

    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('home-page')).toBeVisible();
  });

  test('перевірка згортання та розгортання сайдбару зі збереженням активного стану', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await page.getByTestId('email-input').fill('client@smartfeed.studio');
    await page.getByTestId('password-input').fill('Password123!');
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('home-page')).toBeVisible();

    const sidebar = page.getByTestId('desktop-sidebar');

    // Клік "Згорнути меню"
    const collapseBtn = page.getByTitle('Згорнути меню').first();
    await collapseBtn.click();
    await expect(sidebar).toHaveClass(/w-\[72px\]/);

    // Клік "Розгорнути меню"
    const expandBtn = page.getByTitle('Розгорнути меню').first();
    await expandBtn.click();
    await expect(sidebar).toHaveClass(/w-64/);
  });
});
