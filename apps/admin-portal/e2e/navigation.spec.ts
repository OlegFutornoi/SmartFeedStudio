import { test, expect } from './fixtures/test';
import { mockNavigationItems } from './fixtures/test-data';
import { TargetApp, PlanType } from '@smartfeed/shared';

test.describe('Admin Portal — Navigation & Access Control (POM)', () => {
  test('should render navigation page with header, items list, and live simulator', async ({
    navigationPage,
    page,
  }) => {
    await page.route('**/api/navigation/admin*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockNavigationItems),
      });
    });

    await navigationPage.goto();

    // Verify main page title
    await navigationPage.expectPageTitle('Навігація & Система доступів');

    // Verify items in list
    await navigationPage.expectItemInList('Дашборд');
    await navigationPage.expectItemInList('Каталоги товарів');
    await navigationPage.expectItemInList('AI Збагачення');

    // Verify live simulator
    await expect(navigationPage.simulator.container).toBeVisible();
    await navigationPage.simulator.expectItemVisible('Дашборд');
  });

  test('should switch plan tiers in simulator and dynamically filter items', async ({
    navigationPage,
    page,
  }) => {
    await page.route('**/api/navigation/admin*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockNavigationItems),
      });
    });

    await navigationPage.goto();

    // Default Free plan: PRO items should not be visible in simulator
    await navigationPage.simulator.expectItemVisible('Каталоги товарів');
    await navigationPage.simulator.expectItemHidden('AI Збагачення');
    await navigationPage.simulator.expectItemHidden('Хмарна синхронізація');

    // Switch to PRO plan: PRO item should become visible, Enterprise still hidden
    await navigationPage.simulator.selectPlan(PlanType.PRO);
    await navigationPage.simulator.expectItemVisible('AI Збагачення');
    await navigationPage.simulator.expectItemHidden('Хмарна синхронізація');

    // Switch to Enterprise plan: all items visible
    await navigationPage.simulator.selectPlan(PlanType.ENTERPRISE);
    await navigationPage.simulator.expectItemVisible('AI Збагачення');
    await navigationPage.simulator.expectItemVisible('Хмарна синхронізація');
  });

  test('should filter navigation items by target application', async ({ navigationPage, page }) => {
    await page.route('**/api/navigation/admin*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockNavigationItems),
      });
    });

    await navigationPage.goto();

    // Filter by Desktop
    await navigationPage.filterByApp(TargetApp.DESKTOP);
    await navigationPage.expectItemInList('Каталоги товарів');
    await navigationPage.expectItemNotInList('Користувачі');

    // Filter by Admin
    await navigationPage.filterByApp(TargetApp.ADMIN_PORTAL);
    await navigationPage.expectItemInList('Користувачі');
    await navigationPage.expectItemNotInList('Каталоги товарів');
  });

  test('should toggle interface language between Ukrainian and English', async ({
    navigationPage,
    page,
  }) => {
    await page.route('**/api/navigation/admin*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await navigationPage.goto();

    // Initial Ukrainian title
    await navigationPage.expectPageTitle('Навігація & Система доступів');

    // Toggle language to English
    await navigationPage.header.switchLanguage();
    await navigationPage.expectPageTitle('Navigation & Access Control');

    // Toggle back to Ukrainian
    await navigationPage.header.switchLanguage();
    await navigationPage.expectPageTitle('Навігація & Система доступів');
  });

  test('should translate raw backend errors into user-friendly localized message', async ({
    navigationPage,
    page,
  }) => {
    await page.route('**/api/navigation/admin*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 500,
          message: 'Authentication token is missing or invalid',
        }),
      });
    });

    await navigationPage.goto();

    // Verify translated localized message
    await navigationPage.expectErrorAlert('Сесія застаріла або токен авторизації недійсний');
  });

  test('should navigate via main menu to separated Plans and Licenses pages', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();

    // 1. Verify and click Тарифи in Main Menu
    const mainPlansNav = page.getByTestId('nav-item-plans');
    await expect(mainPlansNav).toBeVisible();
    await expect(mainPlansNav).toContainText('Тарифи');
    await mainPlansNav.click();
    await expect(page).toHaveURL('/plans');
    await expect(page.getByTestId('plans-header-title')).toBeVisible();

    // 2. Verify and click Ліцензії in Main Menu
    const mainLicensesNav = page.getByTestId('nav-item-licenses');
    await expect(mainLicensesNav).toBeVisible();
    await expect(mainLicensesNav).toContainText('Ліцензії');
    await mainLicensesNav.click();
    await expect(page).toHaveURL('/licenses');
    await expect(page.getByTestId('licenses-header-title')).toBeVisible();
  });

  test('should navigate via bottom Settings submenu to Profile, Plans, Payments, and AI', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();

    // 1. Click Тарифи in settings submenu
    const settingsPlansNav = page.getByTestId('nav-item-settings-plans');
    await expect(settingsPlansNav).toBeVisible();
    await settingsPlansNav.click();
    await expect(page).toHaveURL('/plans');
    await expect(page.getByTestId('plans-header-title')).toBeVisible();

    // 2. Click Платіжні системи in settings submenu
    const paymentsNav = page.getByTestId('nav-item-settings-payments');
    await expect(paymentsNav).toBeVisible();
    await paymentsNav.click();
    await expect(page).toHaveURL('/settings/payments');
    await expect(page.getByTestId('payments-header-title')).toBeVisible();

    // 3. Click Налаштування AI in settings submenu
    const aiNav = page.getByTestId('nav-item-settings-ai');
    await expect(aiNav).toBeVisible();
    await aiNav.click();
    await expect(page).toHaveURL('/settings/ai');
    await expect(page.getByTestId('ai-header-title')).toBeVisible();

    // 4. Click Профіль in settings submenu
    const profileNav = page.getByTestId('nav-item-settings-profile');
    await expect(profileNav).toBeVisible();
    await profileNav.click();
    await expect(page).toHaveURL('/settings');
  });
});
