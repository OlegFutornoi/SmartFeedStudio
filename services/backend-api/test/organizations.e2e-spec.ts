import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Organizations & Team Seats Quota Policy (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let ownerToken: string;
  let ownerUserId: string;
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

  const colleague1Email = 'org.test+colleague1@smartfeed.studio';
  const colleague2Email = 'org.test+colleague2@smartfeed.studio';
  const colleague3Email = 'org.test+colleague3@smartfeed.studio';

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
    await prisma.organizationMember.deleteMany({
      where: {
        user: {
          email: {
            in: [
              testOwner.email,
              soloUser.email,
              colleague1Email,
              colleague2Email,
              colleague3Email,
            ],
          },
        },
      },
    });
    await prisma.organization.deleteMany({
      where: {
        name: { in: [testOwner.companyName, `Компанія ${soloUser.fullName}`] },
      },
    });
    await prisma.license.deleteMany({
      where: {
        user: {
          email: {
            in: [
              testOwner.email,
              soloUser.email,
              colleague1Email,
              colleague2Email,
              colleague3Email,
            ],
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testOwner.email, soloUser.email, colleague1Email, colleague2Email, colleague3Email],
        },
      },
    });
  });

  afterAll(async () => {
    // Zero Test Data Leftovers Teardown
    await prisma.organizationMember.deleteMany({
      where: {
        user: {
          email: {
            in: [
              testOwner.email,
              soloUser.email,
              colleague1Email,
              colleague2Email,
              colleague3Email,
            ],
          },
        },
      },
    });
    await prisma.organization.deleteMany({
      where: {
        name: {
          in: [testOwner.companyName, 'Rozetka Enterprise Hub', `Компанія ${soloUser.fullName}`],
        },
      },
    });
    await prisma.license.deleteMany({
      where: {
        user: {
          email: {
            in: [
              testOwner.email,
              soloUser.email,
              colleague1Email,
              colleague2Email,
              colleague3Email,
            ],
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testOwner.email, soloUser.email, colleague1Email, colleague2Email, colleague3Email],
        },
      },
    });

    await app.close();
  });

  describe('1. Registration with companyName', () => {
    it('should register user and automatically create Organization with companyName as OWNER', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testOwner)
        .expect(201);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testOwner.email);
      expect(res.body.tokens.accessToken).toBeDefined();

      ownerToken = res.body.tokens.accessToken;
      ownerUserId = res.body.user.id;

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

  describe('3. Upgrade to PRO plan (maxTeamSeats = 3) and Seat Allocation', () => {
    let colleague1MemberId: string;

    beforeAll(async () => {
      // Simulate plan upgrade to PRO for this organization
      await prisma.license.updateMany({
        where: { organizationId: orgId },
        data: {
          planType: 'PRO',
          maxTeamSeats: 3,
        },
      });
    });

    it('should successfully invite 2nd and 3rd members under PRO plan', async () => {
      // Invite Colleague 1
      const res1 = await request(app.getHttpServer())
        .post(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: colleague1Email,
          role: 'MEMBER',
        })
        .expect(201);

      expect(res1.body.userEmail).toBe(colleague1Email);
      expect(res1.body.role).toBe('MEMBER');
      colleague1MemberId = res1.body.id;

      // Invite Colleague 2
      const res2 = await request(app.getHttpServer())
        .post(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: colleague2Email,
          role: 'ADMIN',
        })
        .expect(201);

      expect(res2.body.userEmail).toBe(colleague2Email);
      expect(res2.body.role).toBe('ADMIN');

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

    it('should liberate a seat when a member is removed, allowing a new member to be invited', async () => {
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

      expect(res.body.userEmail).toBe(colleague3Email);

      // Verify total members count is again 3
      const membersList = await request(app.getHttpServer())
        .get(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(membersList.body.length).toBe(3);
    });
  });

  describe('4. Update Organization Settings', () => {
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
