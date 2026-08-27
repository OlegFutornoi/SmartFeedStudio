import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role, PlanType, TargetApp } from '@smartfeed/shared';
import { cleanDatabase } from './utils/teardown.helper';

describe('Navigation & Dynamic Access Control (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  let adminToken: string;
  let userToken: string;
  let createdItemId: string;

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
      emailPrefixes: ['nav.admin+', 'nav.user+'],
    });

    // Register test admin user
    const adminEmail = `nav.admin+${timestamp}@smartfeed.local`;
    createdEmails.push(adminEmail);
    const adminRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: adminEmail,
      password: 'AdminPassword123!',
      fullName: 'Nav Admin User',
      role: Role.SUPER_ADMIN,
    });
    adminToken = adminRes.body.tokens.accessToken;

    // Register test standard user (FREE tier by default)
    const userEmail = `nav.user+${timestamp}@smartfeed.local`;
    createdEmails.push(userEmail);
    const userRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: userEmail,
      password: 'UserPassword123!',
      fullName: 'Nav Standard User',
      role: Role.USER,
    });
    userToken = userRes.body.tokens.accessToken;
  });

  afterAll(async () => {
    // ── MANDATORY TEST DATA TEARDOWN ──────────────────────────────────────────
    await cleanDatabase(prisma, {
      userEmails: createdEmails,
      emailPrefixes: ['nav.admin+', 'nav.user+'],
      navigationKeys: createdItemId ? [createdItemId] : [],
    });
    // ─────────────────────────────────────────────────────────────────────────

    await app.close();
  });

  describe('GET /api/navigation (Accessible items)', () => {
    it('should reject unauthenticated request with 401', async () => {
      await request(app.getHttpServer()).get('/api/navigation').expect(401);
    });

    it('should return accessible items for standard USER (FREE plan filters out PRO/ENTERPRISE)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/navigation?app=DESKTOP')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const keys = (res.body as Array<{ key: string }>).map((i) => i.key);
      expect(keys).toContain('dashboard');
      expect(keys).toContain('catalogs');
      // AI enrichment requires PRO, so FREE user shouldn't receive it in accessible navigation
      expect(keys).not.toContain('ai_enrichment');
    });

    it('should return all items for SUPER_ADMIN regardless of plan constraints', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/navigation?app=DESKTOP')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const keys = (res.body as Array<{ key: string }>).map((i) => i.key);
      expect(keys).toContain('dashboard');
      expect(keys).toContain('ai_enrichment');
      expect(keys).toContain('cloud_sync');
    });
  });

  describe('Admin Endpoints & CRUD', () => {
    it('should reject non-admin users with 403 on GET /api/navigation/admin', async () => {
      await request(app.getHttpServer())
        .get('/api/navigation/admin')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return all navigation items on GET /api/navigation/admin for admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/navigation/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(5);
    });

    it('should create a new navigation item via POST /api/navigation', async () => {
      const uniqueKey = `analytics_${timestamp}`;
      const res = await request(app.getHttpServer())
        .post('/api/navigation')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: uniqueKey,
          labelUk: 'Аналітика фідів',
          labelEn: 'Feed Analytics',
          path: '/analytics',
          icon: 'BarChart3',
          order: 10,
          isVisible: true,
          requiredRoles: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
          requiredPlan: PlanType.PRO,
          targetApp: TargetApp.DESKTOP,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.key).toBe(uniqueKey);
      createdItemId = res.body.id;
    });

    it('should update navigation item via PATCH /api/navigation/:id', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/navigation/${createdItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          labelUk: 'Оновлена Аналітика',
          isVisible: false,
        })
        .expect(200);

      expect(res.body.labelUk).toBe('Оновлена Аналітика');
      expect(res.body.isVisible).toBe(false);
    });

    it('should delete navigation item via DELETE /api/navigation/:id', async () => {
      await request(app.getHttpServer())
        .delete(`/api/navigation/${createdItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const check = await prisma.navigationItem.findUnique({
        where: { id: createdItemId },
      });
      expect(check).toBeNull();
      createdItemId = '';
    });
  });
});
