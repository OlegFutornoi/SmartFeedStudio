import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { cleanDatabase } from './utils/teardown.helper';

describe('Organizations & Team Seats Quota Policy (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let ownerToken: string;
  let orgId: string;

  let soloUserToken: string;

  const testOwner = {
    email: 'org.test+owner@smartfeed.studio',
    password: 'OwnerPassword123!',
    fullName: 'Owner Org Tester',
    companyName: 'Rozetka Top Sellers LLC',
  };

  const soloUser = {
    email: 'org.test+solo@smartfeed.studio',
    password: 'SoloPassword123!',
    fullName: 'John Solo',
  };

  const existingUser = {
    email: 'org.test+existing@smartfeed.studio',
    password: 'ExistingPassword123!',
    fullName: 'Existing User Tester',
  };

  const colleague1Email = 'org.test+colleague1@smartfeed.studio';
  const colleague2Email = 'org.test+colleague2@smartfeed.studio';
  const colleague3Email = 'org.test+colleague3@smartfeed.studio';

  const allTestEmails = [
    testOwner.email,
    soloUser.email,
    existingUser.email,
    colleague1Email,
    colleague2Email,
    colleague3Email,
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

    // 1. Clean any leftover test data
    await cleanDatabase(prisma, {
      userEmails: allTestEmails,
      emailPrefixes: ['org.test+', 'solo.user+', 'existing.user+'],
      organizationNames: [
        testOwner.companyName,
        'Rozetka Enterprise Hub',
        `Компанія ${soloUser.fullName}`,
        `Компанія ${existingUser.fullName}`,
      ],
    });

    // 2. Ensure Tariff Plans exist
    await prisma.tariffPlan.upsert({
      where: { code: 'STARTER' },
      update: {},
      create: {
        code: 'STARTER',
        nameUk: 'Стартовий',
        nameEn: 'Starter',
        priceMonthly: 0,
        maxXmlLimit: 500,
        aiCredits: 0,
        canCloudBackup: false,
        maxTeamSeats: 1,
        maxSuppliersLimit: 1,
        maxFeedsLimit: 1,
        maxChannelsLimit: 1,
        isActive: true,
        order: 1,
        durationDays: 7,
      },
    });

    await prisma.tariffPlan.upsert({
      where: { code: 'PRO' },
      update: {},
      create: {
        code: 'PRO',
        nameUk: 'Професійний',
        nameEn: 'Professional',
        priceMonthly: 49,
        maxXmlLimit: 100000,
        aiCredits: 1000,
        canCloudBackup: true,
        maxTeamSeats: 3,
        maxSuppliersLimit: 15,
        maxFeedsLimit: 10,
        maxChannelsLimit: 5,
        isActive: true,
        order: 3,
        durationDays: 30,
      },
    });

    await prisma.tariffPlan.upsert({
      where: { code: 'ENTERPRISE' },
      update: {},
      create: {
        code: 'ENTERPRISE',
        nameUk: 'Корпоративний',
        nameEn: 'Enterprise',
        priceMonthly: 199,
        maxXmlLimit: 1000000,
        aiCredits: 10000,
        canCloudBackup: true,
        maxTeamSeats: 100,
        maxSuppliersLimit: 100,
        maxFeedsLimit: 50,
        maxChannelsLimit: 20,
        hasWhiteLabel: true,
        hasSso: true,
        isActive: true,
        order: 4,
        durationDays: 365,
      },
    });
  });

  afterAll(async () => {
    // Teardown with 100% complete data isolation
    await cleanDatabase(prisma, {
      userEmails: allTestEmails,
      emailPrefixes: ['org.test+', 'solo.user+', 'existing.user+'],
      organizationNames: [
        testOwner.companyName,
        'Rozetka Enterprise Hub',
        `Компанія ${soloUser.fullName}`,
        `Компанія ${existingUser.fullName}`,
      ],
    });

    await app.close();
  });

  describe('1. Organization Creation on User Registration', () => {
    it('should create an Organization with companyName, set user as OWNER, and auto-provision Starter License', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testOwner)
        .expect(201);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testOwner.email);
      expect(res.body.user.organization).toBeDefined();
      expect(res.body.user.organization.name).toBe(testOwner.companyName);
      expect(res.body.user.organization.role).toBe('OWNER');
      expect(res.body.tokens.accessToken).toBeDefined();

      ownerToken = res.body.tokens.accessToken;

      // Verify organization created
      const orgsRes = await request(app.getHttpServer())
        .get('/api/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(Array.isArray(orgsRes.body)).toBe(true);
      expect(orgsRes.body.length).toBe(1);
      expect(orgsRes.body[0].name).toBe(testOwner.companyName);
      expect(orgsRes.body[0].userRole).toBe('OWNER');
      expect(orgsRes.body[0].usedTeamSeats).toBe(1);
      expect(orgsRes.body[0].maxTeamSeats).toBe(1); // Starter plan = 1 seat

      orgId = orgsRes.body[0].id;
    });

    it('should create default Organization name if companyName is not provided', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(soloUser)
        .expect(201);

      soloUserToken = res.body.tokens.accessToken;

      const orgsRes = await request(app.getHttpServer())
        .get('/api/organizations')
        .set('Authorization', `Bearer ${soloUserToken}`)
        .expect(200);

      expect(orgsRes.body.length).toBe(1);
      expect(orgsRes.body[0].name).toBe(`Компанія ${soloUser.fullName}`);
      expect(orgsRes.body[0].userRole).toBe('OWNER');
    });
  });

  describe('2. Team Seats Quota Enforcement (STARTER plan)', () => {
    it('should reject inviting a 2nd member when maxTeamSeats is 1 (STARTER)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: colleague1Email,
          role: 'MEMBER',
        })
        .expect(403);

      expect(res.body.code).toBe('TEAM_SEATS_LIMIT_EXCEEDED');
      expect(res.body.message).toContain('1 місць у команді');
    });
  });

  describe('3. Corporate License Upgrade via API (POST /api/licenses/select-plan)', () => {
    it('should allow organization owner to upgrade to PRO plan and automatically link license to organization', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/licenses/select-plan')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ planCode: 'PRO' })
        .expect(201);

      expect(res.body.planType).toBe('PRO');
      expect(res.body.licenseKey).toMatch(/^SF-PRO-/);
      expect(res.body.organizationId).toBe(orgId);
      expect(res.body.organizationName).toBe(testOwner.companyName);
      expect(res.body.maxTeamSeats).toBe(3);
      expect(res.body.maxSuppliersLimit).toBe(15);
      expect(res.body.canCloudBackup).toBe(true);

      // Verify in DB that license is attached to organization
      const dbLicense = await prisma.license.findUnique({
        where: { licenseKey: res.body.licenseKey },
      });
      expect(dbLicense?.organizationId).toBe(orgId);
    });
  });

  describe('4. Team Seats Allocation under PRO plan (maxTeamSeats = 3)', () => {
    let colleague1MemberId: string;

    it('should successfully create invitations and allow acceptance under PRO plan', async () => {
      // Invite Colleague 1
      const res1 = await request(app.getHttpServer())
        .post(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: colleague1Email,
          role: 'MEMBER',
        })
        .expect(201);

      expect(res1.body.email).toBe(colleague1Email);
      expect(res1.body.role).toBe('MEMBER');
      expect(res1.body.token).toMatch(/^SF-INV-/);
      expect(res1.body.inviteUrl).toBeDefined();

      // Colleague 1 accepts invitation
      const accept1 = await request(app.getHttpServer())
        .post('/api/invitations/accept')
        .send({
          token: res1.body.token,
          fullName: 'Colleague One',
          password: 'ColleaguePassword123!',
        })
        .expect(200);

      expect(accept1.body.user.email).toBe(colleague1Email);
      expect(accept1.body.user.organization.id).toBe(orgId);

      // Find colleague 1 member ID
      const membersAfter1 = await request(app.getHttpServer())
        .get(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      const m1 = membersAfter1.body.find((m: any) => m.userEmail === colleague1Email);
      colleague1MemberId = m1.id;

      // Invite Colleague 2
      const res2 = await request(app.getHttpServer())
        .post(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: colleague2Email,
          role: 'ADMIN',
        })
        .expect(201);

      expect(res2.body.email).toBe(colleague2Email);
      expect(res2.body.role).toBe('ADMIN');

      // Colleague 2 accepts invitation
      await request(app.getHttpServer())
        .post('/api/invitations/accept')
        .send({
          token: res2.body.token,
          fullName: 'Colleague Two',
          password: 'ColleaguePassword123!',
        })
        .expect(200);

      // Verify organization now has 3 used seats out of 3
      const orgDetails = await request(app.getHttpServer())
        .get(`/api/organizations/${orgId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(orgDetails.body.usedTeamSeats).toBe(3);
      expect(orgDetails.body.maxTeamSeats).toBe(3);
      expect(orgDetails.body.members.length).toBe(3);
    });

    it('should reject inviting a 4th member when maxTeamSeats is 3 (PRO)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: colleague3Email,
          role: 'MEMBER',
        })
        .expect(403);

      expect(res.body.code).toBe('TEAM_SEATS_LIMIT_EXCEEDED');
      expect(res.body.message).toContain('3 місць у команді');
    });

    it('should liberate a seat when a member is removed, allowing a new member to be invited and accepted', async () => {
      // Remove colleague 1
      await request(app.getHttpServer())
        .delete(`/api/organizations/${orgId}/members/${colleague1MemberId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      // Now used seats = 2, so colleague 3 can be invited
      const res = await request(app.getHttpServer())
        .post(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: colleague3Email,
          role: 'MEMBER',
        })
        .expect(201);

      expect(res.body.email).toBe(colleague3Email);

      // Colleague 3 accepts
      await request(app.getHttpServer())
        .post('/api/invitations/accept')
        .send({
          token: res.body.token,
          fullName: 'Colleague Three',
          password: 'InvitedMemberPassword123!',
        })
        .expect(200);

      // Verify total members count is again 3
      const membersList = await request(app.getHttpServer())
        .get(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(membersList.body.length).toBe(3);
    });
  });

  describe('5. Update Organization Settings', () => {
    it('should update organization name', async () => {
      const updated = await request(app.getHttpServer())
        .patch(`/api/organizations/${orgId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Rozetka Enterprise Hub' })
        .expect(200);

      expect(updated.body.name).toBe('Rozetka Enterprise Hub');
    });
  });

  describe('6. Corporate License Inheritance & Profile Enrichment', () => {
    let colleague3Token: string;

    beforeAll(async () => {
      // Log in as colleague 3
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: colleague3Email,
          password: 'InvitedMemberPassword123!',
        })
        .expect(200);

      colleague3Token = loginRes.body.tokens.accessToken;
      expect(loginRes.body.user.organization).toBeDefined();
      expect(loginRes.body.user.organization.name).toBe('Rozetka Enterprise Hub');
      expect(loginRes.body.user.organization.role).toBe('MEMBER');
    });

    it('should enrich GET /api/auth/me with organization details for team members', async () => {
      const meRes = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${colleague3Token}`)
        .expect(200);

      expect(meRes.body.organization).toBeDefined();
      expect(meRes.body.organization.id).toBe(orgId);
      expect(meRes.body.organization.name).toBe('Rozetka Enterprise Hub');
      expect(meRes.body.organization.role).toBe('MEMBER');
    });

    it('should allow invited colleague to inherit organization corporate PRO license and quotas', async () => {
      const licenseRes = await request(app.getHttpServer())
        .get('/api/licenses/my')
        .set('Authorization', `Bearer ${colleague3Token}`)
        .expect(200);

      expect(licenseRes.body.planType).toBe('PRO');
      expect(licenseRes.body.organizationId).toBe(orgId);
      expect(licenseRes.body.organizationName).toBe('Rozetka Enterprise Hub');
      expect(licenseRes.body.maxTeamSeats).toBe(3);
      expect(licenseRes.body.maxSuppliersLimit).toBe(15);
      expect(licenseRes.body.canCloudBackup).toBe(true);
      expect(licenseRes.body.isActive).toBe(true);
      expect(licenseRes.body.isExpired).toBe(false);
    });

    it('should prioritize corporate PRO license for a user who already has a personal STARTER license', async () => {
      // 1. Register an existing user who gets an auto-provisioned STARTER license
      const regRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(existingUser)
        .expect(201);

      const existingUserToken = regRes.body.tokens.accessToken;

      // Verify existing user initially has STARTER license
      const initLicRes = await request(app.getHttpServer())
        .get('/api/licenses/my')
        .set('Authorization', `Bearer ${existingUserToken}`)
        .expect(200);
      expect(initLicRes.body.planType).toBe('STARTER');
      expect(initLicRes.body.maxXmlLimit).toBe(500);

      // 2. Liberate a seat by removing colleague 2
      const membersList = await request(app.getHttpServer())
        .get(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      const colleague2Member = membersList.body.find(
        (m: any) => m.email === colleague2Email || m.userEmail === colleague2Email,
      );
      if (colleague2Member) {
        await request(app.getHttpServer())
          .delete(`/api/organizations/${orgId}/members/${colleague2Member.id}`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .expect(200);
      }

      // 3. Invite existing user into Rozetka Enterprise Hub
      const invRes = await request(app.getHttpServer())
        .post(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: existingUser.email,
          role: 'MEMBER',
        })
        .expect(201);

      // Accept invitation as existing user
      await request(app.getHttpServer())
        .post('/api/invitations/accept')
        .send({
          token: invRes.body.token,
        })
        .expect(200);

      // 4. Now existing user calls GET /api/licenses/my -> should inherit corporate PRO license!
      const inheritedLicRes = await request(app.getHttpServer())
        .get('/api/licenses/my')
        .set('Authorization', `Bearer ${existingUserToken}`)
        .expect(200);

      expect(inheritedLicRes.body.planType).toBe('PRO');
      expect(inheritedLicRes.body.organizationId).toBe(orgId);
      expect(inheritedLicRes.body.organizationName).toBe('Rozetka Enterprise Hub');
      expect(inheritedLicRes.body.maxXmlLimit).toBe(100000);
      expect(inheritedLicRes.body.canCloudBackup).toBe(true);
    });
  });

  describe('7. Corporate License Expiration & Renewal Access Enforcement', () => {
    let colleagueToken: string;

    beforeAll(async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: colleague3Email,
          password: 'InvitedMemberPassword123!',
        })
        .expect(200);
      colleagueToken = loginRes.body.tokens.accessToken;
    });

    it('should block all team members with 403 LICENSE_EXPIRED when corporate license expires', async () => {
      // Manually expire the organization's license in DB
      await prisma.license.updateMany({
        where: { organizationId: orgId },
        data: {
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired 1 day ago
        },
      });

      // 1. GET /api/licenses/my should reflect isExpired: true and daysRemaining: 0
      const licRes = await request(app.getHttpServer())
        .get('/api/licenses/my')
        .set('Authorization', `Bearer ${colleagueToken}`)
        .expect(200);

      expect(licRes.body.isExpired).toBe(true);
      expect(licRes.body.daysRemaining).toBe(0);

      // 2. Protected endpoint guarded by RequireActiveLicenseGuard must reject colleague with 403
      const blockedRes = await request(app.getHttpServer())
        .post('/api/storage/presigned-url')
        .set('Authorization', `Bearer ${colleagueToken}`)
        .send({
          fileName: 'team_feed.xml',
          contentType: 'application/xml',
        })
        .expect(403);

      expect(blockedRes.body.message).toBe('LICENSE_EXPIRED');
    });

    it('should immediately restore team member access after owner upgrades or renews corporate plan', async () => {
      // Owner selects ENTERPRISE plan
      const renewRes = await request(app.getHttpServer())
        .post('/api/licenses/select-plan')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ planCode: 'ENTERPRISE' })
        .expect(201);

      expect(renewRes.body.planType).toBe('ENTERPRISE');
      expect(renewRes.body.organizationId).toBe(orgId);
      expect(renewRes.body.isExpired).toBe(false);

      // Colleague calls GET /api/licenses/my -> now inherits ENTERPRISE license
      const licRes = await request(app.getHttpServer())
        .get('/api/licenses/my')
        .set('Authorization', `Bearer ${colleagueToken}`)
        .expect(200);

      expect(licRes.body.planType).toBe('ENTERPRISE');
      expect(licRes.body.isExpired).toBe(false);
      expect(licRes.body.daysRemaining).toBeGreaterThanOrEqual(364);
      expect(licRes.body.hasWhiteLabel).toBe(true);
      expect(licRes.body.hasSso).toBe(true);

      // Colleague calls protected endpoint -> successfully granted access (201 Created)
      const storageRes = await request(app.getHttpServer())
        .post('/api/storage/presigned-url')
        .set('Authorization', `Bearer ${colleagueToken}`)
        .send({
          fileName: 'team_feed.xml',
          contentType: 'application/xml',
        })
        .expect(201);

      expect(storageRes.body.uploadUrl).toBeDefined();
      expect(storageRes.body.s3Key).toBeDefined();
    });
  });
});
