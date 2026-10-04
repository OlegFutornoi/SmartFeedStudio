import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { cleanDatabase } from '@test/utils/teardown.helper';

describe('Licenses Admin Actions & Quotas (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken: string;
  let userToken: string;

  const testAdmin = {
    email: 'admin.lic.limits@smartfeed.studio',
    password: 'AdminPassword123!',
    fullName: 'Admin Limits Tester',
  };

  const testUser = {
    email: 'user.lic.limits@smartfeed.studio',
    password: 'UserPassword123!',
    fullName: 'User Limits Tester',
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

    await cleanDatabase(prisma, {
      userEmails: [testAdmin.email, testUser.email],
      emailPrefixes: ['admin.lic.limits', 'user.lic.limits', 'lic-del-limits-'],
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

    await new Promise((resolve) => setTimeout(resolve, 300));
  });

  afterAll(async () => {
    await cleanDatabase(prisma, {
      userEmails: [testAdmin.email, testUser.email],
      emailPrefixes: ['admin.lic.limits', 'user.lic.limits', 'lic-del-limits-'],
    });
    await app.close();
  });

  describe('GET /api/licenses/admin (SUPER_ADMIN Exclusion from Commercial Licenses)', () => {
    it('should return client licenses but NEVER return licenses belonging to SUPER_ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/licenses/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const hasSuperAdmin = res.body.some(
        (lic: { user?: { role?: string; email?: string } }) =>
          lic.user?.role === 'SUPER_ADMIN' || lic.user?.email === testAdmin.email,
      );
      expect(hasSuperAdmin).toBe(false);
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
      tempEmail = `lic-del-limits-${Date.now()}@smartfeed.studio`;
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
          emailPrefixes: ['lic-del-limits-'],
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

      const checkLic = await prisma.license.findUnique({
        where: { id: licenseToDeleteId },
      });
      expect(checkLic).toBeNull();
    });

    it('користувач із видаленою ліцензією отримує 404 на /api/licenses/my та 403 LICENSE_EXPIRED на захищених ендпоінтах', async () => {
      await request(app.getHttpServer())
        .get('/api/licenses/my')
        .set('Authorization', `Bearer ${tempUserToken}`)
        .expect(404);

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

    it('коректно оновлює ліміти квот при зміні тарифного плану (PRO -> STARTER)', async () => {
      await request(app.getHttpServer())
        .post('/api/licenses/select-plan')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ planCode: 'PRO' })
        .expect(201);

      const proQuotas = await request(app.getHttpServer())
        .get('/api/licenses/quotas')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(proQuotas.body.planCode).toBe('PRO');
      expect(proQuotas.body.products.max).toBeGreaterThan(1000);

      await request(app.getHttpServer())
        .post('/api/licenses/select-plan')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ planCode: 'STARTER' })
        .expect(201);

      const starterQuotas = await request(app.getHttpServer())
        .get('/api/licenses/quotas')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(starterQuotas.body.planCode).toBe('STARTER');
      expect(starterQuotas.body.products.max).toBe(1000);
      expect(starterQuotas.body.suppliers.max).toBe(1);
    });
  });
});
