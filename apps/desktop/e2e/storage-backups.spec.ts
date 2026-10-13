import { test, expect } from '@playwright/test';

test.describe('Desktop App — Cloud Backups & Files Browser (E2E)', () => {
  const mockUser = {
    id: 'user_e2e_storage_01',
    email: 'admin@smartfeed.studio',
    fullName: 'Олег Футорний',
    role: 'SUPER_ADMIN',
  };

  const mockActiveQuota = {
    canCloudStorage: true,
    maxStorageGb: 10,
    usedStorageBytes: 1288490188,
    availableBytes: 9448928052,
    usedPercentage: 12,
    totalFilesCount: 24,
    planType: 'PRO',
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

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    });
  });

  test('Тест 1: Вкладка «Хмарні файли R2» відображає таблицю файлів та копіювання URL', async ({
    page,
  }) => {
    const mockFiles = [
      {
        id: 'file_sample_01',
        s3Key: 'images/usr_01/canon_eos_r5.webp',
        originalName: 'canon_eos_r5.webp',
        mimeType: 'image/webp',
        sizeBytes: 524288,
        publicUrl: 'https://pub-cdn.smartfeed.studio/images/usr_01/canon_eos_r5.webp',
        status: 'ACTIVE',
        category: 'PRODUCT_IMAGE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    await page.route('**/api/storage/quota', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockActiveQuota),
      });
    });

    await page.route('**/api/storage/files*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: mockFiles,
          total: 1,
          page: 1,
          totalPages: 1,
        }),
      });
    });

    await page.goto('/cloud-sync');
    await page.locator('[data-testid="cloud-tab-files"]').click();

    // Verify file item rendered in table
    const table = page.locator('[data-testid="cloud-files-browser-tab"]');
    await expect(table).toBeVisible();
    await expect(table).toContainText('canon_eos_r5.webp');
    await expect(table).toContainText('512 KB');

    // Verify pagination is rendered
    const pagination = page.locator('[data-testid="cloud-files-pagination"]');
    await expect(pagination).toBeVisible();
  });

  test('Тест 2: Вкладка «Налаштування сховища» керує перемикачами та очищенням кешу', async ({
    page,
  }) => {
    await page.route('**/api/storage/quota', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockActiveQuota),
      });
    });

    await page.goto('/cloud-sync');
    await page.locator('[data-testid="cloud-tab-settings"]').click();

    const settingsTab = page.locator('[data-testid="storage-settings-tab"]');
    await expect(settingsTab).toBeVisible();

    // Toggle switch
    const autoSyncSwitch = page.locator('[data-testid="auto-sync-switch"]');
    await expect(autoSyncSwitch).toBeVisible();
    await autoSyncSwitch.click();

    // Clear cache button
    const clearCacheBtn = page.locator('[data-testid="clear-cache-btn"]');
    await expect(clearCacheBtn).toBeVisible();
    await clearCacheBtn.click();

    // Verify localized success toast/message appears
    await expect(settingsTab).toContainText('Локальний кеш тимчасових файлів успішно очищено');
  });

  test('Тест 3: Вкладка «Резервні копії» відображає реальний каталог та працює без технічного сленгу', async ({
    page,
  }) => {
    const mockBackupFiles = [
      {
        id: 'snapshot_01',
        s3Key: 'snapshots/usr_01/catalog_backup_sample.json',
        originalName: 'catalog_backup_sample.json',
        mimeType: 'application/json',
        sizeBytes: 1048576,
        publicUrl: 'https://pub-cdn.smartfeed.studio/snapshots/usr_01/catalog_backup_sample.json',
        status: 'ACTIVE',
        category: 'SYSTEM_BACKUP',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    await page.route('**/api/storage/quota', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockActiveQuota),
      });
    });

    await page.route('**/api/storage/files*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: mockBackupFiles,
          total: 1,
          page: 1,
          totalPages: 1,
        }),
      });
    });

    await page.goto('/cloud-sync');
    await page.locator('[data-testid="cloud-tab-backups"]').click();

    const backupsTab = page.locator('[data-testid="cloud-backups-tab"]');
    await expect(backupsTab).toBeVisible();

    // 1. Strict invariant: Zero technical developer jargon
    await expect(backupsTab).not.toContainText('SQLCipher');
    await expect(backupsTab).not.toContainText('OS Keychain');
    await expect(backupsTab).not.toContainText('бази SQLite');

    // 2. Clear business terminology present
    await expect(backupsTab).toContainText('Резервне копіювання каталогу');
    await expect(backupsTab).toContainText('Поточний каталог');
    await expect(backupsTab).toContainText('Хмарний захист');
    await expect(page.locator('[data-testid="create-snapshot-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="download-local-backup-btn"]')).toBeVisible();

    // 3. Backups history table rendered with file
    await expect(page.locator('[data-testid="backup-row-snapshot_01"]')).toBeVisible();
    await expect(backupsTab).toContainText('catalog_backup_sample.json');
    await expect(backupsTab).toContainText('1.0 MB');
  });

  test('Тест 4: Кнопка очищення сміття R2 відкриває діалог та сканує незв’язані файли', async ({
    page,
  }) => {
    await page.route('**/api/storage/quota', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockActiveQuota),
      });
    });

    await page.route('**/api/storage/files*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0, page: 1, totalPages: 0 }),
      });
    });

    let orphanPayload: any = null;
    await page.route('**/api/storage/cleanup-orphans', async (route) => {
      orphanPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          dryRun: true,
          orphanCount: 57,
          orphanSizeBytes: 422000,
          freedBytes: 0,
          deletedKeys: ['images/usr_01/1791895093188-4a0335b9-img_undefined.webp'],
        }),
      });
    });

    await page.goto('/cloud-sync');
    await page.locator('[data-testid="cloud-tab-files"]').click();

    const cleanupBtn = page.locator('[data-testid="open-orphan-cleanup-dialog-btn"]');
    await expect(cleanupBtn).toBeVisible();
    await cleanupBtn.click();

    const dialog = page.locator('[data-testid="orphan-cleanup-dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('57');
    await expect(dialog).toContainText('img_undefined.webp');

    // Verify footer button says "Закрити" (Close), NOT "Скасувати" (Cancel)
    await expect(dialog).toContainText('Закрити');
    await expect(dialog).not.toContainText('Скасувати');

    // Verify "Очистити у фоні" button exists
    const purgeInBackgroundBtn = dialog.locator('button', { hasText: 'Очистити у фоні' });
    await expect(purgeInBackgroundBtn).toBeVisible();

    expect(orphanPayload).toHaveProperty('activeKeys');
    expect(Array.isArray(orphanPayload.activeKeys)).toBe(true);

    // Click background purge: modal closes immediately without blocking user
    await purgeInBackgroundBtn.click();
    await expect(dialog).not.toBeVisible();
  });

  test('Тест 5: Реактивне оновлення StorageQuotaBar при події emitDataSync без перезавантаження сторінки', async ({
    page,
  }) => {
    let callCount = 0;
    await page.route('**/api/storage/quota', async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...mockActiveQuota,
            usedStorageBytes: 2200000,
            totalFilesCount: 58,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...mockActiveQuota,
            usedStorageBytes: 80000,
            totalFilesCount: 1,
          }),
        });
      }
    });

    await page.goto('/cloud-sync');
    const quotaBar = page.locator('[data-testid="storage-quota-bar-full"]');
    await expect(quotaBar).toBeVisible();
    await expect(quotaBar).toContainText('58 файлів у Cloudflare R2');

    // Trigger data-sync event in window
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('smartfeed:data-sync', {
          detail: { domain: 'storage', force: true },
        }),
      );
    });

    // StorageQuotaBar reactively updates to 1 file without reloading page!
    await expect(quotaBar).toContainText('1 файлів у Cloudflare R2');
  });
});
