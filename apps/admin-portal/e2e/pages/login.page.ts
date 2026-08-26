import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { HeaderComponent } from '../components/header.component';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly titleHeading: Locator;
  readonly cardTitle: Locator;
  readonly loginErrorAlert: Locator;
  readonly fillDefaultBtn: Locator;
  readonly header: HeaderComponent;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator('button[type="submit"]');
    this.titleHeading = page.locator('h1');
    this.cardTitle = page.getByTestId('login-card-title');
    this.loginErrorAlert = page.getByTestId('login-error-alert');
    this.fillDefaultBtn = page.getByRole('button', {
      name: /Заповнити супер-адміна|Fill default admin/i,
    });
    this.header = new HeaderComponent(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.titleHeading.waitFor({ state: 'visible' });
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectLoginError(messageSubstring: string): Promise<void> {
    await expect(this.loginErrorAlert).toBeVisible();
    await expect(this.loginErrorAlert).toContainText(messageSubstring);
  }

  async expectTitle(titleSubstring: string): Promise<void> {
    await expect(this.titleHeading).toContainText(titleSubstring);
  }
}
