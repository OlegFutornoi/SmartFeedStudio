import * as request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import {
  bootstrapSuppliersTestContext,
  type SuppliersTestContext,
} from '@test/utils/suppliers-app.helper';

describe('Suppliers & Multi-Currency Management (E2E)', () => {
  let ctx: SuppliersTestContext;
  let app: INestApplication;
  let timestamp: number;
  let userToken: string;
  let user2Token: string;
  let createdSupplierId: string;
  let createdPricingRuleId: string;

  beforeAll(async () => {
    ctx = await bootstrapSuppliersTestContext('sup.test');
    ({ app, timestamp, userToken, user2Token } = ctx);
  });

  afterAll(async () => {
    await ctx.teardown();
  });

  it('1. POST /api/suppliers — creates a new supplier with currency & markup settings', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Brain Distribution Inc',
        code: `BRAIN_${timestamp}`,
        contactEmail: 'sales@brain.local',
        contactPhone: '+380501112233',
        website: 'https://brain.com.ua',
        legalName: 'ТОВ «Брейн Дистрибʼюшн»',
        taxId: '30370505',
        industry: 'Електроніка та IT',
        segment: 'Офіційний дистрибʼютор',
        managerName: 'Олександр Коваленко',
        managerPosition: 'Key Account Manager',
        managerPhone: '+380674445566',
        managerEmail: 'b2b@brain.local',
        managerTelegram: '@brain_b2b',
        country: 'Україна',
        city: 'Київ',
        address: 'вул. Степана Бандери, 21',
        postcode: '04073',
        defaultMarginPercent: 25,
        defaultFixedMarkup: 100,
        isActive: true,
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Brain Distribution Inc');
    expect(res.body.legalName).toBe('ТОВ «Брейн Дистрибʼюшн»');
    expect(res.body.taxId).toBe('30370505');
    expect(res.body.industry).toBe('Електроніка та IT');
    expect(res.body.segment).toBe('Офіційний дистрибʼютор');
    expect(res.body.managerName).toBe('Олександр Коваленко');
    expect(res.body.managerPosition).toBe('Key Account Manager');
    expect(res.body.managerTelegram).toBe('@brain_b2b');
    expect(res.body.city).toBe('Київ');
    expect(res.body.address).toBe('вул. Степана Бандери, 21');
    expect(res.body.postcode).toBe('04073');
    expect(res.body.defaultMarginPercent).toBe(25);
    expect(res.body.isActive).toBe(true);

    createdSupplierId = res.body.id;
  });

  it('2. GET /api/suppliers — returns list of suppliers for current user', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/suppliers')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    const target = (res.body as Array<{ id: string; name: string }>).find(
      (s) => s.id === createdSupplierId,
    );
    expect(target).toBeDefined();
    expect(target?.name).toBe('Brain Distribution Inc');
  });

  it('3. GET /api/suppliers/:id — returns supplier details by ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/suppliers/${createdSupplierId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.id).toBe(createdSupplierId);
    expect(res.body.defaultMarginPercent).toBe(25);
  });

  it('4. PATCH /api/suppliers/:id — updates supplier, CRM fields and toggles isActive status', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/suppliers/${createdSupplierId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        isActive: false,
        defaultMarginPercent: 30,
        managerPosition: 'Head of Commercial B2B',
        city: 'Львів',
      })
      .expect(200);

    expect(res.body.isActive).toBe(false);
    expect(res.body.defaultMarginPercent).toBe(30);
    expect(res.body.managerPosition).toBe('Head of Commercial B2B');
    expect(res.body.city).toBe('Львів');
  });

  it('5. Multi-Tenant Protection — User 2 cannot access or edit User 1 supplier', async () => {
    // User 2 GET User 1 supplier -> 404
    await request(app.getHttpServer())
      .get(`/api/suppliers/${createdSupplierId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(404);

    // User 2 PATCH User 1 supplier -> 404
    await request(app.getHttpServer())
      .patch(`/api/suppliers/${createdSupplierId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ name: 'Hacked Supplier' })
      .expect(404);
  });

  it('6. POST & GET /api/suppliers/:id/pricing-rules — creates and lists pricing tier rules', async () => {
    // Create rule
    const createRes = await request(app.getHttpServer())
      .post(`/api/suppliers/${createdSupplierId}/pricing-rules`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        minPrice: 0,
        maxPrice: 1000,
        marginPercent: 20,
        fixedMarkup: 50,
        priority: 1,
        isActive: true,
      })
      .expect(201);

    expect(createRes.body.id).toBeDefined();
    expect(createRes.body.marginPercent).toBe(20);
    createdPricingRuleId = createRes.body.id;

    // Get rules
    const listRes = await request(app.getHttpServer())
      .get(`/api/suppliers/${createdSupplierId}/pricing-rules`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(listRes.body.length).toBe(1);
    expect(listRes.body[0].id).toBe(createdPricingRuleId);
  });

  it('7. PATCH & DELETE /api/suppliers/:id/pricing-rules/:ruleId — updates and deletes rule', async () => {
    const updateRes = await request(app.getHttpServer())
      .patch(`/api/suppliers/${createdSupplierId}/pricing-rules/${createdPricingRuleId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ marginPercent: 25 })
      .expect(200);

    expect(updateRes.body.marginPercent).toBe(25);

    await request(app.getHttpServer())
      .delete(`/api/suppliers/${createdSupplierId}/pricing-rules/${createdPricingRuleId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const listRes = await request(app.getHttpServer())
      .get(`/api/suppliers/${createdSupplierId}/pricing-rules`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(listRes.body.length).toBe(0);
  });

  it('8. Local-first decoupling — /api/suppliers/marketplace-categories is decoupled from backend (strictly client-side)', async () => {
    await request(app.getHttpServer())
      .get('/api/suppliers/marketplace-categories?marketplaceCode=ROZETKA')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(404);
  });

  it('8b. Local-first decoupling — sync-settings, sync-logs, and sync are decoupled from backend (strictly client-side)', async () => {
    await request(app.getHttpServer())
      .get(`/api/suppliers/${createdSupplierId}/sync-settings`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .get(`/api/suppliers/${createdSupplierId}/sync-logs`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .post(`/api/suppliers/${createdSupplierId}/sync`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ totalProducts: 100 })
      .expect(404);
  });

  it('9. PATCH & GET /api/suppliers/:id/categories/:categoryId — maps category with mutually exclusive markup (% vs ₴)', async () => {
    const mapRzRes = await request(app.getHttpServer())
      .patch(`/api/suppliers/${createdSupplierId}/categories/cat_switches_elios`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Черные выключатели ELIOS в стеклянной 2.5D рамке',
        marginPercent: 35,
        commissionPercent: 12,
        marketplaceCode: 'ROZETKA',
        externalCategoryId: '4662497',
        externalCategoryName: 'Розумні вимикачі',
      })
      .expect(200);

    expect(mapRzRes.body.markupType).toBe('PERCENT');
    expect(mapRzRes.body.marginPercent).toBe(35);
    expect(mapRzRes.body.fixedMarkup).toBeNull();
    expect(mapRzRes.body.commissionPercent).toBe(12);
    expect(mapRzRes.body.externalCategoryId).toBe('4662497');
    expect(mapRzRes.body.externalCategoryName).toBe('Розумні вимикачі');
    expect(mapRzRes.body.marketplaceMappings?.ROZETKA?.externalCategoryId).toBe('4662497');

    const fixedRes = await request(app.getHttpServer())
      .patch(`/api/suppliers/${createdSupplierId}/categories/cat_switches_elios`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        markupType: 'FIXED',
        fixedMarkup: 150,
      })
      .expect(200);

    expect(fixedRes.body.markupType).toBe('FIXED');
    expect(fixedRes.body.fixedMarkup).toBe(150);
    expect(fixedRes.body.marginPercent).toBeNull();

    const getRes = await request(app.getHttpServer())
      .get(`/api/suppliers/${createdSupplierId}/categories`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const cat = getRes.body.find(
      (c: { feedCategoryId: string }) => c.feedCategoryId === 'cat_switches_elios',
    );
    expect(cat).toBeDefined();
    expect(cat.markupType).toBe('FIXED');
    expect(cat.fixedMarkup).toBe(150);
    expect(cat.marginPercent).toBeNull();
  });

  it('10. DELETE /api/suppliers/:id — cascades and deletes supplier cleanly', async () => {
    await request(app.getHttpServer())
      .delete(`/api/suppliers/${createdSupplierId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/suppliers/${createdSupplierId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(404);
  });
});
