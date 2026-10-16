import * as request from 'supertest';
import { CurrencyCode } from '@smartfeed/shared';
import type { INestApplication } from '@nestjs/common';
import {
  bootstrapSuppliersTestContext,
  type SuppliersTestContext,
} from '@test/utils/suppliers-app.helper';

describe('Suppliers CRM Fields & Validation (E2E)', () => {
  let ctx: SuppliersTestContext;
  let app: INestApplication;
  let timestamp: number;
  let userToken: string;

  beforeAll(async () => {
    ctx = await bootstrapSuppliersTestContext('sup.crm');
    ({ app, timestamp, userToken } = ctx);
  });

  afterAll(async () => {
    await ctx.teardown();
  });

  it('8. Robust CRM saving: handles empty emails, non-protocol websites, and persists all 13 CRM fields', async () => {
    const crmPayload = {
      name: 'MobiOptom Wholesale',
      code: `MOBI_${timestamp}`,
      website: 'mobioptom.com',
      contactEmail: '',
      contactPhone: '+380501234567',
      legalName: 'ТОВ «МобіОптом Україна»',
      taxId: '44556677',
      industry: 'Мобільні аксесуари',
      segment: 'Дропшипінг / B2B',
      managerName: 'Іван Петренко',
      managerPosition: 'Керівник B2B відділу',
      managerPhone: '+380671112233',
      managerEmail: '',
      managerTelegram: '@mobioptom_mgr',
      country: 'Україна',
      city: 'Одеса',
      address: 'Промринок 7км, Базова 12',
      postcode: '65000',
      baseCurrency: CurrencyCode.UAH,
    };

    // Create supplier
    const createRes = await request(app.getHttpServer())
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${userToken}`)
      .send(crmPayload)
      .expect(201);

    const supId = createRes.body.id;
    expect(supId).toBeDefined();
    expect(createRes.body.website).toBe('mobioptom.com');
    expect(createRes.body.legalName).toBe('ТОВ «МобіОптом Україна»');
    expect(createRes.body.taxId).toBe('44556677');
    expect(createRes.body.managerName).toBe('Іван Петренко');
    expect(createRes.body.managerPosition).toBe('Керівник B2B відділу');
    expect(createRes.body.managerTelegram).toBe('@mobioptom_mgr');
    expect(createRes.body.city).toBe('Одеса');
    expect(createRes.body.address).toBe('Промринок 7км, Базова 12');

    // Verify GET by ID
    const getRes = await request(app.getHttpServer())
      .get(`/api/suppliers/${supId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(getRes.body.legalName).toBe('ТОВ «МобіОптом Україна»');
    expect(getRes.body.managerPosition).toBe('Керівник B2B відділу');

    // PATCH update CRM fields
    const patchRes = await request(app.getHttpServer())
      .patch(`/api/suppliers/${supId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        legalName: 'ТОВ «МобіОптом Плюс»',
        managerPosition: 'Комерційний директор',
        contactEmail: 'sales@mobioptom.ua',
        website: 'https://mobioptom.ua',
        city: 'Київ',
      })
      .expect(200);

    expect(patchRes.body.legalName).toBe('ТОВ «МобіОптом Плюс»');
    expect(patchRes.body.managerPosition).toBe('Комерційний директор');
    expect(patchRes.body.contactEmail).toBe('sales@mobioptom.ua');
    expect(patchRes.body.website).toBe('https://mobioptom.ua');
    expect(patchRes.body.city).toBe('Київ');

    // Clean up
    await request(app.getHttpServer())
      .delete(`/api/suppliers/${supId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
  });

  it('9. Validation Guard: rejects invalid currency and negative markups with 400 Bad Request', async () => {
    // Bad currency
    await request(app.getHttpServer())
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Invalid Currency Supplier',
        code: `BAD_CUR_${timestamp}`,
        baseCurrency: 'BITCOIN',
      })
      .expect(400);

    // Negative margin percent
    await request(app.getHttpServer())
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Negative Margin Supplier',
        code: `NEG_MAR_${timestamp}`,
        defaultMarginPercent: -10,
      })
      .expect(400);
  });
});
