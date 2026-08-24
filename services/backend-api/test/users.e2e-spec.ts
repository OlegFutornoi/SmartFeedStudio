import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Users & Admin Endpoints (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;

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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');

    await app.init();
    prisma = app.get(PrismaService);

    // Register user to get auth token
    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    authToken = regRes.body.tokens.accessToken;
    testUserId = regRes.body.user.id;
  });

  afterAll(async () => {
    // ── MANDATORY TEST DATA TEARDOWN ──────────────────────────────────────────
    // Cleanup created test user and any lingering test users
    if (testUserId) {
      await prisma.license.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'admintest-' } },
    });
    // ─────────────────────────────────────────────────────────────────────────

    await app.close();
  });

  describe('GET /api/users', () => {
    it('returns 401 Unauthorized when request lacks Bearer token', async () => {
      await request(app.getHttpServer()).get('/api/users').expect(401);
    });

    it('returns list of users with licenses for authenticated admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const found = res.body.find((u: any) => u.email === testUser.email);
      expect(found).toBeDefined();
      expect(found.fullName).toBe(testUser.fullName);
      expect(found.license).toBeDefined();
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
  });

  describe('GET /api/users/stats', () => {
    it('returns 401 Unauthorized when request lacks Bearer token', async () => {
      await request(app.getHttpServer()).get('/api/users/stats').expect(401);
    });

    it('returns valid users and licenses statistics', async () => {
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

      // Verify that old password no longer works for login
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(401);

      // Verify that new password works for login
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'BrandNewPassword123!',
        })
        .expect(200);

      expect(loginRes.body).toHaveProperty('tokens');
      authToken = loginRes.body.tokens.accessToken;
    });
  });
});
