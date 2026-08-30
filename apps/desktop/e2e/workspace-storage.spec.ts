import { test, expect } from '@playwright/test';

test.describe('Desktop App — Локальна зашифрована база даних (SQLCipher), вибір робочої папки (Onboarding) та налаштування сховища', () => {
  const mockUser = {
    id: 'usr-storage-test',
    email: 'storagetest@smartfeed.studio',
    fullName: 'Storage Test User',
    role: 'USER',
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

  test.beforeEach(async ({ page }) => {
    // 100% test isolation & clean storage
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

    // Storage Workspace API Routes
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
  });

  test('1. Новий користувач бачить Onboarding модалку вибору папки при першому вході', async ({
    page,
  }) => {
    // Встановлюємо прапорець першого запуску перед відкриттям сторінки
    await page.addInitScript(() => {
      window.localStorage.setItem('smartfeed_show_workspace_onboarding', 'true');
      window.localStorage.setItem('smartfeed_workspace_initialized', 'false');
    });

    await page.goto('/');

    const dialog = page.getByTestId('first-run-workspace-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Налаштування локальної бази даних');
    await expect(dialog).toContainText('Структура робочої області:');
    await expect(dialog).toContainText('database/catalog.db');
    await expect(dialog).toContainText('OS Keychain');

    // Клікаємо кнопку створення та ініціалізації
    const initBtn = page.getByTestId('init-workspace-btn');
    await expect(initBtn).toBeVisible();
    await initBtn.click();

    // Діалог закривається
    await expect(dialog).not.toBeVisible();
  });

  test('2. Вибір власної кастомної папки у майстрі ініціалізації', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('smartfeed_show_workspace_onboarding', 'true');
      window.localStorage.setItem('smartfeed_workspace_initialized', 'false');
    });

    await page.goto('/');

    const dialog = page.getByTestId('first-run-workspace-dialog');
    await expect(dialog).toBeVisible();

    // Обираємо кастомний варіант
    await dialog.getByText('Вказати іншу папку').click();
    const customInput = page.getByTestId('custom-workspace-input');
    await expect(customInput).toBeVisible();
    await customInput.fill('/Users/oleg/MyCustomFeedsFolder');

    await page.getByTestId('init-workspace-btn').click();
    await expect(dialog).not.toBeVisible();

    // Переходимо в налаштування через сайдбар та перевіряємо збережений шлях
    await page.locator('a[href="/settings"]').first().click();
    await page.getByTestId('storage-tab-btn').click();
    await expect(page.getByTestId('active-workspace-path')).toHaveText(
      '/Users/oleg/MyCustomFeedsFolder',
    );
  });

  test('3. Вкладка "База даних та сховище" в Налаштуваннях: метрики, шифрування та операції', async ({
    page,
  }) => {
    await page.goto('/settings');
    await expect(page.getByTestId('settings-page')).toBeVisible();

    // Перемикаємо на вкладку сховища
    const storageTabBtn = page.getByTestId('storage-tab-btn');
    await expect(storageTabBtn).toBeVisible();
    await storageTabBtn.click();

    const storageTab = page.getByTestId('settings-storage-tab');
    await expect(storageTab).toBeVisible();
    await expect(storageTab).toContainText('База даних та сховище');
    await expect(storageTab).toContainText('Шифрування SQLCipher AES-256');

    // Перевіряємо картки метрик дискового простору
    await expect(page.getByTestId('total-storage-size')).toBeVisible();
    await expect(page.getByTestId('db-storage-size')).toBeVisible();
    await expect(page.getByTestId('feeds-storage-size')).toBeVisible();
    await expect(page.getByTestId('exports-storage-size')).toBeVisible();
    await expect(page.getByTestId('backups-storage-size')).toBeVisible();

    // Перевіряємо локальні лічильники товарів та постачальників
    await expect(page.getByTestId('local-products-count')).toHaveText('1450');
    await expect(page.getByTestId('local-suppliers-count')).toHaveText('2');
    await expect(page.getByTestId('local-feeds-count')).toHaveText('2');

    // 1. Тест створення резервної копії
    await page.getByTestId('create-backup-btn').click();
    const successAlert = page.getByTestId('storage-action-success-alert');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('Резервну копію успішно створено');

    // 2. Тест оптимізації бази (Vacuum)
    await page.getByTestId('vacuum-db-btn').click();
    await expect(successAlert).toContainText('Базу даних дефрагментовано та оптимізовано (VACUUM)');

    // 3. Тест очищення кешу
    await page.getByTestId('clear-cache-btn').click();
    await expect(successAlert).toContainText('Кеш тимчасових фідів успішно очищено');
  });

  test('4. Перенесення/зміна робочої папки через модальний діалог', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('storage-tab-btn').click();

    // Відкриваємо діалог міграції
    await page.getByTestId('change-workspace-btn').click();
    const migrateModal = page.getByTestId('migrate-workspace-dialog');
    await expect(migrateModal).toBeVisible();
    await expect(migrateModal).toContainText('Зміна робочої папки');

    const input = page.getByTestId('new-workspace-input');
    await input.fill('/Users/oleg/NewSmartFeedLocation');

    await page.getByTestId('confirm-migrate-btn').click();
    await expect(migrateModal).not.toBeVisible();

    // Шлях оновився
    await expect(page.getByTestId('active-workspace-path')).toHaveText(
      '/Users/oleg/NewSmartFeedLocation',
    );
  });

  test('5. Двомовність UI (UA ⇄ EN) для розділу локального сховища та налаштувань', async ({
    page,
  }) => {
    await page.goto('/settings');
    await page.getByTestId('storage-tab-btn').click();

    await expect(page.getByTestId('settings-storage-tab')).toContainText('База даних та сховище');
    await expect(page.getByTestId('create-backup-btn')).toContainText('Створити резервну копію');

    // Перемикаємо мову на EN через перемикач у шапці
    const langToggle = page.getByTestId('language-toggle');
    await expect(langToggle).toBeVisible();
    await langToggle.click();

    await expect(page.getByTestId('settings-storage-tab')).toContainText('Database & Storage');
    await expect(page.getByTestId('create-backup-btn')).toContainText('Create Backup');
    await expect(page.getByTestId('vacuum-db-btn')).toContainText('Optimize Database');
    await expect(page.getByTestId('clear-cache-btn')).toContainText('Clear Feed Cache');
    await expect(page.getByTestId('change-workspace-btn')).toContainText('Change Folder');
    await expect(page.getByTestId('open-explorer-btn')).toContainText('Open in Explorer');
  });
});
