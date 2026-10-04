import { Page, Locator } from '@playwright/test';
import { BasePage } from '@e2e/pages/base.page';

export class AdminDashboardPage extends BasePage {
  readonly overviewPage: Locator;
  readonly welcomeBanner: Locator;
  readonly statCardTotalUsers: Locator;
  readonly statValueTotalUsers: Locator;
  readonly statCardActiveLicenses: Locator;
  readonly statValueActiveLicenses: Locator;
  readonly statCardStorage: Locator;
  readonly statCardDatabase: Locator;
  readonly recentUsersCard: Locator;
  readonly recentUsersTitle: Locator;
  readonly recentUsersSubtitle: Locator;
  readonly recentUsersTable: Locator;
  readonly viewAllUsersBtn: Locator;
  readonly langToggleBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.overviewPage = page.getByTestId('dashboard-overview-page');
    this.welcomeBanner = page.getByTestId('dashboard-overview-page');

    this.statCardTotalUsers = page.getByTestId('stat-card-total-users');
    this.statValueTotalUsers = page.getByTestId('stat-value-total-users');
    this.statCardActiveLicenses = page.getByTestId('stat-card-active-licenses');
    this.statValueActiveLicenses = page.getByTestId('stat-value-active-licenses');
    this.statCardStorage = page.getByTestId('stat-card-storage');
    this.statCardDatabase = page.getByTestId('stat-card-database');

    this.recentUsersCard = page.getByTestId('dashboard-recent-users-card');
    this.recentUsersTitle = page.getByTestId('recent-users-title');
    this.recentUsersSubtitle = page.getByTestId('recent-users-subtitle');
    this.recentUsersTable = page.getByTestId('recent-users-table');
    this.viewAllUsersBtn = page.getByTestId('view-all-users-btn');
    this.langToggleBtn = page.getByTestId('language-toggle-btn');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.statCardTotalUsers.waitFor({ state: 'visible', timeout: 15000 });
  }

  async toggleLanguage(): Promise<void> {
    await this.langToggleBtn.click();
  }
}
