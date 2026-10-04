import type { Page } from '@playwright/test';

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

export const mockSuppliers = [
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

export async function setupProductsGridRoutes(page: Page) {
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
}
