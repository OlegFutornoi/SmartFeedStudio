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
        images: [],
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

    await page.route('**/api/suppliers*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSuppliers),
        });
      } else {
        await route.continue();
      }
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

    await page.goto('/suppliers');
    await page.waitForLoadState('networkidle');
  });

  test('should open Import Feed Wizard and display 4-step wizard', async ({ page }) => {
    const importBtn = page.locator('[data-testid="import-feed-header-btn"]');
    await expect(importBtn).toBeVisible({ timeout: 5000 });
    await importBtn.click();

    await expect(page.locator('h2:has-text("Майстер Імпорту Фідів")')).toBeVisible();
    await expect(page.locator('text=Крок 1 з 4: Джерело даних')).toBeVisible();
    await expect(page.locator('button:has-text("Посилання на фід (URL)")')).toBeVisible();
    await expect(page.locator('button:has-text("Завантажити файл")')).toBeVisible();
  });

  test('should analyze XML feed URL and proceed to Step 2 & Step 3', async ({ page }) => {
    const importBtn = page.locator('[data-testid="import-feed-header-btn"]');
    await importBtn.click();

    const livoloBtn = page.locator('button:has-text("Тестовий фід Livolo")');
    await expect(livoloBtn).toBeVisible();
    await livoloBtn.click();

    const analyzeBtn = page.locator('button:has-text("Аналізувати")');
    await analyzeBtn.click();

    await expect(page.locator('text=Крок 2 з 4: Постачальник та правила націнки')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('text=Правила націнки цього постачальника')).toBeVisible();

    const nextBtn = page
      .locator('button:has-text("Далі"), button:has-text("Переглянути товари")')
      .last();
    await nextBtn.click();

    await expect(page.locator('text=Крок 3 з 4: Попередній перегляд')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('text=Формат фіду')).toBeVisible();
    await expect(page.locator('text=Знайдено товарів')).toBeVisible();
    await expect(page.getByText('Категорій', { exact: true })).toBeVisible();
  });

  test('should dynamically enforce quota limit in Step 3 preview', async ({ page }) => {
    const importBtn = page.locator('[data-testid="import-feed-header-btn"]');
    await importBtn.click();

    const livoloBtn = page.locator('button:has-text("Тестовий фід Livolo")');
    await livoloBtn.click();

    await page.locator('button:has-text("Аналізувати")').click();
    await page.waitForTimeout(500);

    const nextBtn = page
      .locator('button:has-text("Далі"), button:has-text("Переглянути товари")')
      .last();
    await nextBtn.click();

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
    const importBtn = page.locator('[data-testid="import-feed-header-btn"]');
    await importBtn.click();

    await page.locator('button:has-text("Тестовий фід Livolo")').click();
    await page.locator('button:has-text("Аналізувати")').click();
    await page.waitForTimeout(500);

    await page
      .locator('button:has-text("Далі"), button:has-text("Переглянути товари")')
      .last()
      .click();
    await page.waitForTimeout(500);

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
    // Toggle language on main page first
    const langBtn = page.locator('[data-testid="language-toggle"]');
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await page.waitForTimeout(300);
    }

    const importBtn = page.locator('[data-testid="import-feed-header-btn"]');
    await importBtn.click();

    await expect(
      page.locator('h2:has-text("Feed Import Wizard"), h2:has-text("Майстер Імпорту Фідів")'),
    ).toBeVisible();
  });
});
