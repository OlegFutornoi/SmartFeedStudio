import { Locator, Page, expect } from '@playwright/test';

export class HeaderComponent {
  readonly container: Locator;
  readonly languageToggle: Locator;
  readonly themeToggle: Locator;
  readonly brandBadge: Locator;

  constructor(page: Page) {
    this.container = page.locator('header');
    this.languageToggle = page.getByRole('button', { name: 'Switch Language' });
    this.themeToggle = this.container.getByTitle('Toggle theme');
    this.brandBadge = this.container.locator('text=SmartFeed Studio');
  }

  async switchLanguage(): Promise<void> {
    await this.languageToggle.click();
  }

  async expectLanguage(code: 'UK' | 'EN'): Promise<void> {
    await expect(this.languageToggle).toContainText(code);
  }

  async toggleTheme(): Promise<void> {
    await this.themeToggle.click();
  }
}
