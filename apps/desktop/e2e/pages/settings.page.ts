import { Page, Locator } from '@playwright/test';

export class DesktopSettingsPage {
  readonly page: Page;
  readonly settingsPage: Locator;
  readonly darkThemeBtn: Locator;
  readonly lightThemeBtn: Locator;
  readonly accentDropdownTrigger: Locator;
  readonly accentDropdownMenu: Locator;
  readonly radiusSegmentedControl: Locator;

  constructor(page: Page) {
    this.page = page;
    this.settingsPage = page.getByTestId('settings-page');
    this.darkThemeBtn = page.getByTestId('theme-mode-dark');
    this.lightThemeBtn = page.getByTestId('theme-mode-light');
    this.accentDropdownTrigger = page.getByTestId('accent-color-dropdown-trigger');
    this.accentDropdownMenu = page.getByTestId('accent-color-dropdown-menu');
    this.radiusSegmentedControl = page.getByTestId('border-radius-segmented-control');
  }

  async goto(): Promise<void> {
    const sidebar = this.page.getByTestId('desktop-sidebar');
    const settingsLink = sidebar.getByRole('link', { name: /Налаштування|Settings/i });
    await settingsLink.click();
  }

  async selectAccentColor(colorKey: string): Promise<void> {
    await this.accentDropdownTrigger.click();
    await this.accentDropdownMenu.waitFor({ state: 'visible' });
    await this.page.getByTestId(`accent-option-${colorKey}`).click();
  }

  async setMode(mode: 'dark' | 'light' | 'system'): Promise<void> {
    await this.page.getByTestId(`theme-mode-${mode}`).click();
  }

  async selectRadius(preset: '0' | '0.25' | '0.5' | '0.75'): Promise<void> {
    await this.page.getByTestId(`radius-option-${preset}`).click();
  }
}
