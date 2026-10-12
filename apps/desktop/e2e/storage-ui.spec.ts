import { test, expect } from '@playwright/test';

test.describe('Desktop App — Cloudflare R2 Storage & Media UI (E2E)', () => {
  const mockUser = {
    id: 'user_e2e_storage_01',
    email: 'admin@smartfeed.studio',
    fullName: 'Олег Футорний',
    role: 'SUPER_ADMIN',
  };

  const mockLicense = {
    id: 'lic-pro-1',
    userId: mockUser.id,
    planType: 'PRO',
    isActive: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isExpired: false,
    daysRemaining: 30,
  };

  const mockNavigationItems = [
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
      id: 'item-cloud',
      key: 'cloud_sync',
      labelUk: 'Хмарна синхронізація',
      labelEn: 'Cloud Sync',
      path: '/cloud-sync',
      icon: 'Cloud',
      order: 2,
      isVisible: true,
      requiredRoles: ['USER', 'ADMIN', 'SUPER_ADMIN'],
      requiredPlan: null,
      targetApp: 'DESKTOP',
    },
  ];

  const mockActiveQuota = {
    canCloudStorage: true,
    maxStorageGb: 10,
    usedStorageBytes: 1288490188, // ~1.2 GB
    availableBytes: 9448928052, // ~8.8 GB
    usedPercentage: 12,
    totalFilesCount: 24,
    planType: 'PRO',
  };

  const mockStarterQuota = {
    canCloudStorage: false,
    maxStorageGb: 0,
    usedStorageBytes: 0,
    availableBytes: 0,
    usedPercentage: 0,
    totalFilesCount: 0,
    planType: 'STARTER',
  };

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((user) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem('smartfeed_access_token', 'mock_token_storage');
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

    await page.route('**/api/licenses/my*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLicense),
      });
    });

    await page.route('**/api/organizations*', async (route) => {
      if (route.request().url().includes('/src/')) return route.continue();
      await route.fulfill({ status: 200, json: [] });
    });
  });

  test('Тест 1: Рендеринг віджету квоти у CloudSyncPage та дедуплікація запитів (requestCount === 1)', async ({
    page,
  }) => {
    let quotaRequests = 0;

    await page.route('**/api/storage/quota', async (route) => {
      quotaRequests++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockActiveQuota),
      });
    });

    await page.goto('/cloud-sync');

    // 1. Verify CloudSyncPage and StorageQuotaBar are visible
    const quotaWidget = page.locator('[data-testid="storage-quota-bar-full"]');
    await expect(quotaWidget).toBeVisible();

    // 2. Verify live metrics from Cloudflare R2 are rendered (not hardcoded 1.4 GB)
    await expect(quotaWidget).toContainText('1.2 GB');
    await expect(quotaWidget).toContainText('10 GB');
    await expect(quotaWidget).toContainText('12%');
    await expect(quotaWidget).toContainText('24 файлів у Cloudflare R2');

    // 3. Verify single network request guarantee (Zero Duplicate Requests per frontend_network_dedup.md)
    expect(quotaRequests).toBe(1);
  });

  test('Тест 2: Поява діалогу апгрейду при відсутності квоти (Starter 0 GB)', async ({ page }) => {
    await page.route('**/api/storage/quota', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStarterQuota),
      });
    });

    await page.goto('/cloud-sync');

    // 1. Verify Upgrade button is visible for Starter plan
    const upgradeBtn = page.locator('[data-testid="full-upgrade-btn"]');
    await expect(upgradeBtn).toBeVisible();
    await upgradeBtn.click();

    // 2. Verify UpgradeStoragePromptDialog is displayed
    const dialog = page.locator('[data-testid="upgrade-storage-dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Потрібен тариф з хмарним сховищем');
    await expect(dialog).toContainText('PRO (10 GB)');

    // 3. Click Upgrade Now -> Navigates to /plans
    const confirmBtn = page.locator('[data-testid="upgrade-storage-confirm-btn"]');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    await expect(page).toHaveURL(/.*\/plans/);
  });

  test('Тест 3: 100% Двомовний динамічний переклад UA ⇄ EN', async ({ page }) => {
    await page.route('**/api/storage/quota', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockActiveQuota),
      });
    });

    // 1. Initial Ukrainian load
    await page.goto('/cloud-sync');
    const quotaWidget = page.locator('[data-testid="storage-quota-bar-full"]');
    await expect(quotaWidget).toBeVisible();
    await expect(quotaWidget).toContainText('Використання хмарного сховища');
    await expect(quotaWidget).toContainText('файлів у Cloudflare R2');

    // 2. Switch to English locale via dynamic LanguageToggle
    const langToggle = page.locator('[data-testid="language-toggle"]');
    await expect(langToggle).toBeVisible();
    await langToggle.click();

    // 3. Verify English copy
    await expect(quotaWidget).toBeVisible();
    await expect(quotaWidget).toContainText('Cloud Storage Usage');
    await expect(quotaWidget).toContainText('files in Cloudflare R2');
  });
});
