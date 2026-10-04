import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { Role, PaymentProvider } from '@smartfeed/shared';
import { cleanDatabase } from '@test/utils/teardown.helper';

describe('Payments & Transactions Integration (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  let adminToken: string;
  let userToken: string;
  let userId: string;

  const createdEmails: string[] = [];
  const secretKey = 'flk3409refn54t54t*FNJRET';

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
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();

    await cleanDatabase(prisma, {
      emailPrefixes: ['payments.tx.admin+', 'payments.tx.user+'],
    });

    await prisma.paymentSetting.upsert({
      where: { provider: PaymentProvider.WAYFORPAY },
      update: {
        isEnabled: true,
        isTestMode: true,
        merchantAccount: 'test_merch_n1',
        merchantSecretKey: secretKey,
        merchantDomain: 'www.market.ua',
        serviceUrl: 'http://localhost:4000/api/payments/wayforpay/webhook',
        returnUrl: 'http://localhost:1420/payment/result',
      },
      create: {
        provider: PaymentProvider.WAYFORPAY,
        isEnabled: true,
        isTestMode: true,
        merchantAccount: 'test_merch_n1',
        merchantSecretKey: secretKey,
        merchantDomain: 'www.market.ua',
        serviceUrl: 'http://localhost:4000/api/payments/wayforpay/webhook',
        returnUrl: 'http://localhost:1420/payment/result',
      },
    });

    // 1. Register Super Admin
    const adminEmail = `payments.tx.admin+${timestamp}@smartfeed.local`;
    createdEmails.push(adminEmail);
    const adminRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: adminEmail,
      password: 'AdminPassword123!',
      fullName: 'Payment Super Admin',
      role: Role.SUPER_ADMIN,
    });
    adminToken = adminRes.body.tokens.accessToken;

    // 2. Register Standard Customer
    const userEmail = `payments.tx.user+${timestamp}@smartfeed.local`;
    createdEmails.push(userEmail);
    const userRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: userEmail,
      password: 'UserPassword123!',
      fullName: 'Payment Client Store',
      role: Role.USER,
    });
    userToken = userRes.body.tokens.accessToken;
    userId = userRes.body.user.id;
  });

  afterAll(async () => {
    await cleanDatabase(prisma, {
      userEmails: createdEmails,
      emailPrefixes: ['payments.tx.admin+', 'payments.tx.user+'],
    });
    await app.close();
  });

  describe('1. Checkout Invoice Creation (POST /api/payments/checkout)', () => {
    it('повинен відхилити створення інвойсу без авторизації (401 Unauthorized)', async () => {
      await request(app.getHttpServer())
        .post('/api/payments/checkout')
        .send({ planCode: 'GROWTH', billingInterval: 'monthly' })
        .expect(401);
    });

    it('повинен повернути 404 якщо зазначено неіснуючий план', async () => {
      await request(app.getHttpServer())
        .post('/api/payments/checkout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ planCode: 'NON_EXISTENT_PLAN', billingInterval: 'monthly' })
        .expect(404);
    });

    it('повинен успішно створити щомісячний інвойс WayForPay для тарифу GROWTH (690 грн) та зберегти транзакцію у статусі PENDING', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/payments/checkout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ planCode: 'GROWTH', billingInterval: 'monthly' })
        .expect(201);

      expect(res.body).toHaveProperty('orderReference');
      expect(res.body.orderReference).toMatch(/^SF-INV-/);
      expect(res.body.amount).toBe(690);
      expect(res.body.currency).toBe('UAH');
      expect(res.body.merchantAccount).toBe('test_merch_n1');
      expect(res.body).toHaveProperty('merchantSignature');

      const tx = await prisma.paymentTransaction.findUnique({
        where: { orderReference: res.body.orderReference },
      });
      expect(tx).not.toBeNull();
      expect(tx?.status).toBe('PENDING');
      expect(tx?.planCode).toBe('GROWTH');
      expect(tx?.billingInterval).toBe('MONTHLY');
      expect(Number(tx?.amount)).toBe(690);
    });

    it('повинен успішно створити річний інвойс WayForPay для тарифу PRO (14280 грн) з правильною сумою', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/payments/checkout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ planCode: 'PRO', billingInterval: 'yearly' })
        .expect(201);

      expect(res.body.amount).toBe(14280);
      expect(res.body.currency).toBe('UAH');

      const tx = await prisma.paymentTransaction.findUnique({
        where: { orderReference: res.body.orderReference },
      });
      expect(tx?.billingInterval).toBe('YEARLY');
      expect(Number(tx?.amount)).toBe(14280);
    });
  });

  describe('2. Admin Transactions, Stats & Gateway Settings', () => {
    it('звичайний користувач не має доступу до списку транзакцій адмінки (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get('/api/payments/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('адміністратор отримує повний список транзакцій з пагінацією та пошуком', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/payments/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body.transactions)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('користувач може отримати історію власних транзакцій (GET /api/payments/my-transactions)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/payments/my-transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(res.body.transactions)).toBe(true);
      expect(res.body.transactions.every((t: { userId: string }) => t.userId === userId)).toBe(
        true,
      );
    });

    it('адміністратор отримує агреговану фінансову статистику (GET /api/payments/stats)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/payments/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('totalRevenueUah');
      expect(res.body).toHaveProperty('successfulCount');
      expect(res.body).toHaveProperty('averageCheckUah');
    });

    it('адміністратор може отримати та оновити налаштування WayForPay (GET & PATCH /api/payments/settings)', async () => {
      const getRes = await request(app.getHttpServer())
        .get('/api/payments/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(getRes.body)).toBe(true);
      const wfpSetting = (getRes.body as Array<{ provider: PaymentProvider }>).find(
        (s) => s.provider === PaymentProvider.WAYFORPAY,
      );
      expect(wfpSetting).toBeDefined();

      const patchRes = await request(app.getHttpServer())
        .patch(`/api/payments/settings/${PaymentProvider.WAYFORPAY}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          merchantAccount: 'my_custom_live_merchant',
          isTestMode: false,
        })
        .expect(200);

      expect(patchRes.body.merchantAccount).toBe('my_custom_live_merchant');
      expect(patchRes.body.isTestMode).toBe(false);

      await request(app.getHttpServer())
        .patch(`/api/payments/settings/${PaymentProvider.WAYFORPAY}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          merchantAccount: 'test_merch_n1',
          isTestMode: true,
        })
        .expect(200);
    });
  });
});
