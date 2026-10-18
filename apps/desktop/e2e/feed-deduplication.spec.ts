import { test, expect } from '@playwright/test';
import { setupFeedIngestionMocks } from '@e2e/fixtures/feed-ingestion-mock-data';

test.describe('Desktop App — Feed Deduplication & Collision Prevention (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await setupFeedIngestionMocks(page);
  });

  test('should display feed name input and uniqueness status in Import Feed Wizard', async ({
    page,
  }) => {
    await page.goto('/catalogs');
    await expect(page.getByTestId('catalogs-page')).toBeVisible({ timeout: 5000 });

    const importBtn = page
      .locator(
        '[data-testid="catalogs-import-feed-btn"], button:has-text("Імпортувати перший фід")',
      )
      .first();
    await expect(importBtn).toBeVisible({ timeout: 5000 });
    await importBtn.click();

    // Verify wizard opened
    await expect(page.getByTestId('import-feed-wizard-sheet')).toBeVisible({ timeout: 5000 });

    // Click test Livolo URL
    const livoloBtn = page.locator('button:has-text("Тестовий фід Livolo")');
    await expect(livoloBtn).toBeVisible();
    await livoloBtn.click();

    // Feed name input should be visible
    const feedNameInput = page.getByTestId('wizard-feed-name-input');
    await expect(feedNameInput).toBeVisible();

    // Analyze URL
    const analyzeBtn = page.locator('button:has-text("Аналізувати")');
    await analyzeBtn.click();
    await expect(page.getByText('Фід успішно проаналізовано')).toBeVisible({ timeout: 5000 });

    // Check that uniqueness badge or collision status is shown
    const uniqueBadge = page.getByTestId('feed-unique-badge');
    const duplicateWarning = page.getByTestId('feed-duplicate-warning');

    const isEitherVisible = (await uniqueBadge.isVisible()) || (await duplicateWarning.isVisible());
    expect(isEitherVisible).toBe(true);
  });

  test('should immediately detect duplicate feed, display duplicate warning, and block Next button', async ({
    page,
  }) => {
    await page.goto('/catalogs');
    await expect(page.getByTestId('catalogs-page')).toBeVisible({ timeout: 5000 });

    // Seed existing supplier and feed into mock database before test
    await page.evaluate(() => {
      const mockDb = (
        window as unknown as {
          __MOCK_LOCAL_DB__?: {
            state: { suppliers: Array<{ id: string }> };
            createSupplier: (payload: unknown) => { id: string };
            createFeedSource: (id: string, payload: unknown) => void;
          };
        }
      ).__MOCK_LOCAL_DB__;
      if (mockDb && mockDb.state) {
        let supId = mockDb.state.suppliers[0]?.id;
        if (!supId) {
          const sup = mockDb.createSupplier({
            id: 'sup_01',
            name: 'Одяг-Опт Україна',
            code: 'SUP-01',
            defaultMarginPercent: 15,
            defaultFixedMarkup: 0,
          });
          supId = sup.id;
        }
        mockDb.createFeedSource(supId, {
          name: 'livolo.kiev.ua',
          url: 'https://livolo.kiev.ua/products_feed.xml',
          productsCount: 5002,
        });
      }
    });

    const importBtn = page
      .locator(
        '[data-testid="catalogs-import-feed-btn"], button:has-text("Імпортувати перший фід")',
      )
      .first();
    await expect(importBtn).toBeVisible({ timeout: 5000 });
    await importBtn.click();

    // Verify wizard opened
    await expect(page.getByTestId('import-feed-wizard-sheet')).toBeVisible({ timeout: 5000 });

    // Click test Livolo URL
    const livoloBtn = page.locator('button:has-text("Тестовий фід Livolo")');
    await expect(livoloBtn).toBeVisible();
    await livoloBtn.click();

    // Collision check should immediately trigger and show duplicate warning without clicking "Аналізувати"
    const duplicateWarning = page.getByTestId('feed-duplicate-warning');
    await expect(duplicateWarning).toBeVisible({ timeout: 5000 });

    // Uniqueness badge must NOT be visible
    const uniqueBadge = page.getByTestId('feed-unique-badge');
    await expect(uniqueBadge).not.toBeVisible();

    // Analyze button must be disabled when duplicate is detected ("зроби її неактивною")
    const analyzeBtn = page.locator('button:has-text("Аналізувати")');
    await expect(analyzeBtn).toBeDisabled();

    // Analysis card must NOT be displayed
    await expect(page.getByText('Фід успішно проаналізовано')).not.toBeVisible();

    // Duplicate warning remains visible and next button remains disabled
    await expect(duplicateWarning).toBeVisible();
    const nextBtn = page.locator('button:has-text("Далі до постачальника")');
    await expect(nextBtn).toBeDisabled();
  });

  test('should detect duplicate file and block analysis without parsing', async ({ page }) => {
    await page.goto('/catalogs');
    await expect(page.getByTestId('catalogs-page')).toBeVisible({ timeout: 5000 });

    // Seed existing file feed into mock database before test
    await page.evaluate(() => {
      const mockDb = (
        window as unknown as {
          __MOCK_LOCAL_DB__?: {
            state: { suppliers: Array<{ id: string }> };
            createSupplier: (payload: unknown) => { id: string };
            createFeedSource: (id: string, payload: unknown) => void;
          };
        }
      ).__MOCK_LOCAL_DB__;
      if (mockDb && mockDb.state) {
        let supId = mockDb.state.suppliers[0]?.id;
        if (!supId) {
          const sup = mockDb.createSupplier({
            id: 'sup_01',
            name: 'Одяг-Опт Україна',
            code: 'SUP-01',
            defaultMarginPercent: 15,
            defaultFixedMarkup: 0,
          });
          supId = sup.id;
        }
        mockDb.createFeedSource(supId, {
          name: 'catalog_existing.xml',
          productsCount: 150,
        });
      }
    });

    const importBtn = page
      .locator(
        '[data-testid="catalogs-import-feed-btn"], button:has-text("Імпортувати перший фід")',
      )
      .first();
    await importBtn.click();

    // Select duplicate file
    const fileInput = page.locator('#feed-file-upload');
    await fileInput.setInputFiles({
      name: 'catalog_existing.xml',
      mimeType: 'application/xml',
      buffer: Buffer.from('<yml_catalog><shop><offers></offers></shop></yml_catalog>'),
    });

    // Duplicate warning should appear
    await expect(page.getByTestId('feed-duplicate-warning')).toBeVisible({ timeout: 5000 });
    const nextBtn = page.locator('button:has-text("Далі до постачальника")');
    await expect(nextBtn).toBeDisabled();
  });

  test('should allow custom feed name editing before advancing', async ({ page }) => {
    await page.goto('/catalogs');
    await expect(page.getByTestId('catalogs-page')).toBeVisible({ timeout: 5000 });

    const importBtn = page
      .locator(
        '[data-testid="catalogs-import-feed-btn"], button:has-text("Імпортувати перший фід")',
      )
      .first();
    await expect(importBtn).toBeVisible({ timeout: 5000 });
    await importBtn.click();

    const feedNameInput = page.getByTestId('wizard-feed-name-input');
    await expect(feedNameInput).toBeVisible();

    // Type a custom name
    await feedNameInput.fill('Livolo Офіційний Каталог 2026');
    expect(await feedNameInput.inputValue()).toBe('Livolo Офіційний Каталог 2026');
  });
});
