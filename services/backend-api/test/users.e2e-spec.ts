import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanDatabase } from './utils/teardown.helper';

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

    // Pre-clean any test leftovers
    await cleanDatabase(prisma, {
      emailPrefixes: ['admintest-', 'regularuser-'],
    });

    // Register regular user to get normal user auth token
    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    testUserId = regRes.body.user.id;

    // Register a second regular user to test role isolation
    const regularUser = {
      email: `regularuser-${Date.now()}@smartfeed.studio`,
      password: 'RegularPassword123!',
      fullName: 'Regular Client User',
    };
    const regUserRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(regularUser)
      .expect(201);
    const regularUserToken = regUserRes.body.tokens.accessToken;

    // Promote testUser to ADMIN in DB to test admin-only endpoints
    await prisma.user.update({
      where: { id: testUserId },
      data: { role: 'ADMIN' },
    });

    // Re-login as ADMIN to get token with ADMIN role
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    authToken = loginRes.body.tokens.accessToken;

    (global as any).regularUserToken = regularUserToken;
    (global as any).regularUserId = regUserRes.body.user.id;
  });

  afterAll(async () => {
    // ── MANDATORY TEST DATA TEARDOWN ──────────────────────────────────────────
    const regularUserId = (global as any).regularUserId;
    await cleanDatabase(prisma, {
      userIds: [testUserId, regularUserId].filter(Boolean),
      emailPrefixes: ['admintest-', 'regularuser-'],
    });
    // ─────────────────────────────────────────────────────────────────────────

    await app.close();
  });

  describe('GET /api/users', () => {
    it('returns 401 Unauthorized when request lacks Bearer token', async () => {
      await request(app.getHttpServer()).get('/api/users').expect(401);
    });

    it('returns 403 Forbidden when accessed by a regular USER', async () => {
      const regularUserToken = (global as any).regularUserToken;
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
          organization?: any;
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
      const allOwners = res.body.every(
        (u: any) => !u.organization || u.organization.isOwner === true,
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

        const found = res.body.find((u: any) => u.email === superAdminEmail);
        expect(found).toBeUndefined();
      } finally {
        await prisma.user.delete({ where: { id: superAdmin.id } }).catch(() => {});
      }
    });
  });

  describe('POST /api/users (Create User by Admin)', () => {
    let createdUserId: string;

    afterEach(async () => {
      if (createdUserId) {
        await cleanDatabase(prisma, { userIds: [createdUserId], emailPrefixes: [] });
        createdUserId = '';
      }
    });

    it('creates a new user with default organization (OWNER)', async () => {
      const newEmail = `admincreated-${Date.now()}@smartfeed.studio`;
      const res = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: newEmail,
          password: 'SecurePassword123!',
          fullName: 'New Owner Client',
          role: 'USER',
          companyName: 'Custom Company LLC',
        })
        .expect(201);

      createdUserId = res.body.id;
      expect(res.body.email).toBe(newEmail);
      expect(res.body.role).toBe('USER');
      expect(res.body.organization).toBeDefined();
      expect(res.body.organization.organizationName).toBe('Custom Company LLC');
      expect(res.body.organization.isOwner).toBe(true);
      expect(res.body.license).toBeDefined();
    });

    it('creates a new member invited to an existing organization (inherits license)', async () => {
      const ownerEmail = `orgowner-${Date.now()}@smartfeed.studio`;
      const ownerRes = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: ownerEmail,
          password: 'SecurePassword123!',
          fullName: 'Main Org Owner',
          role: 'USER',
          companyName: 'Main Org Corp',
          planCode: 'PRO',
        })
        .expect(201);

      const orgId = ownerRes.body.organization.organizationId;

      const memberEmail = `orgmember-${Date.now()}@smartfeed.studio`;
      const memberRes = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: memberEmail,
          password: 'SecurePassword123!',
          fullName: 'Invited Org Member',
          role: 'USER',
          accountType: 'MEMBER',
          organizationId: orgId,
        })
        .expect(201);

      createdUserId = memberRes.body.id;
      expect(memberRes.body.email).toBe(memberEmail);
      expect(memberRes.body.role).toBe('USER');
      expect(memberRes.body.organization).toBeDefined();
      expect(memberRes.body.organization.organizationName).toBe('Main Org Corp');
      expect(memberRes.body.organization.isOwner).toBe(false);
      expect(memberRes.body.organization.memberRole).toBe('MEMBER');
      expect(memberRes.body.license).toBeDefined();
      expect(memberRes.body.license.planType).toBe('PRO');

      // Cleanup owner
      await cleanDatabase(prisma, { userIds: [ownerRes.body.id], emailPrefixes: [] });
    });
  });

  describe('GET /api/users/stats', () => {
    it('returns 401 Unauthorized when request lacks Bearer token', async () => {
      await request(app.getHttpServer()).get('/api/users/stats').expect(401);
    });

    it('returns 403 Forbidden when accessed by a regular USER', async () => {
      const regularUserToken = (global as any).regularUserToken;
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

  describe('PATCH /api/users/:id/status', () => {
    let targetUserId: string;

    beforeEach(async () => {
      const email = `status-test-${Date.now()}@smartfeed.studio`;
      const created = await prisma.user.create({
        data: {
          email,
          passwordHash: 'dummy',
          fullName: 'Status Target',
          role: 'USER',
          isActive: true,
        },
      });
      targetUserId = created.id;
    });

    afterEach(async () => {
      await cleanDatabase(prisma, {
        userIds: targetUserId ? [targetUserId] : [],
        emailPrefixes: [],
      });
    });

    it('returns 400 when trying to suspend own account', async () => {
      await request(app.getHttpServer())
        .patch(`/api/users/${testUserId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isActive: false })
        .expect(400);
    });

    it('returns 404 when user does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/api/users/cuid-nonexistent-123/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isActive: false })
        .expect(404);
    });

    it('successfully suspends and resumes a user', async () => {
      // Suspend
      const suspendRes = await request(app.getHttpServer())
        .patch(`/api/users/${targetUserId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(suspendRes.body.isActive).toBe(false);

      // Resume
      const resumeRes = await request(app.getHttpServer())
        .patch(`/api/users/${targetUserId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isActive: true })
        .expect(200);

      expect(resumeRes.body.isActive).toBe(true);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('returns 400 when admin attempts to delete own account', async () => {
      await request(app.getHttpServer())
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('returns 404 when user does not exist', async () => {
      await request(app.getHttpServer())
        .delete('/api/users/cuid-nonexistent-999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('successfully deletes a target user', async () => {
      const email = `delete-target-${Date.now()}@smartfeed.studio`;
      const created = await prisma.user.create({
        data: {
          email,
          passwordHash: 'dummy',
          fullName: 'Delete Target',
          role: 'USER',
        },
      });

      await request(app.getHttpServer())
        .delete(`/api/users/${created.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const inDb = await prisma.user.findUnique({ where: { id: created.id } });
      expect(inDb).toBeNull();
    });
  });
});
