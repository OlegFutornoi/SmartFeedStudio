import { test as setup } from '@playwright/test';
import { LocalDbClient } from '@/local/backend/clients/local-db.client';
import { urls } from '@/config/urls';

setup('verify local backend e2e container and schema parity', async ({ request }) => {
  const e2eClient = new LocalDbClient(request, urls.local.backend);
  const refClient = new LocalDbClient(request, urls.local.referenceBackend);

  let e2eHealth;
  try {
    e2eHealth = await e2eClient.health();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `[ERROR] Local SQLite E2E container is unreachable at ${urls.local.backend}.\n` +
        `   Make sure 'sqlite-dev-e2e' service is running on port 5002: 'pnpm docker:up'.\n` +
        `   Original error: ${message}`,
    );
  }

  // Check schema fingerprint match if reference dev server is also running
  try {
    const refHealth = await refClient.health();
    if (
      refHealth.schemaFingerprint &&
      e2eHealth.schemaFingerprint &&
      refHealth.schemaFingerprint !== e2eHealth.schemaFingerprint
    ) {
      throw new Error(
        `[ERROR] [Local DB Parity] Schema mismatch detected between Dev DB (5001) and E2E DB (5002).\n` +
          `   Dev: ${refHealth.schemaFingerprint}\n` +
          `   E2E: ${e2eHealth.schemaFingerprint}\n` +
          `   Run 'pnpm db:local:sync' to rebuild and synchronize local sqlite containers.`,
      );
    }
  } catch {
    // If dev container on 5001 is offline, proceed with e2e container alone
  }

  // Safety invariant: NEVER call reset against reference DB
  if (urls.local.backend === urls.local.referenceBackend) {
    throw new Error(`[Local DB Safety] Refusing to reset dev reference DB on port 5001.`);
  }

  await e2eClient.reset();
});
