import { test, expect } from '@playwright/test';
import { setupFeedIngestionMocks, mockAnalysis } from '@e2e/fixtures/feed-ingestion-mock-data';

test.describe('Desktop App — Feed Ingestion Wizard Steps (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await setupFeedIngestionMocks(page);
  });

  test('should open Import Feed Wizard and display 4-step wizard', async ({ page }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible({ timeout: 5000 });
    const importBtn = page.getByTestId('supplier-card-import-btn-sup_01');
    await expect(importBtn).toBeVisible({ timeout: 5000 });
    await importBtn.click();

    await expect(page.locator('h2:has-text("Майстер Імпорту Фідів")')).toBeVisible();
    await expect(page.locator('text=Крок 1 з 4: Джерело даних')).toBeVisible();
    // Unified Smart Input & SmartFeed AI Copilot Showcase
    await expect(page.getByTestId('dropzone-feed-upload')).toBeVisible();
    await expect(page.getByTestId('wizard-ai-copilot-showcase')).toBeVisible();
  });

  test('should analyze XML feed URL and proceed to Step 2 & Step 3 with photo preview feedback', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible({ timeout: 5000 });
    const importBtn = page.getByTestId('supplier-card-import-btn-sup_01');
    await expect(importBtn).toBeVisible({ timeout: 5000 });
    await importBtn.click();

    const livoloBtn = page.locator('button:has-text("Тестовий фід Livolo")');
    await expect(livoloBtn).toBeVisible();
    await livoloBtn.click();

    const analyzeBtn = page.locator('button:has-text("Аналізувати")');
    await analyzeBtn.click();
    await expect(page.getByText('Фід успішно проаналізовано')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Далі до постачальника' }).click();

    await expect(page.locator('text=Крок 2 з 4: Постачальник та правила націнки')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId('wizard-supplier-select')).toBeVisible();
    await expect(page.getByTestId('wizard-pricing-simulator')).toBeVisible();
    await expect(page.getByTestId('wizard-supplier-sync-policy-card')).toBeVisible();

    await page.getByRole('button', { name: 'Переглянути товари' }).click();

    await expect(page.locator('text=Крок 3 з 4: Попередній перегляд')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('text=Формат фіду')).toBeVisible();
    await expect(page.locator('text=Знайдено товарів')).toBeVisible();
    await expect(page.getByText('Категорій', { exact: true })).toBeVisible();

    await expect(page.locator('[data-testid="preview-img-container-VL-C701-11"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-photos-status-badge"]')).toBeVisible();

    await page.locator('[data-testid="preview-img-container-VL-C701-11"]').click();
    await expect(page.locator('[data-testid="preview-image-modal"]')).toBeVisible();
    await page.locator('[data-testid="close-preview-image-modal"]').click();
    await expect(page.locator('[data-testid="preview-image-modal"]')).not.toBeVisible();
  });

  test('should upload XML file, automatically analyze and enable Next button to proceed', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible({ timeout: 5000 });
    const importBtn = page.getByTestId('supplier-card-import-btn-sup_01');
    await expect(importBtn).toBeVisible({ timeout: 5000 });
    await importBtn.click();

    const nextBtn = page.locator('button:has-text("Далі до постачальника")');
    await expect(nextBtn).toBeDisabled();

    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="2026-09-12 12:00">
  <shop>
    <categories>
      <category id="1">Смартфони</category>
    </categories>
    <offers>
      <offer id="1" available="true">
        <name>iPhone 15 Pro Max</name>
        <price>45000</price>
        <categoryId>1</categoryId>
      </offer>
    </offers>
  </shop>
</yml_catalog>`;

    await page.setInputFiles('input#feed-file-upload', {
      name: 'mobile_phones_catalog.xml',
      mimeType: 'application/xml',
      buffer: Buffer.from(sampleXml),
    });

    await expect(page.locator('text=mobile_phones_catalog.xml')).toBeVisible();
    // Invariant UI-FEED-01: Next button remains disabled until explicit analysis
    await expect(nextBtn).toBeDisabled();

    // Click Analyze button
    const analyzeFileBtn = page.getByTestId('analyze-file-btn');
    await expect(analyzeFileBtn).toBeVisible();
    await analyzeFileBtn.click();

    await expect(page.locator('text=Введіть посилання на фід')).not.toBeVisible();
    await expect(nextBtn).toBeEnabled({ timeout: 5000 });

    await nextBtn.click();
    await expect(page.locator('text=Крок 2 з 4: Постачальник та правила націнки')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should reject invalid file extensions like .md or .exe with clear error and keep Next disabled', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await page.getByTestId('supplier-card-import-btn-sup_01').click();

    const nextBtn = page.locator('button:has-text("Далі до постачальника")');
    await expect(nextBtn).toBeDisabled();

    await page.setInputFiles('input#feed-file-upload', {
      name: 'attack_vector.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# Hacked Feed\n\n<script>alert(1)</script>'),
    });

    await expect(
      page.getByText(/Непідтримуваний тип файлу.*Дозволені лише формати фідів/),
    ).toBeVisible();
    await expect(nextBtn).toBeDisabled();
  });

  test('should reject 0-SKU empty XML feed with error and keep Next disabled', async ({ page }) => {
    await page.route('**/api/feeds/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          format: 'XML_ROZETKA',
          totalDetected: 0,
          categoriesCount: 0,
          categories: [],
          sampleCategories: [],
          sampleProducts: [],
        }),
      });
    });

    await page.goto('/suppliers');
    await page.getByTestId('supplier-card-import-btn-sup_01').click();

    const nextBtn = page.locator('button:has-text("Далі до постачальника")');
    await expect(nextBtn).toBeDisabled();

    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="2026-09-12 12:00">
  <shop>
    <categories></categories>
    <offers></offers>
  </shop>
</yml_catalog>`;

    await page.setInputFiles('input#feed-file-upload', {
      name: 'empty_catalog.xml',
      mimeType: 'application/xml',
      buffer: Buffer.from(emptyXml),
    });

    const analyzeFileBtn = page.getByTestId('analyze-file-btn');
    await expect(analyzeFileBtn).toBeVisible();
    await analyzeFileBtn.click();

    await expect(page.getByText(/У фіді не знайдено товарів \(0 SKU\)/)).toBeVisible();
    await expect(nextBtn).toBeDisabled();
  });

  test('should have exactly one close button in the wizard header (zero duplicates)', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible({ timeout: 5000 });
    const importBtn = page.getByTestId('supplier-card-import-btn-sup_01');
    await importBtn.click();

    const sheet = page.getByTestId('import-feed-wizard-sheet');
    await expect(sheet).toBeVisible();
    // Authoritative close button with data-testid="wizard-close-btn"
    await expect(sheet.getByTestId('wizard-close-btn')).toBeVisible();
    // Verify that sheet has exactly 1 button containing close SVG icon (no duplicate absolute close button)
    await expect(sheet.locator('button:has(svg.lucide-x)')).toHaveCount(1);
  });

  test('should display interactive AI analysis loader with live phases and skeleton during analysis', async ({
    page,
  }) => {
    // Delay the mock response so we can assert the loader state
    await page.route('**/api/feeds/analyze-url', async (route) => {
      await new Promise((res) => setTimeout(res, 600));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAnalysis),
      });
    });

    await page.goto('/suppliers');
    await page.getByTestId('supplier-card-import-btn-sup_01').click();
    await page.locator('button:has-text("Тестовий фід Livolo")').click();

    const analyzeBtn = page.locator('button:has-text("Аналізувати")');
    await analyzeBtn.click();

    // Verify interactive loader and assistant badge are visible during analysis
    await expect(page.getByTestId('feed-analysis-interactive-loader')).toBeVisible();
    await expect(page.getByText('SmartFeed AI Скенер')).toBeVisible();

    // After analysis resolves, loader disappears and result card shows up
    await expect(page.getByText('Фід успішно проаналізовано')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('feed-analysis-interactive-loader')).not.toBeVisible();
  });

  test('should display autonomous Reverse Margin Cinema on Step 2 with 4 storytelling phases and white photo studio card', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await page.getByTestId('supplier-card-import-btn-sup_01').click();
    await page.locator('button:has-text("Тестовий фід Livolo")').click();

    await page.locator('button:has-text("Аналізувати")').click();
    await expect(page.getByText('Фід успішно проаналізовано')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Далі до постачальника' }).click();

    // Verify cinema showcase container
    const cinema = page.getByTestId('reverse-margin-cinema-showcase');
    await expect(cinema).toBeVisible({ timeout: 5000 });

    // Verify Cinema Header and Auto-play controls
    const cinemaHeading = cinema.getByRole('heading', { level: 4 });
    await expect(cinemaHeading).toBeVisible();
    await expect(cinemaHeading).toContainText('симулятор');
    const playPauseBtn = cinema.getByTestId('cinema-play-pause-btn');
    await expect(playPauseBtn).toBeVisible();

    // Verify active product studio presentation
    await expect(cinema.getByTestId('cinema-product-image')).toBeVisible();
    await expect(cinema.getByText('Rozetka • 15% комісія')).toBeVisible();

    // Verify 4 storytelling phases
    await expect(cinema.getByText(/1\. Закупка/)).toBeVisible();
    await expect(cinema.getByText(/2\. Моя націнка/)).toBeVisible();
    await expect(cinema.getByText(/3\. Пастка комісії/)).toBeVisible();
    await expect(cinema.getByText(/4\. SmartFeed Ціна/)).toBeVisible();

    // Verify guaranteed protection summary
    await expect(cinema.getByText(/SmartFeed захищає продавця/)).toBeVisible();

    // Verify that the old redundant "+ Створити постачальника" button was removed per user request
    await expect(page.getByTestId('wizard-create-supplier-btn')).not.toBeVisible();
  });

  test('should enforce modern desktop UI invariants (UI-08 form hygiene, UI-10 accessible dropzone, UI-12 zero rounded-2xl, UI-13 zero gradient slop)', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('supplier-card-import-btn-sup_01').click();

    const sheet = page.getByTestId('import-feed-wizard-sheet');
    await expect(sheet).toBeVisible();

    // UI-08: URL input must have spellCheck=false and autoComplete=off
    const urlInput = sheet.getByPlaceholder('https://supplier.com/products_feed.xml');
    await expect(urlInput).toHaveAttribute('spellcheck', 'false');
    await expect(urlInput).toHaveAttribute('autocomplete', 'off');

    // UI-08: Feed name input must have autoComplete=off
    const feedNameInput = sheet.getByTestId('wizard-feed-name-input');
    await expect(feedNameInput).toHaveAttribute('autocomplete', 'off');

    // UI-10: Dropzone must be keyboard-accessible with role="button" and tabIndex=0
    const dropzone = sheet.getByTestId('dropzone-feed-upload');
    await expect(dropzone).toHaveAttribute('role', 'button');
    await expect(dropzone).toHaveAttribute('tabindex', '0');

    // UI-12 & UI-13: Zero oversized mobile rounded-2xl or gradient backgrounds inside the wizard sheet on Step 1
    await expect(sheet.locator('.rounded-2xl')).toHaveCount(0);
    const copilotShowcase = sheet.getByTestId('wizard-ai-copilot-showcase');
    await expect(copilotShowcase).not.toHaveClass(/bg-gradient-to/);

    // Navigate to Step 2 and verify UI-10, UI-12, UI-13 invariants on ReverseMarginCinemaShowcase
    await page.locator('button:has-text("Тестовий фід Livolo")').click();
    await page.locator('button:has-text("Аналізувати")').click();
    await expect(page.getByText('Фід успішно проаналізовано')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Далі до постачальника' }).click();

    await expect(sheet.getByTestId('wizard-supplier-select')).toBeVisible();
    await expect(sheet.getByTestId('wizard-supplier-sync-policy-card')).toBeVisible();
    await expect(sheet.locator('.rounded-2xl')).toHaveCount(0);
    await expect(sheet.locator('.rounded-xl')).toHaveCount(0);
    const cinema = sheet.getByTestId('reverse-margin-cinema-showcase');
    await expect(cinema).not.toHaveClass(/bg-gradient-to/);

    // Navigate to Step 3 and verify UI-12, UI-13 invariants on WizardStepPreview & WizardSampleProductsTable
    await page.getByRole('button', { name: 'Переглянути товари' }).click();
    await expect(page.locator('text=Крок 3 з 4: Попередній перегляд')).toBeVisible();
    await expect(sheet.locator('.rounded-2xl')).toHaveCount(0);
    await expect(sheet.locator('.rounded-xl')).toHaveCount(0);
  });
});
