import { Locator, Page, expect } from '@playwright/test';
import { PlanType } from '@smartfeed/shared';

export class NavigationSimulatorComponent {
  readonly container: Locator;
  readonly starterPlanBtn: Locator;
  readonly growthPlanBtn: Locator;
  readonly proPlanBtn: Locator;
  readonly enterprisePlanBtn: Locator;
  readonly menuItemsContainer: Locator;

  constructor(page: Page) {
    this.container = page.getByTestId('navigation-simulator-card');
    this.starterPlanBtn = this.container.getByRole('button', { name: 'Starter' });
    this.growthPlanBtn = this.container.getByRole('button', { name: 'Growth' });
    this.proPlanBtn = this.container.getByRole('button', { name: 'PRO' });
    this.enterprisePlanBtn = this.container.getByRole('button', { name: 'Enterprise' });
    this.menuItemsContainer = this.container.locator('text=МЕНЮ КОРИСТУВАЧА').locator('..');
  }

  async selectPlan(plan: PlanType): Promise<void> {
    if (plan === PlanType.STARTER) {
      await this.starterPlanBtn.click();
    } else if (plan === PlanType.GROWTH) {
      await this.growthPlanBtn.click();
    } else if (plan === PlanType.PRO) {
      await this.proPlanBtn.click();
    } else if (plan === PlanType.ENTERPRISE) {
      await this.enterprisePlanBtn.click();
    }
  }

  async expectItemVisible(label: string): Promise<void> {
    await expect(this.menuItemsContainer.getByText(label)).toBeVisible();
  }

  async expectItemHidden(label: string): Promise<void> {
    await expect(this.menuItemsContainer.getByText(label)).not.toBeVisible();
  }
}
