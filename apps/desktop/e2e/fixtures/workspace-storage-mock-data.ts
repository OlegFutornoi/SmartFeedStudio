import type { Page } from '@playwright/test';

export const mockUser = {
  id: 'usr-storage-test',
  email: 'storagetest@smartfeed.studio',
  fullName: 'Storage Test User',
  role: 'USER',
};

export const mockNavigationItems = [
  {
    id: 'item-dashboard',
    key: 'dashboard',
    labelUk: 'Дашборд',
    labelEn: 'Dashboard',
    path: '/',
    icon: 'LayoutDashboard',
    order: 1,
    isVisible: true,
    requiredRoles: ['USER', 'ADMIN', 'SUPER_ADMIN'],
    requiredPlan: null,
    targetApp: 'DESKTOP',
  },
  {
    id: 'item-settings',
    key: 'settings',
    labelUk: 'Налаштування',
    labelEn: 'Settings',
    path: '/settings',
    icon: 'Settings',
    order: 2,
    isVisible: true,
    requiredRoles: ['USER', 'ADMIN', 'SUPER_ADMIN'],
    requiredPlan: null,
    targetApp: 'DESKTOP',
  },
];

export async function setupWorkspaceStorageRoutes(page: Page) {
  await page.addInitScript((user) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('smartfeed_access_token', 'mock-valid-token');
    window.localStorage.setItem('smartfeed_user_profile', JSON.stringify(user));
    window.localStorage.setItem('smartfeed_language', 'uk');
  }, mockUser);

  await page.route('**/api/navigation*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockNavigationItems),
    });
  });

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
      body: JSON.stringify({
        id: 'lic-1',
        userId: mockUser.id,
        planType: 'STARTER',
        canCloudBackup: false,
        maxXmlLimit: 500,
        aiCredits: 0,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isExpired: false,
        daysRemaining: 7,
      }),
    });
  });

  await page.route('**/api/organizations*', async (route) => {
    if (route.request().url().includes('/src/')) return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'org-1',
          name: 'SmartFeed Org',
          ownerId: mockUser.id,
          activePlan: 'STARTER',
          maxTeamSeats: 1,
          usedTeamSeats: 1,
          currentUserRole: 'OWNER',
          members: [],
        },
      ]),
    });
  });

  await page.route('**/api/licenses/my-license', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'lic-1',
        userId: mockUser.id,
        planType: 'STARTER',
        canCloudBackup: false,
        maxXmlLimit: 500,
        aiCredits: 0,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isExpired: false,
        daysRemaining: 7,
      }),
    });
  });

  await page.route('**/api/licenses/quotas', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        planCode: 'STARTER',
        planNameUk: 'Старт',
        planNameEn: 'Starter',
        suppliersCount: 2,
        maxSuppliersLimit: 3,
        feedsCount: 2,
        maxFeedsLimit: 5,
        totalSkuCount: 1450,
        maxSkuLimit: 5000,
        usedTeamSeats: 1,
        maxTeamSeats: 1,
        isBlocked: false,
      }),
    });
  });

  await page.route('**/api/background-jobs/active', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/api/storage/workspace/default-path', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ defaultPath: '/Users/oleg/Documents/SmartFeedStudioData' }),
    });
  });

  await page.route('**/api/storage/workspace/info*', async (route) => {
    const url = route.request().url();
    const customPath = url.includes('path=')
      ? decodeURIComponent(url.split('path=')[1])
      : '/Users/oleg/Documents/SmartFeedStudioData';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        workspacePath: customPath,
        isInitialized: true,
        databasePath: `${customPath}/database/catalog.db`,
        isEncrypted: true,
        encryptionAlgorithm: 'SQLCipher-AES256',
        createdAt: new Date().toISOString(),
      }),
    });
  });

  await page.route('**/api/storage/workspace/stats*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        databaseSizeBytes: 14_850_000,
        feedsSizeBytes: 42_300_000,
        exportsSizeBytes: 8_200_000,
        backupsSizeBytes: 29_700_000,
        logsSizeBytes: 1_120_000,
        totalSizeBytes: 96_170_000,
        availableDiskSpaceBytes: 120_000_000_000,
        productsCount: 1450,
        suppliersCount: 2,
        feedsCount: 2,
      }),
    });
  });

  await page.route('**/api/storage/workspace/init', async (route) => {
    const body = route.request().postDataJSON() || {};
    const targetPath = body.workspacePath || '/Users/oleg/Documents/SmartFeedStudioData';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        workspacePath: targetPath,
        isInitialized: true,
        databasePath: `${targetPath}/database/catalog.db`,
        isEncrypted: true,
        encryptionAlgorithm: 'SQLCipher-AES256',
        createdAt: new Date().toISOString(),
      }),
    });
  });

  await page.route('**/api/storage/workspace/backup', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        backupPath:
          '/Users/oleg/Documents/SmartFeedStudioData/backups/backup_catalog_1788035000.sfdb',
        createdAt: new Date().toISOString(),
      }),
    });
  });

  await page.route('**/api/storage/workspace/maintenance', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        integrityOk: true,
        bytesFreed: 2_450_000,
        message: 'Базу даних дефрагментовано та оптимізовано (VACUUM)',
        timestamp: new Date().toISOString(),
      }),
    });
  });

  await page.route('**/api/storage/workspace/clear-cache', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        bytesFreed: 42_300_000,
        filesRemoved: 4,
      }),
    });
  });

  await page.route('**/api/storage/workspace/open', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/api/storage/workspace/migrate', async (route) => {
    const body = route.request().postDataJSON() || {};
    const newPath = body.newPath || '/Users/oleg/NewSmartFeedLocation';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        workspacePath: newPath,
        isInitialized: true,
        databasePath: `${newPath}/database/catalog.db`,
        isEncrypted: true,
        encryptionAlgorithm: 'SQLCipher-AES256',
        createdAt: new Date().toISOString(),
      }),
    });
  });
}
