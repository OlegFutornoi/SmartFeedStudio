import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { cleanDatabase } from './utils/teardown.helper';

describe('Licenses & Tariff Plan Expiration Policy (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken: string;
  let userToken: string;
  let expiredUserToken: string;

  const testAdmin = {
    email: 'admin.lic.test@smartfeed.studio',
    password: 'AdminPassword123!',
    fullName: 'Admin License Tester',
  };

  const testUser = {
    email: 'user.lic.test@smartfeed.studio',
    password: 'UserPassword123!',
    fullName: 'User License Tester',
  };

  const expiredUser = {
    email: 'expired.lic.test@smartfeed.studio',
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

    // Ensure clean state before tests run
    const testEmails = [
      testAdmin.email,
      testUser.email,
      expiredUser.email,
      'duration.test@smartfeed.studio',
    ];
    await cleanDatabase(prisma, {
      userEmails: testEmails,
      emailPrefixes: [
        'admin.lic.test',
        'user.lic.test',
        'expired.lic.test',
        'duration.test',
        'lic-delete-test',
      ],
    });

    // 1. Register Super Admin
    await request(app.getHttpServer()).post('/api/auth/register').send(testAdmin);
    await prisma.user.update({
      where: { email: testAdmin.email },
      data: { role: 'SUPER_ADMIN' },
    });

    const adminLoginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testAdmin.email, password: testAdmin.password });
    adminToken = adminLoginRes.body.tokens.accessToken;

    // 2. Register Standard User
    const userRegRes = await request(app.getHttpServer()).post('/api/auth/register').send(testUser);
    userToken = userRegRes.body.tokens.accessToken;

    // 3. Register Expired User
    const expiredRegRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(expiredUser);
    expiredUserToken = expiredRegRes.body.tokens.accessToken;

    // Wait briefly for EventBus to finish provisioning licenses
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Manually expire the license for expiredUser
    await prisma.license.updateMany({
      where: { user: { email: expiredUser.email } },
      data: {
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired 1 day ago
      },
    });
  });

  afterAll(async () => {
    // Teardown test data with 100% cleanup
    const testEmails = [
      testAdmin.email,
      testUser.email,
      expiredUser.email,
      'duration.test@smartfeed.studio',
    ];
    await cleanDatabase(prisma, {
      userEmails: testEmails,
      emailPrefixes: [
        'admin.lic.test',
        'user.lic.test',
        'expired.lic.test',
        'duration.test',
        'lic-delete-test',
      ],
    });

    // Reset STARTER plan duration back to 30 days
    await prisma.tariffPlan.updateMany({
      where: { code: 'STARTER' },
      data: { durationDays: 30 },
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
      // New quota fields
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

      // Admin updates STARTER plan duration from 7 to 14 days
      await request(app.getHttpServer())
        .patch(`/api/plans/${starterPlan!.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ durationDays: 14 })
        .expect(200);

      // Register new user under 14-day duration
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

      // Restore STARTER plan duration to 30
      await request(app.getHttpServer())
        .patch(`/api/plans/${starterPlan!.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ durationDays: 30 })
        .expect(200);
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
      expect(res.body.maxXmlLimit).toBe(100000); // Updated Pro limit: 100k SKU
      expect(res.body.aiCredits).toBe(2500); // Approved Pro AI credits
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
      // 1. Expired user selects ENTERPRISE plan
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

      // 2. Storage presigned url generation now succeeds!
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

  describe('PATCH /api/licenses/:id/status (Admin License Suspend & Resume)', () => {
    let targetLicenseId: string;

    beforeAll(async () => {
      const myLicRes = await request(app.getHttpServer())
        .get('/api/licenses/my')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      targetLicenseId = myLicRes.body.id;
    });

    it('should allow admin to suspend an active license (isActive: false)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/licenses/${targetLicenseId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(res.body.id).toBe(targetLicenseId);
      expect(res.body.isActive).toBe(false);
    });

    it('should allow admin to resume a suspended license (isActive: true)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/licenses/${targetLicenseId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true })
        .expect(200);

      expect(res.body.id).toBe(targetLicenseId);
      expect(res.body.isActive).toBe(true);
    });

    it('should reject non-admin users with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .patch(`/api/licenses/${targetLicenseId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ isActive: false })
        .expect(403);
    });

    it('should return 404 for non-existent license ID', async () => {
      await request(app.getHttpServer())
        .patch('/api/licenses/non-existent-license-id/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(404);
    });
  });

  describe('DELETE /api/licenses/:id (Admin License Deletion)', () => {
    let licenseToDeleteId: string;
    let tempEmail: string;
    let tempUserToken: string;

    beforeAll(async () => {
      // Create a temporary user with a license to delete
      tempEmail = `lic-delete-test-${Date.now()}@smartfeed.studio`;
      const regRes = await request(app.getHttpServer()).post('/api/auth/register').send({
        email: tempEmail,
        password: 'Password123!',
        fullName: 'Delete License Target',
      });
      tempUserToken = regRes.body.tokens.accessToken;
      await new Promise((resolve) => setTimeout(resolve, 200));

      const licRes = await request(app.getHttpServer())
        .get('/api/licenses/my')
        .set('Authorization', `Bearer ${tempUserToken}`)
        .expect(200);
      licenseToDeleteId = licRes.body.id;
    });

    afterAll(async () => {
      if (tempEmail) {
        await cleanDatabase(prisma, {
          userEmails: [tempEmail],
          emailPrefixes: ['lic-delete-test'],
        });
      }
    });

    it('should reject non-admin users with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .delete(`/api/licenses/${licenseToDeleteId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent license ID', async () => {
      await request(app.getHttpServer())
        .delete('/api/licenses/non-existent-license-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should allow admin to delete a license by ID', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/licenses/${licenseToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify license is deleted from DB
      const checkLic = await prisma.license.findUnique({
        where: { id: licenseToDeleteId },
      });
      expect(checkLic).toBeNull();
    });

    it('користувач із видаленою ліцензією отримує 404 на /api/licenses/my та 403 LICENSE_EXPIRED на захищених ендпоінтах', async () => {
      // 1. GET /api/licenses/my returns 404
      await request(app.getHttpServer())
        .get('/api/licenses/my')
        .set('Authorization', `Bearer ${tempUserToken}`)
        .expect(404);

      // 2. Protected storage endpoint returns 403 LICENSE_EXPIRED
      const blockRes = await request(app.getHttpServer())
        .post('/api/storage/presigned-url')
        .set('Authorization', `Bearer ${tempUserToken}`)
        .send({
          fileName: 'deleted_license_test.zip',
          contentType: 'application/zip',
        })
        .expect(403);

      expect(blockRes.body.message).toBe('LICENSE_EXPIRED');
    });
  });

  describe('6. Уніфікована система квот у реальному часі (GET /api/licenses/quotas)', () => {
    it('повертає коректний розрахунок квот для користувача зі STARTER тарифом', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/licenses/quotas')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('planCode');
      expect(res.body).toHaveProperty('suppliers');
      expect(res.body.suppliers).toHaveProperty('used');
      expect(res.body.suppliers).toHaveProperty('max');
      expect(res.body.suppliers).toHaveProperty('percentUsed');
      expect(res.body.suppliers).toHaveProperty('isUnlimited');

      expect(res.body).toHaveProperty('products');
      expect(res.body).toHaveProperty('feeds');
      expect(res.body).toHaveProperty('channels');
      expect(res.body).toHaveProperty('storage');
    });

    it('Super Admin отримує безлімітні квоти (isUnlimited: true)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/licenses/quotas')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.suppliers.isUnlimited).toBe(true);
      expect(res.body.products.isUnlimited).toBe(true);
      expect(res.body.feeds.isUnlimited).toBe(true);
    });

    it('коректно фіксує isExceeded: true коли користувач знижує тариф і дані перевищують ліміт', async () => {
      // Create supplier & 2 products for testUser
      const _sup = await request(app.getHttpServer())
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Excess Supplier', code: 'EXC-01' });

      // User selects PRO
      await request(app.getHttpServer())
        .post('/api/licenses/select-plan')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ planCode: 'PRO' })
        .expect(201);

      // User downgrades to STARTER (limit 1 supplier)
      await request(app.getHttpServer())
        .post('/api/licenses/select-plan')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ planCode: 'STARTER' })
        .expect(201);

      const quotasRes = await request(app.getHttpServer())
        .get('/api/licenses/quotas')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(quotasRes.body.planCode).toBe('STARTER');
      expect(quotasRes.body.suppliers.max).toBe(1);
      expect(quotasRes.body.suppliers.used).toBeGreaterThanOrEqual(1);
    });
  });
});
