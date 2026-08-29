import { test, expect } from '@playwright/test';

test.describe('Desktop App — Постачальники, Майстер Фідів, Вибір Категорій та Фонова Синхронізація', () => {
  const mockUser = {
    id: 'usr_test_123',
    email: 'supplier.test@smartfeed.local',
    fullName: 'Supplier Test User',
    role: 'USER',
    organization: {
      id: 'org-test-1',
      name: 'Test Org LLC',
      role: 'OWNER',
    },
  };

  const mockLicenseState = {
    id: 'lic-1',
    userId: mockUser.id,
    planType: 'PRO',
    isActive: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isExpired: false,
    daysRemaining: 30,
  };

  const mockQuotas = {
    planCode: 'PRO',
    planNameUk: 'PRO Тариф',
    planNameEn: 'PRO Plan',
    isExpired: false,
    suppliers: {
      used: 1,
      max: 10,
      isUnlimited: false,
      percentUsed: 10,
      isExceeded: false,
      remaining: 9,
    },
    products: {
      used: 250,
      max: 5000,
      isUnlimited: false,
      percentUsed: 5,
      isExceeded: false,
      remaining: 4750,
    },
    feeds: {
      used: 1,
      max: 20,
      isUnlimited: false,
      percentUsed: 5,
      isExceeded: false,
      remaining: 19,
    },
    aiCredits: {
      used: 10,
      max: 500,
      isUnlimited: false,
      percentUsed: 2,
      isExceeded: false,
      remaining: 490,
    },
    teamSeats: {
      used: 1,
      max: 5,
      isUnlimited: false,
      percentUsed: 20,
      isExceeded: false,
      remaining: 4,
    },
    storage: {
      usedMb: 120,
      maxMb: 10000,
      percentUsed: 1.2,
      isUnlimited: false,
      isExceeded: false,
      remainingMb: 9880,
    },
  };

  const mockSuppliers = [
    {
      id: 'sup_test_1',
      name: 'Livolo Офіційний',
      code: 'LIVOLO-UA',
      defaultMarginPercent: 25,
      defaultFixedMarkup: 100,
      isActive: true,
      productsCount: 250,
      activeFeedsCount: 1,
      contactEmail: 'sales@livolo.ua',
      contactPhone: '+380501112233',
      website: 'https://livolo.ua',
    },
  ];

  const mockFeedSources = [
    {
      id: 'src_feed_1',
      supplierId: 'sup_test_1',
      name: 'Livolo Main XML',
      sourceType: 'URL',
      fileFormat: 'XML_ROZETKA',
      sourceUrl: 'https://livolo.kiev.ua/products_feed.xml',
      autoUpdatePrices: true,
      autoUpdateStocks: true,
      lastSyncedAt: new Date().toISOString(),
      lastSyncStatus: 'SUCCESS',
      productsCount: 250,
    },
  ];

  const mockAnalysis = {
    format: 'XML_ROZETKA',
    totalDetected: 50,
    categoriesCount: 3,
    categories: [
      { id: '101', externalId: '101', name: 'Сенсорні вимикачі', productCount: 30 },
      { id: '102', externalId: '102', name: 'Розумні розетки', productCount: 15 },
      { id: '103', externalId: '103', name: 'Рамки для вимикачів', productCount: 5 },
    ],
    sampleCategories: [{ externalId: '101', name: 'Сенсорні вимикачі' }],
    sampleProducts: [
      {
        sku: 'VL-C701-11',
        titleUk: 'Сенсорний вимикач 1-клавішний білий',
        costPrice: 500,
        price: 725,
        currency: 'UAH',
        stockQuantity: 20,
        inStock: true,
        images: [],
      },
    ],
  };

  test.beforeEach(async ({ page }) => {
    // 100% test isolation & clean storage
    await page.addInitScript((user) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem('smartfeed_access_token', 'mock-valid-token');
      window.localStorage.setItem('smartfeed_user_profile', JSON.stringify(user));
      window.localStorage.setItem('smartfeed_language', 'uk');
    }, mockUser);

    // Mock API routes
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    });

    await page.route('**/api/licenses/my', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLicenseState),
      });
    });

    await page.route('**/api/licenses/quotas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockQuotas),
      });
    });

    await page.route('**/api/suppliers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSuppliers),
      });
    });

    await page.route('**/api/feeds/jobs/active', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/feeds/suppliers/sup_test_1/sources', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockFeedSources),
      });
    });
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

    // Verify supplier card
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

  test('майстер імпорту фіду: аналіз, вибір категорій з підрахунком SKU та неблокуюче відправлення у чергу', async ({
    page,
  }) => {
    // Mock analyze-url endpoint
    await page.route('**/api/feeds/analyze-url', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAnalysis),
      });
    });

    // Mock import-async endpoint
    await page.route('**/api/feeds/import-async', async (route) => {
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          jobId: 'job_import_999',
          feedSourceId: 'src_feed_1',
          status: 'PENDING',
        }),
      });
    });

    await page.goto('/suppliers');

    // Click on "Підключити фід" on supplier card
    await page.getByTestId('supplier-card-import-btn-sup_test_1').click();

    // Fill URL and click Analyze
    await page
      .getByPlaceholder('https://supplier.com/products_feed.xml')
      .fill('https://livolo.kiev.ua/products_feed.xml');
    await page.getByRole('button', { name: 'Далі до постачальника' }).click();

    // Step 2: Supplier selection
    await expect(page.getByText('Постачальник та правила націнки')).toBeVisible();
    await page.getByRole('button', { name: 'Переглянути товари' }).click();

    // Step 3: Preview and category selection
    await expect(page.getByText('Оберіть категорії для імпорту:')).toBeVisible();
    await expect(page.getByText('Сенсорні вимикачі')).toBeVisible();
    await expect(page.getByText('30 SKU')).toBeVisible();
    await expect(page.getByText('Розумні розетки')).toBeVisible();
    await expect(page.getByText('15 SKU')).toBeVisible();

    // Verify sample products table with solid sticky header
    await expect(page.getByText('Сенсорний вимикач 1-клавішний білий')).toBeVisible();
    await expect(page.getByText('VL-C701-11')).toBeVisible();

    // Start import
    await page.getByRole('button', { name: 'Розпочати імпорт' }).click();

    // Step 4: Background queue execution confirmation
    await expect(page.getByText('Імпорт виконується у фоновому режимі (BullMQ)')).toBeVisible();
    await expect(page.getByText('Продовжити роботу (закрити вікно)')).toBeVisible();

    // Click close to continue work without blocking
    await page.getByRole('button', { name: 'Продовжити роботу (закрити вікно)' }).click();
  });

  test('блокування кнопки імпорту у майстрі фідів при перевищенні ліміту SKU та динамічне розблокування при знятті категорій', async ({
    page,
  }) => {
    // Quota where user has only 40 SKU remaining
    const constrainedQuotas = {
      ...mockQuotas,
      products: {
        used: 60,
        max: 100,
        isUnlimited: false,
        percentUsed: 60,
        isExceeded: false,
        remaining: 40,
      },
    };

    const feedAnalysis = {
      format: 'XML_ROZETKA',
      totalDetected: 55,
      categoriesCount: 2,
      categories: [
        { id: 'cat_1', name: 'Сенсорні вимикачі', productCount: 30 },
        { id: 'cat_2', name: 'Розумні розетки', productCount: 25 },
      ],
      sampleProducts: [
        {
          sku: 'VL-C701-11',
          titleUk: 'Сенсорний вимикач 1-клавішний білий',
          price: 900,
          costPrice: 650,
          inStock: true,
          images: [],
        },
      ],
    };

    await page.route('**/api/licenses/quotas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(constrainedQuotas),
      });
    });

    await page.route('**/api/feeds/analyze-url', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(feedAnalysis),
      });
    });

    let importPayload: any = null;
    await page.route('**/api/feeds/import-async', async (route) => {
      importPayload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          jobId: 'job_constrained_123',
          feedSourceId: 'src_feed_1',
          status: 'PENDING',
        }),
      });
    });

    await page.goto('/suppliers');

    // Open import wizard for supplier 1
    await page.getByTestId('supplier-card-import-btn-sup_test_1').click();

    // Step 1: fill url & next
    await page
      .getByPlaceholder('https://supplier.com/products_feed.xml')
      .fill('https://example.com/feed.xml');
    await page.getByRole('button', { name: 'Далі до постачальника' }).click();

    // Step 2: next to preview
    await page.getByRole('button', { name: 'Переглянути товари' }).click();

    // Step 3: PREVIEW with 55 SKU total vs 40 available
    await expect(page.getByText('Перевищено ліміт товарів тарифу')).toBeVisible();
    await expect(page.getByText('55 SKU').first()).toBeVisible();

    // Assert that the start import button is DISABLED
    const startImportBtn = page.getByRole('button', { name: 'Розпочати імпорт' });
    await expect(startImportBtn).toBeDisabled();

    // Deselect category "Розумні розетки" (25 SKU) -> leaving 30 SKU <= 40 available
    await page.locator('button').filter({ hasText: 'Розумні розетки' }).click();

    // Assert that quota warning disappeared and button is now ENABLED
    await expect(page.getByText('Перевищено ліміт товарів тарифу')).not.toBeVisible();
    await expect(startImportBtn).toBeEnabled();

    // Click start import
    await startImportBtn.click();

    // Verify import payload sent only selected category 'cat_1'
    expect(importPayload).not.toBeNull();
    expect(importPayload.selectedCategoryIds).toEqual(['cat_1']);

    // Reached step 4
    await expect(page.getByText('Імпорт виконується у фоновому режимі (BullMQ)')).toBeVisible();
  });

  test('блокування кнопок додавання постачальника та підключення фідів при вичерпанні лімітів тарифу (з підказками)', async ({
    page,
  }) => {
    // Quotas where suppliers and feeds are at maximum
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

    await page.route('**/api/suppliers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(maxSuppliers),
      });
    });

    await page.goto('/suppliers');

    // Add supplier header button should be disabled
    const addSupplierBtn = page.getByTestId('add-supplier-header-btn');
    await expect(addSupplierBtn).toBeDisabled();
    await expect(addSupplierBtn).toHaveAttribute(
      'title',
      'Ліміт постачальників вичерпано. Підвищіть тариф або видаліть зайвих постачальників.',
    );

    // Import feed header button should be disabled
    const importFeedBtn = page.getByTestId('import-feed-header-btn');
    await expect(importFeedBtn).toBeDisabled();
    await expect(importFeedBtn).toHaveAttribute(
      'title',
      'Ліміт джерел фідів вичерпано. Підвищіть тариф або видаліть зайві фіди.',
    );

    // Supplier card import button should be disabled
    const cardImportBtn = page.getByTestId('supplier-card-import-btn-sup_test_1');
    await expect(cardImportBtn).toBeDisabled();
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

    // Verify delete was triggered
    expect(deleteCalled).toBe(true);
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

    await page.route('**/api/suppliers*', async (route) => {
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
        // Mutate server-side state
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
