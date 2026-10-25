import { test as base } from '@/core/fixtures/base.fixture';
import { LocalDbClient } from '@/local/backend/clients/local-db.client';
import { urls } from '@/config/urls';

export interface LocalBackendFixtures {
  localDb: LocalDbClient;
}

export const test = base.extend<LocalBackendFixtures>({
  localDb: async ({ request }, use) => {
    const client = new LocalDbClient(request, urls.local.backend);
    await use(client);
  },
});

export { expect } from '@/core/fixtures/base.fixture';
