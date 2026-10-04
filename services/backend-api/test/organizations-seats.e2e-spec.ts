import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { cleanDatabase } from '@test/utils/teardown.helper';

interface MemberSummaryRow {
  id: string;
  userEmail?: string;
  email?: string;
}

describe('Organizations & Team Seats Quotas (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let ownerToken: string;
  let orgId: string;
  let soloUserToken: string;

  const testOwner = {
    email: 'org.seats+owner@smartfeed.studio',
    password: 'OwnerPassword123!',
    fullName: 'Owner Org Tester',
    companyName: 'Rozetka Top Sellers LLC',
  };

  const soloUser = {
    email: 'org.seats+solo@smartfeed.studio',
    password: 'SoloPassword123!',
    fullName: 'John Solo',
  };

  const colleague1Email = 'org.seats+colleague1@smartfeed.studio';
  const colleague2Email = 'org.seats+colleague2@smartfeed.studio';
  const colleague3Email = 'org.seats+colleague3@smartfeed.studio';

  const allTestEmails = [
    testOwner.email,
    soloUser.email,
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

    await cleanDatabase(prisma, {
      userEmails: allTestEmails,
      emailPrefixes: ['org.seats+'],
      organizationNames: [
        testOwner.companyName,
        'Rozetka Enterprise Hub',
        `Компанія ${soloUser.fullName}`,
      ],
    });

    await prisma.tariffPlan.upsert({
      where: { code: 'STARTER' },
      update: {},
      create: {
        code: 'STARTER',
        nameUk: 'Стартовий',
        nameEn: 'Starter',
        priceMonthly: 0,
        maxXmlLimit: 1000,
        aiCredits: 50,
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
  });

  afterAll(async () => {
    await cleanDatabase(prisma, {
      userEmails: allTestEmails,
      emailPrefixes: ['org.seats+'],
      organizationNames: [
        testOwner.companyName,
        'Rozetka Enterprise Hub',
        `Компанія ${soloUser.fullName}`,
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
      ownerToken = res.body.tokens.accessToken;

      const orgsRes = await request(app.getHttpServer())
        .get('/api/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(Array.isArray(orgsRes.body)).toBe(true);
      expect(orgsRes.body.length).toBe(1);
      expect(orgsRes.body[0].name).toBe(testOwner.companyName);
      expect(orgsRes.body[0].userRole).toBe('OWNER');
      expect(orgsRes.body[0].usedTeamSeats).toBe(1);
      expect(orgsRes.body[0].maxTeamSeats).toBe(1);

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
        .send({ email: colleague1Email, role: 'MEMBER' })
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

      const dbLicense = await prisma.license.findUnique({
        where: { licenseKey: res.body.licenseKey },
      });
      expect(dbLicense?.organizationId).toBe(orgId);
    });
  });

  describe('4. Team Seats Allocation under PRO plan (maxTeamSeats = 3)', () => {
    let colleague1MemberId: string;

    it('should successfully create invitations and allow acceptance under PRO plan', async () => {
      const res1 = await request(app.getHttpServer())
        .post(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: colleague1Email, role: 'MEMBER' })
        .expect(201);

      expect(res1.body.token).toMatch(/^SF-INV-/);

      const accept1 = await request(app.getHttpServer())
        .post('/api/invitations/accept')
        .send({
          token: res1.body.token,
          fullName: 'Colleague One',
          password: 'ColleaguePassword123!',
        })
        .expect(200);

      expect(accept1.body.user.email).toBe(colleague1Email);

      const membersAfter1 = await request(app.getHttpServer())
        .get(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      const m1 = (membersAfter1.body as MemberSummaryRow[]).find(
        (m) => m.userEmail === colleague1Email,
      );
      colleague1MemberId = m1!.id;

      const res2 = await request(app.getHttpServer())
        .post(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: colleague2Email, role: 'ADMIN' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/invitations/accept')
        .send({
          token: res2.body.token,
          fullName: 'Colleague Two',
          password: 'ColleaguePassword123!',
        })
        .expect(200);

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
        .send({ email: colleague3Email, role: 'MEMBER' })
        .expect(403);

      expect(res.body.code).toBe('TEAM_SEATS_LIMIT_EXCEEDED');
      expect(res.body.message).toContain('3 місць у команді');
    });

    it('should liberate a seat when a member is removed, allowing a new member to be invited and accepted', async () => {
      await request(app.getHttpServer())
        .delete(`/api/organizations/${orgId}/members/${colleague1MemberId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const res = await request(app.getHttpServer())
        .post(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: colleague3Email, role: 'MEMBER' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/invitations/accept')
        .send({
          token: res.body.token,
          fullName: 'Colleague Three',
          password: 'InvitedMemberPassword123!',
        })
        .expect(200);

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
});
