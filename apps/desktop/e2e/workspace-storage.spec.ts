import { test, expect } from '@playwright/test';
import { setupWorkspaceStorageRoutes } from '@e2e/fixtures/workspace-storage-mock-data';

test.describe('Desktop App — Локальна зашифрована база даних (SQLCipher), вибір робочої папки (Onboarding) та налаштування сховища', () => {
  test.beforeEach(async ({ page }) => {
    await setupWorkspaceStorageRoutes(page);
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

  test('6. Існуючий користувач з діючою ліцензією при видаленій папці сховища бачить діалог вибору папки', async ({
    page,
  }) => {
    // Симулюємо ситуацію: перевірка сховища на диску повертає null (папка/база була видалена)
    await page.route('**/api/storage/workspace/info*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.goto('/');

    const dialog = page.getByTestId('first-run-workspace-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Налаштування локальної бази даних');

    // Клік на ініціалізацію створює структуру та закриває діалог
    const initBtn = page.getByTestId('init-workspace-btn');
    await expect(initBtn).toBeVisible();
    await initBtn.click();

    await expect(dialog).not.toBeVisible();
  });
});
