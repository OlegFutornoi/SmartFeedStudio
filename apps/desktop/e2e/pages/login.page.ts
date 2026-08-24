import { Page, Locator, expect } from '@playwright/test';

export class DesktopLoginPage {
  readonly page: Page;
  readonly container: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;
  readonly errorAlert: Locator;
  readonly errorMessage: Locator;
  readonly languageToggle: Locator;
  readonly themeToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId('login-page');
    this.emailInput = page.getByTestId('email-input');
    this.passwordInput = page.getByTestId('password-input');
    this.loginButton = page.getByTestId('login-button');
    this.registerLink = page.getByTestId('register-link');
    this.errorAlert = page.getByTestId('error-alert');
    this.errorMessage = page.getByTestId('error-message');
    this.languageToggle = page.getByTestId('language-toggle');
    this.themeToggle = page.getByTestId('theme-toggle');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async toggleLanguage(): Promise<void> {
    await this.languageToggle.click();
  }

  async toggleTheme(): Promise<void> {
    await this.themeToggle.click();
  }

  async expectErrorMessage(text: string): Promise<void> {
    await expect(this.errorAlert).toBeVisible();
    await expect(this.errorMessage).toHaveText(text);
  }
}
