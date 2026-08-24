import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;
  readonly loader: Locator;
  readonly errorAlert: Locator;
  readonly successAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loader = page.locator('text=Завантаження...');
    this.errorAlert = page.getByTestId('error-alert');
    this.successAlert = page.locator('.bg-emerald-500\\/10');
  }

  abstract goto(): Promise<void>;

  async waitForLoaded(): Promise<void> {
    await expect(this.loader).not.toBeVisible();
  }

  async expectErrorAlert(messageSubstring: string): Promise<void> {
    await expect(this.errorAlert).toBeVisible();
    await expect(this.errorAlert).toContainText(messageSubstring);
  }

  async expectNoErrorAlert(): Promise<void> {
    await expect(this.errorAlert).not.toBeVisible();
  }
}
