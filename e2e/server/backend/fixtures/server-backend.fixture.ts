import { test as base } from '../../../core/fixtures/base.fixture.js';
import { AuthClient } from '../clients/auth.client.js';
import { urls } from '../../../config/urls.js';
import { cleanupServerDatabase } from '../db/cleanup.js';

export interface ServerBackendFixtures {
  authClient: AuthClient;
  cleanup: (runId?: string) => Promise<void>;
}

export const test = base.extend<ServerBackendFixtures>({
  authClient: async ({ request }, use) => {
    const client = new AuthClient(request, urls.server.api);
    await use(client);
  },
  cleanup: async ({}, use) => {
    await use(cleanupServerDatabase);
  },
});

export { expect } from '../../../core/fixtures/base.fixture.js';
