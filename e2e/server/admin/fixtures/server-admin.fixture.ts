import { test as base } from '@/core/fixtures/base.fixture';
import { AdminHeaderComponent } from '@/server/admin/components/header.component';

export interface ServerAdminFixtures {
  adminHeader: AdminHeaderComponent;
}

export const test = base.extend<ServerAdminFixtures>({
  adminHeader: async ({ page }, use) => {
    await use(new AdminHeaderComponent(page));
  },
});

export { expect } from '@/core/fixtures/base.fixture';
