import { Page, Locator } from '@playwright/test';

export class DesktopSidebarComponent {
  readonly root: Locator;
  readonly suppliersNav: Locator;
  readonly productsNav: Locator;

  constructor(page: Page) {
    this.root = page.locator('aside');
    this.suppliersNav = page.getByTestId('nav-suppliers');
    this.productsNav = page.getByTestId('nav-products');
  }
}
