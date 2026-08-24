import { test as base } from '@playwright/test';
import { DesktopLoginPage } from '../pages/login.page';
import { DesktopRegisterPage } from '../pages/register.page';
import { DesktopNavigationPage } from '../pages/navigation.page';

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
