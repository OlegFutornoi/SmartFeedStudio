import { test as base } from '../../../core/fixtures/base.fixture.js';
import { AdminHeaderComponent } from '../components/header.component.js';

export interface ServerAdminFixtures {
  adminHeader: AdminHeaderComponent;
}

export const test = base.extend<ServerAdminFixtures>({
  adminHeader: async ({ page }, use) => {
    await use(new AdminHeaderComponent(page));
  },
});

export { expect } from '../../../core/fixtures/base.fixture.js';
