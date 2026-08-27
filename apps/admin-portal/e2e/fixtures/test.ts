import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { NavigationPage } from '../pages/navigation.page';
import { AdminSettingsPage } from '../pages/settings.page';
import { AdminLicensesPage } from '../pages/licenses.page';
import { AdminPlansPage } from '../pages/plans.page';
import { AdminDashboardPage } from '../pages/dashboard.page';
import { AdminUsersPage } from '../pages/users.page';
import { mockAdminUser } from './test-data';

type AdminPortalFixtures = {
  loginPage: LoginPage;
  navigationPage: NavigationPage;
  settingsPage: AdminSettingsPage;
  licensesPage: AdminLicensesPage;
  plansPage: AdminPlansPage;
  dashboardPage: AdminDashboardPage;
  usersPage: AdminUsersPage;
  mockAuth: void;
};

export const test = base.extend<AdminPortalFixtures>({
  // Automatically inject mock authentication and getMe API handler
  mockAuth: [
    async ({ page }, use) => {
      await page.route('**/api/auth/me*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockAdminUser),
        });
      });

      await page.addInitScript(() => {
        localStorage.setItem('smartfeed_admin_token', 'mock_admin_token_for_playwright_test');
      });

      await use();
    },
    { auto: true },
  ],

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  navigationPage: async ({ page }, use) => {
    await use(new NavigationPage(page));
  },

  settingsPage: async ({ page }, use) => {
    await use(new AdminSettingsPage(page));
  },

  licensesPage: async ({ page }, use) => {
    await use(new AdminLicensesPage(page));
  },

  plansPage: async ({ page }, use) => {
    await use(new AdminPlansPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new AdminDashboardPage(page));
  },

  usersPage: async ({ page }, use) => {
    await use(new AdminUsersPage(page));
  },
});

export { expect } from '@playwright/test';
