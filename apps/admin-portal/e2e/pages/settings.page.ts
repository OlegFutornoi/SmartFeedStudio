import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class AdminSettingsPage extends BasePage {
  readonly darkModeBtn: Locator;
  readonly lightModeBtn: Locator;
  readonly accentDropdownTrigger: Locator;
  readonly accentDropdownMenu: Locator;

  constructor(page: Page) {
    super(page);
    this.darkModeBtn = page.getByTestId('admin-theme-mode-dark');
    this.lightModeBtn = page.getByTestId('admin-theme-mode-light');
    this.accentDropdownTrigger = page.getByTestId('admin-accent-dropdown-trigger');
    this.accentDropdownMenu = page.getByTestId('admin-accent-dropdown-menu');
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings');
    await this.accentDropdownTrigger.waitFor({ state: 'visible' });
  }

  async selectAccentColor(colorKey: string): Promise<void> {
    await this.accentDropdownTrigger.click();
    await this.accentDropdownMenu.waitFor({ state: 'visible' });
    await this.page.getByTestId(`admin-accent-option-${colorKey}`).click();
  }

  async setMode(mode: 'dark' | 'light' | 'system'): Promise<void> {
    await this.page.getByTestId(`admin-theme-mode-${mode}`).click();
  }
}
