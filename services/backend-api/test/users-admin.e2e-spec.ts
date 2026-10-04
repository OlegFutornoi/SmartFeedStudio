import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { cleanDatabase } from '@test/utils/teardown.helper';

describe('Users Admin Lifecycle & Mutations (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;

  const testUser = {
    email: `admintest-life-${Date.now()}@smartfeed.studio`,
    password: 'OriginalPassword123!',
    fullName: 'Admin Lifecycle Tester',
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
      emailPrefixes: [
        'admintest-life-',
        'admincreated-',
        'orgowner-',
        'orgmember-',
        'status-test-',
        'delete-target-',
      ],
    });

    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);
    testUserId = regRes.body.user.id;

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
      userIds: [testUserId].filter(Boolean),
      emailPrefixes: [
        'admintest-life-',
        'admincreated-',
        'orgowner-',
        'orgmember-',
        'status-test-',
        'delete-target-',
      ],
    });
    await app.close();
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

      await cleanDatabase(prisma, { userIds: [ownerRes.body.id], emailPrefixes: [] });
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
      const suspendRes = await request(app.getHttpServer())
        .patch(`/api/users/${targetUserId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(suspendRes.body.isActive).toBe(false);

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
