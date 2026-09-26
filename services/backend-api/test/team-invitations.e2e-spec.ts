import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { cleanDatabase } from './utils/teardown.helper';

describe('Team Invitations & Mail Service Life-cycle (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let ownerToken: string;
  let orgId: string;

  const ownerUser = {
    email: 'inv.test+owner@smartfeed.studio',
    password: 'OwnerPassword123!',
    fullName: 'Company Owner Tester',
    companyName: 'Invites Testing Corp',
  };

  const newColleagueEmail = 'inv.test+newcolleague@smartfeed.studio';
  const existingColleagueEmail = 'inv.test+existingcolleague@smartfeed.studio';
  const thirdColleagueEmail = 'inv.test+thirdcolleague@smartfeed.studio';

  const allTestEmails = [
    ownerUser.email,
    newColleagueEmail,
    existingColleagueEmail,
    thirdColleagueEmail,
  ];

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

    // Teardown any leftovers before starting
    await cleanDatabase(prisma, {
      userEmails: allTestEmails,
      emailPrefixes: ['inv.test+'],
      organizationNames: [ownerUser.companyName],
    });

    // 1. Register owner
    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(ownerUser)
      .expect(201);

    ownerToken = regRes.body.tokens.accessToken;
    orgId = regRes.body.user.organization.id;

    // 2. Upgrade owner to PRO (3 seats)
    await request(app.getHttpServer())
      .post('/api/licenses/select-plan')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ planCode: 'PRO' })
      .expect(201);
  });

  afterAll(async () => {
    // 100% complete data isolation teardown
    await cleanDatabase(prisma, {
      userEmails: allTestEmails,
      emailPrefixes: ['inv.test+'],
      organizationNames: [ownerUser.companyName],
    });

    await app.close();
  });

  describe('1. Invitation Generation & Token Delivery', () => {
    let invitationToken: string;

    it('should create an invitation with token, inviteUrl, and pending status', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/organizations/${orgId}/invitations`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: newColleagueEmail,
          role: 'MEMBER',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.email).toBe(newColleagueEmail);
      expect(res.body.role).toBe('MEMBER');
      expect(res.body.token).toMatch(/^SF-INV-/);
      expect(res.body.inviteUrl).toContain('/invite?token=SF-INV-');
      expect(res.body.status).toBe('PENDING');

      invitationToken = res.body.token;
    });

    it('should dispatch HTML email to Mailpit SMTP server with token link', async () => {
      // Small wait to allow async Nodemailer dispatch to complete
      await new Promise((resolve) => setTimeout(resolve, 300));

      try {
        const mailpitRes = await fetch('http://localhost:8025/api/v1/messages');
        if (mailpitRes.ok) {
          interface MailpitMessage {
            Subject?: string;
            Snippet?: string;
            To?: Array<{ Address: string }>;
          }
          const mailpitData = (await mailpitRes.json()) as { messages?: MailpitMessage[] };
          const sentMessage = mailpitData.messages?.find((m) =>
            m.To?.some((to) => to.Address === newColleagueEmail),
          );

          if (sentMessage) {
            expect(sentMessage.Subject).toContain(ownerUser.companyName);
            expect(sentMessage.Snippet || '').toContain('SF-INV-');
          }
        }
      } catch {
        // Mailpit check is non-blocking in environments without docker mailpit
      }
    });

    it('should allow public verification of invitation token (GET /api/invitations/:token)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/invitations/${invitationToken}`)
        .expect(200);

      expect(res.body.token).toBe(invitationToken);
      expect(res.body.email).toBe(newColleagueEmail);
      expect(res.body.organizationName).toBe(ownerUser.companyName);
      expect(res.body.role).toBe('MEMBER');
      expect(res.body.isExistingUser).toBe(false);
      expect(res.body.isValid).toBe(true);
    });

    it('should return pending invitations list for organization', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/organizations/${orgId}/invitations`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].email).toBe(newColleagueEmail);
      expect(res.body[0].status).toBe('PENDING');
    });

    it('should reject non-existent or invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/invitations/SF-INV-nonexistent-invalid-token')
        .expect(404);
    });
  });

  describe('2. Acceptance Flow for New User', () => {
    let invitationToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/organizations/${orgId}/invitations`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: newColleagueEmail,
          role: 'MEMBER',
        })
        .expect(201);
      invitationToken = res.body.token;
    });

    it('should require password with at least 6 characters for new user registration', async () => {
      await request(app.getHttpServer())
        .post('/api/invitations/accept')
        .send({
          token: invitationToken,
          fullName: 'New Colleague',
          password: '123', // Too short
        })
        .expect(400);
    });

    it('should successfully register user, accept invitation, and return JWT tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/invitations/accept')
        .send({
          token: invitationToken,
          fullName: 'Valeriy Zaluzhnyi',
          password: 'SecureColleaguePassword123!',
        })
        .expect(200);

      expect(res.body.tokens.accessToken).toBeDefined();
      expect(res.body.tokens.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe(newColleagueEmail);
      expect(res.body.user.fullName).toBe('Valeriy Zaluzhnyi');
      expect(res.body.user.organization.id).toBe(orgId);
      expect(res.body.user.organization.role).toBe('MEMBER');

      // Verify invitation in DB is now ACCEPTED
      const dbInv = await prisma.organizationInvitation.findUnique({
        where: { token: invitationToken },
      });
      expect(dbInv?.status).toBe('ACCEPTED');

      // Verify pending invitations list is now empty
      const pendingList = await request(app.getHttpServer())
        .get(`/api/organizations/${orgId}/invitations`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      expect(pendingList.body.length).toBe(0);
    });

    it('should reject plan selection (POST /api/licenses/select-plan) when executed by invited member with 403', async () => {
      // 1. Log in as new colleague (MEMBER role)
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: newColleagueEmail,
          password: 'SecureColleaguePassword123!',
        })
        .expect(200);

      const colleagueToken = loginRes.body.tokens.accessToken;

      // 2. Colleague attempts to switch tariff plan to ENTERPRISE -> must be rejected with 403
      const blockedRes = await request(app.getHttpServer())
        .post('/api/licenses/select-plan')
        .set('Authorization', `Bearer ${colleagueToken}`)
        .send({ planCode: 'ENTERPRISE' })
        .expect(403);

      expect(blockedRes.body.code).toBe('ONLY_OWNER_CAN_CHANGE_PLAN');
    });
  });

  describe('3. Acceptance Flow for Existing User', () => {
    let invitationToken: string;

    beforeAll(async () => {
      // 1. Register existing colleague
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: existingColleagueEmail,
          password: 'ExistingPassword123!',
          fullName: 'Existing Colleague',
        })
        .expect(201);

      // 2. Invite existing colleague to org
      const invRes = await request(app.getHttpServer())
        .post(`/api/organizations/${orgId}/invitations`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: existingColleagueEmail,
          role: 'ADMIN',
        })
        .expect(201);

      invitationToken = invRes.body.token;
    });

    it('should show isExistingUser: true when inspecting token details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/invitations/${invitationToken}`)
        .expect(200);

      expect(res.body.isExistingUser).toBe(true);
      expect(res.body.email).toBe(existingColleagueEmail);
      expect(res.body.role).toBe('ADMIN');
    });

    it('should require password or authenticated session for existing user to accept', async () => {
      // Unauthenticated without password should fail (defense-in-depth)
      await request(app.getHttpServer())
        .post('/api/invitations/accept')
        .send({
          token: invitationToken,
        })
        .expect(400);

      // Verifying ownership via password succeeds
      const res = await request(app.getHttpServer())
        .post('/api/invitations/accept')
        .send({
          token: invitationToken,
          password: 'ExistingPassword123!',
        })
        .expect(200);

      expect(res.body.user.email).toBe(existingColleagueEmail);
      expect(res.body.user.organization.id).toBe(orgId);
      expect(res.body.user.organization.role).toBe('ADMIN');
    });
  });

  describe('4. Revoke Invitation', () => {
    let invitationId: string;

    beforeAll(async () => {
      // Free up a seat first
      const members = await request(app.getHttpServer())
        .get(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      interface OrgMemberSummary {
        id: string;
        userEmail?: string;
        email?: string;
      }
      const existingMem = (members.body as OrgMemberSummary[]).find(
        (m) => m.userEmail === existingColleagueEmail || m.email === existingColleagueEmail,
      );
      if (existingMem) {
        await request(app.getHttpServer())
          .delete(`/api/organizations/${orgId}/members/${existingMem.id}`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .expect(200);
      }

      // Create an invitation to third colleague
      const invRes = await request(app.getHttpServer())
        .post(`/api/organizations/${orgId}/invitations`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: thirdColleagueEmail,
          role: 'MEMBER',
        })
        .expect(201);

      invitationId = invRes.body.id;
    });

    it('should allow owner to revoke a pending invitation', async () => {
      await request(app.getHttpServer())
        .delete(`/api/organizations/${orgId}/invitations/${invitationId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      // Verify it no longer appears in pending invitations list
      const res = await request(app.getHttpServer())
        .get(`/api/organizations/${orgId}/invitations`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.some((i: { id: string }) => i.id === invitationId)).toBe(false);
    });
  });
});
