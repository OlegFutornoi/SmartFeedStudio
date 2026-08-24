import { test, expect } from './fixtures/test';

test.describe('Admin Portal — Сучасні теми shadcn/ui та монохромна схема за замовчуванням (POM)', () => {
  test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
      window.localStorage.removeItem('smartfeed_theme_mode');
      window.localStorage.removeItem('smartfeed_theme_accent');
    });
  });

  test('дефолтна тема: ініціалізація монохромної теми Zinc за замовчуванням та dark mode', async ({
    settingsPage,
    page,
  }) => {
    await settingsPage.goto();

    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);
    await expect(htmlElement).toHaveAttribute('data-accent', 'zinc');
    await expect(settingsPage.accentDropdownTrigger).toContainText(/Zinc/);
  });

  test('випадаючий список тем shadcn: динамічна зміна теми на Slate, Stone, Bronze та збереження', async ({
    settingsPage,
    page,
  }) => {
    await settingsPage.goto();

    // 1. Select Slate
    await settingsPage.selectAccentColor('slate');
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'slate');
    await expect(settingsPage.accentDropdownTrigger).toContainText(/Slate/);

    // 2. Select Stone
    await settingsPage.selectAccentColor('stone');
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'stone');
    await expect(settingsPage.accentDropdownTrigger).toContainText(/Stone/);

    // 3. Select Bronze
    await settingsPage.selectAccentColor('bronze');
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'bronze');
    await expect(settingsPage.accentDropdownTrigger).toContainText(/Bronze/);

    // 4. Return to Default Zinc
    await settingsPage.selectAccentColor('zinc');
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'zinc');
    await expect(settingsPage.accentDropdownTrigger).toContainText(/Zinc/);
  });
});
