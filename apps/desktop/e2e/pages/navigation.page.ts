import { Page, Locator } from '@playwright/test';

export class DesktopNavigationPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly toggleSidebarButton: Locator;
  readonly logoutButton: Locator;
  readonly userFullName: Locator;
  readonly userEmail: Locator;
  readonly sidebarUserFullName: Locator;
  readonly sidebarUserEmail: Locator;
  readonly licenseBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.getByTestId('desktop-sidebar');
    this.toggleSidebarButton = page.getByTestId('toggle-sidebar-button');
    this.logoutButton = page.getByTestId('logout-button');
    this.userFullName = page.getByTestId('user-fullname');
    this.userEmail = page.getByTestId('user-email');
    this.sidebarUserFullName = page.getByTestId('sidebar-user-fullname');
    this.sidebarUserEmail = page.getByTestId('sidebar-user-email');
    this.licenseBadge = page.getByTestId('license-badge');
  }

  async clickNavItem(key: string): Promise<void> {
    await this.page.getByTestId(`nav-item-${key}`).click();
  }

  async toggleSidebar(): Promise<void> {
    await this.toggleSidebarButton.click();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
