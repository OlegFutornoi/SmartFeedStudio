import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { cleanDatabase } from '@test/utils/teardown.helper';

describe('Users Profile & Query Endpoints (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;
  let regularUserToken: string;
  let regularUserId: string;

  const testUser = {
    email: `admintest-${Date.now()}@smartfeed.studio`,
    password: 'OriginalPassword123!',
    fullName: 'Admin E2E Tester',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');

    await app.init();
    prisma = app.get(PrismaService);

    await cleanDatabase(prisma, {
      emailPrefixes: ['admintest-', 'regularuser-'],
    });

    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);
    testUserId = regRes.body.user.id;

    const regularUser = {
      email: `regularuser-${Date.now()}@smartfeed.studio`,
      password: 'RegularPassword123!',
      fullName: 'Regular Client User',
    };
    const regUserRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(regularUser)
      .expect(201);
    regularUserToken = regUserRes.body.tokens.accessToken;
    regularUserId = regUserRes.body.user.id;

    await prisma.user.update({
      where: { id: testUserId },
      data: { role: 'ADMIN' },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    authToken = loginRes.body.tokens.accessToken;
  });

  afterAll(async () => {
    await cleanDatabase(prisma, {
      userIds: [testUserId, regularUserId].filter(Boolean),
      emailPrefixes: ['admintest-', 'regularuser-'],
    });
    await app.close();
  });

  describe('GET /api/users', () => {
    it('returns 401 Unauthorized when request lacks Bearer token', async () => {
      await request(app.getHttpServer()).get('/api/users').expect(401);
    });

    it('returns 403 Forbidden when accessed by a regular USER', async () => {
      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });

    it('returns list of users with licenses for authenticated admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const found = (
        res.body as Array<{
          email: string;
          fullName: string;
          license?: unknown;
          organization?: { isOwner?: boolean; memberRole?: string };
        }>
      ).find((u) => u.email === testUser.email);
      expect(found).toBeDefined();
      expect(found?.fullName).toBe(testUser.fullName);
      expect(found?.license).toBeDefined();
      expect(found?.organization).toBeDefined();
      expect(found?.organization?.isOwner).toBe(true);
      expect(found?.organization?.memberRole).toBe('OWNER');
    });

    it('filters users by orgRoleFilter=OWNERS', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users?orgRoleFilter=OWNERS')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const allOwners = (res.body as Array<{ organization?: { isOwner?: boolean } }>).every(
        (u) => !u.organization || u.organization.isOwner === true,
      );
      expect(allOwners).toBe(true);
    });

    it('filters users by search query', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/users?search=${encodeURIComponent(testUser.email)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].email).toBe(testUser.email);
    });

    it('does not include SUPER_ADMIN in the users list', async () => {
      const superAdminEmail = `superadmin-${Date.now()}@smartfeed.studio`;
      const superAdmin = await prisma.user.create({
        data: {
          email: superAdminEmail,
          passwordHash: 'hash',
          fullName: 'Root Super Admin',
          role: 'SUPER_ADMIN',
        },
      });

      try {
        const res = await request(app.getHttpServer())
          .get('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const found = (res.body as Array<{ email: string }>).find(
          (u) => u.email === superAdminEmail,
        );
        expect(found).toBeUndefined();
      } finally {
        await prisma.user.delete({ where: { id: superAdmin.id } }).catch(() => {});
      }
    });
  });

  describe('GET /api/users/stats', () => {
    it('returns 401 Unauthorized when request lacks Bearer token', async () => {
      await request(app.getHttpServer()).get('/api/users/stats').expect(401);
    });

    it('returns 403 Forbidden when accessed by a regular USER', async () => {
      await request(app.getHttpServer())
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });

    it('returns valid users and licenses statistics for authenticated admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('totalUsers');
      expect(res.body).toHaveProperty('activeLicenses');
      expect(typeof res.body.totalUsers).toBe('number');
      expect(res.body.totalUsers).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('returns 400 Bad Request when current password is wrong', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword999!',
          newPassword: 'BrandNewPassword123!',
        })
        .expect(400);
    });

    it('successfully changes password with valid current password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'BrandNewPassword123!',
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(401);

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'BrandNewPassword123!' })
        .expect(200);

      expect(loginRes.body).toHaveProperty('tokens');
      authToken = loginRes.body.tokens.accessToken;
    });
  });
});
