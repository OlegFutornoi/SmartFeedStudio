import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class AdminLicensesPage extends BasePage {
  readonly pageTitle: Locator;
  readonly refreshLicensesBtn: Locator;
  readonly licensesTable: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.getByTestId('licenses-header-title');
    this.refreshLicensesBtn = page.getByTestId('refresh-licenses-btn');
    this.licensesTable = page.getByTestId('licenses-table');
  }

  async goto(): Promise<void> {
    await this.page.goto('/licenses');
    await this.pageTitle.waitFor({ state: 'visible' });
  }

  async expectLicenseRowVisible(licenseKey: string): Promise<void> {
    const row = this.page.getByTestId(`license-row-${licenseKey}`);
    await expect(row).toBeVisible();
  }
}
