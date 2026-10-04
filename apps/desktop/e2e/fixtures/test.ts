import { test as base } from '@playwright/test';
import { DesktopLoginPage } from '@e2e/pages/login.page';
import { DesktopRegisterPage } from '@e2e/pages/register.page';
import { DesktopNavigationPage } from '@e2e/pages/navigation.page';

type DesktopFixtures = {
  loginPage: DesktopLoginPage;
  registerPage: DesktopRegisterPage;
  navigationPage: DesktopNavigationPage;
};

export const test = base.extend<DesktopFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new DesktopLoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new DesktopRegisterPage(page));
  },
  navigationPage: async ({ page }, use) => {
    await use(new DesktopNavigationPage(page));
  },
});

export { expect } from '@playwright/test';
