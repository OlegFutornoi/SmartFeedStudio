import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class AdminPlansPage extends BasePage {
  readonly pageTitle: Locator;
  readonly createPlanBtn: Locator;
  readonly refreshPlansBtn: Locator;
  readonly plansGrid: Locator;
  readonly viewSwitcher: Locator;
  readonly viewCardsBtn: Locator;
  readonly viewComparisonBtn: Locator;
  readonly comparisonTable: Locator;

  // Dialog locators
  readonly planDialog: Locator;
  readonly planDialogTitle: Locator;
  readonly planDialogTabBasic: Locator;
  readonly planDialogTabQuotas: Locator;
  readonly planDialogTabFlags: Locator;
  readonly planDialogTabFeatures: Locator;
  readonly planCodeInput: Locator;
  readonly planNameUkInput: Locator;
  readonly planNameEnInput: Locator;
  readonly planDescUkInput: Locator;
  readonly planDescEnInput: Locator;
  readonly planPriceMonthlyInput: Locator;
  readonly planPriceYearlyInput: Locator;
  readonly planMaxXmlInput: Locator;
  readonly planMaxSuppliersInput: Locator;
  readonly planMaxFeedsInput: Locator;
  readonly planMaxChannelsInput: Locator;
  readonly planMaxSeatsInput: Locator;
  readonly planMaxStorageInput: Locator;
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
    this.viewSwitcher = page.getByTestId('plans-view-switcher');
    this.viewCardsBtn = page.getByTestId('plans-view-cards-btn');
    this.viewComparisonBtn = page.getByTestId('plans-view-comparison-btn');
    this.comparisonTable = page.getByTestId('plans-comparison-table-container');

    // Dialog
    this.planDialog = page.getByTestId('plan-dialog');
    this.planDialogTitle = page.getByTestId('plan-dialog-title');
    this.planDialogTabBasic = page.getByTestId('plan-dialog-tab-basic');
    this.planDialogTabQuotas = page.getByTestId('plan-dialog-tab-quotas');
    this.planDialogTabFlags = page.getByTestId('plan-dialog-tab-flags');
    this.planDialogTabFeatures = page.getByTestId('plan-dialog-tab-features');

    this.planCodeInput = page.getByTestId('plan-code-input');
    this.planNameUkInput = page.getByTestId('plan-name-uk-input');
    this.planNameEnInput = page.getByTestId('plan-name-en-input');
    this.planDescUkInput = page.getByTestId('plan-desc-uk-input');
    this.planDescEnInput = page.getByTestId('plan-desc-en-input');
    this.planPriceMonthlyInput = page.getByTestId('plan-price-monthly-input');
    this.planPriceYearlyInput = page.getByTestId('plan-price-yearly-input');
    this.planMaxXmlInput = page.getByTestId('plan-max-xml-input');
    this.planMaxSuppliersInput = page.getByTestId('plan-max-suppliers-input');
    this.planMaxFeedsInput = page.getByTestId('plan-max-feeds-input');
    this.planMaxChannelsInput = page.getByTestId('plan-max-channels-input');
    this.planMaxSeatsInput = page.getByTestId('plan-max-seats-input');
    this.planMaxStorageInput = page.getByTestId('plan-max-storage-input');
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

  async expectPlanMonthlyPrice(code: string, priceText: string): Promise<void> {
    const priceLocator = this.page.getByTestId(`plan-price-monthly-${code.toLowerCase()}`);
    await expect(priceLocator).toContainText(priceText);
  }

  async switchToComparisonView(): Promise<void> {
    await this.viewComparisonBtn.click();
    await this.comparisonTable.waitFor({ state: 'visible' });
  }

  async switchToCardsView(): Promise<void> {
    await this.viewCardsBtn.click();
    await this.plansGrid.waitFor({ state: 'visible' });
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

  async openEditFromComparison(code: string): Promise<void> {
    const editBtn = this.page.getByTestId(`comparison-edit-btn-${code.toLowerCase()}`);
    await editBtn.click();
    await this.planDialog.waitFor({ state: 'visible' });
  }

  async fillPlanForm(data: {
    code?: string;
    nameUk: string;
    nameEn: string;
    priceMonthly: string;
    maxXmlLimit?: string;
    aiCredits?: string;
    featureUk?: string;
    featureEn?: string;
  }): Promise<void> {
    // Basic Tab
    if (data.code && (await this.planCodeInput.isEnabled())) {
      await this.planCodeInput.fill(data.code);
    }
    await this.planNameUkInput.fill(data.nameUk);
    await this.planNameEnInput.fill(data.nameEn);
    await this.planPriceMonthlyInput.fill(data.priceMonthly);

    // Quotas Tab
    if (data.maxXmlLimit || data.aiCredits) {
      await this.planDialogTabQuotas.click();
      if (data.maxXmlLimit) await this.planMaxXmlInput.fill(data.maxXmlLimit);
      if (data.aiCredits) await this.planAiCreditsInput.fill(data.aiCredits);
    }

    // Features Tab
    if (data.featureUk && data.featureEn) {
      await this.planDialogTabFeatures.click();
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
