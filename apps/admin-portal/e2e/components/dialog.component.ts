import { Locator, Page, expect } from '@playwright/test';
import { TargetApp, PlanType, Role } from '@smartfeed/shared';

export interface NavigationItemFormInput {
  key: string;
  targetApp: TargetApp;
  labelUk: string;
  labelEn: string;
  path: string;
  icon?: string;
  roles?: Role[];
  plan?: PlanType;
}

export class NavigationItemDialogComponent {
  readonly container: Locator;
  readonly keyInput: Locator;
  readonly targetAppSelect: Locator;
  readonly labelUkInput: Locator;
  readonly labelEnInput: Locator;
  readonly pathInput: Locator;
  readonly minPlanSelect: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.container = page.getByRole('dialog');
    this.keyInput = this.container.locator('input[placeholder="catalogs"]');
    this.targetAppSelect = this.container.locator('select').first();
    this.labelUkInput = this.container.locator('input[placeholder="Каталоги товарів"]');
    this.labelEnInput = this.container.locator('input[placeholder="Product Catalogs"]');
    this.pathInput = this.container.locator('input[placeholder="/catalogs"]');
    this.minPlanSelect = this.container.locator('select').nth(1);
    this.saveButton = this.container.getByRole('button', {
      name: /Зберегти|Створити|Save|Create/i,
    });
    this.cancelButton = this.container.getByRole('button', { name: /Скасувати|Cancel/i });
  }

  async fillForm(data: NavigationItemFormInput): Promise<void> {
    await this.keyInput.fill(data.key);
    await this.targetAppSelect.selectOption(data.targetApp);
    await this.labelUkInput.fill(data.labelUk);
    await this.labelEnInput.fill(data.labelEn);
    await this.pathInput.fill(data.path);

    if (data.icon) {
      await this.container.getByTitle(data.icon).click();
    }

    if (data.plan) {
      await this.minPlanSelect.selectOption(data.plan);
    }
  }

  async submit(): Promise<void> {
    await this.saveButton.click();
    await expect(this.container).not.toBeVisible();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await expect(this.container).not.toBeVisible();
  }
}
