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
});
