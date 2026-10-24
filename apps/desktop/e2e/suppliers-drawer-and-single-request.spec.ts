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

    const statusToggleBtn = page.getByTestId('supplier-status-toggle-sup_test_1');
    await expect(statusToggleBtn).toBeVisible();

    // Click interactive status badge
    await statusToggleBtn.click();

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

  test('2. Single status column without switch tautology and zero layout shifts', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    // Verify tautology removed: switch column is gone, only status badge is present
    const switchCell = page.getByTestId('supplier-active-toggle-sup_test_1');
    await expect(switchCell).not.toBeVisible();

    const statusCell = page.getByTestId('supplier-status-badge-sup_test_1');
    await expect(statusCell).toBeVisible();

    // Measure bounding boxes before toggle
    const tableHeader = page.locator('thead');
    const boxBefore = await tableHeader.boundingBox();

    // Toggle status via badge
    const statusToggleBtn = page.getByTestId('supplier-status-toggle-sup_test_1');
    await statusToggleBtn.click();

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

    const sidebar = page.getByTestId('desktop-sidebar');
    await expect(sidebar).toHaveClass(/w-64/);

    // Open drawer for Mobioptom first to verify zeroed categoriesCount when activeFeedsCount is 0
    await page.getByTestId('supplier-name-sup_test_2').click();
    const drawer = page.getByTestId('supplier-drawer-sheet');
    await expect(drawer).toBeVisible();
    await expect(sidebar).toHaveClass(/w-\[72px\]/);
    await expect(drawer).toHaveClass(/max-w-none/);

    // Verify KPI metrics for Mobioptom show 0 products, 0 feeds, and 0 categories despite stale backend counts
    const overviewTab = page.getByTestId('supplier-drawer-overview-tab');
    await expect(overviewTab).toBeVisible();
    await expect(overviewTab.getByTestId('overview-kpi-categories')).toContainText('0');
    await expect(overviewTab.getByTestId('overview-kpi-products')).toContainText('0');
    await expect(overviewTab.getByTestId('overview-kpi-feeds')).toContainText('0');

    await page.getByTestId('supplier-drawer-close-btn').click();
    await expect(drawer).not.toBeVisible();

    // Open drawer for Livolo
    await page.getByTestId('supplier-name-sup_test_1').click();
    await expect(drawer).toBeVisible();

    // Invariant assertions: No date text, active switch is in header, no fullscreen in footer
    const header = page.getByTestId('supplier-drawer-header');
    await expect(header).toBeVisible();
    await expect(header.getByTestId('supplier-drawer-active-toggle')).toBeVisible();
    await expect(header.locator('text=Додано')).toHaveCount(0);

    const footer = page.getByTestId('supplier-drawer-footer');
    await expect(footer.getByTestId('supplier-drawer-fullscreen-btn')).toHaveCount(0);

    // Drawer opens expanded by default with sidebar collapsed
    await expect(sidebar).toHaveClass(/w-\[72px\]/);
    await expect(drawer).toHaveClass(/max-w-none/);

    // Full screen expansion button in header toggles between compact drawer and expanded workspace width
    const fullBtn = header.getByTestId('supplier-drawer-fullscreen-btn');
    await expect(fullBtn).toBeVisible();
    await fullBtn.click();

    await expect(drawer).not.toHaveClass(/max-w-none/);
    await expect(drawer).toHaveClass(/max-w-5xl|max-w-6xl/);

    // Toggle back to expanded full workspace width
    await fullBtn.click();
    await expect(drawer).toHaveClass(/max-w-none/);
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

  test('6. Categories tab displays feed attribution, clean category name, right overlay drawer, export CSV, inline edit, and CSV import', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    await page.getByTestId('supplier-name-sup_test_1').click();
    await expect(page.getByTestId('supplier-drawer-sheet')).toBeVisible();

    await page.getByTestId('supplier-drawer-tab-categories').click();
    await expect(page.getByTestId('supplier-categories-tab')).toBeVisible();

    // Check Feed Name, Marketplace Category, and Commission columns are visible
    await expect(page.getByText('Назва фіду')).toBeVisible();
    await expect(page.getByText('Категорія маркетплейсу')).toBeVisible();
    await expect(page.getByText('Комісія МП (%)')).toBeVisible();

    const feedBadge = page.getByTestId('category-feed-scat_test_1');
    await expect(feedBadge).toContainText('Livolo Main XML');

    // Auto-map categories to Rozetka: row displays ONLY category name (no technical rz_id badge)
    await page.getByTestId('auto-map-categories-btn').click();
    const mapBtn = page.getByTestId('category-marketplace-btn-scat_test_1');
    await expect(mapBtn).toContainText('Розумні вимикачі');
    await expect(page.getByTestId('category-commission-input-scat_test_1')).toHaveValue('12');

    // Open Marketplace Category Drawer (right slide-over, expanded to workspace width, zero dark backdrop)
    await mapBtn.click();
    const categoryDrawer = page.getByTestId('marketplace-category-drawer');
    await expect(categoryDrawer).toBeVisible();
    await expect(categoryDrawer).toHaveClass(/max-w-none/);

    // Verify Export CSV button is present
    const exportBtn = page.getByTestId('drawer-export-csv-btn');
    await expect(exportBtn).toBeVisible();

    // Test import drawer toggle and sample CSV button
    const importBtn = page.getByTestId('drawer-toggle-import-btn');
    await expect(importBtn).toBeVisible();
    await importBtn.click();
    await expect(page.getByTestId('marketplace-category-import-form')).toBeVisible();
    await expect(page.getByTestId('download-sample-csv-btn')).toBeVisible();

    // Switch back to search and paste Rozetka URL for Зарядні станції (c4674585)
    await page.getByTestId('drawer-toggle-import-btn').click();
    await page
      .getByTestId('picker-search-input')
      .fill('https://rozetka.com.ua/ua/zaryadnie-stantsii-4674585/c4674585/');
    await expect(page.getByTestId('picker-url-detected-badge')).toContainText('4674585');

    // Test inline editing of existing category before selecting
    await page.getByTestId('edit-item-4674585').click();
    await expect(page.getByTestId('marketplace-category-edit-form')).toBeVisible();
    await page.getByTestId('edit-category-commission-input').fill('8');
    await page.getByTestId('edit-category-submit-btn').click();
    await expect(page.getByTestId('marketplace-category-edit-form')).toHaveCount(0);

    // Select the updated category into supplier category row
    await page.getByTestId('picker-item-4674585').click();

    // Drawer closes; row displays only clean category name without rz_id badge
    await expect(categoryDrawer).toHaveCount(0);
    await expect(mapBtn).toContainText('Зарядні станції');
    await expect(page.getByTestId('category-commission-input-scat_test_1')).toHaveValue('8');

    // Check search filter works
    const searchInput = page.getByTestId('search-category-input');
    await searchInput.fill('Сенсорні');
    await expect(page.getByText('Сенсорні вимикачі')).toBeVisible();
    await expect(page.getByText('Розумні розетки')).not.toBeVisible();
  });

  test('7. Feed selector in categories tab displays all connected feeds and filters correctly', async ({
    page,
  }) => {
    page.on('console', (msg) => console.log('BROWSER_LOG:', msg.text()));
    page.on('response', (resp) => {
      console.log('ALL_RESP:', resp.status(), resp.url());
    });
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    await page.getByTestId('supplier-name-sup_test_1').click();
    await expect(page.getByTestId('supplier-drawer-sheet')).toBeVisible();

    await page.getByTestId('supplier-drawer-tab-categories').click();
    await expect(page.getByTestId('supplier-categories-tab')).toBeVisible();

    // Verify feed selector is present
    const feedSelector = page.getByTestId('category-feed-filter');
    await expect(feedSelector).toBeVisible();

    // Open dropdown to verify both connected feeds are listed
    await feedSelector.click();
    await expect(page.getByRole('option', { name: 'Livolo Main XML' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Livolo Secondary CSV' })).toBeVisible();

    // Select second feed which has no categories yet
    await page.getByRole('option', { name: 'Livolo Secondary CSV' }).click();

    // Empty state hint for feed should be visible
    await expect(page.getByText('Для обраного фіду ще немає імпортованих категорій')).toBeVisible();

    // Switch back to "Всі фіди"
    await feedSelector.click();
    await page.getByRole('option', { name: /Всі фіди|All feeds/i }).click();
    await expect(page.getByText('Сенсорні вимикачі')).toBeVisible();
  });

  test('8. Category markup unit switch (% vs ₴) and human-friendly Ukrainian terminology («Привʼязано»)', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    await page.getByTestId('supplier-name-sup_test_1').click();
    await expect(page.getByTestId('supplier-drawer-sheet')).toBeVisible();

    await page.getByTestId('supplier-drawer-tab-categories').click();
    await expect(page.getByTestId('supplier-categories-tab')).toBeVisible();

    // Verify terminology: "Привʼязано" stat and column header "Націнка"
    const mappedStat = page.getByTestId('mapped-categories-stat');
    await expect(mappedStat).toContainText('Привʼязано');

    // Verify filter dropdown option "Привʼязані"
    const mappingFilter = page.getByTestId('category-mapping-filter');
    await mappingFilter.click();
    await expect(page.getByRole('option', { name: 'Привʼязані' })).toBeVisible();
    await page.getByRole('option', { name: 'Усі категорії' }).click();

    // Verify table header says "Націнка"
    await expect(page.locator('thead').getByText('Націнка', { exact: true })).toBeVisible();

    // Markup unit buttons for first category
    const percentBtn = page.getByTestId('category-markup-type-percent-scat_test_1');
    const fixedBtn = page.getByTestId('category-markup-type-fixed-scat_test_1');
    const marginInput = page.getByTestId('category-margin-input-scat_test_1');

    await expect(percentBtn).toBeVisible();
    await expect(fixedBtn).toBeVisible();
    await expect(marginInput).toBeVisible();

    // Default is % active
    await expect(percentBtn).toHaveClass(/bg-primary/);

    // Enter value 100 in percent
    await marginInput.fill('100');
    await expect(marginInput).toHaveValue('100');

    // Click ₴ to switch to FIXED currency markup
    await fixedBtn.click();
    await expect(fixedBtn).toHaveClass(/bg-primary/);
    await expect(percentBtn).not.toHaveClass(/bg-primary/);

    // Value 100 is preserved upon switching to ₴
    await expect(marginInput).toHaveValue('100');

    // Edit to 150 ₴
    await marginInput.fill('150');
    await expect(marginInput).toHaveValue('150');

    // Switch back to %
    await percentBtn.click();
    await expect(percentBtn).toHaveClass(/bg-primary/);
    await expect(fixedBtn).not.toHaveClass(/bg-primary/);
    await expect(marginInput).toHaveValue('150');
  });
});
