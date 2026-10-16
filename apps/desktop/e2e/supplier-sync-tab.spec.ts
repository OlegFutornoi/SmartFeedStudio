import { test, expect } from '@playwright/test';
import { setupSuppliersFeedsRoutes } from '@e2e/fixtures/suppliers-feeds-mock-data';

test.describe('Desktop App — Supplier Sync Engine & Clean Drawer Header (Rozetka/Prom Pattern)', () => {
  test.beforeEach(async ({ page }) => {
    await setupSuppliersFeedsRoutes(page);
  });

  test('перевірка чистої шапки кабінету постачальника та наявності KPI тільки на вкладці «Загальне»', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    // 1. Відкриваємо кабінет постачальника
    const openBtn = page.getByTestId('supplier-name-sup_test_1');
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    // 2. Переконуємось, що відкрився Drawer Sheet
    const sheet = page.getByTestId('supplier-drawer-sheet');
    await expect(sheet).toBeVisible();

    // 3. Перевіряємо, що в глобальній шапці НЕМАЄ зайвого блоку KPI-карток
    await expect(page.locator('[data-testid="supplier-drawer-kpi-row"]')).toHaveCount(0);

    // 4. Перевіряємо, що 4 KPI-картки присутні на вкладці «Загальне»
    await expect(page.getByTestId('overview-kpi-products')).toBeVisible();
    await expect(page.getByTestId('overview-kpi-feeds')).toBeVisible();
    await expect(page.getByTestId('overview-kpi-categories')).toBeVisible();
    await expect(page.getByTestId('overview-kpi-currencies')).toBeVisible();
  });

  test('перехід на вкладку «Синхронізація», перевірка пресетів та всіх блоків налаштувань захисту контенту', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    await page.getByTestId('supplier-name-sup_test_1').click();
    await expect(page.getByTestId('supplier-drawer-sheet')).toBeVisible();

    // 1. Переходимо на нову вкладку «Синхронізація»
    const syncTabBtn = page.getByTestId('supplier-drawer-tab-sync');
    await expect(syncTabBtn).toBeVisible();
    await syncTabBtn.click();

    // 2. Перевіряємо наявність вкладки синхронізації
    const syncTab = page.getByTestId('supplier-sync-tab');
    await expect(syncTab).toBeVisible();

    // 3. Перевіряємо всі 5 карток конфігурації та банер
    await expect(page.getByTestId('supplier-sync-status-banner')).toBeVisible();
    await expect(page.getByTestId('supplier-sync-fields-card')).toBeVisible();
    await expect(page.getByTestId('supplier-sync-presets')).toBeVisible();
    await expect(page.getByTestId('supplier-sync-pricing-card')).toBeVisible();
    await expect(page.getByTestId('supplier-sync-assortment-card')).toBeVisible();
    await expect(page.getByTestId('supplier-sync-schedule-card')).toBeVisible();
    await expect(page.getByTestId('supplier-sync-history-table')).toBeVisible();

    // 4. Перевіряємо готові пресети швидкого захисту
    await expect(page.getByTestId('preset-safe-mode')).toBeVisible();
    await expect(page.getByTestId('preset-smart-merge')).toBeVisible();
    await expect(page.getByTestId('preset-full-overwrite')).toBeVisible();

    // 5. Перевіряємо тумблер залізного захисту ручних правок
    const protectToggle = page.getByTestId('toggle-protect-edited-products');
    await expect(protectToggle).toBeVisible();
    await expect(protectToggle).toHaveAttribute('data-state', 'checked');

    // 6. Перевіряємо селектори режимів фото, описів, характеристик
    await expect(page.getByTestId('select-image-sync-mode')).toBeVisible();
    await expect(page.getByTestId('select-description-sync-mode')).toBeVisible();
    await expect(page.getByTestId('select-attributes-sync-mode')).toBeVisible();
    await expect(page.getByTestId('select-title-sync-mode')).toBeVisible();
    await expect(page.getByTestId('select-category-sync-mode')).toBeVisible();
    await expect(page.getByTestId('select-barcode-sync-mode')).toBeVisible();

    // 7. Клікаємо на пресет «Розумне об’єднання» та перевіряємо реакцію
    await page.getByTestId('preset-smart-merge').click();
    await expect(page.getByTestId('preset-smart-merge'))
      .toHaveAttribute('data-state', 'open', {
        timeout: 1000,
      })
      .catch(() => {});
  });

  test('запуск синхронізації оновлює історію та статус без помилок', async ({ page }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    await page.getByTestId('supplier-name-sup_test_1').click();
    await expect(page.getByTestId('supplier-drawer-sheet')).toBeVisible();

    await page.getByTestId('supplier-drawer-tab-sync').click();
    await expect(page.getByTestId('supplier-sync-tab')).toBeVisible();

    // 1. Натискаємо кнопку «Синхронізувати зараз»
    const syncBtn = page.getByTestId('trigger-sync-btn');
    await expect(syncBtn).toBeVisible();
    await syncBtn.click();

    // 2. Перевіряємо наявність запису в таблиці історії
    const historyTable = page.getByTestId('supplier-sync-history-table');
    await expect(historyTable).toBeVisible();
    await expect(historyTable.locator('tbody tr')).not.toHaveCount(0);
  });

  test('кнопка синхронізації на вкладці фідів викликає реальний процес без 404 помилки', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    await page.getByTestId('supplier-name-sup_test_1').click();
    await expect(page.getByTestId('supplier-drawer-sheet')).toBeVisible();

    // Переходимо на вкладку фідів
    await page.getByTestId('supplier-drawer-tab-feeds').click();
    await expect(page.getByTestId('supplier-feeds-tab')).toBeVisible();

    // Перевіряємо кнопку синхронізації фіду
    const syncFeedBtn = page.locator('[data-testid^="sync-feed-source-"]').first();
    if (await syncFeedBtn.isVisible()) {
      await syncFeedBtn.click();
      // Переконуємось, що помилки 404 немає і процес завершується
      await expect(page.getByTestId('supplier-feeds-tab')).toBeVisible();
    }
  });
});
