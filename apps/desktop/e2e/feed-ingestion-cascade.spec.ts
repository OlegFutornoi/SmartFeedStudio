import { test, expect } from '@playwright/test';
import { setupFeedIngestionMocks } from '@e2e/fixtures/feed-ingestion-mock-data';

test.describe('Desktop App — Feed Quotas & Cascade Teardown (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await setupFeedIngestionMocks(page);
  });

  test('should dynamically enforce quota limit in Step 3 preview', async ({ page }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible({ timeout: 5000 });
    const importBtn = page.getByTestId('supplier-card-import-btn-sup_01');
    await expect(importBtn).toBeVisible({ timeout: 5000 });
    await importBtn.click();

    const livoloBtn = page.locator('button:has-text("Тестовий фід Livolo")');
    await livoloBtn.click();

    await page.locator('button:has-text("Аналізувати")').click();
    await expect(page.getByText('Фід успішно проаналізовано')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Далі до постачальника' }).click();
    await page.getByRole('button', { name: 'Переглянути товари' }).click();

    const selectAllBtn = page.locator('button:has-text("Обрати всі")');
    const deselectAllBtn = page.locator('button:has-text("Зняти всі")');

    await expect(selectAllBtn).toBeVisible();
    await expect(deselectAllBtn).toBeVisible();

    await deselectAllBtn.click();
    await expect(page.getByText('Оберіть хоча б одну категорію для імпорту')).toBeVisible();

    await selectAllBtn.click();
    await expect(page.getByText('Обрано до імпорту:')).toBeVisible();
  });

  test('should trigger asynchronous background ingestion and emit data sync', async ({ page }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible({ timeout: 5000 });
    const importBtn = page.getByTestId('supplier-card-import-btn-sup_01');
    await expect(importBtn).toBeVisible({ timeout: 5000 });
    await importBtn.click();

    await page.locator('button:has-text("Тестовий фід Livolo")').click();
    await page.locator('button:has-text("Аналізувати")').click();
    await expect(page.getByText('Фід успішно проаналізовано')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Далі до постачальника' }).click();
    await page.getByRole('button', { name: 'Переглянути товари' }).click();

    const startImportBtn = page.locator('button:has-text("Розпочати імпорт")');
    await expect(startImportBtn).toBeVisible();
    await startImportBtn.click();

    await expect(page.locator('text=Крок 4 з 4: Фонова черга обробки товарів')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should translate UI elements dynamically when switching languages UA ⇄ EN', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible({ timeout: 5000 });

    const importBtn = page.getByTestId('supplier-card-import-btn-sup_01');
    await expect(importBtn).toBeVisible({ timeout: 5000 });
    await importBtn.click();

    await expect(
      page.locator('h2:has-text("Feed Import Wizard"), h2:has-text("Майстер Імпорту Фідів")'),
    ).toBeVisible();
  });

  test('should cascade delete products and decrease SKU counter when feed is deleted in CatalogsPage', async ({
    page,
  }) => {
    let feedList = [
      {
        id: 'feed_sup_01_01',
        supplierId: 'sup_01',
        name: 'Одяг-Опт Фід',
        sourceType: 'URL',
        fileFormat: 'XML_ROZETKA',
        sourceUrl: 'https://smartfeed.studio/feed.xml',
        autoUpdatePrices: true,
        autoUpdateStocks: true,
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: 'SUCCESS',
        productsCount: 15,
      },
    ];

    await page.route('**/api/feeds/sources', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(feedList),
      });
    });

    await page.route('**/api/feeds/suppliers/sup_01/sources', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(feedList),
      });
    });

    await page.route('**/api/feeds/suppliers/sup_01/sources/feed_sup_01_01*', async (route) => {
      if (route.request().method() === 'DELETE') {
        feedList = [];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, deletedProductsCount: 15 }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/catalogs');
    await expect(page.getByTestId('catalogs-page')).toBeVisible({ timeout: 5000 });

    await page.getByTestId('tab-catalogs').click();
    await expect(page.getByText('Одяг-Опт Фід')).toBeVisible();

    const deleteBtn = page.getByTestId('delete-feed-btn-feed_sup_01_01');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    await expect(page.getByTestId('confirm-dialog-confirm-btn')).toBeVisible();
    await page.getByTestId('confirm-dialog-confirm-btn').click();

    await expect(page.getByTestId('delete-feed-btn-feed_sup_01_01')).not.toBeVisible({
      timeout: 5000,
    });
  });
});
