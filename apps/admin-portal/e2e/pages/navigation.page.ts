import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '@e2e/pages/base.page';
import { HeaderComponent } from '@e2e/components/header.component';
import { NavigationSimulatorComponent } from '@e2e/components/simulator.component';
import { NavigationItemDialogComponent } from '@e2e/components/dialog.component';
import { TargetApp } from '@smartfeed/shared';

export class NavigationPage extends BasePage {
  readonly header: HeaderComponent;
  readonly simulator: NavigationSimulatorComponent;
  readonly dialog: NavigationItemDialogComponent;
  readonly pageTitle: Locator;
  readonly addItemButton: Locator;
  readonly itemsListCard: Locator;
  readonly filterDesktopBtn: Locator;
  readonly filterAdminBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.simulator = new NavigationSimulatorComponent(page);
    this.dialog = new NavigationItemDialogComponent(page);
    this.pageTitle = page.locator('h1');
    this.addItemButton = page.getByRole('button', { name: /Додати пункт меню|Add Menu Item/i });
    this.itemsListCard = page.getByTestId('navigation-items-card');
    this.filterDesktopBtn = this.itemsListCard.getByRole('button', { name: /Desktop/i });
    this.filterAdminBtn = this.itemsListCard.getByRole('button', { name: /Admin/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/navigation');
    await this.waitForLoaded();
  }

  async openCreateDialog(): Promise<NavigationItemDialogComponent> {
    await this.addItemButton.click();
    await expect(this.dialog.container).toBeVisible();
    return this.dialog;
  }

  async filterByApp(app: TargetApp): Promise<void> {
    if (app === TargetApp.DESKTOP) {
      await this.filterDesktopBtn.click();
    } else {
      await this.filterAdminBtn.click();
    }
  }

  async expectPageTitle(text: string): Promise<void> {
    await expect(this.pageTitle).toContainText(text);
  }

  async expectItemInList(labelUk: string): Promise<void> {
    await expect(this.itemsListCard.getByText(labelUk).first()).toBeVisible();
  }

  async expectItemNotInList(labelUk: string): Promise<void> {
    await expect(this.itemsListCard.getByText(labelUk)).not.toBeVisible();
  }
}
