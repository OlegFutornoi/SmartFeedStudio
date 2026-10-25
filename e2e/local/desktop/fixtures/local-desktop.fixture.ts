import { test as base } from '@/core/fixtures/base.fixture';
import { DesktopSidebarComponent } from '@/local/desktop/components/sidebar.component';

export interface LocalDesktopFixtures {
  desktopSidebar: DesktopSidebarComponent;
}

export const test = base.extend<LocalDesktopFixtures>({
  desktopSidebar: async ({ page }, use) => {
    await use(new DesktopSidebarComponent(page));
  },
});

export { expect } from '@/core/fixtures/base.fixture';
