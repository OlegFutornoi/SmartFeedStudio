import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as crypto from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role, PaymentProvider } from '@smartfeed/shared';
import { cleanDatabase } from './utils/teardown.helper';

describe('Payments & WayForPay Gateway Integration (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  let adminToken: string;
  let userToken: string;
  let userId: string;

  const createdEmails: string[] = [];
  const secretKey = 'flk3409refn54t54t*FNJRET';

  function generateHmacMd5(fields: (string | number)[], key: string): string {
    const rawString = fields.map((f) => String(f)).join(';');
    return crypto.createHmac('md5', key).update(rawString, 'utf8').digest('hex');
  }

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
      emailPrefixes: ['payments.admin+', 'payments.user+'],
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
    const adminEmail = `payments.admin+${timestamp}@smartfeed.local`;
    createdEmails.push(adminEmail);
    const adminRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: adminEmail,
      password: 'AdminPassword123!',
      fullName: 'Payment Super Admin',
      role: Role.SUPER_ADMIN,
    });
    adminToken = adminRes.body.tokens.accessToken;

    // 2. Register Standard Customer
    const userEmail = `payments.user+${timestamp}@smartfeed.local`;
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
      emailPrefixes: ['payments.admin+', 'payments.user+'],
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

      // Перевіряємо запис у БД
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

  describe('2. WayForPay Webhook Handling (POST /api/payments/wayforpay/webhook)', () => {
    let orderRefToApprove: string;
    let orderRefToDecline: string;

    beforeAll(async () => {
      // Створюємо 2 інвойси для тестів вебхуків
      const res1 = await request(app.getHttpServer())
        .post('/api/payments/checkout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ planCode: 'PRO', billingInterval: 'monthly' });
      orderRefToApprove = res1.body.orderReference;

      const res2 = await request(app.getHttpServer())
        .post('/api/payments/checkout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ planCode: 'GROWTH', billingInterval: 'monthly' });
      orderRefToDecline = res2.body.orderReference;
    });

    it('повинен відхилити Webhook з невалідним підписом (400 Bad Request)', async () => {
      const invalidPayload = {
        merchantAccount: 'test_merch_n1',
        orderReference: orderRefToApprove,
        merchantSignature: 'invalid_fake_signature_hash',
        amount: 1490,
        currency: 'UAH',
        authCode: '123456',
        cardPan: '411111****1111',
        transactionStatus: 'Approved',
      };

      await request(app.getHttpServer())
        .post('/api/payments/wayforpay/webhook')
        .send(invalidPayload)
        .expect(400);
    });

    it('повинен успішно обробити Approved Webhook, перевести транзакцію в APPROVED, подовжити ліцензію та повернути accept підпис', async () => {
      const signatureFields = [
        'test_merch_n1',
        orderRefToApprove,
        1490,
        'UAH',
        'AUTH-889900',
        '411111****1111',
        'Approved',
        '',
      ];
      const merchantSignature = generateHmacMd5(signatureFields, secretKey);

      const validApprovedPayload = {
        merchantAccount: 'test_merch_n1',
        orderReference: orderRefToApprove,
        merchantSignature,
        amount: 1490,
        currency: 'UAH',
        authCode: 'AUTH-889900',
        cardPan: '411111****1111',
        cardType: 'Visa',
        issuerBankName: 'Monobank',
        transactionStatus: 'Approved',
        paymentSystem: 'card',
      };

      const res = await request(app.getHttpServer())
        .post('/api/payments/wayforpay/webhook')
        .send(validApprovedPayload)
        .expect(200);

      expect(res.body.orderReference).toBe(orderRefToApprove);
      expect(res.body.status).toBe('accept');
      expect(res.body).toHaveProperty('signature');

      // Перевіряємо статус транзакції в БД
      const updatedTx = await prisma.paymentTransaction.findUnique({
        where: { orderReference: orderRefToApprove },
      });
      expect(updatedTx?.status).toBe('APPROVED');
      expect(updatedTx?.providerPaymentId).toBe('AUTH-889900');
      expect(updatedTx?.cardPan).toBe('411111****1111');
      expect(updatedTx?.issuerBank).toBe('Monobank');

      // Перевіряємо, що користувач отримав активну ліцензію PRO
      const license = await prisma.license.findFirst({
        where: { userId, isActive: true },
      });
      expect(license?.planType).toBe('PRO');
      expect(license?.isActive).toBe(true);
    });

    it('повинен коректно зафіксувати відхилену оплату (Declined)', async () => {
      const signatureFields = [
        'test_merch_n1',
        orderRefToDecline,
        690,
        'UAH',
        '',
        '411111****2222',
        'Declined',
        1101,
      ];
      const merchantSignature = generateHmacMd5(signatureFields, secretKey);

      const declinedPayload = {
        merchantAccount: 'test_merch_n1',
        orderReference: orderRefToDecline,
        merchantSignature,
        amount: 690,
        currency: 'UAH',
        cardPan: '411111****2222',
        transactionStatus: 'Declined',
        reason: 'Insufficient funds',
        reasonCode: 1101,
      };

      await request(app.getHttpServer())
        .post('/api/payments/wayforpay/webhook')
        .send(declinedPayload)
        .expect(200);

      const declinedTx = await prisma.paymentTransaction.findUnique({
        where: { orderReference: orderRefToDecline },
      });
      expect(declinedTx?.status).toBe('DECLINED');
      expect(declinedTx?.failureReason).toContain('Insufficient funds');
    });
  });

  describe('3. Admin Transactions, Stats & Gateway Settings', () => {
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
      expect(res.body.transactions.every((t: any) => t.userId === userId)).toBe(true);
    });

    it('адміністратор отримує агреговану фінансову статистику (GET /api/payments/stats)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/payments/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('totalRevenueUah');
      expect(res.body).toHaveProperty('successfulCount');
      expect(res.body).toHaveProperty('averageCheckUah');
      expect(res.body.totalRevenueUah).toBeGreaterThanOrEqual(1490);
    });

    it('адміністратор може отримати та оновити налаштування WayForPay (GET & PATCH /api/payments/settings)', async () => {
      // 1. Отримання
      const getRes = await request(app.getHttpServer())
        .get('/api/payments/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(getRes.body)).toBe(true);
      const wfpSetting = getRes.body.find((s: any) => s.provider === PaymentProvider.WAYFORPAY);
      expect(wfpSetting).toBeDefined();

      // 2. Оновлення
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

      // 3. Повертаємо назад у тестовий режим для ізоляції
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
