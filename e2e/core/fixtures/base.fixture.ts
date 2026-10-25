import { test as base, expect } from '@playwright/test';
import { createRunId } from '@/core/data/test-id';

export interface BaseFixtures {
  runId: string;
}

export const test = base.extend<BaseFixtures>({
  runId: async ({}, use) => {
    const id = createRunId();
    await use(id);
  },
  // Auto-fixture to guarantee storage isolation for browser-based tests (TEST-02)
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await use(page);
    try {
      await page.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
    } catch {
      // Ignore if page already closed
    }
  },
});

export { expect };
