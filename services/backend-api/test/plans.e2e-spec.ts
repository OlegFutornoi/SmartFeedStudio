import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '@smartfeed/shared';
import { cleanDatabase } from './utils/teardown.helper';

describe('Tariff Plans & Licenses Management (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  let adminToken: string;
  let userToken: string;
  let createdPlanId: string;

  const createdEmails: string[] = [];
  const createdPlanCodes: string[] = [];

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
      emailPrefixes: ['plans.admin+', 'plans.user+'],
    });

    // Register test super admin user
    const adminEmail = `plans.admin+${timestamp}@smartfeed.local`;
    createdEmails.push(adminEmail);
    const adminRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: adminEmail,
      password: 'AdminPassword123!',
      fullName: 'Plans Super Admin',
      role: Role.SUPER_ADMIN,
    });
    adminToken = adminRes.body.tokens.accessToken;

    // Register standard user
    const userEmail = `plans.user+${timestamp}@smartfeed.local`;
    createdEmails.push(userEmail);
    const userRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: userEmail,
      password: 'UserPassword123!',
      fullName: 'Plans Regular User',
      role: Role.USER,
    });
    userToken = userRes.body.tokens.accessToken;
  });

  afterAll(async () => {
    // 100% complete data isolation teardown
    await cleanDatabase(prisma, {
      userEmails: createdEmails,
      emailPrefixes: ['plans.admin+', 'plans.user+'],
      planCodes: createdPlanCodes,
    });

    await app.close();
  });

  describe('GET /api/plans (Public & Authenticated active plans list)', () => {
    it('should return active tariff plans without requiring authentication', async () => {
      const res = await request(app.getHttpServer()).get('/api/plans').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const starterPlan = (
        res.body as Array<{
          code: string;
          nameUk: string;
          featuresUk: string[];
          maxXmlLimit: number;
        }>
      ).find((p) => p.code === 'STARTER');
      expect(starterPlan).toBeDefined();
      expect(starterPlan?.nameUk).toBeDefined();
      expect(Array.isArray(starterPlan?.featuresUk)).toBe(true);
      expect(starterPlan?.maxXmlLimit).toBeGreaterThan(0);
    });
  });

  describe('GET /api/plans/admin (Admin-only plans management)', () => {
    it('should reject unauthenticated request with 401', async () => {
      await request(app.getHttpServer()).get('/api/plans/admin').expect(401);
    });

    it('should reject standard USER with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/plans/admin')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should allow SUPER_ADMIN to get all tariff plans', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/plans/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('POST /api/plans (Create Tariff Plan)', () => {
    it('should reject plan creation from standard user with 403', async () => {
      await request(app.getHttpServer())
        .post('/api/plans')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'TEST_HACK',
          nameUk: 'Тестовий',
          nameEn: 'Test Tier',
          priceMonthly: 10,
          maxXmlLimit: 5000,
          aiCredits: 100,
        })
        .expect(403);
    });

    it('should allow SUPER_ADMIN to create a new tariff plan with dynamic features', async () => {
      const planCode = `TEST_TIER_${timestamp}`;
      createdPlanCodes.push(planCode);

      const res = await request(app.getHttpServer())
        .post('/api/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: planCode,
          nameUk: 'Тестовий План Плюс',
          nameEn: 'Test Tier Plus',
          descriptionUk: 'Опис тестового плану для перевірки динамічних квот',
          descriptionEn: 'Test tier description for dynamic quotas verification',
          priceMonthly: 29.99,
          priceYearly: 299.99,
          currency: 'USD',
          maxXmlLimit: 25000,
          aiCredits: 250,
          canCloudBackup: true,
          isPopular: true,
          isActive: true,
          order: 10,
          featuresUk: ['25,000 товарів у XML', '250 AI кредитів', 'S3 бекапи'],
          featuresEn: ['25,000 items in XML', '250 AI credits', 'S3 backups'],
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.code).toBe(planCode);
      expect(res.body.nameUk).toBe('Тестовий План Плюс');
      expect(res.body.priceMonthly).toBe(29.99);
      expect(res.body.maxXmlLimit).toBe(25000);
      expect(res.body.featuresUk.length).toBe(3);

      createdPlanId = res.body.id;
    });

    it('should reject creating duplicate plan code with 409 Conflict', async () => {
      const duplicateCode = createdPlanCodes[0];

      await request(app.getHttpServer())
        .post('/api/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: duplicateCode,
          nameUk: 'Дублікат',
          nameEn: 'Duplicate',
          priceMonthly: 10,
          maxXmlLimit: 1000,
          aiCredits: 50,
        })
        .expect(409);
    });
  });

  describe('GET /api/plans/:id (Get Plan By ID)', () => {
    it('should return plan details by ID', async () => {
      const res = await request(app.getHttpServer()).get(`/api/plans/${createdPlanId}`).expect(200);

      expect(res.body.id).toBe(createdPlanId);
      expect(res.body.nameUk).toBe('Тестовий План Плюс');
    });

    it('should return 404 for non-existent plan ID', async () => {
      await request(app.getHttpServer())
        .get('/api/plans/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('PATCH /api/plans/:id (Update Tariff Plan)', () => {
    it('should allow SUPER_ADMIN to update plan properties, limits and features', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/plans/${createdPlanId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nameUk: 'Оновлений Тестовий План',
          priceMonthly: 35.0,
          maxXmlLimit: 30000,
          featuresUk: ['Оновлений пункт 1', 'Оновлений пункт 2'],
        })
        .expect(200);

      expect(res.body.nameUk).toBe('Оновлений Тестовий План');
      expect(res.body.priceMonthly).toBe(35.0);
      expect(res.body.maxXmlLimit).toBe(30000);
      expect(res.body.featuresUk.length).toBe(2);
    });
  });

  describe('GET /api/licenses/admin (Admin list of issued licenses)', () => {
    it('should allow SUPER_ADMIN to fetch all user licenses with plan details', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/licenses/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);

      const license = res.body[0];
      expect(license.licenseKey).toBeDefined();
      expect(license.user).toBeDefined();
      expect(license.user.email).toBeDefined();
      expect(license.maxXmlLimit).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/plans/:id (Delete Tariff Plan)', () => {
    it('should allow SUPER_ADMIN to delete a tariff plan', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/plans/${createdPlanId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.id).toBe(createdPlanId);

      // Verify it no longer exists
      await request(app.getHttpServer()).get(`/api/plans/${createdPlanId}`).expect(404);
    });
  });
});
