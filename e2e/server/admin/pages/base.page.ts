import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  abstract goto(): Promise<void>;

  async waitForLoaded(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }
}
