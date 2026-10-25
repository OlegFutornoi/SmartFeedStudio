import { test as setup, expect } from '@playwright/test';
import { urls } from '../../../config/urls.js';
import { cleanupServerDatabase } from '../db/cleanup.js';

setup('verify server backend health and initialize clean database', async ({ request }) => {
  const healthUrl = `${urls.server.api}/health`;
  try {
    const res = await request.get(healthUrl, { timeout: 5000 });
    expect(res.status(), `Backend API at ${urls.server.api} must return 200`).toBe(200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `❌ Backend API is unreachable at ${healthUrl}.\n` +
        `   Make sure the server is running on port 4000: 'pnpm dev:backend'.\n` +
        `   Original error: ${message}`,
    );
  }

  // Pre-clean isolated test entities
  await cleanupServerDatabase();
});
