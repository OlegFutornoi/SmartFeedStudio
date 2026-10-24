import * as request from 'supertest';
import { CurrencyCode, ExchangeRateMode, PriceRoundingMode } from '@smartfeed/shared';
import type { INestApplication } from '@nestjs/common';
import {
  bootstrapSuppliersTestContext,
  type SuppliersTestContext,
} from '@test/utils/suppliers-app.helper';

describe('Supplier Tabs Extended CRUD (E2E)', () => {
  let ctx: SuppliersTestContext;
  let app: INestApplication;
  let timestamp: number;
  let userToken: string;
  let user2Token: string;
  let createdSupplierId: string;
  let createdFeedSourceId: string;

  beforeAll(async () => {
    ctx = await bootstrapSuppliersTestContext('sup.tabs');
    ({ app, timestamp, userToken, user2Token } = ctx);

    const res = await request(app.getHttpServer())
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Brain Extended Tabs Inc',
        code: `BRAIN_TABS_${timestamp}`,
        contactEmail: 'sales@tabs.local',
        baseCurrency: CurrencyCode.USD,
        targetCurrency: CurrencyCode.UAH,
        exchangeRateMode: ExchangeRateMode.MANUAL,
        exchangeRate: 41.5,
        currencyBufferPercent: 2.5,
        priceRounding: PriceRoundingMode.DECIMAL_99,
        defaultMarginPercent: 25,
        defaultFixedMarkup: 100,
        isActive: true,
      })
      .expect(201);

    createdSupplierId = res.body.id;
  });

  afterAll(async () => {
    await ctx.teardown();
  });

  it('1. POST /api/feeds/suppliers/:id/sources — creates cloud feed source for supplier', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/feeds/suppliers/${createdSupplierId}/sources`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Brain Rozetka XML',
        sourceUrl: 'https://brain.com.ua/feed/rozetka.xml',
        sourceType: 'URL',
        fileFormat: 'XML_ROZETKA',
        productsCount: 150,
        syncIntervalHours: 4,
        autoUpdatePrices: true,
        autoUpdateStocks: true,
        autoCreateNewProducts: true,
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.supplierId).toBe(createdSupplierId);
    expect(res.body.name).toBe('Brain Rozetka XML');
    expect(res.body.sourceUrl).toBe('https://brain.com.ua/feed/rozetka.xml');
    expect(res.body.productsCount).toBe(150);
    expect(res.body.syncIntervalHours).toBe(4);
    createdFeedSourceId = res.body.id;
  });

  it('2. GET /api/feeds/suppliers/:id/sources & GET /api/feeds/sources — returns feed sources', async () => {
    const supplierSourcesRes = await request(app.getHttpServer())
      .get(`/api/feeds/suppliers/${createdSupplierId}/sources`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(Array.isArray(supplierSourcesRes.body)).toBe(true);
    expect(supplierSourcesRes.body.length).toBe(1);
    expect(supplierSourcesRes.body[0].id).toBe(createdFeedSourceId);

    const allSourcesRes = await request(app.getHttpServer())
      .get('/api/feeds/sources')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(Array.isArray(allSourcesRes.body)).toBe(true);
    const found = allSourcesRes.body.find((f: { id: string }) => f.id === createdFeedSourceId);
    expect(found).toBeDefined();
  });

  it('3. GET /api/suppliers/:id — aggregates real activeFeedsCount and productsCount', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/suppliers/${createdSupplierId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.activeFeedsCount).toBe(1);
    expect(res.body.productsCount).toBe(150);
  });

  it('4. PATCH /api/feeds/suppliers/:id/sources/:sourceId — updates feed source metadata', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/feeds/suppliers/${createdSupplierId}/sources/${createdFeedSourceId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Brain Updated XML',
        productsCount: 200,
        syncIntervalHours: 6,
      })
      .expect(200);

    expect(res.body.name).toBe('Brain Updated XML');
    expect(res.body.productsCount).toBe(200);
    expect(res.body.syncIntervalHours).toBe(6);
  });

  it('5. Multi-Tenant Protection on Feed Sources — User 2 cannot access or mutate User 1 feed source', async () => {
    await request(app.getHttpServer())
      .get(`/api/feeds/suppliers/${createdSupplierId}/sources`)
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/api/feeds/suppliers/${createdSupplierId}/sources/${createdFeedSourceId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ name: 'Hacked Feed' })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/feeds/suppliers/${createdSupplierId}/sources/${createdFeedSourceId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(404);
  });

  it('6. POST /api/suppliers/:id/categories/bulk-upsert — bulk upserts supplier category rules', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/suppliers/${createdSupplierId}/categories/bulk-upsert`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        categories: [
          {
            feedCategoryId: 'cat_laptops',
            name: 'Ноутбуки',
            feedSourceId: createdFeedSourceId,
            feedName: 'Brain Updated XML',
            productCount: 45,
            isActive: true,
          },
          {
            feedCategoryId: 'cat_tablets',
            name: 'Планшети',
            feedSourceId: createdFeedSourceId,
            feedName: 'Brain Updated XML',
            productCount: 30,
            isActive: true,
          },
        ],
      })
      .expect(201);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it('7. PATCH /api/suppliers/:id/categories/:categoryId/toggle & POST /batch-toggle — toggles category status', async () => {
    const toggleRes = await request(app.getHttpServer())
      .patch(`/api/suppliers/${createdSupplierId}/categories/cat_laptops/toggle`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ isActive: false })
      .expect(200);

    expect(toggleRes.body.isActive).toBe(false);

    const batchRes = await request(app.getHttpServer())
      .post(`/api/suppliers/${createdSupplierId}/categories/batch-toggle`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        categoryIds: ['cat_laptops', 'cat_tablets'],
        isActive: true,
      })
      .expect(200);

    expect(batchRes.body.updatedCount).toBe(2);
  });

  it('8. Multi-Marketplace Mapping Preservation — preserves ROZETKA and PROM simultaneously in marketplaceMappings JSONB', async () => {
    const rzRes = await request(app.getHttpServer())
      .patch(`/api/suppliers/${createdSupplierId}/categories/cat_laptops`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        marketplaceCode: 'ROZETKA',
        externalCategoryId: '80004',
        externalCategoryName: 'Ноутбуки',
        commissionPercent: 10,
      })
      .expect(200);

    expect(rzRes.body.marketplaceMappings?.ROZETKA?.externalCategoryId).toBe('80004');

    const promRes = await request(app.getHttpServer())
      .patch(`/api/suppliers/${createdSupplierId}/categories/cat_laptops`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        marketplaceCode: 'PROM',
        externalCategoryId: 'p_101',
        externalCategoryName: 'Ноутбуки та аксесуари',
        commissionPercent: 8,
      })
      .expect(200);

    expect(promRes.body.marketplaceMappings?.ROZETKA?.externalCategoryId).toBe('80004');
    expect(promRes.body.marketplaceMappings?.PROM?.externalCategoryId).toBe('p_101');
  });

  it('9. DELETE /api/suppliers/:id/categories/:categoryId — deletes a single category rule', async () => {
    await request(app.getHttpServer())
      .delete(`/api/suppliers/${createdSupplierId}/categories/cat_tablets`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const listRes = await request(app.getHttpServer())
      .get(`/api/suppliers/${createdSupplierId}/categories`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const tablets = listRes.body.find(
      (c: { feedCategoryId: string }) => c.feedCategoryId === 'cat_tablets',
    );
    expect(tablets).toBeUndefined();
  });

  it('10. POST /api/suppliers/:id/pricing-rules/bulk — bulk creates pricing tier rules', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/suppliers/${createdSupplierId}/pricing-rules/bulk`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        replaceExisting: true,
        rules: [
          {
            minPrice: 0,
            maxPrice: 500,
            marginPercent: 30,
            fixedMarkup: 0,
            priority: 1,
            isActive: true,
          },
          {
            minPrice: 500.01,
            maxPrice: 2000,
            marginPercent: 20,
            fixedMarkup: 50,
            priority: 2,
            isActive: true,
          },
          {
            minPrice: 2000.01,
            maxPrice: 10000,
            marginPercent: 15,
            fixedMarkup: 100,
            priority: 3,
            isActive: true,
          },
        ],
      })
      .expect(201);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
  });

  it('11. POST /api/suppliers/:id/sync & DELETE /api/suppliers/:id/sync-logs — triggers sync with metrics and clears logs', async () => {
    const syncRes = await request(app.getHttpServer())
      .post(`/api/suppliers/${createdSupplierId}/sync`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        totalProducts: 200,
        createdCount: 15,
        updatedCount: 180,
        outOfStockCount: 5,
      })
      .expect(200);

    expect(syncRes.body.totalProducts).toBe(200);
    expect(syncRes.body.updatedCount).toBe(180);

    const logsRes = await request(app.getHttpServer())
      .get(`/api/suppliers/${createdSupplierId}/sync-logs`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(Array.isArray(logsRes.body)).toBe(true);
    expect(logsRes.body.length).toBeGreaterThanOrEqual(1);

    await request(app.getHttpServer())
      .delete(`/api/suppliers/${createdSupplierId}/sync-logs`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const emptyLogsRes = await request(app.getHttpServer())
      .get(`/api/suppliers/${createdSupplierId}/sync-logs`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(emptyLogsRes.body.length).toBe(0);
  });

  it('12. DELETE /api/feeds/suppliers/:id/sources/:sourceId — deletes feed source', async () => {
    await request(app.getHttpServer())
      .delete(`/api/feeds/suppliers/${createdSupplierId}/sources/${createdFeedSourceId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const listRes = await request(app.getHttpServer())
      .get(`/api/feeds/suppliers/${createdSupplierId}/sources`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(listRes.body.length).toBe(0);
  });
});
