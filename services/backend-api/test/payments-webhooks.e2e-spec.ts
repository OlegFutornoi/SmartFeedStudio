import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as crypto from 'crypto';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { Role, PaymentProvider } from '@smartfeed/shared';
import { cleanDatabase } from '@test/utils/teardown.helper';

describe('Payments & WayForPay Webhooks Integration (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
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
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();

    await cleanDatabase(prisma, {
      emailPrefixes: ['payments.wh.user+'],
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

    const userEmail = `payments.wh.user+${timestamp}@smartfeed.local`;
    createdEmails.push(userEmail);
    const userRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: userEmail,
      password: 'UserPassword123!',
      fullName: 'Payment Webhook Store',
      role: Role.USER,
    });
    userToken = userRes.body.tokens.accessToken;
    userId = userRes.body.user.id;
  });

  afterAll(async () => {
    await cleanDatabase(prisma, {
      userEmails: createdEmails,
      emailPrefixes: ['payments.wh.user+'],
    });
    await app.close();
  });

  describe('WayForPay Webhook Handling (POST /api/payments/wayforpay/webhook)', () => {
    let orderRefToApprove: string;
    let orderRefToDecline: string;

    beforeAll(async () => {
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

      const updatedTx = await prisma.paymentTransaction.findUnique({
        where: { orderReference: orderRefToApprove },
      });
      expect(updatedTx?.status).toBe('APPROVED');
      expect(updatedTx?.providerPaymentId).toBe('AUTH-889900');
      expect(updatedTx?.cardPan).toBe('411111****1111');
      expect(updatedTx?.issuerBank).toBe('Monobank');

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
});
