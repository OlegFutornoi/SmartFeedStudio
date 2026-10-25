import { test as base } from '../../../core/fixtures/base.fixture.js';
import { LocalDbClient } from '../clients/local-db.client.js';
import { urls } from '../../../config/urls.js';

export interface LocalBackendFixtures {
  localDb: LocalDbClient;
}

export const test = base.extend<LocalBackendFixtures>({
  localDb: async ({ request }, use) => {
    const client = new LocalDbClient(request, urls.local.backend);
    await use(client);
  },
});

export { expect } from '../../../core/fixtures/base.fixture.js';
