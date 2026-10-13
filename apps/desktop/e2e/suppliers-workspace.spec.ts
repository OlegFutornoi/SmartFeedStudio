import { test, expect } from '@playwright/test';
import { setupSuppliersFeedsRoutes } from '@e2e/fixtures/suppliers-feeds-mock-data';

test.describe('Desktop App — Модуль постачальників та кабінет постачальника', () => {
  test.beforeEach(async ({ page }) => {
    await setupSuppliersFeedsRoutes(page);

    // Mock category rules
    await page.route(/\/api\/suppliers\/sup_test_1\/categories(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'cat_1',
            supplierId: 'sup_test_1',
            feedCategoryId: '101',
            name: 'Сенсорні вимикачі',
            productCount: 120,
            isActive: true,
            marginPercent: 20,
            fixedMarkup: 50,
          },
          {
            id: 'cat_2',
            supplierId: 'sup_test_1',
            feedCategoryId: '102',
            name: 'Розумні розетки',
            productCount: 80,
            isActive: false,
            marginPercent: null,
            fixedMarkup: null,
          },
        ]),
      });
    });

    // Mock category rules for empty supplier (sup_test_2)
    await page.route(/\/api\/suppliers\/sup_test_2\/categories(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Mock pricing rules
    await page.route(/\/api\/suppliers\/sup_test_1\/pricing-rules(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'rule_1',
            supplierId: 'sup_test_1',
            minPrice: 0,
            maxPrice: 1000,
            marginPercent: 30,
            fixedMarkup: 50,
            priority: 1,
            isActive: true,
          },
          {
            id: 'rule_2',
            supplierId: 'sup_test_1',
            minPrice: 1001,
            maxPrice: null,
            marginPercent: 20,
            fixedMarkup: 100,
            priority: 2,
            isActive: true,
          },
        ]),
      });
    });

    // Mock products
    await page.route(/\/api\/products(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'p_1',
              catalogId: 'cat_1',
              supplierId: 'sup_test_1',
              sku: 'LIV-001',
              titleUk: 'Сенсорний вимикач білий',
              categoryNameUk: 'Сенсорні вимикачі',
              costPrice: 500,
              price: 725,
              currency: 'UAH',
              stockQuantity: 45,
              inStock: true,
              status: 'ACTIVE',
              images: [],
              attributes: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          total: 1,
          page: 1,
          pageSize: 50,
        }),
      });
    });
  });

  test('рендеринг списку постачальників, KPI карток та таблиці', async ({ page }) => {
    await page.goto('/suppliers');

    // KPI Cards
    await expect(page.getByTestId('suppliers-page')).toBeVisible();
    await expect(page.getByTestId('suppliers-quota-card')).toBeVisible();
    await expect(page.getByTestId('feeds-quota-card')).toBeVisible();
    await expect(page.getByTestId('products-quota-card')).toBeVisible();

    // Table rows & data invariants
    await expect(page.getByText('Livolo Офіційний')).toBeVisible();
    await expect(page.getByTestId('supplier-name-sup_test_2')).toBeVisible();

    // Verify supplier initials avatar
    await expect(page.locator('text=LO').first()).toBeVisible();

    // Verify search filter input
    const searchInput = page.getByTestId('search-suppliers-input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Livolo');
    await expect(page.getByText('Livolo Офіційний')).toBeVisible();
    await expect(page.getByTestId('supplier-name-sup_test_2')).not.toBeVisible();

    // Clear search
    await searchInput.fill('');
    await expect(page.getByTestId('supplier-name-sup_test_2')).toBeVisible();
  });

  test('перехід у кабінет постачальника та перемикання 5 вкладок', async ({ page }) => {
    await page.goto('/suppliers');

    // Click on details / workspace button
    await page.getByTestId('supplier-actions-sup_test_1').click();
    await page.getByTestId('action-details-sup_test_1').click();

    // Verify workspace container & header
    const workspace = page.getByTestId('supplier-detail-workspace');
    await expect(workspace).toBeVisible();
    await expect(page.getByTestId('supplier-detail-header')).toBeVisible();
    await expect(page.getByText('LIVOLO-UA')).toBeVisible();

    // Tab 1: Feeds tab
    await expect(page.getByTestId('supplier-feeds-tab')).toBeVisible();
    await expect(page.getByText('Livolo Main XML')).toBeVisible();

    // Tab 2: Categories tab
    await page.getByTestId('tab-categories').click();
    await expect(page.getByTestId('supplier-categories-tab')).toBeVisible();
    await expect(page.getByText('Сенсорні вимикачі')).toBeVisible();
    await expect(page.getByText('Розумні розетки')).toBeVisible();

    // Tab 3: Pricing tab
    await page.getByTestId('tab-pricing').click();
    await expect(page.getByTestId('supplier-pricing-tab')).toBeVisible();
    await expect(page.getByTestId('base-margin-input')).toBeVisible();

    // Tab 4: Currencies tab
    await page.getByTestId('tab-currencies').click();
    await expect(page.getByTestId('supplier-currencies-tab')).toBeVisible();
    await expect(page.getByTestId('base-currency-select')).toBeVisible();

    // Tab 5: Products tab
    await page.getByTestId('tab-products').click();
    await expect(page.getByTestId('supplier-products-tab')).toBeVisible();
    await expect(page.getByText('LIV-001')).toBeVisible();
    await expect(page.getByText('Сенсорний вимикач білий')).toBeVisible();

    // Back button returns to list view
    await page.getByTestId('back-to-suppliers-btn').click();
    await expect(page.getByTestId('suppliers-page')).toBeVisible();
  });

  test('постачальник без категорій відображає 0/0 та інформаційний empty state', async ({
    page,
  }) => {
    await page.goto('/suppliers');

    // Open Mobioptom details
    await page.getByTestId('supplier-actions-sup_test_2').click();
    await page.getByTestId('action-details-sup_test_2').click();

    // Verify workspace & navigate to Categories tab
    await expect(page.getByTestId('supplier-detail-workspace')).toBeVisible();
    await page.getByTestId('tab-categories').click();

    // Verify Categories tab empty state
    await expect(page.getByTestId('supplier-categories-tab')).toBeVisible();
    await expect(page.getByText('Активно: 0 / 0')).toBeVisible();
    await expect(page.getByText('У цього постачальника ще немає категорій')).toBeVisible();
    await expect(
      page.getByText(
        'Категорії будуть автоматично імпортовані після підключення та обробки XML/CSV фіду.',
      ),
    ).toBeVisible();
  });

  test('кнопка "Редагувати" у кабінеті постачальника успішно відкриває діалог та зберігає зміни', async ({
    page,
  }) => {
    await page.goto('/suppliers');

    // Open Livolo details workspace
    await page.getByTestId('supplier-actions-sup_test_1').click();
    await page.getByTestId('action-details-sup_test_1').click();
    await expect(page.getByTestId('supplier-detail-workspace')).toBeVisible();

    // Click "Редагувати" in workspace header
    const editBtn = page.getByTestId('edit-supplier-btn');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Assert modal dialog is open and visible
    const dialog = page.getByTestId('supplier-create-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('supplier-name-input')).toHaveValue('Livolo Офіційний');

    // Change supplier name and save
    await page.getByTestId('supplier-name-input').fill('Livolo Global Pro');
    await page.getByTestId('save-supplier-dialog-btn').click();

    // Dialog should close cleanly
    await expect(dialog).not.toBeVisible();

    // Updated name should be reflected in workspace header
    await expect(page.getByText('Livolo Global Pro')).toBeVisible();
  });

  test('повзунок активності постачальника у кабінеті та таблиці динамічно перемикає статус', async ({
    page,
  }) => {
    await page.goto('/suppliers');

    // 1. Check table inline toggle
    const tableToggle = page.getByTestId('supplier-table-toggle-sup_test_1');
    await expect(tableToggle).toBeVisible();

    // 2. Open Livolo workspace
    await page.getByTestId('supplier-actions-sup_test_1').click();
    await page.getByTestId('action-details-sup_test_1').click();
    await expect(page.getByTestId('supplier-detail-workspace')).toBeVisible();

    // 3. Workspace status toggle switch
    const statusToggle = page.getByTestId('supplier-active-toggle');
    const statusText = page.getByTestId('supplier-active-status-text');
    await expect(statusToggle).toBeVisible();
    await expect(statusText).toContainText('Активний');

    // Toggle to inactive
    await statusToggle.click();
    await expect(statusText).toContainText('Неактивний');

    // Toggle back to active
    await statusToggle.click();
    await expect(statusText).toContainText('Активний');
  });

  test('налаштування стовпців таблиці ("Налаштувати стовпці") приховує та показує колонки', async ({
    page,
  }) => {
    await page.goto('/suppliers');

    // Verify customize columns button and initial state
    const customizeBtn = page.getByTestId('customize-columns-btn');
    await expect(customizeBtn).toBeVisible();
    await expect(page.locator('thead').getByText('Контакти')).toBeVisible();

    // Open dropdown and toggle off contacts column
    await customizeBtn.click();
    const contactsToggle = page.getByTestId('column-toggle-contacts');
    await expect(contactsToggle).toBeVisible();
    await contactsToggle.click();

    // Close menu with Escape
    await page.keyboard.press('Escape');

    // Header "Контакти" must now be hidden
    await expect(page.locator('thead').getByText('Контакти')).not.toBeVisible();

    // Re-open and toggle contacts back on
    await customizeBtn.click();
    await contactsToggle.click();
    await page.keyboard.press('Escape');
    await expect(page.locator('thead').getByText('Контакти')).toBeVisible();
  });

  test('панель інструментів містить компактне поле пошуку та кнопку експорту', async ({ page }) => {
    await page.goto('/suppliers');

    // Compact search input
    const searchInput = page.getByTestId('search-suppliers-input');
    await expect(searchInput).toBeVisible();

    // Export button
    const exportBtn = page.getByTestId('export-suppliers-btn');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toContainText('Експорт');
  });
});
