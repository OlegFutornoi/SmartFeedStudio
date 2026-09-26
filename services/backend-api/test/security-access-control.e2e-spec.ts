import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanDatabase } from './utils/teardown.helper';

describe('Security & Access Control (RBAC/ABAC E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const prefix = `sec-${Date.now()}`;
  let ownerUser: { id: string; email: string; token: string; orgId: string };
  let memberUser: { id: string; email: string; token: string; password: string };
  let foreignUser: { id: string; email: string; token: string };

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

    // Pre-clean
    await cleanDatabase(prisma, {
      emailPrefixes: ['sec-'],
    });

    await prisma.tariffPlan.updateMany({
      where: { code: 'PRO' },
      data: { maxTeamSeats: 3 },
    });

    // 1. Create Company Owner
    const ownerEmail = `${prefix}-owner@smartfeed.studio`;
    const ownerPassword = 'Password123!';
    const ownerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: ownerEmail,
        password: ownerPassword,
        fullName: 'Security Test Owner',
        companyName: 'Security Corp LLC',
      })
      .expect(201);

    // Upgrade owner to standard PRO plan to allow team seats
    await request(app.getHttpServer())
      .post('/api/licenses/select-plan')
      .set('Authorization', `Bearer ${ownerRes.body.tokens.accessToken}`)
      .send({ planCode: 'PRO' })
      .expect(201);

    const userOrgs = await request(app.getHttpServer())
      .get('/api/organizations')
      .set('Authorization', `Bearer ${ownerRes.body.tokens.accessToken}`)
      .expect(200);

    ownerUser = {
      id: ownerRes.body.user.id,
      email: ownerEmail,
      token: ownerRes.body.tokens.accessToken,
      orgId: userOrgs.body[0].id,
    };

    // 2. Create Standalone / Foreign User
    const foreignEmail = `${prefix}-foreign@smartfeed.studio`;
    const foreignRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: foreignEmail,
        password: 'Password123!',
        fullName: 'Foreign User',
      })
      .expect(201);

    foreignUser = {
      id: foreignRes.body.user.id,
      email: foreignEmail,
      token: foreignRes.body.tokens.accessToken,
    };

    // 3. Create Member User (pre-registered)
    const memberEmail = `${prefix}-member@smartfeed.studio`;
    const memberPassword = 'MemberSecurePass123!';
    const memberRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: memberEmail,
        password: memberPassword,
        fullName: 'Invited Member',
      })
      .expect(201);

    memberUser = {
      id: memberRes.body.user.id,
      email: memberEmail,
      token: memberRes.body.tokens.accessToken,
      password: memberPassword,
    };
  });

  afterAll(async () => {
    await cleanDatabase(prisma, {
      emailPrefixes: ['sec-'],
    });
    await app.close();
  });

  describe('1. RBAC Admin Protection (Zero Unauthorized Privilege Escalation)', () => {
    it('should reject non-admin access to /api/users with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${foreignUser.token}`)
        .expect(403);
    });

    it('should reject non-admin access to /api/users/stats with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${foreignUser.token}`)
        .expect(403);
    });

    it('should reject non-admin access to /api/plans/admin with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/plans/admin')
        .set('Authorization', `Bearer ${foreignUser.token}`)
        .expect(403);
    });

    it('should reject non-admin access to /api/licenses/admin with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/licenses/admin')
        .set('Authorization', `Bearer ${foreignUser.token}`)
        .expect(403);
    });

    it('should reject non-admin access to /api/navigation/admin with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/navigation/admin')
        .set('Authorization', `Bearer ${foreignUser.token}`)
        .expect(403);
    });

    it('should reject non-admin attempt to create a plan with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post('/api/plans')
        .set('Authorization', `Bearer ${foreignUser.token}`)
        .send({
          code: 'HACKED',
          nameUk: 'Зламаний',
          nameEn: 'Hacked',
          priceMonthly: 0,
          currency: 'USD',
        })
        .expect(403);
    });

    it('should reject unauthenticated request to /api/auth/me with 401 Unauthorized', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });
  });

  describe('2. Multi-Tenant ABAC Protection (Zero Cross-Organization Data Leakage)', () => {
    it('should forbid foreign user from viewing another organization details', async () => {
      await request(app.getHttpServer())
        .get(`/api/organizations/${ownerUser.orgId}`)
        .set('Authorization', `Bearer ${foreignUser.token}`)
        .expect(403);
    });

    it('should forbid foreign user from viewing another organization members list', async () => {
      await request(app.getHttpServer())
        .get(`/api/organizations/${ownerUser.orgId}/members`)
        .set('Authorization', `Bearer ${foreignUser.token}`)
        .expect(403);
    });

    it('should forbid foreign user from viewing another organization pending invitations', async () => {
      await request(app.getHttpServer())
        .get(`/api/organizations/${ownerUser.orgId}/invitations`)
        .set('Authorization', `Bearer ${foreignUser.token}`)
        .expect(403);
    });

    it('should forbid foreign user from inviting anyone to another organization', async () => {
      await request(app.getHttpServer())
        .post(`/api/organizations/${ownerUser.orgId}/members`)
        .set('Authorization', `Bearer ${foreignUser.token}`)
        .send({
          email: 'intruder@smartfeed.studio',
          role: 'MEMBER',
        })
        .expect(403);
    });

    it('should forbid foreign user from updating another organization name', async () => {
      await request(app.getHttpServer())
        .patch(`/api/organizations/${ownerUser.orgId}`)
        .set('Authorization', `Bearer ${foreignUser.token}`)
        .send({ name: 'Hacked Org Name' })
        .expect(403);
    });
  });

  describe('3. Team Roles & Quota Enforcement (Member Restrictions)', () => {
    let inviteToken: string;
    let freshMemberToken: string;

    it('owner should invite a new teammate to the organization', async () => {
      const freshEmail = `${prefix}-fresh-teammate@smartfeed.studio`;
      const inviteRes = await request(app.getHttpServer())
        .post(`/api/organizations/${ownerUser.orgId}/members`)
        .set('Authorization', `Bearer ${ownerUser.token}`)
        .send({
          email: freshEmail,
          role: 'MEMBER',
        })
        .expect(201);

      expect(inviteRes.body.token).toBeDefined();
      inviteToken = inviteRes.body.token;
    });

    it('should successfully accept invitation for new user and issue tokens', async () => {
      const acceptRes = await request(app.getHttpServer())
        .post('/api/invitations/accept')
        .send({
          token: inviteToken,
          password: 'NewTeammatePass123!',
          fullName: 'Fresh Teammate',
        })
        .expect(200);

      expect(acceptRes.body.tokens.accessToken).toBeDefined();
      freshMemberToken = acceptRes.body.tokens.accessToken;
    });

    it('invited member cannot select or upgrade organization tariff plan (ONLY_OWNER_CAN_CHANGE_PLAN)', async () => {
      const upgradeRes = await request(app.getHttpServer())
        .post('/api/licenses/select-plan')
        .set('Authorization', `Bearer ${freshMemberToken}`)
        .send({ planCode: 'ENTERPRISE' })
        .expect(403);

      expect(upgradeRes.body.code).toBe('ONLY_OWNER_CAN_CHANGE_PLAN');
    });

    it('should reject invitation accept for existing user if wrong password is provided', async () => {
      const invExistingRes = await request(app.getHttpServer())
        .post(`/api/organizations/${ownerUser.orgId}/members`)
        .set('Authorization', `Bearer ${ownerUser.token}`)
        .send({
          email: memberUser.email,
          role: 'MEMBER',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/invitations/accept')
        .send({
          token: invExistingRes.body.token,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('ADVERSARIAL P0: should reject invitation accept for existing user if password is NOT provided and user is unauthenticated', async () => {
      const invExistingRes = await request(app.getHttpServer())
        .post(`/api/organizations/${ownerUser.orgId}/members`)
        .set('Authorization', `Bearer ${ownerUser.token}`)
        .send({
          email: memberUser.email,
          role: 'MEMBER',
        })
        .expect(201);

      // Attempt to accept WITHOUT password and WITHOUT Bearer auth - MUST be rejected
      const res = await request(app.getHttpServer()).post('/api/invitations/accept').send({
        token: invExistingRes.body.token,
      });

      expect([400, 401]).toContain(res.status);
    });
  });

  describe('4. Storage S3 Presigned URL Security & User Scoping', () => {
    it('should sanitize filename and scope S3 upload key strictly to requesting user ID', async () => {
      const storageRes = await request(app.getHttpServer())
        .post('/api/storage/presigned-url')
        .set('Authorization', `Bearer ${ownerUser.token}`)
        .send({
          fileName: '../../../etc/passwd_evil.png',
          contentType: 'image/png',
          folder: 'images',
        })
        .expect(201);

      expect(storageRes.body.s3Key).toBeDefined();
      expect(storageRes.body.s3Key).toContain(`images/${ownerUser.id}/`);
      expect(storageRes.body.s3Key).not.toContain('..');
      expect(storageRes.body.s3Key).toContain('passwd_evil.png');
    });
  });
});
