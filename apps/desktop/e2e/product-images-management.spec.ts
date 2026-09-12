import { test, expect } from '@playwright/test';

test.describe('Desktop App — Local Product Images Engine & Management (E2E)', () => {
  const mockUser = {
    id: 'user_e2e_images_01',
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
          body: JSON.stringify({
            planCode: 'PRO',
            planNameUk: 'PRO Тариф',
            planNameEn: 'PRO Plan',
            isExpired: false,
          }),
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
              id: '3',
              key: 'catalogs',
              labelUk: 'Каталоги товарів',
              labelEn: 'Catalogs',
              path: '/catalogs',
              icon: 'Layers',
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

  test('1. Повинен рендерити мініатюри товарів у віртуалізованій таблиці', async ({ page }) => {
    await expect(page.getByTestId('products-view')).toBeVisible();

    // Verify row for prod_1
    const row1 = page.getByTestId('product-row-prod_1');
    await expect(row1).toBeVisible();

    // Verify product thumbnail container is visible
    const thumbnail = row1.locator('[data-testid^="product-thumbnail-"]');
    await expect(thumbnail).toBeVisible();
  });

  test('2. Перегляд галереї фото у висувній картці товару та модалці', async ({ page }) => {
    await expect(page.getByTestId('products-view')).toBeVisible();

    // Open actions menu and click view details for prod_1
    await page.getByTestId('product-actions-prod_1').click();
    await page.getByTestId('view-details-btn-prod_1').click();

    // Product details drawer appears
    const drawer = page.getByTestId('product-details-drawer');
    await expect(drawer).toBeVisible();

    // Check images count badge (prod_1 has 2 images)
    await expect(drawer.getByText(/Галерея фотографій/)).toBeVisible();

    // Switch between thumbnails in drawer
    const thumb1 = page.getByTestId('drawer-thumbnail-1');
    if (await thumb1.isVisible()) {
      await thumb1.click();
    }

    // Open full gallery modal
    const openGalleryBtn = page.getByTestId('open-gallery-modal-btn');
    await expect(openGalleryBtn).toBeVisible();
    await openGalleryBtn.click();

    // Gallery modal is visible
    const galleryModal = page.getByTestId('product-gallery-modal');
    await expect(galleryModal).toBeVisible();

    // Close gallery modal
    await page.getByTestId('close-gallery-modal-btn').click();
    await expect(galleryModal).not.toBeVisible();

    // Close drawer
    await page.getByTestId('close-drawer-btn').click();
    await expect(drawer).not.toBeVisible();
  });

  test('3. Видалення фотографії товару з оновленням лічильника та списку', async ({ page }) => {
    await expect(page.getByTestId('products-view')).toBeVisible();

    // Open details drawer
    await page.getByTestId('product-actions-prod_1').click();
    await page.getByTestId('view-details-btn-prod_1').click();

    const drawer = page.getByTestId('product-details-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Галерея фотографій (2)')).toBeVisible();

    // Delete current active image via drawer delete button
    const deleteBtn = page.getByTestId('drawer-delete-image-btn');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Verify image count updated from 2 to 1
    await expect(drawer.getByText('Галерея фотографій (1)')).toBeVisible();
  });

  test('4. Двомовність UI (UA ⇄ EN) для керування фотографіями товарів', async ({ page }) => {
    await expect(page.getByTestId('products-view')).toBeVisible();

    // Open drawer
    await page.getByTestId('product-actions-prod_1').click();
    await page.getByTestId('view-details-btn-prod_1').click();

    const drawer = page.getByTestId('product-details-drawer');
    await expect(drawer).toBeVisible();

    // Ukrainian checks
    await expect(drawer.getByText(/Галерея фотографій/)).toBeVisible();
    await expect(page.getByTestId('open-gallery-modal-btn')).toContainText('Переглянути всі фото');

    // Toggle Language to English
    const langBtn = page.locator('[data-testid="language-toggle-btn"]');
    if (await langBtn.isVisible()) {
      await langBtn.click();

      // English checks
      await expect(drawer.getByText(/Photo Gallery/)).toBeVisible();
      await expect(page.getByTestId('open-gallery-modal-btn')).toContainText('View All Photos');

      // Open gallery in English
      await page.getByTestId('open-gallery-modal-btn').click();
      const galleryModal = page.getByTestId('product-gallery-modal');
      await expect(galleryModal).toBeVisible();
      await expect(galleryModal.getByText(/Photo Gallery/)).toBeVisible();

      // Close modal & revert back
      await page.getByTestId('close-gallery-modal-btn').click();
      await langBtn.click();
      await expect(drawer.getByText(/Галерея фотографій/)).toBeVisible();
    }
  });
});
