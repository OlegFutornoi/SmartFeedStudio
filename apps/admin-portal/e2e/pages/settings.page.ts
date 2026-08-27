import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class AdminSettingsPage extends BasePage {
  // Theme selectors
  readonly darkModeBtn: Locator;
  readonly lightModeBtn: Locator;
  readonly accentDropdownTrigger: Locator;
  readonly accentDropdownMenu: Locator;

  // Header selectors
  readonly headerTitle: Locator;
  readonly headerSubtitle: Locator;

  // Profile card selectors
  readonly profileCard: Locator;
  readonly profileName: Locator;
  readonly profileEmail: Locator;
  readonly profileRole: Locator;

  // Infrastructure selectors
  readonly infraCard: Locator;
  readonly infraBadgePostgres: Locator;
  readonly infraBadgeRedis: Locator;
  readonly infraBadgeS3: Locator;

  // Password card selectors
  readonly changePasswordCard: Locator;
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitPasswordBtn: Locator;
  readonly passwordError: Locator;
  readonly passwordSuccess: Locator;

  // Language toggle
  readonly langToggleBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.darkModeBtn = page.getByTestId('admin-theme-mode-dark');
    this.lightModeBtn = page.getByTestId('admin-theme-mode-light');
    this.accentDropdownTrigger = page.getByTestId('admin-accent-dropdown-trigger');
    this.accentDropdownMenu = page.getByTestId('admin-accent-dropdown-menu');

    this.headerTitle = page.getByTestId('settings-header-title');
    this.headerSubtitle = page.getByTestId('settings-header-subtitle');

    this.profileCard = page.getByTestId('profile-info-card');
    this.profileName = page.getByTestId('profile-name');
    this.profileEmail = page.getByTestId('profile-email');
    this.profileRole = page.getByTestId('profile-role');

    this.infraCard = page.getByTestId('infrastructure-status-card');
    this.infraBadgePostgres = page.getByTestId('infra-badge-postgres');
    this.infraBadgeRedis = page.getByTestId('infra-badge-redis');
    this.infraBadgeS3 = page.getByTestId('infra-badge-s3');

    this.changePasswordCard = page.getByTestId('change-password-card');
    this.currentPasswordInput = page.getByTestId('current-password-input');
    this.newPasswordInput = page.getByTestId('new-password-input');
    this.confirmPasswordInput = page.getByTestId('confirm-password-input');
    this.submitPasswordBtn = page.getByTestId('submit-password-btn');
    this.passwordError = page.getByTestId('change-password-error');
    this.passwordSuccess = page.getByTestId('change-password-success');

    this.langToggleBtn = page.getByTestId('language-toggle-btn');
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings');
    await this.headerTitle.waitFor({ state: 'visible', timeout: 15000 });
  }

  async selectAccentColor(colorKey: string): Promise<void> {
    await this.accentDropdownTrigger.click();
    await this.accentDropdownMenu.waitFor({ state: 'visible' });
    await this.page.getByTestId(`admin-accent-option-${colorKey}`).click();
  }

  async setMode(mode: 'dark' | 'light' | 'system'): Promise<void> {
    await this.page.getByTestId(`admin-theme-mode-${mode}`).click();
  }

  async toggleLanguage(): Promise<void> {
    await this.langToggleBtn.click();
  }

  async submitChangePassword(current: string, next: string, confirm: string): Promise<void> {
    await this.currentPasswordInput.fill(current);
    await this.newPasswordInput.fill(next);
    await this.confirmPasswordInput.fill(confirm);
    await this.submitPasswordBtn.click();
  }
}
