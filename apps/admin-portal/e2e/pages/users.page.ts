import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class AdminUsersPage extends BasePage {
  readonly headerTitle: Locator;
  readonly headerSubtitle: Locator;
  readonly countBadge: Locator;
  readonly refreshBtn: Locator;
  readonly searchInput: Locator;
  readonly roleFilterGroup: Locator;
  readonly tableCard: Locator;
  readonly dataTable: Locator;
  readonly emptyState: Locator;
  readonly langToggleBtn: Locator;

  readonly thUser: Locator;
  readonly thRole: Locator;
  readonly thPlan: Locator;
  readonly thQuotas: Locator;
  readonly thStatus: Locator;
  readonly thCreated: Locator;

  constructor(page: Page) {
    super(page);
    this.headerTitle = page.getByTestId('users-header-title');
    this.headerSubtitle = page.getByTestId('users-header-subtitle');
    this.countBadge = page.getByTestId('users-count-badge');
    this.refreshBtn = page.getByTestId('refresh-users-btn');
    this.searchInput = page.getByTestId('users-search-input');
    this.roleFilterGroup = page.getByTestId('user-role-filter-group');
    this.tableCard = page.getByTestId('users-table-card');
    this.dataTable = page.getByTestId('users-data-table');
    this.emptyState = page.getByTestId('users-empty-state');
    this.langToggleBtn = page.getByTestId('language-toggle-btn');

    this.thUser = page.getByTestId('th-user');
    this.thRole = page.getByTestId('th-role');
    this.thPlan = page.getByTestId('th-plan');
    this.thQuotas = page.getByTestId('th-quotas');
    this.thStatus = page.getByTestId('th-status');
    this.thCreated = page.getByTestId('th-created');
  }

  async goto(): Promise<void> {
    await this.page.goto('/users');
    await this.headerTitle.waitFor({ state: 'visible', timeout: 15000 });
  }

  async searchUsers(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(300); // Allow debounce
  }

  async selectRole(role: 'all' | 'super_admin' | 'admin' | 'user'): Promise<void> {
    await this.page.getByTestId(`user-role-filter-${role}`).click();
  }

  async toggleLanguage(): Promise<void> {
    await this.langToggleBtn.click();
  }
}
