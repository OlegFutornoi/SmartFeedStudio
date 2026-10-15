import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { Role, CurrencyCode, ExchangeRateMode, PriceRoundingMode } from '@smartfeed/shared';
import { cleanDatabase } from '@test/utils/teardown.helper';

describe('Suppliers & Multi-Currency Management (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  let userToken: string;
  let user2Token: string;
  let createdSupplierId: string;
  let createdPricingRuleId: string;

  const createdEmails: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    await cleanDatabase(prisma, {
      emailPrefixes: ['sup.test1+', 'sup.test2+'],
    });

    // 1. Register User 1
    const user1Email = `sup.test1+${timestamp}@smartfeed.local`;
    createdEmails.push(user1Email);
    const u1Res = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: user1Email,
      password: 'UserPassword123!',
      fullName: 'Supplier Test User 1',
      role: Role.USER,
    });
    userToken = u1Res.body.tokens.accessToken;

    // 2. Register User 2 (for multi-tenant isolation testing)
    const user2Email = `sup.test2+${timestamp}@smartfeed.local`;
    createdEmails.push(user2Email);
    const u2Res = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: user2Email,
      password: 'UserPassword123!',
      fullName: 'Supplier Test User 2',
      role: Role.USER,
    });
    user2Token = u2Res.body.tokens.accessToken;
  });

  afterAll(async () => {
    await cleanDatabase(prisma, {
      userEmails: createdEmails,
      emailPrefixes: ['sup.test1+', 'sup.test2+'],
    });
    await app.close();
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

    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Brain Distribution Inc');
    expect(res.body.baseCurrency).toBe('USD');
    expect(res.body.targetCurrency).toBe('UAH');
    expect(res.body.exchangeRate).toBe(41.5);
    expect(res.body.currencyBufferPercent).toBe(2.5);
    expect(res.body.priceRounding).toBe('DECIMAL_99');
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
    expect(res.body.exchangeRate).toBe(41.5);
  });

  it('4. PATCH /api/suppliers/:id — updates supplier and toggles isActive status', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/suppliers/${createdSupplierId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        isActive: false,
        exchangeRate: 42.0,
        defaultMarginPercent: 30,
      })
      .expect(200);

    expect(res.body.isActive).toBe(false);
    expect(res.body.exchangeRate).toBe(42.0);
    expect(res.body.defaultMarginPercent).toBe(30);
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

  it('8. DELETE /api/suppliers/:id — cascades and deletes supplier cleanly', async () => {
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
