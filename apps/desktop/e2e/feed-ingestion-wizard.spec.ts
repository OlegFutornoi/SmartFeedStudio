import { test, expect } from '@playwright/test';
import { setupFeedIngestionMocks } from '@e2e/fixtures/feed-ingestion-mock-data';

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
    await expect(page.locator('button:has-text("Посилання на фід (URL)")')).toBeVisible();
    await expect(page.locator('button:has-text("Завантажити файл")')).toBeVisible();
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
    await expect(page.locator('text=Правила націнки цього постачальника')).toBeVisible();

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

    const fileTabBtn = page.locator('button:has-text("Завантажити файл")');
    await expect(fileTabBtn).toBeVisible();
    await fileTabBtn.click();

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
    await expect(nextBtn).toBeEnabled({ timeout: 5000 });

    await nextBtn.click();
    await expect(page.locator('text=Крок 2 з 4: Постачальник та правила націнки')).toBeVisible({
      timeout: 5000,
    });
  });
});
