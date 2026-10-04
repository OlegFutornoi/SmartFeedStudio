import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { cleanDatabase } from '@test/utils/teardown.helper';

describe('Licenses Lifecycle & Duration Policy (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken: string;
  let userToken: string;
  let expiredUserToken: string;

  const testAdmin = {
    email: 'admin.lic.life@smartfeed.studio',
    password: 'AdminPassword123!',
    fullName: 'Admin License Tester',
  };

  const testUser = {
    email: 'user.lic.life@smartfeed.studio',
    password: 'UserPassword123!',
    fullName: 'User License Tester',
  };

  const expiredUser = {
    email: 'expired.lic.life@smartfeed.studio',
    password: 'UserPassword123!',
    fullName: 'Expired License Tester',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    const testEmails = [
      testAdmin.email,
      testUser.email,
      expiredUser.email,
      'duration.test@smartfeed.studio',
    ];
    await cleanDatabase(prisma, {
      userEmails: testEmails,
      emailPrefixes: ['admin.lic.life', 'user.lic.life', 'expired.lic.life', 'duration.test'],
    });

    await request(app.getHttpServer()).post('/api/auth/register').send(testAdmin);
    await prisma.user.update({
      where: { email: testAdmin.email },
      data: { role: 'SUPER_ADMIN' },
    });

    const adminLoginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testAdmin.email, password: testAdmin.password });
    adminToken = adminLoginRes.body.tokens.accessToken;

    const userRegRes = await request(app.getHttpServer()).post('/api/auth/register').send(testUser);
    userToken = userRegRes.body.tokens.accessToken;

    const expiredRegRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(expiredUser);
    expiredUserToken = expiredRegRes.body.tokens.accessToken;

    await new Promise((resolve) => setTimeout(resolve, 300));

    await prisma.license.updateMany({
      where: { user: { email: expiredUser.email } },
      data: {
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });
  });

  afterAll(async () => {
    const testEmails = [
      testAdmin.email,
      testUser.email,
      expiredUser.email,
      'duration.test@smartfeed.studio',
    ];
    await cleanDatabase(prisma, {
      userEmails: testEmails,
      emailPrefixes: ['admin.lic.life', 'user.lic.life', 'expired.lic.life', 'duration.test'],
    });
    await app.close();
  });

  describe('GET /api/licenses/my (License details & dynamic duration)', () => {
    it('should return auto-provisioned STARTER license with 7-day expiration and remaining days', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/licenses/my')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.planType).toBe('STARTER');
      expect(res.body.licenseKey).toMatch(/^SF-STARTER-/);
      expect(res.body.isExpired).toBe(false);
      expect(res.body.daysRemaining).toBeGreaterThanOrEqual(6);
      expect(res.body.daysRemaining).toBeLessThanOrEqual(7);
      expect(res.body.expiresAt).toBeDefined();
      expect(res.body.tariffPlan).toBeDefined();
      expect(res.body.tariffPlan.durationDays).toBe(30);
      expect(res.body.maxFeedsLimit).toBe(1);
      expect(res.body.maxChannelsLimit).toBe(1);
      expect(res.body.maxSuppliersLimit).toBe(1);
      expect(res.body.hasApiAccess).toBe(false);
    });

    it('should correctly flag expired license with isExpired: true and daysRemaining: 0', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/licenses/my')
        .set('Authorization', `Bearer ${expiredUserToken}`)
        .expect(200);

      expect(res.body.isExpired).toBe(true);
      expect(res.body.daysRemaining).toBe(0);
    });
  });

  describe('Customizable Dynamic Duration via Admin Settings', () => {
    it('should allow admin to change durationDays and apply it to new registrations', async () => {
      const starterPlan = await prisma.tariffPlan.findUnique({ where: { code: 'STARTER' } });
      expect(starterPlan).toBeDefined();

      try {
        await request(app.getHttpServer())
          .patch(`/api/plans/${starterPlan!.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ durationDays: 14 })
          .expect(200);

        const newDurationUser = {
          email: 'duration.test@smartfeed.studio',
          password: 'UserPassword123!',
          fullName: '14-Day Duration Tester',
        };
        const regRes = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send(newDurationUser)
          .expect(201);

        await new Promise((resolve) => setTimeout(resolve, 200));

        const licRes = await request(app.getHttpServer())
          .get('/api/licenses/my')
          .set('Authorization', `Bearer ${regRes.body.tokens.accessToken}`)
          .expect(200);

        expect(licRes.body.daysRemaining).toBeGreaterThanOrEqual(13);
        expect(licRes.body.daysRemaining).toBeLessThanOrEqual(14);
        expect(licRes.body.tariffPlan.durationDays).toBe(14);
      } finally {
        await request(app.getHttpServer())
          .patch(`/api/plans/${starterPlan!.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ durationDays: 30 });
      }
    });
  });

  describe('POST /api/licenses/select-plan (User Plan Selection & Renewal)', () => {
    it('should allow user to select STARTER paid plan and receive 30 days duration with starter quota', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/licenses/select-plan')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ planCode: 'STARTER' })
        .expect(201);

      expect(res.body.planType).toBe('STARTER');
      expect(res.body.licenseKey).toMatch(/^SF-STARTER-/);
      expect(res.body.isExpired).toBe(false);
      expect(res.body.tariffPlan.priceMonthly).toBe(299);
      expect(res.body.tariffPlan.priceYearly).toBe(2999);
      expect(res.body.daysRemaining).toBeGreaterThanOrEqual(29);
      expect(res.body.daysRemaining).toBeLessThanOrEqual(30);
    });

    it('should allow user to select PRO plan and receive 30 days duration with correct quota', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/licenses/select-plan')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ planCode: 'PRO' })
        .expect(201);

      expect(res.body.planType).toBe('PRO');
      expect(res.body.licenseKey).toMatch(/^SF-PRO-/);
      expect(res.body.maxXmlLimit).toBe(100000);
      expect(res.body.aiCredits).toBe(2500);
      expect(res.body.canCloudBackup).toBe(true);
      expect(res.body.maxFeedsLimit).toBeGreaterThan(1);
      expect(res.body.hasApiAccess).toBe(true);
      expect(res.body.hasFeedDiff).toBe(true);
      expect(res.body.isExpired).toBe(false);
      expect(res.body.daysRemaining).toBeGreaterThanOrEqual(29);
      expect(res.body.daysRemaining).toBeLessThanOrEqual(30);
    });

    it('should reject invalid or non-existent plan code with 404', async () => {
      await request(app.getHttpServer())
        .post('/api/licenses/select-plan')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ planCode: 'NON_EXISTENT_PLAN_CODE' })
        .expect(404);
    });

    it('should reject SUPER_ADMIN from selecting commercial customer plans with 403', async () => {
      await request(app.getHttpServer())
        .post('/api/licenses/select-plan')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ planCode: 'PRO' })
        .expect(403);
    });
  });

  describe('RequireActiveLicenseGuard (Access Enforcement)', () => {
    it('should block expired users from accessing protected features with 403 LICENSE_EXPIRED', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/storage/presigned-url')
        .set('Authorization', `Bearer ${expiredUserToken}`)
        .send({
          fileName: 'catalog_backup.zip',
          contentType: 'application/zip',
        })
        .expect(403);

      expect(res.body.message).toBe('LICENSE_EXPIRED');
    });

    it('should allow user to select a new plan in expired state and immediately restore access', async () => {
      const renewRes = await request(app.getHttpServer())
        .post('/api/licenses/select-plan')
        .set('Authorization', `Bearer ${expiredUserToken}`)
        .send({ planCode: 'ENTERPRISE' })
        .expect(201);

      expect(renewRes.body.planType).toBe('ENTERPRISE');
      expect(renewRes.body.isExpired).toBe(false);
      expect(renewRes.body.daysRemaining).toBeGreaterThanOrEqual(364);
      expect(renewRes.body.hasWhiteLabel).toBe(true);
      expect(renewRes.body.hasSso).toBe(true);
      expect(renewRes.body.hasAuditLog).toBe(true);

      const storageRes = await request(app.getHttpServer())
        .post('/api/storage/presigned-url')
        .set('Authorization', `Bearer ${expiredUserToken}`)
        .send({
          fileName: 'catalog_backup.zip',
          contentType: 'application/zip',
        })
        .expect(201);

      expect(storageRes.body.uploadUrl).toBeDefined();
      expect(storageRes.body.s3Key).toBeDefined();
    });
  });
});
