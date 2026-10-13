import { test, expect } from '@playwright/test';

test.describe('Desktop App — Universal Page Guides & AI Assistant Header (E2E)', () => {
  const mockUser = {
    id: 'user_e2e_guides_01',
    email: 'admin@smartfeed.studio',
    fullName: 'Олег Футорний',
    role: 'SUPER_ADMIN',
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

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((user) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem('smartfeed_access_token', 'mock_token_guides');
      window.localStorage.setItem('smartfeed_refresh_token', 'mock_refresh_token');
      window.localStorage.setItem('smartfeed_user_profile', JSON.stringify(user));
      window.localStorage.setItem('smartfeed_language', 'uk');
      window.localStorage.setItem('smartfeed_theme', 'dark');
      window.localStorage.setItem('has_selected_workspace', 'true');
      window.localStorage.setItem('workspace_path', '/mock/workspace/guides');
      window.localStorage.setItem('smartfeed_workspace_path', '/mock/workspace/guides');
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

    await page.route('**/api/quotas/reconcile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          planType: 'PRO',
          canCloudStorage: true,
          maxStorageGb: 10,
          usedStorageBytes: 1000,
          availableBytes: 100000,
          usedPercentage: 1,
          totalFilesCount: 5,
        }),
      });
    });

    await page.route('**/api/storage/files*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          files: [],
          totalCount: 0,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        }),
      });
    });
  });

  test('1. Header displays route icon, page title, and [i] info guide trigger', async ({
    page,
  }) => {
    await page.goto('/');

    const routeIcon = page.locator('[data-testid="header-route-icon"]');
    await expect(routeIcon).toBeVisible();

    const guideTrigger = page.locator('[data-testid="page-header-guide-trigger"]');
    await expect(guideTrigger).toBeVisible();

    // Click [i] trigger to open modal
    await guideTrigger.click();

    const guideModal = page.locator('[data-testid="page-header-guide-modal"]');
    await expect(guideModal).toBeVisible();

    // Verify 3D AI Assistant Avatar is rendered with compact, beautiful dimensions (max 60px)
    const aiAvatar = page.locator('[data-testid="page-guide-ai-avatar"]');
    await expect(aiAvatar).toBeVisible();
    const avatarSrc = await aiAvatar.getAttribute('src');
    expect(avatarSrc).toBeTruthy();

    const box = await aiAvatar.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(60);
    expect(box!.height).toBeLessThanOrEqual(60);
    expect(box!.width).toBeGreaterThanOrEqual(40);
    expect(box!.height).toBeGreaterThanOrEqual(40);

    // Verify modal content (title, features, and pro-tip)
    await expect(guideModal).toContainText('Дашборд');
    await expect(guideModal).toContainText('Ключові можливості:');

    // Capture screenshot for visual inspection
    await page.screenshot({ path: 'test-results/page-header-guide-modal.png' });

    // Close modal
    await page.keyboard.press('Escape');
    await expect(guideModal).not.toBeVisible();
  });

  test('2. Dynamic bilingual switching updates header and AI guide modal (UA ⇄ EN)', async ({
    page,
  }) => {
    await page.goto('/cloud-sync');

    // Open guide in Ukrainian
    const guideTrigger = page.locator('[data-testid="page-header-guide-trigger"]');
    await expect(guideTrigger).toBeVisible();
    await guideTrigger.click();

    const guideModal = page.locator('[data-testid="page-header-guide-modal"]');
    await expect(guideModal).toBeVisible();
    await expect(guideModal).toContainText('Хмарна синхронізація');
    await expect(guideModal).toContainText('Ключові можливості:');

    // Close modal
    await page.keyboard.press('Escape');
    await expect(guideModal).not.toBeVisible();

    // Switch to English
    const langToggle = page.locator('[data-testid="language-toggle"]');
    await langToggle.click();

    // Reopen guide in English
    await guideTrigger.click();
    await expect(guideModal).toBeVisible();
    await expect(guideModal).toContainText('Cloud Storage');
    await expect(guideModal).toContainText('Key Capabilities:');

    await page.keyboard.press('Escape');
  });

  test('3. MediaSyncTab has removed the bulky static educational banner to save screen space', async ({
    page,
  }) => {
    await page.goto('/cloud-sync');

    await expect(page.locator('[data-testid="media-sync-tab"]')).toBeVisible();

    // Ensure the old bulky static banner is completely removed from the page body
    const oldBannerTitle = page.getByText('Як працює хмарне медіасховище Cloudflare R2');
    await expect(oldBannerTitle).not.toBeVisible();
  });

  test('4. AI Assistant Profile can be overridden from backend configuration', async ({ page }) => {
    const customAvatar = 'https://r2.smartfeed.studio/avatars/custom-ai-model.webp';
    const customName = 'Apex Super Copilot';

    await page.route('**/api/page-guides/assistant/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          name: customName,
          avatarUrl: customAvatar,
          roleUk: 'Оновлений AI Робот',
          roleEn: 'Updated AI Robot',
          badgeUk: 'PRO AI 24/7',
          badgeEn: 'PRO AI 24/7',
        }),
      });
    });

    await page.goto('/');

    const guideTrigger = page.locator('[data-testid="page-header-guide-trigger"]');
    await guideTrigger.click();

    const guideModal = page.locator('[data-testid="page-header-guide-modal"]');
    await expect(guideModal).toBeVisible();

    const aiAvatar = page.locator('[data-testid="page-guide-ai-avatar"]');
    await expect(aiAvatar).toHaveAttribute('src', customAvatar);
    await expect(guideModal).toContainText(customName);
  });
});
