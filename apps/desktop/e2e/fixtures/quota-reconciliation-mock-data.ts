import type { Page } from '@playwright/test';

export const mockUser = {
  id: 'usr_reconcile_123',
  email: 'reconcile.test@smartfeed.local',
  fullName: 'Reconcile Test User',
  role: 'USER',
  organization: {
    id: 'org-test-1',
    name: 'Reconcile Org',
    role: 'OWNER',
  },
};

export const mockStarterLicense = {
  id: 'lic-starter-1',
  userId: mockUser.id,
  planType: 'STARTER',
  isActive: true,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  isExpired: false,
  daysRemaining: 30,
  tariffPlan: {
    id: 'tp-starter',
    code: 'STARTER',
    nameUk: 'Старт',
    nameEn: 'Starter',
    maxXmlLimit: 1000,
    maxSuppliersLimit: 1,
    maxFeedsLimit: 1,
  },
};

export const mockExcessQuotas = {
  planCode: 'STARTER',
  planNameUk: 'Старт',
  planNameEn: 'Starter',
  isExpired: false,
  suppliers: {
    used: 1,
    max: 1,
    isUnlimited: false,
    percentUsed: 100,
    isExceeded: false,
    remaining: 0,
  },
  products: {
    used: 5102,
    max: 1000,
    isUnlimited: false,
    percentUsed: 100,
    isExceeded: true,
    remaining: 0,
  },
  feeds: {
    used: 2,
    max: 1,
    isUnlimited: false,
    percentUsed: 100,
    isExceeded: true,
    remaining: 0,
  },
  channels: {
    used: 1,
    max: 1,
    isUnlimited: false,
    percentUsed: 100,
    isExceeded: false,
    remaining: 0,
  },
  teamSeats: {
    used: 1,
    max: 1,
    isUnlimited: false,
    percentUsed: 100,
    isExceeded: false,
    remaining: 0,
  },
  aiCredits: {
    used: 0,
    max: 50,
    isUnlimited: false,
    percentUsed: 0,
    isExceeded: false,
    remaining: 50,
  },
  storage: {
    used: 0.1,
    max: 0,
    isUnlimited: false,
    percentUsed: 0,
    isExceeded: false,
    remaining: 0,
    usedBytes: 100000,
    maxBytes: 0,
    canCloudBackup: false,
  },
};

export const mockSuppliers = [
  {
    id: 'sup_mmm_1',
    name: 'MMM',
    code: 'M-01',
    notes: 'Мережа Мобільних Аксесуарів',
    defaultMarginPercent: 30,
    defaultFixedMarkup: 0,
    isActive: true,
    productsCount: 5102,
    activeFeedsCount: 2,
    contactEmail: 'mmm@gmail.com',
    contactPhone: '+380550000001',
    website: 'mma.ua/',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockCategoriesSummary = [
  {
    id: 'cat_cases',
    nameUk: 'Чохли для телефонів',
    nameEn: 'Phone Cases',
    productCount: 4200,
    supplierName: 'MMM',
  },
  {
    id: 'cat_cables',
    nameUk: 'Кабелі та адаптери',
    nameEn: 'Cables & Adapters',
    productCount: 902,
    supplierName: 'MMM',
  },
];

export const mockFeedSources = [
  {
    id: 'feed_1',
    supplierId: 'sup_mmm_1',
    name: 'Прайс Чохли (Основний)',
    sourceType: 'URL',
    fileFormat: 'YML_PROM',
    sourceUrl: 'https://mma.ua/feeds/cases.xml',
    syncIntervalHours: 0,
    autoUpdatePrices: true,
    autoUpdateStocks: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'feed_2',
    supplierId: 'sup_mmm_1',
    name: 'Прайс Кабелі',
    sourceType: 'URL',
    fileFormat: 'XML_ROZETKA',
    sourceUrl: 'https://mma.ua/feeds/cables.xml',
    syncIntervalHours: 0,
    autoUpdatePrices: true,
    autoUpdateStocks: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function setupQuotaReconciliationRoutes(page: Page) {
  await page.addInitScript(
    ({ user, license, token }) => {
      localStorage.setItem('smartfeed_user_profile', JSON.stringify(user));
      localStorage.setItem('smartfeed_access_token', token);
      localStorage.setItem('smartfeed_refresh_token', 'fake_refresh_token_reconcile');
      localStorage.setItem('smartfeed_license', JSON.stringify(license));
      localStorage.setItem('smartfeed_language', 'uk');
    },
    {
      user: mockUser,
      license: mockStarterLicense,
      token: 'mock-jwt-token-reconcile',
    },
  );

  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, json: mockUser }));
  await page.route('**/api/licenses/my', (route) =>
    route.fulfill({ status: 200, json: mockStarterLicense }),
  );
  await page.route('**/api/licenses/quotas', (route) =>
    route.fulfill({ status: 200, json: mockExcessQuotas }),
  );
  await page.route('**/api/suppliers', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 200, json: mockSuppliers });
    } else {
      route.continue();
    }
  });
  await page.route('**/api/products/categories-summary', (route) =>
    route.fulfill({ status: 200, json: mockCategoriesSummary }),
  );
  await page.route('**/api/feeds/suppliers/sup_mmm_1/sources', (route) =>
    route.fulfill({ status: 200, json: mockFeedSources }),
  );
  await page.route(/\/api\/products(\?|$)/, (route) =>
    route.fulfill({ status: 200, json: { items: [], total: 5102, page: 1, pageSize: 1 } }),
  );
  await page.route('**/api/feeds/jobs/active', (route) => route.fulfill({ status: 200, json: [] }));
  await page.route('**/api/navigation*', (route) => route.fulfill({ status: 200, json: [] }));
}
