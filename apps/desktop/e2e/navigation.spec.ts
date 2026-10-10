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

    // Чекаємо завершення CSS transition (duration-300) до повної фіксації ширини 72px
    await expect(async () => {
      const box = await sidebar.boundingBox();
      expect(Math.round(box?.width ?? 0)).toBe(72);
    }).toPass({ timeout: 2000 });

    // Перевірка геометричного центру іконок (бренд, навігація, аватар) у згорнутому стані
    const sBox = (await sidebar.boundingBox())!;
    const bBox = (await page.getByTestId('sidebar-brand-button').boundingBox())!;
    const nBox = (await page.getByTestId('nav-item-dashboard').boundingBox())!;
    const uBox = (await page.getByTestId('sidebar-user-trigger').boundingBox())!;
    const sCenter = sBox.x + sBox.width / 2;
    expect(Math.abs(bBox.x + bBox.width / 2 - sCenter)).toBeLessThanOrEqual(2);
    expect(Math.abs(nBox.x + nBox.width / 2 - sCenter)).toBeLessThanOrEqual(2);
    expect(Math.abs(uBox.x + uBox.width / 2 - sCenter)).toBeLessThanOrEqual(2);

    // Клік "Розгорнути меню"
    const expandBtn = page.getByTitle('Розгорнути меню').first();
    await expandBtn.click();
    await expect(sidebar).toHaveClass(/w-64/);
  });

  test('перехід на сторінку "Профіль" (/profile) через меню користувача', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByTestId('email-input').fill('client@smartfeed.studio');
    await page.getByTestId('password-input').fill('Password123!');
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('home-page')).toBeVisible();

    // Відкрити меню користувача внизу сайдбара
    await page.getByTestId('sidebar-user-trigger').click();
    await expect(page.getByTestId('sidebar-profile-link')).toBeVisible();
    await page.getByTestId('sidebar-profile-link').click();

    await expect(page).toHaveURL('/profile');
    await expect(page.getByTestId('profile-page')).toBeVisible();
  });

  test('перевірка чистоти шапки: відсутність зайвих плашок тарифу та онлайн, наявність у профілі', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await page.getByTestId('email-input').fill('client@smartfeed.studio');
    await page.getByTestId('password-input').fill('Password123!');
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('home-page')).toBeVisible();

    const header = page.getByTestId('desktop-header');
    await expect(header).toBeVisible();

    // Зайві блоки вилучені з шапки
    await expect(header.getByTestId('header-active-plan-badge')).not.toBeVisible();
    await expect(header.getByText('Онлайн')).not.toBeVisible();
    await expect(header.getByTestId('header-command-search-trigger')).toBeVisible();
    await expect(header.getByTestId('language-toggle')).toBeVisible();
    await expect(header.getByTestId('theme-toggle')).toBeVisible();
    await page.getByTestId('sidebar-user-trigger').click();
    await page.getByTestId('sidebar-profile-link').click();
    await expect(page).toHaveURL('/profile');
    await expect(page.getByTestId('profile-page')).toBeVisible();
    await expect(page.getByText('Статус підключення: Онлайн')).toBeVisible();
  });

  test('перевірка клікабельного аватара в шапці (Header User Menu) та його випадаючого списку', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await page.getByTestId('email-input').fill('client@smartfeed.studio');
    await page.getByTestId('password-input').fill('Password123!');
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('home-page')).toBeVisible();

    // Клікаємо на аватар у шапці праворуч
    const headerAvatar = page.getByTestId('header-user-trigger');
    await expect(headerAvatar).toBeVisible();
    await headerAvatar.click();

    // Перевіряємо пункти меню
    await expect(page.getByTestId('header-profile-link')).toBeVisible();
    await expect(page.getByTestId('header-settings-link')).toBeVisible();
    await expect(page.getByTestId('header-plans-link')).toBeVisible();
    await expect(page.getByTestId('header-logout-button')).toBeVisible();

    // Перехід у Профіль через шапку
    await page.getByTestId('header-profile-link').click();
    await expect(page).toHaveURL('/profile');
    await expect(page.getByTestId('profile-page')).toBeVisible();
  });
});
