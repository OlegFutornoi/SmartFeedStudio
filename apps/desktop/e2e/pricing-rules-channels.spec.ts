import { test, expect } from '@playwright/test';
import {
  mockSupplier,
  setupPricingChannelsRoutes,
  type PricingChannelsState,
} from '@e2e/fixtures/pricing-channels-mock-data';

test.describe('Desktop App — Multi-Tier Pricing Rules & Marketplace Reverse Margin Engine', () => {
  const state: PricingChannelsState = {
    rules: [],
    channels: [],
  };

  test.beforeEach(async ({ page }) => {
    state.rules = [];
    state.channels = [];
    await setupPricingChannelsRoutes(page, state);
  });

  test('1. should open Supplier Pricing Rules modal and test interactive Live Price Simulator', async ({
    page,
  }) => {
    await page.goto('/suppliers');

    // Verify supplier card renders markup pill
    const markupPill = page.locator(
      `[data-testid="supplier-pricing-rules-btn-${mockSupplier.id}"]`,
    );
    await expect(markupPill).toBeVisible();
    await expect(markupPill).toContainText('+20% +10 ₴');

    // Click to open pricing rules modal
    await markupPill.click();

    // Verify modal elements
    await expect(page.locator('text=Правила націнки: Tech Master Supplier')).toBeVisible();
    await expect(page.locator('text=Інтерактивний калькулятор вхідної націнки')).toBeVisible();

    // Ingestion simulation with default markup (+20% + 10₴ on 500₴)
    // 500 * 1.20 + 10 = 610 ₴ (+110 ₴)
    await expect(page.locator('text=610 ₴')).toBeVisible();
    await expect(page.locator('text=(+110 ₴)')).toBeVisible();

    // Add a Category Rule (+30%, +50₴ for Electronics)
    await page.locator('[data-testid="submit-pricing-rule-btn"]').click();

    // Assert created rule in list
    await expect(page.locator('text=Категорія: Електроніка')).toBeVisible();
    await expect(page.locator('[data-testid^="delete-pricing-rule-"]').first()).toBeVisible();

    // Delete rule
    const deleteBtn = page.locator('[data-testid^="delete-pricing-rule-"]').first();
    await deleteBtn.click();
    await expect(page.locator('text=Спеціальних правил ще немає')).toBeVisible();
  });

  test('2. should navigate to CatalogsPage, open Export Channels tab, and create marketplace feed with reverse markup', async ({
    page,
  }) => {
    await page.goto('/catalogs');

    // Click tab "Канали експорту та Маркетплейси"
    const tabChannels = page.locator('[data-testid="tab-export-channels"]');
    await expect(tabChannels).toBeVisible();
    await tabChannels.click();

    // Click "Підключити маркетплейс"
    const connectBtn = page.locator('[data-testid="create-export-channel-btn"]');
    await expect(connectBtn).toBeVisible();
    await connectBtn.click();

    // Verify Modal & Live Profit Simulator
    await expect(page.locator('text=Створити канал експорту для маркетплейсу')).toBeVisible();
    await expect(page.locator('text=Симулятор маржинальності та чистого заробітку')).toBeVisible();

    // Set Commission = 15% and verify Reverse Margin formula:
    // Cost 1000, Supplier 25% -> Base = 1250
    // Shelf = 1250 / (1 - 0.15) = 1470.59 ₴
    // Net profit = 1470.59 - 220.59 - 1000 = +250 ₴ (+25%)
    await expect(page.locator('text=1470.59 ₴')).toBeVisible();
    await expect(page.locator('text=+250 ₴ (25%)')).toBeVisible();

    // Submit dialog
    await page.locator('[data-testid="save-export-channel-btn"]').click();

    // Verify Export Channel Card appeared
    await expect(page.locator('text=Rozetka — Основний фід')).toBeVisible();
    await expect(page.getByText('ROZETKA', { exact: true })).toBeVisible();
    await expect(page.locator('text=Reverse Markup (100% прибутку)')).toBeVisible();
    await expect(page.locator('text=Завантажити фід')).toBeVisible();

    // Test Copy Feed URL
    const copyBtn = page.locator('[data-testid^="copy-feed-url-btn-"]').first();
    await copyBtn.click();
  });

  test('3. should support dynamic localization without raw translation keys', async ({ page }) => {
    await page.goto('/catalogs');

    const tabChannels = page.locator('[data-testid="tab-export-channels"]');
    await tabChannels.click();

    // Verify no raw translation keys on screen
    const pageText = await page.innerText('body');
    expect(pageText).not.toContain('catalogs:');
    expect(pageText).not.toContain('suppliers:');
    expect(pageText).not.toContain('common:');
  });
});
