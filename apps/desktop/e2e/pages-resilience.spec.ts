import { test, expect } from '@playwright/test';

test.describe('Desktop App — Розділи додатку, i18n та Стійкість (POM E2E)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage to prevent cross-test contamination
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Mock authenticated user session
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'usr-test-123',
          email: 'desktop.tester@smartfeed.studio',
          fullName: 'Олег Тестер',
          role: 'USER',
          organization: {
            id: 'org-test-123',
            name: 'SmartFeed Enterprise Store',
            role: 'OWNER',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });
    });

    // Mock active PRO license
    await page.route('**/api/licenses/my', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'lic-test-123',
          licenseKey: 'SF-PRO-ABCD-1234-EFGH',
          planType: 'PRO',
          organizationId: 'org-test-123',
          organizationName: 'SmartFeed Enterprise Store',
          isActive: true,
          isExpired: false,
          maxXmlLimit: 100000,
          aiCredits: 500,
          maxFeedsLimit: 999,
          maxChannelsLimit: 15,
          maxTeamSeats: 3,
          maxSuppliersLimit: 15,
          canCloudBackup: true,
          hasApiAccess: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    // Mock navigation
    await page.route('**/api/navigation?app=DESKTOP', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'nav-1',
            key: 'dashboard',
            labelUk: 'Дашборд',
            labelEn: 'Dashboard',
            path: '/',
            icon: 'LayoutDashboard',
            order: 1,
            isVisible: true,
            requiredRoles: ['USER'],
            targetApp: 'DESKTOP',
          },
          {
            id: 'nav-2',
            key: 'catalogs',
            labelUk: 'Каталоги товарів',
            labelEn: 'Product Catalogs',
            path: '/catalogs',
            icon: 'Layers',
            order: 2,
            isVisible: true,
            requiredRoles: ['USER'],
            targetApp: 'DESKTOP',
          },
          {
            id: 'nav-3',
            key: 'ai_enrichment',
            labelUk: 'AI Збагачення',
            labelEn: 'AI Enrichment',
            path: '/ai-enrichment',
            icon: 'Sparkles',
            order: 3,
            isVisible: true,
            requiredRoles: ['USER'],
            targetApp: 'DESKTOP',
          },
          {
            id: 'nav-4',
            key: 'cloud_sync',
            labelUk: 'Хмарна синхронізація',
            labelEn: 'Cloud Sync',
            path: '/cloud-sync',
            icon: 'Cloud',
            order: 4,
            isVisible: true,
            requiredRoles: ['USER'],
            targetApp: 'DESKTOP',
          },
          {
            id: 'nav-5',
            key: 'plans',
            labelUk: 'Тарифи',
            labelEn: 'Plans & Pricing',
            path: '/plans',
            icon: 'CreditCard',
            order: 5,
            isVisible: true,
            requiredRoles: ['USER'],
            targetApp: 'DESKTOP',
          },
          {
            id: 'nav-6',
            key: 'team',
            labelUk: 'Команда',
            labelEn: 'Team',
            path: '/team',
            icon: 'Users',
            order: 6,
            isVisible: true,
            requiredRoles: ['USER'],
            targetApp: 'DESKTOP',
          },
        ]),
      });
    });

    // Set token
    await page.evaluate(() => {
      localStorage.setItem('smartfeed_access_token', 'test-valid-jwt-token');
    });
  });

  test('1. Сторінка Каталогів: перегляд карток, фільтрація та двомовність UA ⇄ EN', async ({
    page,
  }) => {
    await page.goto('/catalogs');
    await expect(page.locator('[data-testid="catalogs-page"]')).toBeVisible();

    // Assert Ukrainian title from i18n
    await expect(page.locator('h1')).toContainText('Каталоги товарів');

    // Toggle to English
    const langBtn = page.locator('[data-testid="language-toggle-btn"]');
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await expect(page.locator('h1')).toContainText('Product Catalogs');
      // Switch back to Ukrainian
      await langBtn.click();
      await expect(page.locator('h1')).toContainText('Каталоги товарів');
    }
  });

  test('2. Сторінка AI Збагачення: баланс кредитів, функції та двомовність UA ⇄ EN', async ({
    page,
  }) => {
    await page.goto('/ai-enrichment');
    await expect(page.locator('[data-testid="ai-enrichment-page"]')).toBeVisible();

    // Assert Ukrainian title & credits
    await expect(page.locator('h1')).toContainText('AI Збагачення контенту');
    await expect(page.locator('text=500 AI Кредитів залишилось')).toBeVisible();

    // Toggle to English
    const langBtn = page.locator('[data-testid="language-toggle-btn"]');
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await expect(page.locator('h1')).toContainText('AI Content Enrichment');
      await expect(page.locator('text=500 AI Credits remaining')).toBeVisible();
      // Switch back
      await langBtn.click();
    }
  });

  test('3. Сторінка Хмарної синхронізації: індикатори сховища та двомовність UA ⇄ EN', async ({
    page,
  }) => {
    await page.goto('/cloud-sync');
    await expect(page.locator('[data-testid="cloud-sync-page"]')).toBeVisible();

    // Assert Ukrainian title
    await expect(page.locator('h1')).toContainText('Хмарна синхронізація & Бекап');

    // Toggle to English
    const langBtn = page.locator('[data-testid="language-toggle-btn"]');
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await expect(page.locator('h1')).toContainText('Cloud Sync & Backups');
      // Switch back
      await langBtn.click();
    }
  });

  test('4. Сторінка Каталогів: перевірка пагінації та пошуку по всій вибірці даних', async ({
    page,
  }) => {
    await page.goto('/catalogs');
    await expect(page.getByTestId('catalogs-page')).toBeVisible();

    const pagination = page.getByTestId('catalogs-pagination');
    await expect(pagination).toBeVisible();
    await expect(page.getByTestId('catalogs-pagination-range-text')).toContainText(
      'Показано 1–3 із 3 записів',
    );

    await page.screenshot({
      path: '/Users/oleg/.gemini/antigravity-ide/brain/d7eed6c3-a334-4c29-a82d-93b7ad73f29a/desktop-catalogs-pagination-view.png',
      fullPage: true,
    });

    // Search query narrows the pagination scope
    const searchInput = page.getByTestId('catalogs-search-input');
    await searchInput.fill('Google');
    await expect(page.getByTestId('catalogs-pagination-range-text')).toContainText(
      'Показано 1–1 із 1 записів',
    );
    await expect(page.getByText('Google Merchant Center Feed')).toBeVisible();
    await expect(page.getByText('Rozetka XML')).not.toBeVisible();
  });
});
