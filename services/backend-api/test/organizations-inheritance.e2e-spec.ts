import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { cleanDatabase } from '@test/utils/teardown.helper';

describe('Organizations License Inheritance & Renewal (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let ownerToken: string;
  let orgId: string;
  let colleagueToken: string;

  const testOwner = {
    email: 'org.inh+owner@smartfeed.studio',
    password: 'OwnerPassword123!',
    fullName: 'Owner Org Tester',
    companyName: 'Rozetka Enterprise Hub',
  };

  const colleagueEmail = 'org.inh+colleague@smartfeed.studio';
  const colleague2Email = 'org.inh+colleague2@smartfeed.studio';

  const existingUser = {
    email: 'org.inh+existing@smartfeed.studio',
    password: 'ExistingPassword123!',
    fullName: 'Existing User Tester',
  };

  const allTestEmails = [testOwner.email, colleagueEmail, colleague2Email, existingUser.email];

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
      emailPrefixes: ['org.inh+'],
      organizationNames: [testOwner.companyName, `Компанія ${existingUser.fullName}`],
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

    // Register owner and upgrade to PRO
    const regRes = await request(app.getHttpServer()).post('/api/auth/register').send(testOwner);
    ownerToken = regRes.body.tokens.accessToken;

    const orgsRes = await request(app.getHttpServer())
      .get('/api/organizations')
      .set('Authorization', `Bearer ${ownerToken}`);
    orgId = orgsRes.body[0].id;

    await request(app.getHttpServer())
      .post('/api/licenses/select-plan')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ planCode: 'PRO' });

    // Invite colleague
    const invRes = await request(app.getHttpServer())
      .post(`/api/organizations/${orgId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: colleagueEmail, role: 'MEMBER' });

    await request(app.getHttpServer()).post('/api/invitations/accept').send({
      token: invRes.body.token,
      fullName: 'Colleague Inh',
      password: 'ColleaguePassword123!',
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: colleagueEmail, password: 'ColleaguePassword123!' });
    colleagueToken = loginRes.body.tokens.accessToken;
  });

  afterAll(async () => {
    await cleanDatabase(prisma, {
      userEmails: allTestEmails,
      emailPrefixes: ['org.inh+'],
      organizationNames: [testOwner.companyName, `Компанія ${existingUser.fullName}`],
    });
    await app.close();
  });

  describe('Corporate License Inheritance & Profile Enrichment', () => {
    it('should enrich GET /api/auth/me with organization details for team members', async () => {
      const meRes = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${colleagueToken}`)
        .expect(200);

      expect(meRes.body.organization).toBeDefined();
      expect(meRes.body.organization.id).toBe(orgId);
      expect(meRes.body.organization.name).toBe(testOwner.companyName);
      expect(meRes.body.organization.role).toBe('MEMBER');
    });

    it('should allow invited colleague to inherit organization corporate PRO license and quotas', async () => {
      const licenseRes = await request(app.getHttpServer())
        .get('/api/licenses/my')
        .set('Authorization', `Bearer ${colleagueToken}`)
        .expect(200);

      expect(licenseRes.body.planType).toBe('PRO');
      expect(licenseRes.body.organizationId).toBe(orgId);
      expect(licenseRes.body.organizationName).toBe(testOwner.companyName);
      expect(licenseRes.body.maxTeamSeats).toBe(3);
      expect(licenseRes.body.maxSuppliersLimit).toBe(15);
      expect(licenseRes.body.canCloudBackup).toBe(true);
      expect(licenseRes.body.isActive).toBe(true);
      expect(licenseRes.body.isExpired).toBe(false);
    });

    it('should prioritize corporate PRO license for a user who already has a personal STARTER license', async () => {
      const regRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(existingUser)
        .expect(201);
      const existingUserToken = regRes.body.tokens.accessToken;

      const initLicRes = await request(app.getHttpServer())
        .get('/api/licenses/my')
        .set('Authorization', `Bearer ${existingUserToken}`)
        .expect(200);
      expect(initLicRes.body.planType).toBe('STARTER');

      const invRes = await request(app.getHttpServer())
        .post(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: existingUser.email, role: 'MEMBER' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/invitations/accept')
        .send({ token: invRes.body.token, password: existingUser.password })
        .expect(200);

      const inheritedLicRes = await request(app.getHttpServer())
        .get('/api/licenses/my')
        .set('Authorization', `Bearer ${existingUserToken}`)
        .expect(200);

      expect(inheritedLicRes.body.planType).toBe('PRO');
      expect(inheritedLicRes.body.organizationId).toBe(orgId);
    });
  });

  describe('Corporate License Expiration & Renewal Access Enforcement', () => {
    it('should block all team members with 403 LICENSE_EXPIRED when corporate license expires', async () => {
      await prisma.license.updateMany({
        where: { organizationId: orgId },
        data: {
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      });

      const licRes = await request(app.getHttpServer())
        .get('/api/licenses/my')
        .set('Authorization', `Bearer ${colleagueToken}`)
        .expect(200);

      expect(licRes.body.isExpired).toBe(true);
      expect(licRes.body.daysRemaining).toBe(0);

      const blockedRes = await request(app.getHttpServer())
        .post('/api/storage/presigned-url')
        .set('Authorization', `Bearer ${colleagueToken}`)
        .send({ fileName: 'team_feed.xml', contentType: 'application/xml' })
        .expect(403);

      expect(blockedRes.body.message).toBe('LICENSE_EXPIRED');
    });

    it('should immediately restore team member access after owner upgrades or renews corporate plan', async () => {
      const renewRes = await request(app.getHttpServer())
        .post('/api/licenses/select-plan')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ planCode: 'ENTERPRISE' })
        .expect(201);

      expect(renewRes.body.planType).toBe('ENTERPRISE');
      expect(renewRes.body.organizationId).toBe(orgId);
      expect(renewRes.body.isExpired).toBe(false);

      const licRes = await request(app.getHttpServer())
        .get('/api/licenses/my')
        .set('Authorization', `Bearer ${colleagueToken}`)
        .expect(200);

      expect(licRes.body.planType).toBe('ENTERPRISE');
      expect(licRes.body.isExpired).toBe(false);
      expect(licRes.body.daysRemaining).toBeGreaterThanOrEqual(364);

      const storageRes = await request(app.getHttpServer())
        .post('/api/storage/presigned-url')
        .set('Authorization', `Bearer ${colleagueToken}`)
        .send({ fileName: 'team_feed.xml', contentType: 'application/xml' })
        .expect(201);

      expect(storageRes.body.uploadUrl).toBeDefined();
    });
  });
});
