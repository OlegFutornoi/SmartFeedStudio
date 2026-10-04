import { test, expect } from '@playwright/test';
import {
  constrainedFeedAnalysis,
  constrainedQuotas,
  setupSuppliersFeedsRoutes,
} from '@e2e/fixtures/suppliers-feeds-mock-data';

test.describe('Desktop App — Майстер імпорту фідів (Feed Ingestion Wizard)', () => {
  test.beforeEach(async ({ page }) => {
    await setupSuppliersFeedsRoutes(page);
  });

  test('майстер імпорту фіду: аналіз, вибір категорій з підрахунком SKU та неблокуюче відправлення у чергу', async ({
    page,
  }) => {
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
    await page.getByRole('button', { name: 'Аналізувати' }).click();
    await expect(page.getByText('Фід успішно проаналізовано')).toBeVisible();
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

  test('перемикання постачальника у майстрі імпорту фідів успішно обирає іншого постачальника, оновлює правила націнки та не скидає вибір', async ({
    page,
  }) => {
    await page.goto('/suppliers');

    // Click on "Підключити фід" on first supplier card (Livolo)
    await page.getByTestId('supplier-card-import-btn-sup_test_1').click();

    // Step 1: Fill feed URL and click Analyze
    await page
      .getByPlaceholder('https://supplier.com/products_feed.xml')
      .fill('https://mobioptom.com/price/allcategories.xml');
    await page.getByRole('button', { name: 'Аналізувати' }).click();
    await expect(page.getByText('Фід успішно проаналізовано')).toBeVisible();
    await page.getByRole('button', { name: 'Далі до постачальника' }).click();

    // Step 2: Verify Step 2 is active
    await expect(page.getByText('Постачальник та правила націнки')).toBeVisible();

    // Verify initial selection is Livolo
    const selectTrigger = page.getByTestId('wizard-supplier-select');
    await expect(selectTrigger).toContainText('Livolo Офіційний');
    const markupBadge = page.getByTestId('wizard-selected-supplier-markup');
    await expect(markupBadge).toContainText('+25%');
    await expect(markupBadge).toContainText('+100 ₴');

    // Open supplier select dropdown
    await selectTrigger.click();

    // Click second supplier option (Mobioptom)
    const mobiOption = page.getByTestId('wizard-supplier-option-sup_test_2');
    await expect(mobiOption).toBeVisible();
    await mobiOption.click();

    // Assert that the select trigger updated to Mobioptom
    await expect(selectTrigger).toContainText('Mobioptom');

    // Assert that the selected supplier card updated to Mobioptom's markup (0%)
    await expect(markupBadge).toContainText('0% (Базова ціна)');
    const card = page.getByTestId('wizard-selected-supplier-card');
    await expect(card).toContainText('MOBI');

    // Click next to Step 3 (Preview)
    await page.getByRole('button', { name: 'Переглянути товари' }).click();
    await expect(page.getByText('Оберіть категорії для імпорту:')).toBeVisible();

    // Click back to Step 2
    await page.getByRole('button', { name: 'Назад' }).click();
    await expect(page.getByText('Постачальник та правила націнки')).toBeVisible();

    // Critical assertion: Supplier selection MUST NOT have reverted to Livolo!
    await expect(selectTrigger).toContainText('Mobioptom');
    await expect(markupBadge).toContainText('0% (Базова ціна)');

    // Assert checkboxes
    const priceCheckbox = page.getByTestId('wizard-auto-update-prices-checkbox');
    const stockCheckbox = page.getByTestId('wizard-auto-update-stocks-checkbox');
    await expect(priceCheckbox).toBeChecked();
    await expect(stockCheckbox).toBeChecked();
    await expect(priceCheckbox).toHaveClass(/accent-primary/);
    await expect(stockCheckbox).toHaveClass(/accent-primary/);

    // Close wizard
    await page.getByTestId('wizard-close-btn').click();
  });

  test('блокування кнопки імпорту у майстрі фідів при перевищенні ліміту SKU та динамічне розблокування при знятті категорій', async ({
    page,
  }) => {
    await page.route('**/api/licenses/quotas', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(constrainedQuotas),
      });
    });

    await page.route(/\/api\/products(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 60 }),
      });
    });

    await page.route('**/api/feeds/analyze-url', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(constrainedFeedAnalysis),
      });
    });

    let importPayload: Record<string, unknown> | null = null;
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
    await expect(page.getByTestId('suppliers-page')).toBeVisible({ timeout: 5000 });

    // Open import wizard for supplier 1
    await page.getByTestId('supplier-card-import-btn-sup_test_1').click();

    // Step 1: fill url, analyze & next
    await page
      .getByPlaceholder('https://supplier.com/products_feed.xml')
      .fill('https://example.com/feed.xml');
    await page.getByRole('button', { name: 'Аналізувати' }).click();
    await expect(page.getByText('Фід успішно проаналізовано')).toBeVisible();
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

    expect(importPayload).not.toBeNull();
    expect((importPayload as Record<string, unknown> | null)?.selectedCategoryIds).toEqual([
      'cat_1',
    ]);

    // Reached step 4
    await expect(page.getByText('Імпорт виконується у фоновому режимі (BullMQ)')).toBeVisible();
  });

  test('майстер імпорту фіду: при відсутності постачальників відображає картку-попередження замість випадашки та дозволяє створити постачальника', async ({
    page,
  }) => {
    await page.route(/\/api\/suppliers(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/catalogs');

    // Click Import Feed
    await page.getByRole('button', { name: /Підключити фід|Імпортувати.*фід/i }).click();

    // Step 1: fill url, analyze & next
    await page
      .getByPlaceholder('https://supplier.com/products_feed.xml')
      .fill('https://example.com/feed.xml');
    await page.getByRole('button', { name: 'Аналізувати' }).click();
    await expect(page.getByText('Фід успішно проаналізовано')).toBeVisible();
    await page.getByRole('button', { name: 'Далі до постачальника' }).click();

    // Step 2: ASSERT empty state warning card is displayed
    await expect(page.getByTestId('no-suppliers-warning')).toBeVisible();
    await expect(page.getByText('Постачальників ще не додано')).toBeVisible();
    await expect(page.getByTestId('wizard-supplier-select')).not.toBeVisible();

    // "Переглянути товари" button is disabled
    const nextBtn = page.getByRole('button', { name: 'Переглянути товари' });
    await expect(nextBtn).toBeDisabled();

    // Click "+ Створити постачальника" in wizard
    const createSupplierBtn = page.getByTestId('wizard-create-supplier-btn');
    await expect(createSupplierBtn).toBeVisible();
    await createSupplierBtn.click();

    // Modal opens
    await expect(page.getByRole('heading', { name: 'Новий постачальник' })).toBeVisible();
  });

  test('майстер імпорту фіду: коректна обробка помилок мережі/таймауту без накладання попереднього результату та без англійських рядків', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await page.getByTestId('supplier-card-import-btn-sup_test_1').click();

    const input = page.getByPlaceholder('https://supplier.com/products_feed.xml');
    await input.fill('https://livolo.kiev.ua/products_feed.xml');
    await page.getByRole('button', { name: 'Аналізувати' }).click();

    // Verify success card is visible
    await expect(page.getByText('Фід успішно проаналізовано')).toBeVisible();

    // Mock fails with network timeout on second attempt
    await page.route('**/api/feeds/analyze-url', async (route) => {
      await route.abort('timedout');
    });

    await input.fill('https://broken-supplier.com/feed.xml');
    await page.getByRole('button', { name: 'Аналізувати' }).click();

    // Assert green card from previous feed is completely gone
    await expect(page.getByText('Фід успішно проаналізовано')).not.toBeVisible();

    // Assert localized error message is displayed
    await expect(
      page.getByText(/Час очікування відповіді сервера фіду вичерпано|Не вдалося завантажити фід/),
    ).toBeVisible();
    await expect(page.getByText('Failed to fetch')).not.toBeVisible();
  });
});
