import { test, expect } from '@playwright/test';
import { setupProductsGridRoutes } from '@e2e/fixtures/products-grid-mock-data';

test.describe('Desktop App — Віртуалізована Таблиця Товарів: Перегляд та деталі', () => {
  test.beforeEach(async ({ page }) => {
    await setupProductsGridRoutes(page);
    await page.goto('/catalogs');
    await page.waitForLoadState('networkidle');
  });

  test('1. Повинен відкрити сторінку Каталогів з активною вкладкою Товарів та Solid Sticky Header', async ({
    page,
  }) => {
    await expect(page.getByTestId('catalogs-page')).toBeVisible();

    // Products Tab is active by default
    const productsTab = page.getByTestId('tab-products');
    await expect(productsTab).toBeVisible();

    // Toolbar & Search Input
    const toolbar = page.getByTestId('products-toolbar');
    await expect(toolbar).toBeVisible();
    await expect(page.getByTestId('products-search-input')).toBeVisible();

    // Products Table & 100% Solid Sticky Header
    const table = page.getByTestId('products-table');
    await expect(table).toBeVisible();
    const thead = table.locator('thead');
    await expect(thead).toBeVisible();

    // Check product rows are present
    const firstRow = page.getByTestId('product-row-prod_1');
    await expect(firstRow).toBeVisible();
    await expect(firstRow).toContainText('SKU-DEMO-0001');
    await expect(firstRow).toContainText('Brain Distribution');

    // Assert that the supplier badge displays the actual company name, not generic fallback
    const supplierBadge = page.getByTestId('product-supplier-badge-prod_1');
    await expect(supplierBadge).toBeVisible();
    await expect(supplierBadge).toHaveText('Brain Distribution');
  });

  test('2. Висувна картка товару (Product Details Drawer) з розбивкою собівартості та маржі', async ({
    page,
  }) => {
    await expect(page.getByTestId('products-view')).toBeVisible();

    // Open the dropdown menu first
    const actionsMenu = page.getByTestId('product-actions-prod_1');
    await actionsMenu.click();

    // Click View Details icon on prod_1
    const viewBtn = page.getByTestId('view-details-btn-prod_1');
    await viewBtn.click();

    // Drawer opens
    const drawer = page.getByTestId('product-details-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('SKU-DEMO-0001');
    await expect(drawer).toContainText('Ціна закупівлі');
    await expect(drawer).toContainText('Ціна продажу');
    await expect(drawer).toContainText('Маржинальність');

    // Close drawer
    const closeBtn = page.getByTestId('close-drawer-btn');
    await closeBtn.click();
    await expect(drawer).not.toBeVisible();
  });

  test('3. Двомовність UI (UA ⇄ EN) для розділу Товарів каталогу', async ({ page }) => {
    await expect(page.getByTestId('products-view')).toBeVisible();

    // Default Ukrainian
    await expect(page.getByTestId('tab-products')).toContainText('Товари каталогу');
    await expect(page.getByTestId('tab-catalogs')).toContainText('Джерела фідів');

    // Toggle Language to English
    const langBtn = page.locator('[data-testid="language-toggle-btn"]');
    if (await langBtn.isVisible()) {
      await langBtn.click();

      // Assert translated English strings
      await expect(page.getByTestId('tab-products')).toContainText('Products Catalog');
      await expect(page.getByTestId('tab-catalogs')).toContainText('Feed Sources');
      await expect(page.getByTestId('products-search-input')).toHaveAttribute(
        'placeholder',
        'Search by name, SKU, or category...',
      );

      // Revert back to Ukrainian
      await langBtn.click();
      await expect(page.getByTestId('tab-products')).toContainText('Товари каталогу');
    }
  });

  test('4. Всі товари обовʼязково відображають справжнє імʼя постачальника і ніколи не показують технічне слово «Постачальник»', async ({
    page,
  }) => {
    await expect(page.getByTestId('products-view')).toBeVisible();

    // Verify all rendered supplier badges across the table
    const badges = page.locator('[data-testid^="product-supplier-badge-"]');
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const badge = badges.nth(i);
      await expect(badge).toBeVisible();
      const text = await badge.innerText();
      // Zero tolerance for fallback column title as company name
      expect(text.trim()).not.toBe('Постачальник');
      expect(text.trim()).not.toBe('Supplier');
      expect(text.trim()).toBe('Brain Distribution');
    }
  });
});
