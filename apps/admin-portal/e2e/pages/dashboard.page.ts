import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class AdminDashboardPage extends BasePage {
  readonly welcomeBanner: Locator;
  readonly welcomeTitle: Locator;
  readonly welcomeSubtitle: Locator;
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
  readonly quickActionsPanel: Locator;
  readonly quickActionsTitle: Locator;
  readonly actionBtnUsers: Locator;
  readonly actionBtnLicenses: Locator;
  readonly actionBtnChangePwd: Locator;
  readonly securityNotice: Locator;
  readonly securityNoticeTitle: Locator;
  readonly changePasswordModal: Locator;
  readonly langToggleBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.welcomeBanner = page.getByTestId('dashboard-welcome-banner');
    this.welcomeTitle = page.getByTestId('dashboard-welcome-title');
    this.welcomeSubtitle = page.getByTestId('dashboard-welcome-subtitle');

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

    this.quickActionsPanel = page.getByTestId('dashboard-quick-actions-panel');
    this.quickActionsTitle = page.getByTestId('quick-actions-title');
    this.actionBtnUsers = page.getByTestId('action-btn-users');
    this.actionBtnLicenses = page.getByTestId('action-btn-licenses');
    this.actionBtnChangePwd = page.getByTestId('action-btn-change-pwd');
    this.securityNotice = page.getByTestId('dashboard-security-notice');
    this.securityNoticeTitle = page.getByTestId('security-notice-title');

    this.changePasswordModal = page.getByTestId('change-password-modal');
    this.langToggleBtn = page.getByTestId('language-toggle-btn');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.welcomeBanner.waitFor({ state: 'visible', timeout: 15000 });
  }

  async toggleLanguage(): Promise<void> {
    await this.langToggleBtn.click();
  }
}
