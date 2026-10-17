import { test, expect } from '@playwright/test';
import { setupSuppliersFeedsRoutes } from '@e2e/fixtures/suppliers-feeds-mock-data';

test.describe('Suppliers Slide-Over Drawer & Network Single-Request Optimization', () => {
  test.beforeEach(async ({ page }) => {
    await setupSuppliersFeedsRoutes(page);
  });

  test('1. Clicking Switch fires STRONGLY 1 PATCH request and zero redundant re-fetches', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();
    await expect(page.getByText('Livolo Офіційний')).toBeVisible();

    // Track network calls during toggle interaction
    let patchCount = 0;
    let suppliersGetCount = 0;
    let quotasGetCount = 0;
    let activeJobsGetCount = 0;

    page.on('request', (req) => {
      const url = req.url();
      const method = req.method();

      if (url.includes('/api/suppliers/sup_test_1') && method === 'PATCH') {
        patchCount++;
      } else if (url.includes('/api/suppliers') && method === 'GET') {
        suppliersGetCount++;
      } else if (url.includes('/api/licenses/quotas') && method === 'GET') {
        quotasGetCount++;
      } else if (url.includes('/api/feeds/jobs/active') && method === 'GET') {
        activeJobsGetCount++;
      }
    });

    const switchBtn = page.getByTestId('supplier-switch-sup_test_1');
    await expect(switchBtn).toBeVisible();

    // Click toggle switch
    await switchBtn.click();

    // Wait a brief moment to ensure no background cascade requests are emitted
    await page.waitForTimeout(600);

    // Assert strictly 1 PATCH request and ZERO cascading re-fetches
    expect(patchCount).toBe(1);
    expect(suppliersGetCount).toBe(0);
    expect(quotasGetCount).toBe(0);
    expect(activeJobsGetCount).toBe(0);

    // Assert optimistic UI status update without reload
    const statusBadge = page.getByTestId('supplier-status-badge-sup_test_1');
    await expect(statusBadge).toContainText('Неактивний');
  });

  test('2. Separate columns for toggle switch and status badge with zero layout shifts', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    const switchCell = page.getByTestId('supplier-active-toggle-sup_test_1');
    const statusCell = page.getByTestId('supplier-status-badge-sup_test_1');

    await expect(switchCell).toBeVisible();
    await expect(statusCell).toBeVisible();

    // Measure bounding boxes before toggle
    const tableHeader = page.locator('thead');
    const boxBefore = await tableHeader.boundingBox();

    // Toggle switch
    const switchBtn = page.getByTestId('supplier-switch-sup_test_1');
    await switchBtn.click();

    // Measure bounding boxes after toggle
    const boxAfter = await tableHeader.boundingBox();

    // Table width and height must not jump or twitch
    expect(boxBefore?.width).toBeCloseTo(boxAfter?.width || 0, 0);
    expect(boxBefore?.height).toBeCloseTo(boxAfter?.height || 0, 0);
  });

  test('3. Slide-Over Drawer opens from right, keeps table mounted, and allows 6 tabs switching', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    // Table must be visible
    const table = page.getByTestId('suppliers-table');
    await expect(table).toBeVisible();

    // Click on supplier name to open drawer (opens on Overview tab)
    await page.getByTestId('supplier-name-sup_test_1').click();

    // Drawer sheet must be visible
    const drawer = page.getByTestId('supplier-drawer-sheet');
    await expect(drawer).toBeVisible();

    // Table must still remain mounted underneath
    await expect(table).toBeVisible();

    // Check Header info
    await expect(page.getByTestId('supplier-drawer-name')).toContainText('Livolo Офіційний');
    await expect(page.getByTestId('supplier-drawer-code')).toContainText('LIVOLO-UA');
    await expect(page.getByTestId('supplier-drawer-avatar')).toBeVisible();

    // Tab 1: Overview (default)
    await expect(page.getByTestId('supplier-drawer-tab-overview')).toBeVisible();
    await expect(page.getByTestId('supplier-drawer-overview-tab')).toBeVisible();

    // Tab 2: Feeds
    const feedsTab = page.getByTestId('supplier-drawer-tab-feeds');
    await feedsTab.click();
    await expect(page.getByTestId('supplier-feeds-tab')).toBeVisible();

    // Connect feed button is visible
    await expect(page.getByTestId('supplier-feeds-tab')).toBeVisible();

    // Tab 3: Categories
    const categoriesTab = page.getByTestId('supplier-drawer-tab-categories');
    await categoriesTab.click();
    await expect(page.getByTestId('supplier-categories-tab')).toBeVisible();

    // Tab 4: Pricing
    const pricingTab = page.getByTestId('supplier-drawer-tab-pricing');
    await pricingTab.click();
    await expect(page.getByTestId('supplier-pricing-tab')).toBeVisible();

    // Tab 5: Currencies
    const currenciesTab = page.getByTestId('supplier-drawer-tab-currencies');
    await currenciesTab.click();
    await expect(page.getByTestId('supplier-currencies-tab')).toBeVisible();

    // Tab 6: Sync
    const syncTab = page.getByTestId('supplier-drawer-tab-sync');
    await syncTab.click();
    await expect(page.getByTestId('supplier-sync-tab')).toBeVisible();

    // Close drawer via close button
    const closeBtn = page.getByTestId('supplier-drawer-close-btn');
    await closeBtn.click();
    await expect(drawer).not.toBeVisible();

    // Table is still visible and operational
    await expect(table).toBeVisible();
  });

  test('4. Full-screen expansion from drawer expands sheet to left menu', async ({ page }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    // Open drawer
    await page.getByTestId('supplier-name-sup_test_1').click();
    const drawer = page.getByTestId('supplier-drawer-sheet');
    await expect(drawer).toBeVisible();

    // Invariant assertions: No date text, active switch is in header, no fullscreen in footer
    const header = page.getByTestId('supplier-drawer-header');
    await expect(header).toBeVisible();
    await expect(header.getByTestId('supplier-drawer-active-toggle')).toBeVisible();
    await expect(header.locator('text=Додано')).toHaveCount(0);

    const footer = page.getByTestId('supplier-drawer-footer');
    await expect(footer.getByTestId('supplier-drawer-fullscreen-btn')).toHaveCount(0);

    // Full screen expansion button is in header
    const fullBtn = header.getByTestId('supplier-drawer-fullscreen-btn');
    await expect(fullBtn).toBeVisible();
    await fullBtn.click();

    // Drawer has expanded width class
    await expect(drawer).toHaveClass(/max-w-none/);

    // Toggle back to normal drawer
    await fullBtn.click();
    await expect(drawer).not.toHaveClass(/max-w-none/);
    await expect(drawer).toHaveClass(/max-w-5xl|max-w-6xl/);
  });

  test('5. Add feed from table row dropdown opens Import Feed Wizard', async ({ page }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    // Open row actions dropdown
    await page.getByTestId('supplier-actions-sup_test_1').click();

    // Click "Підключити фід"
    await page.getByTestId('action-add-feed-sup_test_1').click();

    // Wizard modal opens
    await expect(page.getByTestId('wizard-close-btn')).toBeVisible();
    await page.getByTestId('wizard-close-btn').click();
  });
});
