import { test, expect } from '@playwright/test';

test.describe('Desktop App — Multi-Tier Pricing Rules & Marketplace Reverse Margin Engine', () => {
  const mockUser = {
    id: 'usr_pricing_123',
    email: 'pricing.rules@smartfeed.local',
    fullName: 'Pricing Test User',
    role: 'USER',
    organization: {
      id: 'org-test-1',
      name: 'SmartFeed Store LLC',
      role: 'OWNER',
    },
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
    s3Storage: {
      used: 50,
      max: 1000,
      isUnlimited: false,
      percentUsed: 5,
      isExceeded: false,
      remaining: 950,
    },
    teamSeats: {
      used: 1,
      max: 5,
      isUnlimited: false,
      percentUsed: 20,
      isExceeded: false,
      remaining: 4,
    },
  };

  const mockSupplier = {
    id: 'sup_test_1',
    userId: mockUser.id,
    name: 'Tech Master Supplier',
    code: 'TECH_01',
    contactPhone: '+380501112233',
    contactEmail: 'tech@supplier.ua',
    website: 'https://tech-master.ua',
    defaultMarginPercent: 20,
    defaultFixedMarkup: 10,
    isActive: true,
    productsCount: 150,
    activeFeedsCount: 1,
    createdAt: new Date().toISOString(),
  };

  let mockRules: any[] = [];
  let mockExportChannels: any[] = [];

  test.beforeEach(async ({ page }) => {
    mockRules = [];
    mockExportChannels = [];

    await page.addInitScript((user) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem('smartfeed_access_token', 'mock-valid-token');
      window.localStorage.setItem('smartfeed_user_profile', JSON.stringify(user));
      window.localStorage.setItem('smartfeed_language', 'uk');
    }, mockUser);

    // Mock Backend API routes
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

    await page.route('**/api/navigation', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'nav-1',
            key: 'suppliers',
            labelUk: 'Постачальники',
            labelEn: 'Suppliers',
            path: '/suppliers',
            icon: 'Building2',
            isVisible: true,
            targetApp: 'DESKTOP',
          },
          {
            id: 'nav-2',
            key: 'catalogs',
            labelUk: 'Каталоги товарів',
            labelEn: 'Catalogs',
            path: '/catalogs',
            icon: 'Layers',
            isVisible: true,
            targetApp: 'DESKTOP',
          },
        ]),
      });
    });

    await page.route('**/api/suppliers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockSupplier]),
      });
    });

    await page.route('**/api/products/categories-summary', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'cat-1', nameUk: 'Електроніка', nameEn: 'Electronics', productCount: 80 },
          { id: 'cat-2', nameUk: 'Аксесуари', nameEn: 'Accessories', productCount: 70 },
        ]),
      });
    });

    await page.route('**/api/suppliers/*/pricing-rules', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockRules),
        });
      } else if (method === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const newRule = {
          id: `rule-${Date.now()}`,
          supplierId: mockSupplier.id,
          categoryId: body.categoryId || null,
          categoryNameUk:
            body.categoryId === 'cat-1' ? 'Електроніка' : body.categoryId ? 'Аксесуари' : null,
          minPrice: body.minPrice || null,
          maxPrice: body.maxPrice || null,
          marginPercent: body.marginPercent || 0,
          fixedMarkup: body.fixedMarkup || 0,
          priority: body.priority || 0,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        mockRules.push(newRule);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newRule),
        });
      }
    });

    await page.route('**/api/suppliers/*/pricing-rules/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        const ruleId = route.request().url().split('/').pop();
        mockRules = mockRules.filter((r) => r.id !== ruleId);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await page.route('**/api/export/channels', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockExportChannels),
        });
      } else if (method === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const newChannel = {
          id: `channel-${Date.now()}`,
          userId: mockUser.id,
          name: body.name,
          marketplaceCode: body.marketplaceCode || 'ROZETKA',
          feedFormat: body.feedFormat || 'XML_ROZETKA',
          commissionPercent: body.commissionPercent || 15,
          extraFixedCost: body.extraFixedCost || 0,
          applyReverseMarkup: body.applyReverseMarkup ?? true,
          slug: 'rozetka-main-feed-123',
          isActive: true,
          catalogId: body.catalogId || null,
          catalogName: 'Основний каталог',
          totalProductsCount: 150,
          exportUrl: '/api/export/feed/rozetka-main-feed-123',
          createdAt: new Date().toISOString(),
        };
        mockExportChannels.push(newChannel);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newChannel),
        });
      }
    });

    // Set initial session storage
    await page.addInitScript(() => {
      localStorage.setItem('smartfeed_access_token', 'mock_valid_token_123');
      localStorage.setItem(
        'smartfeed_user_profile',
        JSON.stringify({
          id: 'usr_pricing_123',
          email: 'pricing.rules@smartfeed.local',
          role: 'USER',
        }),
      );
    });
  });

  test('1. should open Supplier Pricing Rules modal and test interactive Live Price Simulator', async ({
    page,
  }) => {
    await page.goto('/suppliers');

    // Verify supplier card renders markup pill
    const markupPill = page.locator(
      `[data-testid="supplier-pricing-rules-btn-${mockSupplier.id}"]`,
    );
    await expect(markupPill).toBeVisible();
    await expect(markupPill).toContainText('+20% +10 ₴');

    // Click to open pricing rules modal
    await markupPill.click();

    // Verify modal elements
    await expect(page.locator('text=Правила націнки: Tech Master Supplier')).toBeVisible();
    await expect(page.locator('text=Інтерактивний калькулятор вхідної націнки')).toBeVisible();

    // Ingestion simulation with default markup (+20% + 10₴ on 500₴)
    // 500 * 1.20 + 10 = 610 ₴ (+110 ₴)
    await expect(page.locator('text=610 ₴')).toBeVisible();
    await expect(page.locator('text=(+110 ₴)')).toBeVisible();

    // Add a Category Rule (+30%, +50₴ for Electronics)
    await page.locator('[data-testid="submit-pricing-rule-btn"]').click();

    // Assert created rule in list
    await expect(page.locator('text=Категорія: Електроніка')).toBeVisible();
    await expect(page.locator('[data-testid^="delete-pricing-rule-"]').first()).toBeVisible();

    // Delete rule
    const deleteBtn = page.locator('[data-testid^="delete-pricing-rule-"]').first();
    await deleteBtn.click();
    await expect(page.locator('text=Спеціальних правил ще немає')).toBeVisible();
  });

  test('2. should navigate to CatalogsPage, open Export Channels tab, and create marketplace feed with reverse markup', async ({
    page,
  }) => {
    await page.goto('/catalogs');

    // Click tab "Канали експорту та Маркетплейси"
    const tabChannels = page.locator('[data-testid="tab-export-channels"]');
    await expect(tabChannels).toBeVisible();
    await tabChannels.click();

    // Click "Підключити маркетплейс"
    const connectBtn = page.locator('[data-testid="create-export-channel-btn"]');
    await expect(connectBtn).toBeVisible();
    await connectBtn.click();

    // Verify Modal & Live Profit Simulator
    await expect(page.locator('text=Створити канал експорту для маркетплейсу')).toBeVisible();
    await expect(page.locator('text=Симулятор маржинальності та чистого заробітку')).toBeVisible();

    // Set Commission = 15% and verify Reverse Margin formula:
    // Cost 1000, Supplier 25% -> Base = 1250
    // Shelf = 1250 / (1 - 0.15) = 1470.59 ₴
    // Net profit = 1470.59 - 220.59 - 1000 = +250 ₴ (+25%)
    await expect(page.locator('text=1470.59 ₴')).toBeVisible();
    await expect(page.locator('text=+250 ₴ (25%)')).toBeVisible();

    // Submit dialog
    await page.locator('[data-testid="save-export-channel-btn"]').click();

    // Verify Export Channel Card appeared
    await expect(page.locator('text=Rozetka — Основний фід')).toBeVisible();
    await expect(page.getByText('ROZETKA', { exact: true })).toBeVisible();
    await expect(page.locator('text=Reverse Markup (100% прибутку)')).toBeVisible();
    await expect(page.locator('text=Завантажити фід')).toBeVisible();

    // Test Copy Feed URL
    const copyBtn = page.locator('[data-testid^="copy-feed-url-btn-"]').first();
    await copyBtn.click();
  });

  test('3. should support dynamic localization without raw translation keys', async ({ page }) => {
    await page.goto('/catalogs');

    const tabChannels = page.locator('[data-testid="tab-export-channels"]');
    await tabChannels.click();

    // Verify no raw translation keys on screen
    const pageText = await page.innerText('body');
    expect(pageText).not.toContain('catalogs:');
    expect(pageText).not.toContain('suppliers:');
    expect(pageText).not.toContain('common:');
  });
});
