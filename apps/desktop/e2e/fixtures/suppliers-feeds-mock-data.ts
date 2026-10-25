import type { Page } from '@playwright/test';
import { setupSupplierSyncRoutes } from '@e2e/fixtures/supplier-sync-routes';

export * from '@e2e/fixtures/suppliers-mock-entities';
import {
  mockUser,
  mockLicenseState,
  mockQuotas,
  mockSuppliers,
} from '@e2e/fixtures/suppliers-mock-entities';

export {
  mockFeedSources,
  mockAnalysis,
  constrainedFeedAnalysis,
} from '@e2e/fixtures/feeds-mock-data';
import { mockFeedSources, mockAnalysis } from '@e2e/fixtures/feeds-mock-data';

export async function setupSuppliersFeedsRoutes(page: Page) {
  await page.addInitScript((user) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('smartfeed_access_token', 'mock-valid-token');
    window.localStorage.setItem('smartfeed_refresh_token', 'mock_refresh_token');
    window.localStorage.setItem('smartfeed_user_profile', JSON.stringify(user));
    window.localStorage.setItem('smartfeed_language', 'uk');
    window.localStorage.setItem('smartfeed_theme', 'dark');
  }, mockUser);

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUser),
    });
  });

  await page.route('**/api/licenses/my', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockLicenseState),
    });
  });

  await page.route('**/api/licenses/quotas', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockQuotas),
    });
  });

  const currentSuppliers = [...mockSuppliers.map((s) => ({ ...s }))];

  await page.route(/\/api\/suppliers(\?|$)/, async (route) => {
    if (route.request().method() === 'POST') {
      const payload = route.request().postDataJSON() || {};
      const newSup = {
        id: `sup_new_${Date.now()}`,
        userId: mockUser.id,
        productsCount: 0,
        activeFeedsCount: 0,
        categoriesCount: 0,
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      currentSuppliers.unshift(newSup);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newSup),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(currentSuppliers),
    });
  });

  await page.route(/\/api\/suppliers\/([^/?#]+)$/, async (route) => {
    const method = route.request().method();
    const id = route.request().url().split('/').pop()?.split('?')[0];

    if (method === 'PATCH') {
      const patch = route.request().postDataJSON() || {};
      const foundIndex = currentSuppliers.findIndex((s) => s.id === id);
      const found = foundIndex !== -1 ? currentSuppliers[foundIndex] : currentSuppliers[0];
      const updated = { ...found, ...patch };
      if (foundIndex !== -1) {
        currentSuppliers[foundIndex] = updated;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updated),
      });
      return;
    }

    if (method === 'GET') {
      const found = currentSuppliers.find((s) => s.id === id) || currentSuppliers[0];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(found),
      });
      return;
    }

    if (method === 'DELETE') {
      const foundIndex = currentSuppliers.findIndex((s) => s.id === id);
      if (foundIndex !== -1) {
        currentSuppliers.splice(foundIndex, 1);
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    await route.fallback();
  });

  await page.route('**/api/feeds/jobs/active', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route(/\/api\/feeds\/suppliers\/([^/?#]+)\/sources(\?|$)/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockFeedSources),
    });
  });

  await page.route(/\/api\/feeds\/suppliers\/([^/?#]+)\/sources\/([^/?#]+)$/, async (route) => {
    if (route.request().method() === 'PATCH') {
      const payload = route.request().postDataJSON() || {};
      const sourceId = route.request().url().split('/').pop()?.split('?')[0];
      const found = mockFeedSources.find((s) => s.id === sourceId) || mockFeedSources[0];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...found, ...payload, updatedAt: new Date().toISOString() }),
      });
      return;
    }
    await route.fallback();
  });

  await page.route('**/api/feeds/analyze-url', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockAnalysis),
    });
  });

  await setupSupplierSyncRoutes(page);

  await page.route(
    /\/api\/feeds\/suppliers\/([^/?#]+)\/sources\/([^/?#]+)\/sync/,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          jobId: `job_${Date.now()}`,
          updatedCount: 50,
        }),
      });
    },
  );

  await page.route(/\/api\/suppliers\/([^/?#]+)\/categories(\?|$)/, async (route) => {
    const url = route.request().url();
    if (url.includes('/sup_test_2/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'scat_test_1',
          supplierId: 'sup_test_1',
          feedCategoryId: 'cat_1',
          name: 'Сенсорні вимикачі',
          feedSourceId: 'feed_test_1',
          feedName: 'Livolo Main XML',
          productCount: 150,
          isActive: true,
          marginPercent: 20,
          fixedMarkup: 50,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'scat_test_2',
          supplierId: 'sup_test_1',
          feedCategoryId: 'cat_2',
          name: 'Розумні розетки',
          feedSourceId: 'feed_test_1',
          feedName: 'Livolo Main XML',
          productCount: 100,
          isActive: true,
          marginPercent: null,
          fixedMarkup: null,
          updatedAt: new Date().toISOString(),
        },
      ]),
    });
  });

  await page.route(/\/api\/suppliers\/([^/?#]+)\/categories\/([^/?#]+)\/toggle/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route(/\/api\/suppliers\/([^/?#]+)\/categories\/batch-toggle/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ updatedCount: 2 }),
    });
  });

  await page.route(/\/api\/suppliers\/([^/?#]+)\/categories\/([^/?#]+)$/, async (route) => {
    if (route.request().method() === 'PATCH') {
      const payload = route.request().postDataJSON() || {};
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'scat_test_1', ...payload }),
      });
      return;
    }
    await route.fallback();
  });
}
