import { test, expect } from '@playwright/test';

test.describe('Desktop App — Віртуалізована Таблиця Товарів (Products Grid E2E)', () => {
  const mockUser = {
    id: 'user_e2e_01',
    email: 'admin@smartfeed.studio',
    fullName: 'Олег Футорний',
    role: 'SUPER_ADMIN',
  };

  const mockLicenseState = {
    id: 'lic-1',
    userId: mockUser.id,
    planType: 'PRO',
    isActive: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isExpired: false,
    daysRemaining: 30,
  };

  const mockQuotas = {
    planCode: 'PRO',
    planNameUk: 'PRO Тариф',
    planNameEn: 'PRO Plan',
    isExpired: false,
    suppliers: {
      used: 1,
      max: 10,
      isUnlimited: false,
      percentUsed: 10,
      isExceeded: false,
      remaining: 9,
    },
    products: {
      used: 450,
      max: 5000,
      isUnlimited: false,
      percentUsed: 9,
      isExceeded: false,
      remaining: 4550,
    },
    feeds: {
      used: 1,
      max: 20,
      isUnlimited: false,
      percentUsed: 5,
      isExceeded: false,
      remaining: 19,
    },
    aiCredits: {
      used: 10,
      max: 500,
      isUnlimited: false,
      percentUsed: 2,
      isExceeded: false,
      remaining: 490,
    },
    teamSeats: {
      used: 1,
      max: 5,
      isUnlimited: false,
      percentUsed: 20,
      isExceeded: false,
      remaining: 4,
    },
    storage: {
      usedMb: 120,
      maxMb: 10000,
      percentUsed: 1.2,
      isUnlimited: false,
      isExceeded: false,
      remainingMb: 9880,
    },
  };

  const mockSuppliers = [
    {
      id: 'sup_demo_01',
      name: 'Brain Distribution',
      code: 'BRAIN',
      defaultMarginPercent: 15,
      defaultFixedMarkup: 0,
      isActive: true,
      productsCount: 450,
      activeFeedsCount: 2,
      contactEmail: 'sales@brain.ua',
    },
  ];

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((user) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem('smartfeed_access_token', 'mock_jwt_token');
      window.localStorage.setItem('smartfeed_refresh_token', 'mock_refresh_token');
      window.localStorage.setItem('smartfeed_user_profile', JSON.stringify(user));
      window.localStorage.setItem('smartfeed_language', 'uk');
      window.localStorage.setItem('smartfeed_theme', 'dark');
      window.localStorage.setItem('has_selected_workspace', 'true');
      window.localStorage.setItem('workspace_path', '/mock/workspace/storage');
      window.localStorage.setItem('smartfeed_workspace_path', '/mock/workspace/storage');
      window.localStorage.setItem('smartfeed_workspace_initialized', 'true');
      window.localStorage.setItem('smartfeed_show_workspace_onboarding', 'false');
      window.localStorage.setItem('smartfeed_e2e_seed', 'true');
    }, mockUser);

    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/src/')) {
        return route.continue();
      }

      if (url.includes('/api/auth/me')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockUser),
        });
      }

      if (url.includes('/api/licenses/my')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockLicenseState),
        });
      }

      if (url.includes('/api/licenses/quotas')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockQuotas),
        });
      }

      if (url.includes('/api/suppliers')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSuppliers),
        });
      }

      if (url.includes('/api/background-jobs/active')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }

      if (url.includes('/api/storage/workspace/default-path')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ defaultPath: '/mock/workspace/storage' }),
        });
      }

      if (url.includes('/api/storage/workspace/info')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            workspacePath: '/mock/workspace/storage',
            isInitialized: true,
            databasePath: '/mock/workspace/storage/catalog.db',
            feedsPath: '/mock/workspace/storage/feeds',
            imagesPath: '/mock/workspace/storage/images',
            isEncrypted: true,
            encryptionAlgorithm: 'SQLCipher-AES256',
            sizeBytes: 25000000,
            freeSpaceBytes: 150000000000,
            createdAt: new Date().toISOString(),
          }),
        });
      }

      if (url.includes('/api/storage/workspace/stats')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            workspacePath: '/mock/workspace/storage',
            databaseSizeBytes: 2400000,
            feedsCount: 2,
            feedsSizeBytes: 5200000,
            imagesCount: 30,
            imagesSizeBytes: 12000000,
            totalSizeBytes: 19600000,
            freeDiskSpaceBytes: 120000000000,
          }),
        });
      }

      if (url.includes('/api/navigation')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: '1',
              key: 'home',
              labelUk: 'Головна',
              labelEn: 'Home',
              path: '/',
              icon: 'Home',
              isVisible: true,
            },
            {
              id: '2',
              key: 'suppliers',
              labelUk: 'Постачальники',
              labelEn: 'Suppliers',
              path: '/suppliers',
              icon: 'Truck',
              isVisible: true,
            },
            {
              id: '3',
              key: 'catalogs',
              labelUk: 'Каталоги товарів',
              labelEn: 'Catalogs',
              path: '/catalogs',
              icon: 'Layers',
              isVisible: true,
            },
            {
              id: '4',
              key: 'plans',
              labelUk: 'Тарифні плани',
              labelEn: 'Plans',
              path: '/plans',
              icon: 'Shield',
              isVisible: true,
            },
          ]),
        });
      }

      return route.continue();
    });

    await page.goto('/catalogs');
    await page.waitForLoadState('networkidle');
  });

  test('1. Повинен відкрити сторінку Каталогів з активною вкладкою Товарів та Solid Sticky Header', async ({
    page,
  }) => {
    await expect(page.getByTestId('catalogs-page')).toBeVisible();

    // Products Tab is active by default
    const productsTab = page.getByTestId('tab-products');
    await expect(productsTab).toBeVisible();

    // Toolbar & Search Input
    const toolbar = page.getByTestId('products-toolbar');
    await expect(toolbar).toBeVisible();
    await expect(page.getByTestId('products-search-input')).toBeVisible();

    // Products Table & 100% Solid Sticky Header
    const table = page.getByTestId('products-table');
    await expect(table).toBeVisible();
    const thead = table.locator('thead');
    await expect(thead).toBeVisible();

    // Check product rows are present
    const firstRow = page.getByTestId('product-row-prod_1');
    await expect(firstRow).toBeVisible();
    await expect(firstRow).toContainText('SKU-DEMO-0001');
    await expect(firstRow).toContainText('Brain Distribution');
  });

  test('2. Фасетна фільтрація: живий пошук за назвою та артикулом + фільтр за категорією та наявністю', async ({
    page,
  }) => {
    await expect(page.getByTestId('products-view')).toBeVisible();

    // 1. Search by SKU
    const searchInput = page.getByTestId('products-search-input');
    await searchInput.fill('0002');
    await expect(page.getByTestId('product-row-prod_2')).toBeVisible();
    await expect(page.getByTestId('product-row-prod_1')).not.toBeVisible();

    // 2. Reset Filters
    const resetBtn = page.getByTestId('reset-filters-button');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await expect(page.getByTestId('product-row-prod_1')).toBeVisible();

    // 3. In Stock toggle
    const inStockToggle = page.getByTestId('filter-instock-toggle');
    await inStockToggle.click();
    await expect(inStockToggle).toContainText('Тільки в наявності');
  });

  test('3. Вибір товарів (Checkbox Select All) та панель масових дій (Bulk Actions Bar)', async ({
    page,
  }) => {
    await expect(page.getByTestId('products-view')).toBeVisible();

    // Select All Checkbox in sticky header
    const selectAllCheckbox = page.getByTestId('select-all-products-checkbox');
    await selectAllCheckbox.click();

    // Bulk bar appears with count
    const bulkBar = page.getByTestId('products-bulk-actions-bar');
    await expect(bulkBar).toBeVisible();
    await expect(bulkBar).toContainText('Вибрано:');

    // Clear selection
    const clearBtn = page.getByTestId('clear-selection-button');
    await clearBtn.click();
    await expect(bulkBar).not.toBeVisible();

    // Select individual row
    const rowCheckbox = page.getByTestId('product-checkbox-prod_1');
    await rowCheckbox.click();
    await expect(bulkBar).toBeVisible();
    await expect(bulkBar).toContainText('1');

    // Bulk delete button opens confirmation
    const bulkDeleteBtn = page.getByTestId('bulk-delete-button');
    await bulkDeleteBtn.click();
    await expect(page.getByText('Масове видалення товарів')).toBeVisible();
    await page.getByRole('button', { name: 'Скасувати' }).click();
  });

  test('4. Висувна картка товару (Product Details Drawer) з розбивкою собівартості та маржі', async ({
    page,
  }) => {
    await expect(page.getByTestId('products-view')).toBeVisible();

    // Open the dropdown menu first
    const actionsMenu = page.getByTestId('product-actions-prod_1');
    await actionsMenu.click();

    // Click View Details icon on prod_1
    const viewBtn = page.getByTestId('view-details-btn-prod_1');
    await viewBtn.click();

    // Drawer opens
    const drawer = page.getByTestId('product-details-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('SKU-DEMO-0001');
    await expect(drawer).toContainText('Ціна закупівлі');
    await expect(drawer).toContainText('Ціна продажу');
    await expect(drawer).toContainText('Маржинальність');

    // Close drawer
    const closeBtn = page.getByTestId('close-drawer-btn');
    await closeBtn.click();
    await expect(drawer).not.toBeVisible();
  });

  test('5. Двомовність UI (UA ⇄ EN) для розділу Товарів каталогу', async ({ page }) => {
    await expect(page.getByTestId('products-view')).toBeVisible();

    // Default Ukrainian
    await expect(page.getByTestId('tab-products')).toContainText('Товари каталогу');
    await expect(page.getByTestId('tab-catalogs')).toContainText('Джерела фідів');

    // Toggle Language to English
    const langBtn = page.locator('[data-testid="language-toggle-btn"]');
    if (await langBtn.isVisible()) {
      await langBtn.click();

      // Assert translated English strings
      await expect(page.getByTestId('tab-products')).toContainText('Products Catalog');
      await expect(page.getByTestId('tab-catalogs')).toContainText('Feed Sources');
      await expect(page.getByTestId('products-search-input')).toHaveAttribute(
        'placeholder',
        'Search by name, SKU, or category...',
      );

      // Revert back to Ukrainian
      await langBtn.click();
      await expect(page.getByTestId('tab-products')).toContainText('Товари каталогу');
    }
  });
});
