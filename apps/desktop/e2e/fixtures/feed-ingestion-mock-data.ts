import { Page } from '@playwright/test';

export const mockUser = {
  id: 'user_e2e_01',
  email: 'admin@smartfeed.studio',
  fullName: 'Олег Футорний',
  role: 'SUPER_ADMIN',
};

export const mockLicenseState = {
  id: 'lic-1',
  userId: mockUser.id,
  planType: 'PRO',
  isActive: true,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  isExpired: false,
  daysRemaining: 30,
};

export const mockQuotas = {
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

export const mockSuppliers = [
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

export const mockAnalysis = {
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

export async function setupFeedIngestionMocks(page: Page) {
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
}
