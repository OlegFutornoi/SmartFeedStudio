import { test, expect } from '@playwright/test';
import {
  mockExcessQuotas,
  mockFeedSources,
  setupQuotaReconciliationRoutes,
} from '@e2e/fixtures/quota-reconciliation-mock-data';

test.describe('Desktop App — Узгодження Надлишку Даних при Зниженні Тарифу (Downgrade Reconciliation)', () => {
  test.beforeEach(async ({ page }) => {
    await setupQuotaReconciliationRoutes(page);
  });

  test('відображає QuotaExcessBanner коли ліміти тарифу перевищено та відкриває діалог узгодження', async ({
    page,
  }) => {
    await page.goto('/suppliers');

    // 1. Verify Quota Excess Banner is visible
    const excessBanner = page.locator('[data-testid="quota-excess-banner"]');
    await expect(excessBanner).toBeVisible();
    await expect(excessBanner).toContainText('Перевищено ліміти тарифного плану');

    // 2. Click "Очистити надлишок" button
    const openBtn = page.locator('[data-testid="open-reconciliation-btn"]');
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    // 3. Verify Quota Reconciliation Dialog is open
    const dialog = page.locator('[data-testid="quota-reconciliation-dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Узгодження лімітів тарифного плану');
    await expect(dialog).toContainText(/5[, ]?102/);

    // 4. Verify categories are loaded in the checklist
    await expect(dialog).toContainText('Чохли для телефонів');
    await expect(dialog).toContainText(/4[, ]?200\s*SKU/);
    await expect(dialog).toContainText('Кабелі та адаптери');
    await expect(dialog).toContainText(/902\s*SKU/);

    // 5. Select "Чохли для телефонів" category to delete
    const categoryRow = dialog.locator('tr:has-text("Чохли для телефонів")');
    await categoryRow.click();

    // Verify dynamic live projection: 4,200 selected, 902 remaining (<= 1,000 max SKU -> Valid)
    await expect(dialog).toContainText(/4[, ]?200\s*SKU/);
    await expect(dialog).toContainText(/902\s*\/\s*1[, ]?000\s*SKU/);

    // 6. Mock bulk delete endpoint
    await page.route('**/api/products/bulk-delete', (route) =>
      route.fulfill({
        status: 200,
        json: {
          deletedCount: 4200,
          remainingCount: 902,
          message: 'Успішно видалено 4200 товарів',
        },
      }),
    );

    // Mock updated quotas within limit
    await page.route('**/api/licenses/quotas', (route) =>
      route.fulfill({
        status: 200,
        json: {
          ...mockExcessQuotas,
          products: {
            used: 902,
            max: 1000,
            isUnlimited: false,
            percentUsed: 90,
            isExceeded: false,
            remaining: 98,
          },
          feeds: {
            used: 1,
            max: 1,
            isUnlimited: false,
            percentUsed: 100,
            isExceeded: false,
            remaining: 0,
          },
        },
      }),
    );

    // Click delete button
    const deleteBtn = dialog.locator('[data-testid="delete-selected-categories-btn"]');
    await expect(deleteBtn).toBeEnabled();
    await deleteBtn.click();

    // Verify success feedback
    await expect(dialog).toContainText('Успішно видалено');

    // Close dialog
    const closeBtn = dialog.locator('[data-testid="close-reconciliation-dialog-btn"]');
    await closeBtn.click();
    await expect(dialog).not.toBeVisible();
  });

  test('вкладка фідів джерел: лаконічне відображення без дублювання URL та видалення через іконку-смітник', async ({
    page,
  }) => {
    await page.goto('/suppliers');

    // Open reconciliation dialog
    await page.locator('[data-testid="open-reconciliation-btn"]').click();
    const dialog = page.locator('[data-testid="quota-reconciliation-dialog"]');
    await expect(dialog).toBeVisible();

    // Switch to Feeds tab
    const feedsTab = dialog.locator('[data-testid="tab-feeds-reconciliation"]');
    await feedsTab.click();

    // Verify feeds are displayed concisely with format badges
    await expect(dialog).toContainText('Прайс Чохли (Основний)');
    await expect(dialog).toContainText('YML_PROM');
    await expect(dialog).toContainText('Прайс Кабелі');
    await expect(dialog).toContainText('XML_ROZETKA');

    // Verify delete feed button is an icon button
    const deleteFeedBtn = dialog.locator('[data-testid="delete-feed-btn-feed_1"]');
    await expect(deleteFeedBtn).toBeVisible();

    // Mock delete feed endpoint
    await page.route('**/api/feeds/suppliers/sup_mmm_1/sources/feed_1*', (route) =>
      route.fulfill({
        status: 200,
        json: { success: true, deletedProductsCount: 4200 },
      }),
    );

    // Mock updated feed sources after delete
    await page.route('**/api/feeds/suppliers/sup_mmm_1/sources', (route) =>
      route.fulfill({
        status: 200,
        json: [mockFeedSources[1]],
      }),
    );

    await deleteFeedBtn.click();
    await expect(dialog).toContainText('Фід успішно видалено');
  });

  test('вкладка постачальників: компактний список з іконкою видалення постачальника', async ({
    page,
  }) => {
    await page.goto('/suppliers');

    // Open reconciliation dialog
    await page.locator('[data-testid="open-reconciliation-btn"]').click();
    const dialog = page.locator('[data-testid="quota-reconciliation-dialog"]');
    await expect(dialog).toBeVisible();

    // Switch to Suppliers tab
    const suppsTab = dialog.locator('[data-testid="tab-suppliers-reconciliation"]');
    await suppsTab.click();

    // Verify supplier row
    await expect(dialog).toContainText('MMM');
    await expect(dialog).toContainText('M-01');

    // Verify delete supplier button is an icon button
    const deleteSupBtn = dialog.locator('[data-testid="delete-supplier-btn-sup_mmm_1"]');
    await expect(deleteSupBtn).toBeVisible();

    // Mock delete supplier endpoint
    await page.route('**/api/suppliers/sup_mmm_1', (route) =>
      route.fulfill({
        status: 200,
        json: { success: true },
      }),
    );

    // Mock updated suppliers after delete
    await page.route('**/api/suppliers', (route) =>
      route.fulfill({
        status: 200,
        json: [],
      }),
    );

    await deleteSupBtn.click();
    await expect(dialog).toContainText('Постачальника та всі його товари видалено');
  });

  test('неблокуюче видалення у фоні: відображення глобального прогрес-бару та можливість закрити діалог', async ({
    page,
  }) => {
    await page.goto('/suppliers');

    // Open reconciliation dialog
    await page.locator('[data-testid="open-reconciliation-btn"]').click();
    const dialog = page.locator('[data-testid="quota-reconciliation-dialog"]');
    await expect(dialog).toBeVisible();

    // Select category to delete
    const selectAllBtn = dialog.locator('button:has-text("Обрати всі")');
    await selectAllBtn.click();

    // Delay the bulk delete response slightly to observe background job widget
    await page.route('**/api/products/bulk', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        json: { deletedCount: 5102, remainingCount: 0 },
      });
    });

    // Mock post-delete data
    await page.route('**/api/products/categories-summary', (route) =>
      route.fulfill({
        status: 200,
        json: [],
      }),
    );

    // Click delete
    const deleteBtn = dialog.locator('[data-testid="delete-selected-categories-btn"]');
    await deleteBtn.click();

    // Verify global progress bar is visible and shows background task
    const globalProgressBar = page.locator('[data-testid="global-job-progress-bar"]');
    await expect(globalProgressBar).toBeVisible();
    await expect(globalProgressBar).toContainText('Видалення');

    // Verify dialog can be closed immediately without blocking
    const closeBtn = dialog.locator('[data-testid="close-reconciliation-dialog-btn"]');
    await closeBtn.click();
    await expect(dialog).not.toBeVisible();

    // Global progress bar remains visible and handles completion
    await expect(globalProgressBar).toBeVisible();
  });
});
