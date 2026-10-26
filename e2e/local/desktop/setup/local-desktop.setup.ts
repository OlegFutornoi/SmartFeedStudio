import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { urls } from '@/config/urls';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.resolve(__dirname, '../../../.auth/local-desktop.json');

setup('verify local desktop client availability and store auth state', async ({ page }) => {
  try {
    const res = await page.goto(urls.local.desktop, { timeout: 10000 });
    expect(
      res?.status(),
      `Desktop client at ${urls.local.desktop} must be accessible`,
    ).toBeLessThan(400);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `[ERROR] Desktop client (E2E mode) is unreachable at ${urls.local.desktop}.\n` +
        `   Make sure 'dev:e2e' is running on port 1421: 'pnpm --filter @smartfeed/desktop dev:e2e'.\n` +
        `   Original error: ${message}`,
    );
  }

  await page.context().storageState({ path: authFile });
});
