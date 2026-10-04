import { test, expect } from '@playwright/test';
import { setupFeatureTeaserMocks } from '@e2e/fixtures/feature-teaser-mock-data';

test.describe('Desktop App — Feature Teaser Interactive Sandboxes (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await setupFeatureTeaserMocks(page, 'uk');
  });

  test('1. Інтерактивна пісочниця (Mockup): перемикання ролей співробітника та модалка апгрейду', async ({
    page,
  }) => {
    await page.goto('/team');
    await expect(page.locator('[data-testid="interactive-team-mockup"]')).toBeVisible();

    const interactiveRow = page.locator('[data-testid="mockup-interactive-row"]');
    await expect(interactiveRow).toContainText('Адміністратор');

    await page.locator('[data-testid="mockup-select-member"]').click();
    await expect(interactiveRow).toContainText('Менеджер');

    await page.locator('[data-testid="mockup-select-admin"]').click();
    await expect(interactiveRow).toContainText('Адміністратор');

    await page.locator('[data-testid="mockup-invite-btn"]').click();

    const upgradeDialog = page.locator('[data-testid="mockup-upgrade-dialog"]');
    await expect(upgradeDialog).toBeVisible();
    await expect(upgradeDialog).toContainText('Потрібен тариф PRO');

    await page.locator('[data-testid="mockup-confirm-upgrade-btn"]').click();
    await expect(page).toHaveURL(/.*\/plans\?highlight=PRO/);
  });

  test('2. Інтерактивний калькулятор ROI: зміна годин динамічно оновлює заощаджений час та суму', async ({
    page,
  }) => {
    await page.goto('/team');
    const roiWidget = page.locator('[data-testid="feature-roi-widget"]');
    await expect(roiWidget).toBeVisible();

    const slider = page.locator('[data-testid="roi-hours-slider"]');
    await expect(slider).toBeVisible();

    await slider.fill('20');
    await expect(page.locator('[data-testid="roi-slider-value"]')).toHaveText('20 год/тиждень');

    await expect(page.locator('[data-testid="roi-hours-saved-result"]')).toContainText(
      '64 год/міс',
    );
    await expect(page.locator('[data-testid="roi-money-saved-result"]')).toContainText(
      '12,800 грн/міс',
    );
  });

  test('3. AI Асистент: відображається в блоці «Розширити можливості» та відкриває інтерактивний AI Sandbox з підтримкою UA ⇄ EN', async ({
    page,
  }) => {
    await page.goto('/catalogs');

    const upsellSection = page.locator('[data-testid="sidebar-upsell-section"]');
    await expect(upsellSection).toBeVisible();

    const aiItem = upsellSection.locator('[data-testid="nav-item-ai_enrichment"]');
    await expect(aiItem).toBeVisible();
    await expect(aiItem).toContainText('AI Асистент');
    await expect(aiItem).toContainText('GROWTH');

    await aiItem.click();
    await expect(page).toHaveURL(/.*\/ai-enrichment/);
    await expect(page.locator('[data-testid="feature-teaser-page"]')).toBeVisible();

    await expect(page.locator('[data-testid="feature-hero-plan-badge"]')).toContainText(
      'AI & GROWTH',
    );
    await expect(page.locator('[data-testid="feature-hero-title"]')).toContainText(
      'Розумний AI Асистент',
    );

    const aiMockup = page.locator('[data-testid="ai-interactive-mockup"]');
    await expect(aiMockup).toBeVisible();

    const langBtn = page.locator('[data-testid="language-toggle-btn"]');
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await expect(aiItem).toContainText('AI Assistant');
      await expect(page.locator('[data-testid="feature-hero-title"]')).toContainText(
        'Intelligent AI Assistant',
      );
      await langBtn.click();
      await expect(aiItem).toContainText('AI Асистент');
    }

    await page.locator('[data-testid="ai-batch-generate-btn"]').click();
    await expect(page.locator('[data-testid="ai-upgrade-dialog"]')).toBeVisible();
  });
});
