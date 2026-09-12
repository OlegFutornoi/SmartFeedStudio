import { test, expect } from '@playwright/test';

test.describe('Feed Ingestion & Streaming Engine E2E Tests', () => {
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
      used: 250,
      max: 5000,
      isUnlimited: false,
      percentUsed: 5,
      isExceeded: false,
      remaining: 4750,
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
      id: 'sup_01',
      name: 'Одяг-Опт Україна',
      code: 'SUP-01',
      defaultMarginPercent: 20,
      defaultFixedMarkup: 50,
      isActive: true,
      productsCount: 450,
      activeFeedsCount: 1,
      contactEmail: 'sales@opt.ua',
    },
  ];

  const mockAnalysis = {
    format: 'XML_ROZETKA',
    totalDetected: 50,
    categoriesCount: 3,
    categories: [
      { id: '101', externalId: '101', name: 'Сенсорні вимикачі', productCount: 30 },
      { id: '102', externalId: '102', name: 'Розумні розетки', productCount: 15 },
      { id: '103', externalId: '103', name: 'Рамки для вимикачів', productCount: 5 },
    ],
    sampleCategories: [{ externalId: '101', name: 'Сенсорні вимикачі' }],
    sampleProducts: [
      {
        sku: 'VL-C701-11',
        titleUk: 'Сенсорний вимикач 1-клавішний білий',
        costPrice: 500,
        price: 725,
        currency: 'UAH',
        stockQuantity: 20,
        inStock: true,
        images: [{ originalUrl: 'https://smartfeed.studio/preview-switch.png', isMain: true }],
      },
    ],
  };

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((user) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem('smartfeed_access_token', 'mock_jwt_token');
      window.localStorage.setItem('smartfeed_refresh_token', 'mock_refresh_token');
      window.localStorage.setItem('smartfeed_user_profile', JSON.stringify(user));
      window.localStorage.setItem('smartfeed_language', 'uk');
      window.localStorage.setItem('smartfeed_theme', 'dark');
    }, mockUser);

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    });

    await page.route('**/api/licenses/my', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLicenseState),
      });
    });

    await page.route('**/api/licenses/quotas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockQuotas),
      });
    });

    await page.route('**/api/suppliers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSuppliers),
      });
    });

    await page.route('**/api/feeds/suppliers/sup_01/sources', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'feed_sup_01_01',
            supplierId: 'sup_01',
            name: 'Одяг-Опт Фід',
            sourceType: 'URL',
            fileFormat: 'XML_ROZETKA',
            sourceUrl: 'https://smartfeed.studio/feed.xml',
            autoUpdatePrices: true,
            autoUpdateStocks: true,
            lastSyncedAt: new Date().toISOString(),
            lastSyncStatus: 'SUCCESS',
            productsCount: 450,
          },
        ]),
      });
    });

    await page.route('**/api/feeds/jobs/active', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/feeds/analyze-url', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAnalysis),
      });
    });

    await page.route('**/api/feeds/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAnalysis),
      });
    });

    await page.route('**/api/feeds/import-async', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          jobId: 'job_test_123',
          feedSourceId: 'feed_sup_01_01',
          status: 'COMPLETED',
        }),
      });
    });

    await page.route('**/*preview-switch.png*', async (route) => {
      const png1px = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      );
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: png1px,
      });
    });
  });

  test('should open Import Feed Wizard and display 4-step wizard', async ({ page }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible({ timeout: 5000 });
    const importBtn = page.getByTestId('supplier-card-import-btn-sup_01');
    await expect(importBtn).toBeVisible({ timeout: 5000 });
    await importBtn.click();

    await expect(page.locator('h2:has-text("Майстер Імпорту Фідів")')).toBeVisible();
    await expect(page.locator('text=Крок 1 з 4: Джерело даних')).toBeVisible();
    await expect(page.locator('button:has-text("Посилання на фід (URL)")')).toBeVisible();
    await expect(page.locator('button:has-text("Завантажити файл")')).toBeVisible();
  });

  test('should analyze XML feed URL and proceed to Step 2 & Step 3 with photo preview feedback', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible({ timeout: 5000 });
    const importBtn = page.getByTestId('supplier-card-import-btn-sup_01');
    await expect(importBtn).toBeVisible({ timeout: 5000 });
    await importBtn.click();

    const livoloBtn = page.locator('button:has-text("Тестовий фід Livolo")');
    await expect(livoloBtn).toBeVisible();
    await livoloBtn.click();

    const analyzeBtn = page.locator('button:has-text("Аналізувати")');
    await analyzeBtn.click();
    await expect(page.getByText('Фід успішно проаналізовано')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Далі до постачальника' }).click();

    await expect(page.locator('text=Крок 2 з 4: Постачальник та правила націнки')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('text=Правила націнки цього постачальника')).toBeVisible();

    await page.getByRole('button', { name: 'Переглянути товари' }).click();

    await expect(page.locator('text=Крок 3 з 4: Попередній перегляд')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('text=Формат фіду')).toBeVisible();
    await expect(page.locator('text=Знайдено товарів')).toBeVisible();
    await expect(page.getByText('Категорій', { exact: true })).toBeVisible();

    // Verify photo thumbnail container & status badge
    await expect(page.locator('[data-testid="preview-img-container-VL-C701-11"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-photos-status-badge"]')).toBeVisible();

    // Click thumbnail to verify enlarged lightbox modal
    await page.locator('[data-testid="preview-img-container-VL-C701-11"]').click();
    await expect(page.locator('[data-testid="preview-image-modal"]')).toBeVisible();
    await page.locator('[data-testid="close-preview-image-modal"]').click();
    await expect(page.locator('[data-testid="preview-image-modal"]')).not.toBeVisible();
  });

  test('should upload XML file, automatically analyze and enable Next button to proceed', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible({ timeout: 5000 });
    const importBtn = page.getByTestId('supplier-card-import-btn-sup_01');
    await expect(importBtn).toBeVisible({ timeout: 5000 });
    await importBtn.click();

    // Switch to FILE tab
    const fileTabBtn = page.locator('button:has-text("Завантажити файл")');
    await expect(fileTabBtn).toBeVisible();
    await fileTabBtn.click();

    // The Next button should initially be disabled before file is selected
    const nextBtn = page.locator('button:has-text("Далі до постачальника")');
    await expect(nextBtn).toBeDisabled();

    // Upload an XML file using setInputFiles
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="2026-09-12 12:00">
  <shop>
    <categories>
      <category id="1">Смартфони</category>
    </categories>
    <offers>
      <offer id="1" available="true">
        <name>iPhone 15 Pro Max</name>
        <price>45000</price>
        <categoryId>1</categoryId>
      </offer>
    </offers>
  </shop>
</yml_catalog>`;

    await page.setInputFiles('input#feed-file-upload', {
      name: 'mobile_phones_catalog.xml',
      mimeType: 'application/xml',
      buffer: Buffer.from(sampleXml),
    });

    // Expect file name to be shown
    await expect(page.locator('text=mobile_phones_catalog.xml')).toBeVisible();

    // The Next button MUST now be enabled!
    await expect(nextBtn).toBeEnabled({ timeout: 5000 });

    // Click Next
    await nextBtn.click();

    // Should successfully navigate to Step 2
    await expect(page.locator('text=Крок 2 з 4: Постачальник та правила націнки')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should dynamically enforce quota limit in Step 3 preview', async ({ page }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible({ timeout: 5000 });
    const importBtn = page.getByTestId('supplier-card-import-btn-sup_01');
    await expect(importBtn).toBeVisible({ timeout: 5000 });
    await importBtn.click();

    const livoloBtn = page.locator('button:has-text("Тестовий фід Livolo")');
    await livoloBtn.click();

    await page.locator('button:has-text("Аналізувати")').click();
    await expect(page.getByText('Фід успішно проаналізовано')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Далі до постачальника' }).click();
    await page.getByRole('button', { name: 'Переглянути товари' }).click();

    const selectAllBtn = page.locator('button:has-text("Обрати всі")');
    const deselectAllBtn = page.locator('button:has-text("Зняти всі")');

    await expect(selectAllBtn).toBeVisible();
    await expect(deselectAllBtn).toBeVisible();

    await deselectAllBtn.click();
    await expect(page.getByText('Оберіть хоча б одну категорію для імпорту')).toBeVisible();

    await selectAllBtn.click();
    await expect(page.getByText('Обрано до імпорту:')).toBeVisible();
  });

  test('should trigger asynchronous background ingestion and emit data sync', async ({ page }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible({ timeout: 5000 });
    const importBtn = page.getByTestId('supplier-card-import-btn-sup_01');
    await expect(importBtn).toBeVisible({ timeout: 5000 });
    await importBtn.click();

    await page.locator('button:has-text("Тестовий фід Livolo")').click();
    await page.locator('button:has-text("Аналізувати")').click();
    await expect(page.getByText('Фід успішно проаналізовано')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Далі до постачальника' }).click();
    await page.getByRole('button', { name: 'Переглянути товари' }).click();

    const startImportBtn = page.locator('button:has-text("Розпочати імпорт")');
    await expect(startImportBtn).toBeVisible();
    await startImportBtn.click();

    await expect(page.locator('text=Крок 4 з 4: Фонова черга обробки товарів')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should translate UI elements dynamically when switching languages UA ⇄ EN', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible({ timeout: 5000 });

    const importBtn = page.getByTestId('supplier-card-import-btn-sup_01');
    await expect(importBtn).toBeVisible({ timeout: 5000 });
    await importBtn.click();

    await expect(
      page.locator('h2:has-text("Feed Import Wizard"), h2:has-text("Майстер Імпорту Фідів")'),
    ).toBeVisible();
  });

  test('should cascade delete products and decrease SKU counter when feed is deleted in CatalogsPage', async ({
    page,
  }) => {
    let feedList = [
      {
        id: 'feed_sup_01_01',
        supplierId: 'sup_01',
        name: 'Одяг-Опт Фід',
        sourceType: 'URL',
        fileFormat: 'XML_ROZETKA',
        sourceUrl: 'https://smartfeed.studio/feed.xml',
        autoUpdatePrices: true,
        autoUpdateStocks: true,
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: 'SUCCESS',
        productsCount: 15,
      },
    ];

    await page.route('**/api/feeds/sources', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(feedList),
      });
    });

    await page.route('**/api/feeds/suppliers/sup_01/sources', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(feedList),
      });
    });

    await page.route('**/api/feeds/suppliers/sup_01/sources/feed_sup_01_01*', async (route) => {
      if (route.request().method() === 'DELETE') {
        feedList = [];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, deletedProductsCount: 15 }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/catalogs');
    await expect(page.getByTestId('catalogs-page')).toBeVisible({ timeout: 5000 });

    // Switch to feed sources tab
    await page.getByTestId('tab-catalogs').click();
    await expect(page.getByText('Одяг-Опт Фід')).toBeVisible();

    // Click delete feed button
    const deleteBtn = page.getByTestId('delete-feed-btn-feed_sup_01_01');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Confirm custom delete dialog
    await expect(page.getByTestId('confirm-dialog-confirm-btn')).toBeVisible();
    await page.getByTestId('confirm-dialog-confirm-btn').click();

    // Feed should be gone from list
    await expect(page.getByTestId('delete-feed-btn-feed_sup_01_01')).not.toBeVisible({
      timeout: 5000,
    });
  });
});
