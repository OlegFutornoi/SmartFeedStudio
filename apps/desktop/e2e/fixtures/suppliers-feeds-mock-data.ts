import type { Page } from '@playwright/test';
import { setupSupplierSyncRoutes } from '@e2e/fixtures/supplier-sync-routes';

export const mockUser = {
  id: 'usr_test_123',
  email: 'supplier.test@smartfeed.local',
  fullName: 'Supplier Test User',
  role: 'USER',
  organization: { id: 'org-test-1', name: 'Test Org LLC', role: 'OWNER' },
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
  feeds: { used: 1, max: 20, isUnlimited: false, percentUsed: 5, isExceeded: false, remaining: 19 },
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
    legalName: 'ТОВ «Ліволо Україна»',
    taxId: '38942104',
    industry: 'Розумний дім та електрофурнітура',
    segment: 'Ексклюзивний імпортер',
    managerName: 'Артем Васильєв',
    managerPosition: 'Директор з оптових продажів',
    managerPhone: '+380501112233',
    managerEmail: 'a.vasyliev@livolo.ua',
    managerTelegram: '@livolo_b2b',
    country: 'Україна',
    city: 'Київ',
    address: 'вул. Глибочицька, 17',
    postcode: '04050',
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
    managerName: 'Олександр Коваленко',
    industry: 'Мобільні аксесуари',
    segment: 'Опт',
  },
];

export {
  mockFeedSources,
  mockAnalysis,
  constrainedFeedAnalysis,
} from '@e2e/fixtures/feeds-mock-data';
import { mockFeedSources, mockAnalysis } from '@e2e/fixtures/feeds-mock-data';

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

  const currentSuppliers = [...mockSuppliers.map((s) => ({ ...s }))];

  await page.route(/\/api\/suppliers(\?|$)/, async (route) => {
    if (route.request().method() === 'POST') {
      const payload = route.request().postDataJSON() || {};
      const newSup = {
        id: `sup_new_${Date.now()}`,
        userId: mockUser.id,
        productsCount: 0,
        activeFeedsCount: 0,
        categoriesCount: 0,
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      currentSuppliers.unshift(newSup);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newSup),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(currentSuppliers),
    });
  });

  await page.route(/\/api\/suppliers\/([^/?#]+)$/, async (route) => {
    const method = route.request().method();
    const id = route.request().url().split('/').pop()?.split('?')[0];

    if (method === 'PATCH') {
      const patch = route.request().postDataJSON() || {};
      const foundIndex = currentSuppliers.findIndex((s) => s.id === id);
      const found = foundIndex !== -1 ? currentSuppliers[foundIndex] : currentSuppliers[0];
      const updated = { ...found, ...patch };
      if (foundIndex !== -1) {
        currentSuppliers[foundIndex] = updated;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updated),
      });
      return;
    }

    if (method === 'GET') {
      const found = currentSuppliers.find((s) => s.id === id) || currentSuppliers[0];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(found),
      });
      return;
    }

    if (method === 'DELETE') {
      const foundIndex = currentSuppliers.findIndex((s) => s.id === id);
      if (foundIndex !== -1) {
        currentSuppliers.splice(foundIndex, 1);
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    await route.fallback();
  });

  await page.route('**/api/feeds/jobs/active', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
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

  await setupSupplierSyncRoutes(page);

  await page.route(
    /\/api\/feeds\/suppliers\/([^/?#]+)\/sources\/([^/?#]+)\/sync/,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          jobId: `job_${Date.now()}`,
          updatedCount: 50,
        }),
      });
    },
  );
}
