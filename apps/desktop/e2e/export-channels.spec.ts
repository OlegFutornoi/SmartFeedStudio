import { test, expect } from '@playwright/test';

interface MockExportChannel {
  id: string;
  userId: string;
  name: string;
  marketplaceCode: string;
  feedFormat: string;
  commissionPercent: number;
  extraFixedCost: number;
  applyReverseMarkup: boolean;
  slug: string;
  isActive: boolean;
  catalogId: string | null;
  catalogName: string;
  totalProductsCount: number;
  exportUrl: string;
  createdAt: string;
}

test.describe('Desktop App — Export Channels & Marketplace Reverse Margin (E2E)', () => {
  const mockUser = {
    id: 'usr_export_e2e',
    email: 'export.e2e@smartfeed.local',
    fullName: 'Export Tester',
    role: 'USER',
    organization: {
      id: 'org-export-test',
      name: 'Export Test Store',
      role: 'OWNER',
    },
  };

  const mockLicense = {
    id: 'lic-export-1',
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
      used: 50,
      max: 5000,
      isUnlimited: false,
      percentUsed: 1,
      isExceeded: false,
      remaining: 4950,
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
      used: 0,
      max: 500,
      isUnlimited: false,
      percentUsed: 0,
      isExceeded: false,
      remaining: 500,
    },
    s3Storage: {
      used: 10,
      max: 1000,
      isUnlimited: false,
      percentUsed: 1,
      isExceeded: false,
      remaining: 990,
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

  let mockChannels: MockExportChannel[] = [];

  test.beforeEach(async ({ page, context }) => {
    mockChannels = [];

    await context.clearCookies();
    await page.addInitScript((user) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem('smartfeed_access_token', 'mock-export-token-123');
      window.localStorage.setItem('smartfeed_user_profile', JSON.stringify(user));
      window.localStorage.setItem('smartfeed_language', 'uk');
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
        body: JSON.stringify(mockLicense),
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
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/feed-sources', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/export/channels', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockChannels),
        });
      } else if (method === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const newChannel: MockExportChannel = {
          id: `channel-${Date.now()}`,
          userId: mockUser.id,
          name: body.name || 'Rozetka Feed',
          marketplaceCode: body.marketplaceCode || 'ROZETKA',
          feedFormat: body.feedFormat || 'XML_ROZETKA',
          commissionPercent: body.commissionPercent || 15,
          extraFixedCost: body.extraFixedCost || 0,
          applyReverseMarkup: body.applyReverseMarkup ?? true,
          slug: 'rozetka-feed-test',
          isActive: true,
          catalogId: null,
          catalogName: 'Основний каталог',
          totalProductsCount: 50,
          exportUrl: '/api/export/feed/rozetka-feed-test',
          createdAt: new Date().toISOString(),
        };
        mockChannels.push(newChannel);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newChannel),
        });
      }
    });
  });

  test('1. Empty State: renders single CTA button and completely hides search toolbar when channels list is empty', async ({
    page,
  }) => {
    await page.goto('/catalogs');

    // Switch to Export Channels tab
    const tabChannels = page.locator('[data-testid="tab-export-channels"]');
    await expect(tabChannels).toBeVisible();
    await tabChannels.click();

    // Verify search toolbar is NOT in DOM
    await expect(page.locator('[data-testid="search-export-channels-input"]')).not.toBeVisible();

    // Verify exactly ONE CTA button exists on the screen (in the empty state card)
    const createBtns = page.locator('[data-testid="create-export-channel-btn"]');
    await expect(createBtns).toHaveCount(1);
    await expect(createBtns).toBeVisible();
    await expect(createBtns).toContainText('Підключити маркетплейс');

    // Verify empty state messages
    await expect(page.locator('text=Немає підключених каналів експорту')).toBeVisible();
    await expect(
      page.locator(
        'text=Створіть свій перший канал експорту для Rozetka, Prom, Epicentr чи Hotline',
      ),
    ).toBeVisible();
  });

  test('2. Channel Creation Flow: creates Rozetka channel with Reverse Margin and validates search toolbar appearance', async ({
    page,
  }) => {
    await page.goto('/catalogs');

    const tabChannels = page.locator('[data-testid="tab-export-channels"]');
    await tabChannels.click();

    // Open creation modal
    await page.locator('[data-testid="create-export-channel-btn"]').click();

    // Modal verification
    await expect(page.locator('text=Створити канал експорту для маркетплейсу')).toBeVisible();
    await expect(page.locator('text=Симулятор маржинальності та чистого заробітку')).toBeVisible();

    // Verify Reverse Margin simulation values
    await expect(page.locator('text=1470.59 ₴')).toBeVisible();
    await expect(page.locator('text=+250 ₴ (25%)')).toBeVisible();

    // Submit dialog
    await page.locator('[data-testid="save-export-channel-btn"]').click();

    // Channel card must now be visible
    await expect(page.locator('text=Rozetka — Основний фід')).toBeVisible();
    await expect(page.getByText('ROZETKA', { exact: true })).toBeVisible();
    await expect(page.locator('text=Reverse Markup (100% прибутку)')).toBeVisible();

    // Toolbar must now appear with search input and toolbar CTA button
    const searchInput = page.locator('[data-testid="search-export-channels-input"]');
    await expect(searchInput).toBeVisible();

    // Still exactly ONE CTA button exists across the entire screen (now in toolbar, empty card is gone)
    await expect(page.locator('[data-testid="create-export-channel-btn"]')).toHaveCount(1);

    // Test Search filter
    await searchInput.fill('prom');
    await expect(page.locator('text=Каналів не знайдено')).toBeVisible();

    await searchInput.fill('');
    await expect(page.locator('text=Rozetka — Основний фід')).toBeVisible();
  });

  test('3. Bilingual i18n & Zero Raw Translation Keys: dynamic translation UA ⇄ EN', async ({
    page,
  }) => {
    // 1. Check Ukrainian
    await page.goto('/catalogs');
    const tabChannels = page.locator('[data-testid="tab-export-channels"]');
    await tabChannels.click();

    await expect(page.locator('text=Немає підключених каналів експорту')).toBeVisible();
    await expect(page.locator('[data-testid="create-export-channel-btn"]')).toContainText(
      'Підключити маркетплейс',
    );

    // Open dialog in UA
    await page.locator('[data-testid="create-export-channel-btn"]').click();
    await expect(page.locator('text=Створити канал експорту для маркетплейсу')).toBeVisible();
    await expect(page.locator('text=Автоматична зворотна націнка (Reverse Markup)')).toBeVisible();
    await expect(page.locator('text=Симулятор маржинальності та чистого заробітку')).toBeVisible();

    // Close dialog
    await page.locator('text=Скасувати').click();

    // 2. Switch to English
    const langToggle = page.locator('[data-testid="language-toggle"]');
    await expect(langToggle).toBeVisible();
    await langToggle.click();

    // Verify English translations
    await expect(page.locator('text=No connected export channels')).toBeVisible();
    await expect(page.locator('[data-testid="create-export-channel-btn"]')).toContainText(
      'Connect marketplace',
    );

    // Open dialog in EN
    await page.locator('[data-testid="create-export-channel-btn"]').click();
    await expect(page.locator('text=Create Export Channel for Marketplace')).toBeVisible();
    await expect(page.getByText('Automatic Reverse Markup', { exact: true })).toBeVisible();
    await expect(page.locator('text=Margin & Net Profit Simulator')).toBeVisible();

    // Assert zero raw translation keys on the page
    const pageText = await page.innerText('body');
    expect(pageText).not.toContain('export:');
    expect(pageText).not.toContain('catalogs:');
    expect(pageText).not.toContain('common:');
  });
});
