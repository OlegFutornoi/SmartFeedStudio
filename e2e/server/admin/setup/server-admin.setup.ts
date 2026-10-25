import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { urls } from '../../../config/urls.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.resolve(__dirname, '../../../.auth/server-admin.json');

setup('authenticate admin user and store storageState', async ({ page }) => {
  try {
    const res = await page.goto(urls.server.admin, { timeout: 10000 });
    expect(res?.status(), `Admin portal at ${urls.server.admin} must be accessible`).toBeLessThan(
      400,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `❌ Admin portal is unreachable at ${urls.server.admin}.\n` +
        `   Make sure the server is running on port 3000: 'pnpm dev:admin'.\n` +
        `   Original error: ${message}`,
    );
  }

  // Pre-seed token state if needed or save storage
  await page.context().storageState({ path: authFile });
});
