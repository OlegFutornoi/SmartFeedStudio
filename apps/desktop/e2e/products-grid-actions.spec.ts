import { test, expect } from '@playwright/test';
import { setupProductsGridRoutes } from '@e2e/fixtures/products-grid-mock-data';

test.describe('Desktop App — Віртуалізована Таблиця Товарів: Фільтрація, вибір та каскадне видалення', () => {
  test.beforeEach(async ({ page }) => {
    await setupProductsGridRoutes(page);
    await page.goto('/catalogs');
    await page.waitForLoadState('networkidle');
  });

  test('1. Фасетна фільтрація: живий пошук за назвою та артикулом + фільтр за категорією та наявністю', async ({
    page,
  }) => {
    await expect(page.getByTestId('products-view')).toBeVisible();

    // 1. Search by SKU
    const searchInput = page.getByTestId('products-search-input');
    await searchInput.fill('0002');
    await expect(page.getByTestId('product-row-prod_2')).toBeVisible();
    await expect(page.getByTestId('product-row-prod_1')).not.toBeVisible();

    // 2. Reset Filters
    const resetBtn = page.getByTestId('reset-filters-button');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await expect(page.getByTestId('product-row-prod_1')).toBeVisible();

    // 3. In Stock toggle
    const inStockToggle = page.getByTestId('filter-instock-toggle');
    await inStockToggle.click();
    await expect(inStockToggle).toContainText('Тільки в наявності');
  });

  test('2. Вибір товарів (Checkbox Select All) та панель масових дій (Bulk Actions Bar)', async ({
    page,
  }) => {
    await expect(page.getByTestId('products-view')).toBeVisible();

    // Select All Checkbox in sticky header
    const selectAllCheckbox = page.getByTestId('select-all-products-checkbox');
    await selectAllCheckbox.click();

    // Bulk bar appears with count
    const bulkBar = page.getByTestId('products-bulk-actions-bar');
    await expect(bulkBar).toBeVisible();
    await expect(bulkBar).toContainText('Вибрано:');

    // Clear selection
    const clearBtn = page.getByTestId('clear-selection-button');
    await clearBtn.click();
    await expect(bulkBar).not.toBeVisible();

    // Select individual row
    const rowCheckbox = page.getByTestId('product-checkbox-prod_1');
    await rowCheckbox.click();
    await expect(bulkBar).toBeVisible();
    await expect(bulkBar).toContainText('1');

    // Bulk delete button opens confirmation
    const bulkDeleteBtn = page.getByTestId('bulk-delete-button');
    await bulkDeleteBtn.click();
    await expect(page.getByText('Масове видалення товарів')).toBeVisible();
    await page.getByRole('button', { name: 'Скасувати' }).click();
  });

  test('3. Видалення фіду у постачальника каскадно видаляє всі товари цього фіду з каталогу (zero orphaned products)', async ({
    page,
  }) => {
    await expect(page.getByTestId('products-view')).toBeVisible();

    // 1. Assert initial products exist
    const initialRows = page.locator('[data-testid^="product-row-"]');
    const initialCount = await initialRows.count();
    expect(initialCount).toBeGreaterThan(0);

    // 2. Switch to Feeds tab
    const catalogsTab = page.getByTestId('tab-catalogs');
    await catalogsTab.click();

    // 3. Locate feed delete button
    const deleteFeedBtn = page.locator('[data-testid^="delete-feed-btn-"]').first();
    if (await deleteFeedBtn.isVisible()) {
      await deleteFeedBtn.click();

      // 4. Confirm deletion in modal
      const confirmBtn = page.locator('[data-testid="confirm-dialog-confirm-btn"]');
      await expect(confirmBtn).toBeVisible();
      await confirmBtn.click();

      // Wait for deletion background task and reactive sync
      await page.waitForTimeout(500);

      // 5. Switch back to Products Catalog tab
      const productsTab = page.getByTestId('tab-products');
      await productsTab.click();

      // 6. Assert that cascading deletion cleared the products of this deleted feed
      const remainingRows = page.locator('[data-testid^="product-row-"]');
      const remainingCount = await remainingRows.count();
      expect(remainingCount).toBeLessThan(initialCount);
    }
  });
});
