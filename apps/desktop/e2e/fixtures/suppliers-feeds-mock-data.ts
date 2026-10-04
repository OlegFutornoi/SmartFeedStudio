import type { Page } from '@playwright/test';

export const mockUser = {
  id: 'usr_test_123',
  email: 'supplier.test@smartfeed.local',
  fullName: 'Supplier Test User',
  role: 'USER',
  organization: {
    id: 'org-test-1',
    name: 'Test Org LLC',
    role: 'OWNER',
  },
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
    id: 'sup_test_1',
    name: 'Livolo Офіційний',
    code: 'LIVOLO-UA',
    defaultMarginPercent: 25,
    defaultFixedMarkup: 100,
    isActive: true,
    productsCount: 250,
    activeFeedsCount: 1,
    contactEmail: 'sales@livolo.ua',
    contactPhone: '+380501112233',
    website: 'https://livolo.ua',
  },
  {
    id: 'sup_test_2',
    name: 'Mobioptom',
    code: 'MOBI',
    defaultMarginPercent: 0,
    defaultFixedMarkup: 0,
    isActive: true,
    productsCount: 150,
    activeFeedsCount: 0,
    contactEmail: 'sales@mobioptom.com',
    contactPhone: '+380509998877',
    website: 'https://mobioptom.com',
  },
];

export const mockFeedSources = [
  {
    id: 'src_feed_1',
    supplierId: 'sup_test_1',
    name: 'Livolo Main XML',
    sourceType: 'URL',
    fileFormat: 'XML_ROZETKA',
    sourceUrl: 'https://livolo.kiev.ua/products_feed.xml',
    autoUpdatePrices: true,
    autoUpdateStocks: true,
    lastSyncedAt: new Date().toISOString(),
    lastSyncStatus: 'SUCCESS',
    productsCount: 250,
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
      images: [],
    },
  ],
};

export const constrainedQuotas = {
  ...mockQuotas,
  products: {
    used: 60,
    max: 100,
    isUnlimited: false,
    percentUsed: 60,
    isExceeded: false,
    remaining: 40,
  },
};

export const constrainedFeedAnalysis = {
  format: 'XML_ROZETKA',
  totalDetected: 55,
  categoriesCount: 2,
  categories: [
    { id: 'cat_1', name: 'Сенсорні вимикачі', productCount: 30 },
    { id: 'cat_2', name: 'Розумні розетки', productCount: 25 },
  ],
  sampleProducts: [
    {
      sku: 'VL-C701-11',
      titleUk: 'Сенсорний вимикач 1-клавішний білий',
      price: 900,
      costPrice: 650,
      inStock: true,
      images: [],
    },
  ],
};

export async function setupSuppliersFeedsRoutes(page: Page) {
  await page.addInitScript((user) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('smartfeed_access_token', 'mock-valid-token');
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

  await page.route(/\/api\/suppliers(\?|$)/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSuppliers),
    });
  });

  await page.route('**/api/feeds/jobs/active', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/api/feeds/suppliers/sup_test_1/sources', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockFeedSources),
    });
  });

  await page.route('**/api/feeds/analyze-url', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockAnalysis),
    });
  });
}
