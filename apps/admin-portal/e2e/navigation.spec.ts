import { test, expect } from '@e2e/fixtures/test';
import { mockNavigationItems } from '@e2e/fixtures/test-data';
import { TargetApp, PlanType } from '@smartfeed/shared';

test.describe('Admin Portal — Navigation & Access Control (POM)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/navigation/admin*', async (route) => {
      const url = route.request().url();
      if (url.includes('app=ADMIN_PORTAL')) {
        const adminItems = mockNavigationItems.filter(
          (i) => i.targetApp === TargetApp.ADMIN_PORTAL,
        );
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(adminItems),
        });
      } else if (url.includes('app=DESKTOP')) {
        const desktopItems = mockNavigationItems.filter((i) => i.targetApp === TargetApp.DESKTOP);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(desktopItems),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockNavigationItems),
        });
      }
    });

    await page.route('**/api/plans/admin*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/licenses/admin*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
  });

  test('should render navigation page with header, items list, and live simulator', async ({
    navigationPage,
  }) => {
    await navigationPage.goto();

    // Verify main page title
    await navigationPage.expectPageTitle('Навігація & Система доступів');

    // Verify items in list
    await navigationPage.expectItemInList('Дашборд');
    await navigationPage.expectItemInList('Каталоги товарів');
    await navigationPage.expectItemInList('AI Асистент');

    // Verify live simulator
    await expect(navigationPage.simulator.container).toBeVisible();
    await navigationPage.simulator.expectItemVisible('Дашборд');

    await navigationPage.page.screenshot({
      path: 'test-results/navigation-page-clean.png',
      fullPage: true,
    });
  });

  test('should switch plan tiers in simulator and dynamically filter items', async ({
    navigationPage,
  }) => {
    await navigationPage.goto();

    // Default Free plan: PRO items should not be visible in simulator
    await navigationPage.simulator.expectItemVisible('Каталоги товарів');
    await navigationPage.simulator.expectItemHidden('AI Асистент');
    await navigationPage.simulator.expectItemHidden('Хмарна синхронізація');

    // Switch to PRO plan: PRO item should become visible, Enterprise still hidden
    await navigationPage.simulator.selectPlan(PlanType.PRO);
    await navigationPage.simulator.expectItemVisible('AI Асистент');
    await navigationPage.simulator.expectItemHidden('Хмарна синхронізація');

    // Switch to Enterprise plan: all items visible
    await navigationPage.simulator.selectPlan(PlanType.ENTERPRISE);
    await navigationPage.simulator.expectItemVisible('AI Асистент');
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

  test('should display and reorder admin navigation items when filtering by Admin', async ({
    navigationPage,
    page,
  }) => {
    let reorderPayload: { items: Array<{ id: string; order?: number }> } | undefined;
    await page.route('**/api/navigation/reorder*', async (route) => {
      reorderPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await navigationPage.goto();

    // Filter by Admin
    await navigationPage.filterByApp(TargetApp.ADMIN_PORTAL);

    // All 5 admin items should be visible
    await navigationPage.expectItemInList('Дашборд');
    await navigationPage.expectItemInList('Користувачі');
    await navigationPage.expectItemInList('Тарифи');
    await navigationPage.expectItemInList('Ліцензії');
    await navigationPage.expectItemInList('Навігація');

    // Reorder: move first item (Dashboard) down
    const moveDownDashboardBtn = page.getByTestId('move-down-admin_dashboard');
    await expect(moveDownDashboardBtn).toBeVisible();
    await moveDownDashboardBtn.click();

    // Verify reorder API was called with correct items
    expect(reorderPayload).not.toBeNull();
    if (!reorderPayload) throw new Error('reorderPayload is null');
    expect(reorderPayload.items).toHaveLength(5);
    expect(reorderPayload.items[0].id).toBe('b0000000-0000-0000-0000-000000000006'); // admin_users
    expect(reorderPayload.items[1].id).toBe('b0000000-0000-0000-0000-000000000005'); // admin_dashboard

    await page.screenshot({
      path: 'test-results/admin-navigation-reordered.png',
      fullPage: true,
    });
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
    await expect(page.getByTestId('dashboard-overview-page')).toBeVisible();

    // 1. Verify and click Тарифи in Main Menu
    const mainPlansNav = page.locator('aside').getByTestId('nav-item-plans');
    await expect(mainPlansNav).toBeVisible();
    await expect(mainPlansNav).toContainText('Тарифи');
    await mainPlansNav.click();
    await expect(page).toHaveURL(/.*\/plans/);
    await expect(page.getByTestId('plans-header-title')).toBeVisible();

    // 2. Verify and click Ліцензії in Main Menu
    const mainLicensesNav = page.locator('aside').getByTestId('nav-item-licenses');
    await expect(mainLicensesNav).toBeVisible();
    await expect(mainLicensesNav).toContainText('Ліцензії');
    await mainLicensesNav.click();
    await expect(page).toHaveURL(/.*\/licenses/);
    await expect(page.getByTestId('licenses-header-title')).toBeVisible();
  });

  test('should navigate via bottom Settings link to Profile and Security settings', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('dashboard-overview-page')).toBeVisible();

    // Click Налаштування in bottom sidebar
    const profileNav = page.locator('aside').getByTestId('nav-item-settings-profile');
    await expect(profileNav).toBeVisible();
    await profileNav.click();
    await page.waitForURL('**/settings');
    await expect(page).toHaveURL(/.*\/settings/);
    await expect(page.getByTestId('settings-header-title')).toBeVisible();
  });
});
