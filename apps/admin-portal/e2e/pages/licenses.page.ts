import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '@e2e/pages/base.page';

export class AdminLicensesPage extends BasePage {
  readonly pageTitle: Locator;
  readonly refreshLicensesBtn: Locator;
  readonly licensesTable: Locator;
  readonly searchInput: Locator;
  readonly searchClearBtn: Locator;
  readonly tierFilterBtn: Locator;
  readonly statusFilterBtn: Locator;
  readonly cloudFilterBtn: Locator;
  readonly sortSelect: Locator;
  readonly resetFiltersBtn: Locator;
  readonly resultsCount: Locator;
  readonly emptyRow: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.getByTestId('licenses-header-title');
    this.refreshLicensesBtn = page.getByTestId('refresh-licenses-btn');
    this.licensesTable = page.getByTestId('licenses-table');
    this.searchInput = page.getByTestId('licenses-search-input');
    this.searchClearBtn = page.getByTestId('licenses-search-clear-btn');
    this.tierFilterBtn = page.getByTestId('licenses-filter-tier');
    this.statusFilterBtn = page.getByTestId('licenses-filter-status');
    this.cloudFilterBtn = page.getByTestId('licenses-filter-cloud');
    this.sortSelect = page.getByTestId('licenses-sort-select');
    this.resetFiltersBtn = page.getByTestId('licenses-reset-filters-btn');
    this.resultsCount = page.getByTestId('licenses-results-count');
    this.emptyRow = page.getByTestId('licenses-empty-row');
  }

  async goto(): Promise<void> {
    await this.page.goto('/licenses');
    await this.pageTitle.waitFor({ state: 'visible' });
  }

  async searchLicenses(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async filterByTier(tier: string): Promise<void> {
    await this.tierFilterBtn.click();
    const option = this.page.getByTestId(`licenses-filter-tier-option-${tier.toLowerCase()}`);
    await option.click();
  }

  async filterByStatus(status: string): Promise<void> {
    await this.statusFilterBtn.click();
    const option = this.page.getByTestId(`licenses-filter-status-option-${status.toLowerCase()}`);
    await option.click();
  }

  async filterByCloud(cloudOption: string): Promise<void> {
    await this.cloudFilterBtn.click();
    const option = this.page.getByTestId(
      `licenses-filter-cloud-option-${cloudOption.toLowerCase()}`,
    );
    await option.click();
  }

  async resetFilters(): Promise<void> {
    await this.resetFiltersBtn.click();
  }

  async expectLicenseRowVisible(licenseKey: string): Promise<void> {
    const row = this.page.getByTestId(`license-row-${licenseKey}`);
    await expect(row).toBeVisible();
  }

  async expectLicenseRowNotVisible(licenseKey: string): Promise<void> {
    const row = this.page.getByTestId(`license-row-${licenseKey}`);
    await expect(row).not.toBeVisible();
  }

  async openActionsMenu(licenseKey: string): Promise<void> {
    const btn = this.page.getByTestId(`license-actions-btn-${licenseKey}`);
    await btn.click();
    const menu = this.page.getByTestId(`license-actions-menu-${licenseKey}`);
    await expect(menu).toBeVisible();
  }

  async toggleLicenseStatus(licenseKey: string): Promise<void> {
    await this.openActionsMenu(licenseKey);
    const toggleBtn = this.page.getByTestId(`license-action-toggle-${licenseKey}`);
    await toggleBtn.click();
  }

  async clickDeleteLicense(licenseKey: string): Promise<void> {
    await this.openActionsMenu(licenseKey);
    const deleteBtn = this.page.getByTestId(`license-action-delete-${licenseKey}`);
    await deleteBtn.click();
  }

  async confirmDeleteLicense(_licenseKey?: string): Promise<void> {
    const confirmBtn = this.page.getByTestId('license-delete-confirm-btn');
    await confirmBtn.click();
  }

  async cancelDeleteLicense(_licenseKey?: string): Promise<void> {
    const cancelBtn = this.page.getByTestId('license-delete-cancel-btn');
    await cancelBtn.click();
  }
}
