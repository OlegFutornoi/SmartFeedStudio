import { Page, Locator, expect } from '@playwright/test';

export class DesktopRegisterPage {
  readonly page: Page;
  readonly container: Locator;
  readonly fullNameInput: Locator;
  readonly companyNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly loginLink: Locator;
  readonly errorAlert: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId('register-page');
    this.fullNameInput = page.getByTestId('fullname-input');
    this.companyNameInput = page.getByTestId('company-name-input');
    this.emailInput = page.getByTestId('email-input');
    this.passwordInput = page.getByTestId('password-input');
    this.confirmPasswordInput = page.getByTestId('confirm-password-input');
    this.registerButton = page.getByTestId('register-button');
    this.loginLink = page.getByTestId('login-link');
    this.errorAlert = page.getByTestId('error-alert');
    this.errorMessage = page.getByTestId('error-message');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/register');
  }

  async register(data: {
    fullName: string;
    companyName?: string;
    email: string;
    password: string;
    confirmPassword?: string;
  }): Promise<void> {
    await this.fullNameInput.fill(data.fullName);
    if (data.companyName) {
      await this.companyNameInput.fill(data.companyName);
    }
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.confirmPasswordInput.fill(data.confirmPassword ?? data.password);
    await this.registerButton.click();
  }

  async expectErrorMessage(text: string): Promise<void> {
    await expect(this.errorAlert).toBeVisible();
    await expect(this.errorMessage).toHaveText(text);
  }
}
