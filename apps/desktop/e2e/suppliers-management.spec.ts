import { test, expect } from '@playwright/test';
import {
  mockQuotas,
  mockSuppliers,
  setupSuppliersFeedsRoutes,
} from '@e2e/fixtures/suppliers-feeds-mock-data';

test.describe('Desktop App — Постачальники та ліміти', () => {
  test.beforeEach(async ({ page }) => {
    await setupSuppliersFeedsRoutes(page);
  });

  test('перегляд сторінки постачальників, квотних карток та відкриття підключених фідів', async ({
    page,
  }) => {
    await page.goto('/suppliers');

    // Verify suppliers page & quota cards
    await expect(page.getByTestId('suppliers-page')).toBeVisible();
    await expect(page.getByTestId('suppliers-quota-card')).toBeVisible();
    await expect(page.getByTestId('products-quota-card')).toBeVisible();
    await expect(page.getByTestId('feeds-quota-card')).toBeVisible();

    await expect(page.getByText('Livolo Офіційний')).toBeVisible();
    await expect(page.getByText('+25% +100 ₴')).toBeVisible();

    // Click on active feeds button
    await page.getByTestId('view-supplier-feeds-btn-sup_test_1').click();

    // Verify modal appears with feed details
    await expect(page.getByText('Підключені фіди:')).toBeVisible();
    await expect(page.getByText('Livolo Main XML')).toBeVisible();
    await expect(page.getByText('XML_ROZETKA')).toBeVisible();
    await expect(page.getByText('Синхронізувати')).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: 'Закрити' }).click();
  });

  test('блокування кнопок додавання постачальника та підключення фідів при вичерпанні лімітів тарифу (з підказками)', async ({
    page,
  }) => {
    const maxedQuotas = {
      ...mockQuotas,
      suppliers: {
        used: 10,
        max: 10,
        isUnlimited: false,
        percentUsed: 100,
        isExceeded: false,
        remaining: 0,
      },
      feeds: {
        used: 20,
        max: 20,
        isUnlimited: false,
        percentUsed: 100,
        isExceeded: false,
        remaining: 0,
      },
    };

    await page.route('**/api/licenses/quotas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(maxedQuotas),
      });
    });

    const maxSuppliers = Array.from({ length: 10 }, (_, i) => ({
      ...mockSuppliers[0],
      id: `sup_test_${i + 1}`,
      name: `Постачальник ${i + 1}`,
    }));

    await page.route(/\/api\/suppliers(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(maxSuppliers),
      });
    });

    await page.route(/\/api\/products(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0 }),
      });
    });

    await page.route(/\/api\/feeds\/sources(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(Array.from({ length: 50 }, (_, i) => ({ id: `feed_${i}` }))),
      });
    });

    await page.goto('/suppliers');
    await expect(page.getByRole('heading', { name: 'Постачальник 1', exact: true })).toBeVisible();

    // Add supplier header button should be disabled
    const addSupplierBtn = page.getByTestId('add-supplier-header-btn');
    await expect(addSupplierBtn).toBeDisabled();
    await expect(addSupplierBtn).toHaveAttribute(
      'title',
      'Ліміт постачальників вичерпано. Підвищіть тариф або видаліть зайвих постачальників.',
    );

    // Import feed button should not exist in toolbar (zero duplicate CTA)
    await expect(page.getByTestId('import-feed-header-btn')).not.toBeVisible();

    // Supplier card import button should be disabled with feed limit tooltip
    const cardImportBtn = page.getByTestId('supplier-card-import-btn-sup_test_1');
    await expect(cardImportBtn).toBeDisabled();
    await expect(cardImportBtn).toHaveAttribute(
      'title',
      'Ліміт джерел фідів вичерпано. Підвищіть тариф або видаліть зайві фіди.',
    );
  });

  test('модальне вікно підтвердження видалення фіду ConfirmDeleteDialog замість системного confirm()', async ({
    page,
  }) => {
    let deleteCalled = false;
    await page.route('**/api/feeds/suppliers/sup_test_1/sources/src_feed_1*', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, deletedProductsCount: 250 }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/suppliers');

    // Click on active feeds button
    await page.getByTestId('view-supplier-feeds-btn-sup_test_1').click();
    await expect(page.getByText('Підключені фіди:')).toBeVisible();

    // Click delete feed button inside modal
    await page.getByTestId('delete-feed-source-src_feed_1').click();

    // Custom ConfirmDeleteDialog should appear
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Видалити підключений фід')).toBeVisible();
    await expect(
      page.getByText('Ви впевнені, що хочете видалити це підключене джерело фіду?'),
    ).toBeVisible();

    // Click confirm delete button in dialog
    await page.getByTestId('confirm-dialog-confirm-btn').click();

    // Verify delete was triggered via condition polling
    await expect.poll(() => deleteCalled).toBe(true);
  });

  test('диференціація дій URL vs FILE фідів, локалізація статусів та відсутність дублювання знака плюс на кнопці', async ({
    page,
  }) => {
    const multiSources = [
      {
        id: 'src_url_1',
        supplierId: 'sup_test_1',
        name: 'Livolo XML Feed',
        sourceType: 'URL',
        fileFormat: 'XML_ROZETKA',
        sourceUrl: 'https://livolo.ua/feed.xml',
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: 'SUCCESS',
        productsCount: 100,
      },
      {
        id: 'src_file_1',
        supplierId: 'sup_test_1',
        name: 'catalog.csv',
        sourceType: 'FILE',
        fileFormat: 'CSV_CUSTOM',
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: 'ERROR',
        productsCount: 50,
      },
    ];

    await page.route('**/api/feeds/suppliers/sup_test_1/sources', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(multiSources),
      });
    });

    await page.goto('/suppliers');
    await page.getByTestId('view-supplier-feeds-btn-sup_test_1').click();

    await expect(page.getByText('Підключені фіди:')).toBeVisible();

    // URL feed should have "Синхронізувати"
    await expect(page.getByRole('button', { name: 'Синхронізувати' })).toBeVisible();

    // FILE feed should have "Оновити файл" instead of broken sync
    await expect(page.getByRole('button', { name: 'Оновити файл' })).toBeVisible();

    // Statuses should be localized (Успішно and Помилка, not raw English ERROR)
    await expect(page.getByText('Успішно')).toBeVisible();
    await expect(page.getByText('Помилка')).toBeVisible();

    // Modal footer button should not have double plus
    const modalAddBtn = page.getByTestId('modal-connect-new-feed-btn');
    await expect(modalAddBtn).toBeVisible();
    await expect(modalAddBtn).toHaveText('Підключити новий фід');
  });

  test('сторінка постачальників: при порожньому списку приховує тулбар і не дублює кнопку створення (єдина кнопка у картці)', async ({
    page,
  }) => {
    await page.route(/\/api\/suppliers(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/suppliers');

    // 1. Toolbar and header action buttons MUST NOT be visible
    await expect(page.getByTestId('add-supplier-header-btn')).not.toBeVisible();
    await expect(page.getByTestId('import-feed-header-btn')).not.toBeVisible();

    // 2. Empty state card is visible with proper title and a single CTA button
    await expect(page.getByText('Список постачальників порожній')).toBeVisible();
    const emptyCreateBtn = page.getByTestId('empty-create-supplier-btn');
    await expect(emptyCreateBtn).toBeVisible();
    await expect(emptyCreateBtn).toHaveText('Додати постачальника');

    // 3. Exactly 1 button for adding a supplier on the entire screen
    const allAddSupplierBtns = page.getByRole('button', { name: /Додати постачальника/i });
    await expect(allAddSupplierBtns).toHaveCount(1);

    // 4. Clicking the single button opens the create supplier dialog
    await emptyCreateBtn.click();
    await expect(page.getByRole('heading', { name: 'Новий постачальник' })).toBeVisible();
  });
});
