import { test, expect } from '@playwright/test';
import { setupSuppliersFeedsRoutes } from '@e2e/fixtures/suppliers-feeds-mock-data';

test.describe('Desktop App — Реактивна синхронізація лічильників (DataSync)', () => {
  test.beforeEach(async ({ page }) => {
    await setupSuppliersFeedsRoutes(page);
  });

  test('єдина реактивна синхронізація лічильників (DataSync): видалення фіду миттєво оновлює картку постачальника та квоти без перезавантаження', async ({
    page,
  }) => {
    let currentSuppliers = [
      {
        id: 'sup_sync_1',
        name: 'MMM',
        code: 'M-01',
        isActive: true,
        defaultMarginPercent: 30,
        defaultFixedMarkup: 0,
        productsCount: 100,
        activeFeedsCount: 1,
        contactEmail: 'mmm@gmail.com',
        contactPhone: '+380550000001',
        website: 'https://mma.ua',
      },
    ];

    let currentQuotas = {
      planCode: 'STARTER',
      planNameUk: 'Старт',
      planNameEn: 'Starter',
      suppliers: {
        used: 1,
        max: 1,
        isUnlimited: false,
        percentUsed: 100,
        isExceeded: false,
        remaining: 0,
      },
      feeds: {
        used: 1,
        max: 1,
        isUnlimited: false,
        percentUsed: 100,
        isExceeded: false,
        remaining: 0,
      },
      products: {
        used: 100,
        max: 1000,
        isUnlimited: false,
        percentUsed: 10,
        isExceeded: false,
        remaining: 900,
      },
      channels: {
        used: 0,
        max: 1,
        isUnlimited: false,
        percentUsed: 0,
        isExceeded: false,
        remaining: 1,
      },
      teamSeats: {
        used: 1,
        max: 1,
        isUnlimited: false,
        percentUsed: 100,
        isExceeded: false,
        remaining: 0,
      },
      aiCredits: {
        used: 0,
        max: 0,
        isUnlimited: false,
        percentUsed: 0,
        isExceeded: false,
        remaining: 0,
      },
    };

    let feedSources = [
      {
        id: 'src_feed_mmm',
        supplierId: 'sup_sync_1',
        name: 'mobile_phones_catalog.xml',
        sourceType: 'FILE',
        fileFormat: 'XML_ROZETKA',
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: 'SUCCESS',
        productsCount: 100,
      },
    ];

    await page.route(/\/api\/suppliers(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(currentSuppliers),
      });
    });

    await page.route('**/api/licenses/quotas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(currentQuotas),
      });
    });

    await page.route('**/api/feeds/suppliers/sup_sync_1/sources', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(feedSources),
      });
    });

    await page.route('**/api/feeds/suppliers/sup_sync_1/sources/src_feed_mmm*', async (route) => {
      if (route.request().method() === 'DELETE') {
        feedSources = [];
        currentSuppliers = [
          {
            ...currentSuppliers[0],
            productsCount: 0,
            activeFeedsCount: 0,
          },
        ];
        currentQuotas = {
          ...currentQuotas,
          feeds: { ...currentQuotas.feeds, used: 0, percentUsed: 0, remaining: 1 },
          products: { ...currentQuotas.products, used: 0, percentUsed: 0, remaining: 1000 },
        };

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, deletedProductsCount: 100 }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/suppliers');

    // Initially: supplier MMM shows 100 products and 1 feed
    const supplierCard = page.locator('.grid').filter({ hasText: 'MMM' });
    await expect(page.getByRole('heading', { name: 'MMM' })).toBeVisible();
    await expect(supplierCard.getByText('100')).toBeVisible();

    // Open feeds modal
    await page.getByTestId('view-supplier-feeds-btn-sup_sync_1').click();
    await expect(page.getByText('mobile_phones_catalog.xml')).toBeVisible();

    // Click delete feed
    await page.getByTestId('delete-feed-source-src_feed_mmm').click();
    await expect(page.getByTestId('confirm-dialog-confirm-btn')).toBeVisible();
    await page.getByTestId('confirm-dialog-confirm-btn').click();

    // Close modal
    await page.locator('.max-w-3xl').getByRole('button', { name: 'Закрити' }).click();

    // ASSERT: Without page reload, supplier card counters updated reactively to 0!
    await expect(supplierCard.getByText('0', { exact: true }).first()).toBeVisible();

    // Top quota cards are also reactively at 0
    await expect(
      page.getByTestId('products-quota-card').getByText('0', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByTestId('feeds-quota-card').getByText('0', { exact: true }),
    ).toBeVisible();
  });
});
