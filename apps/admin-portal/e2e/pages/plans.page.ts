import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class AdminPlansPage extends BasePage {
  readonly pageTitle: Locator;
  readonly createPlanBtn: Locator;
  readonly refreshPlansBtn: Locator;
  readonly plansGrid: Locator;

  // Dialog locators
  readonly planDialog: Locator;
  readonly planDialogTitle: Locator;
  readonly planCodeInput: Locator;
  readonly planNameUkInput: Locator;
  readonly planNameEnInput: Locator;
  readonly planDescUkInput: Locator;
  readonly planDescEnInput: Locator;
  readonly planPriceMonthlyInput: Locator;
  readonly planPriceYearlyInput: Locator;
  readonly planMaxXmlInput: Locator;
  readonly planAiCreditsInput: Locator;
  readonly planIsPopularCheckbox: Locator;
  readonly planCloudBackupCheckbox: Locator;
  readonly planFeatureUkInput: Locator;
  readonly planFeatureEnInput: Locator;
  readonly planAddFeatureBtn: Locator;
  readonly planSubmitBtn: Locator;
  readonly planCancelBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.getByTestId('plans-header-title');
    this.createPlanBtn = page.getByTestId('create-plan-btn');
    this.refreshPlansBtn = page.getByTestId('refresh-plans-btn');
    this.plansGrid = page.getByTestId('plans-grid');

    // Dialog
    this.planDialog = page.getByTestId('plan-dialog');
    this.planDialogTitle = page.getByTestId('plan-dialog-title');
    this.planCodeInput = page.getByTestId('plan-code-input');
    this.planNameUkInput = page.getByTestId('plan-name-uk-input');
    this.planNameEnInput = page.getByTestId('plan-name-en-input');
    this.planDescUkInput = page.getByTestId('plan-desc-uk-input');
    this.planDescEnInput = page.getByTestId('plan-desc-en-input');
    this.planPriceMonthlyInput = page.getByTestId('plan-price-monthly-input');
    this.planPriceYearlyInput = page.getByTestId('plan-price-yearly-input');
    this.planMaxXmlInput = page.getByTestId('plan-max-xml-input');
    this.planAiCreditsInput = page.getByTestId('plan-ai-credits-input');
    this.planIsPopularCheckbox = page.getByTestId('plan-is-popular-checkbox');
    this.planCloudBackupCheckbox = page.getByTestId('plan-cloud-backup-checkbox');
    this.planFeatureUkInput = page.getByTestId('plan-feature-uk-input');
    this.planFeatureEnInput = page.getByTestId('plan-feature-en-input');
    this.planAddFeatureBtn = page.getByTestId('plan-add-feature-btn');
    this.planSubmitBtn = page.getByTestId('plan-submit-btn');
    this.planCancelBtn = page.getByTestId('plan-cancel-btn');
  }

  async goto(): Promise<void> {
    await this.page.goto('/plans');
    await this.pageTitle.waitFor({ state: 'visible' });
  }

  async expectPlanCardVisible(code: string): Promise<void> {
    const card = this.page.getByTestId(`plan-card-${code.toLowerCase()}`);
    await expect(card).toBeVisible();
  }

  async expectPlanMonthlyPrice(code: string, price: string): Promise<void> {
    const priceLocator = this.page.getByTestId(`plan-price-monthly-${code.toLowerCase()}`);
    await expect(priceLocator).toContainText(price);
  }

  async openCreateDialog(): Promise<void> {
    await this.createPlanBtn.click();
    await this.planDialog.waitFor({ state: 'visible' });
  }

  async openEditDialog(code: string): Promise<void> {
    const editBtn = this.page.getByTestId(`plan-edit-btn-${code.toLowerCase()}`);
    await editBtn.click();
    await this.planDialog.waitFor({ state: 'visible' });
  }

  async fillPlanForm(data: {
    code?: string;
    nameUk: string;
    nameEn: string;
    priceMonthly: string;
    maxXmlLimit: string;
    aiCredits: string;
    featureUk?: string;
    featureEn?: string;
  }): Promise<void> {
    if (data.code && (await this.planCodeInput.isEnabled())) {
      await this.planCodeInput.fill(data.code);
    }
    await this.planNameUkInput.fill(data.nameUk);
    await this.planNameEnInput.fill(data.nameEn);
    await this.planPriceMonthlyInput.fill(data.priceMonthly);
    await this.planMaxXmlInput.fill(data.maxXmlLimit);
    await this.planAiCreditsInput.fill(data.aiCredits);

    if (data.featureUk && data.featureEn) {
      await this.planFeatureUkInput.fill(data.featureUk);
      await this.planFeatureEnInput.fill(data.featureEn);
      await this.planAddFeatureBtn.click();
    }
  }

  async submitPlanForm(): Promise<void> {
    await this.planSubmitBtn.click();
    await this.planDialog.waitFor({ state: 'hidden' });
  }
}
