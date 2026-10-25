import { Page, Locator } from '@playwright/test';

export class AdminHeaderComponent {
  readonly root: Locator;
  readonly userAvatar: Locator;

  constructor(page: Page) {
    this.root = page.locator('header');
    this.userAvatar = page.getByTestId('user-avatar');
  }
}
