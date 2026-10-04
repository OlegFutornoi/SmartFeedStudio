import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { cleanDatabase } from '@test/utils/teardown.helper';

describe('Adversarial Security & Concurrency Race Condition Suite (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let ownerToken: string;
  let orgId: string;
  let ownerUserId: string;

  const testOwner = {
    email: 'adv.race.owner@smartfeed.studio',
    password: 'RacePassword123!',
    fullName: 'Adversarial Race Owner',
    companyName: 'Adversarial Concurrency Corp',
  };

  const colleagueEmails = Array.from(
    { length: 10 },
    (_, i) => `adv.colleague.${i}@smartfeed.studio`,
  );
  const allTestEmails = [testOwner.email, ...colleagueEmails];

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

    // Teardown before starting
    await cleanDatabase(prisma, {
      userEmails: allTestEmails,
      emailPrefixes: ['adv.race.', 'adv.colleague.'],
      organizationNames: [testOwner.companyName],
    });

    // 1. Register owner
    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testOwner)
      .expect(201);

    ownerToken = regRes.body.tokens.accessToken;
    ownerUserId = regRes.body.user.id;
    orgId = regRes.body.user.organization.id;

    // 2. Set maxTeamSeats to 2 (1 owner + 1 free seat remaining)
    await prisma.license.updateMany({
      where: { userId: ownerUserId, isActive: true },
      data: { maxTeamSeats: 2 },
    });
  });

  afterAll(async () => {
    // 100% clean teardown
    await cleanDatabase(prisma, {
      userEmails: allTestEmails,
      emailPrefixes: ['adv.race.', 'adv.colleague.'],
      organizationNames: [testOwner.companyName],
    });

    await app.close();
  });

  describe('1. Team Seats Quota TOCTOU Concurrency Stress Test', () => {
    it('should allow strictly 1 invite out of 10 concurrent requests when 1 team seat is available', async () => {
      // Dispatch 10 concurrent requests to POST /api/organizations/:id/members
      const requests = colleagueEmails.map((email) =>
        request(app.getHttpServer())
          .post(`/api/organizations/${orgId}/members`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            email,
            role: 'MEMBER',
          }),
      );

      const responses = await Promise.all(requests);

      const successfulResponses = responses.filter((r) => r.status === 201);
      const rejectedResponses = responses.filter((r) => r.status === 403);

      // Exactly 1 request must succeed
      expect(successfulResponses).toHaveLength(1);

      // Exactly 9 requests must be rejected with 403 TEAM_SEATS_LIMIT_EXCEEDED
      expect(rejectedResponses).toHaveLength(9);

      for (const rejected of rejectedResponses) {
        interface ErrorBody {
          statusCode: number;
          code?: string;
          message: string;
        }
        const body = rejected.body as ErrorBody;
        expect(body.code).toBe('TEAM_SEATS_LIMIT_EXCEEDED');
        expect(body.message).toContain('місць у команді');
      }

      // Assert physical database integrity
      const pendingCount = await prisma.organizationInvitation.count({
        where: { organizationId: orgId, status: 'PENDING' },
      });
      expect(pendingCount).toBe(1);
    });
  });

  describe('2. Path Traversal & OS Command Injection Mitigation in Storage Workspace', () => {
    it('should reject relative path traversal (../) in workspace path with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/storage/workspace/init')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          workspacePath: '../../../../etc/shadow',
          enableEncryption: true,
        })
        .expect(400);

      expect(res.body.message).toContain('directory traversal');
    });

    it('should reject Windows-style path traversal (..\\) in workspace path with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/storage/workspace/init')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          workspacePath: '..\\..\\Windows\\System32',
          enableEncryption: true,
        })
        .expect(400);

      expect(res.body.message).toContain('directory traversal');
    });

    it('should reject command injection metacharacters (; | & ` $ < >) in workspace path with 400', async () => {
      const maliciousPaths = [
        'valid_workspace; rm -rf /',
        'valid_workspace | whoami',
        'valid_workspace && cat /etc/passwd',
        'valid_workspace`id`',
        'valid_workspace$(whoami)',
      ];

      for (const badPath of maliciousPaths) {
        const res = await request(app.getHttpServer())
          .post('/api/storage/workspace/init')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            workspacePath: badPath,
            enableEncryption: true,
          })
          .expect(400);

        expect(res.body.message).toContain('command injection');
      }
    });

    it('should reject targeting system root directories (/ or /etc or /var) with 400', async () => {
      const systemRoots = ['/', '/etc', '/var', '/usr'];

      for (const rootDir of systemRoots) {
        const res = await request(app.getHttpServer())
          .post('/api/storage/workspace/init')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            workspacePath: rootDir,
            enableEncryption: true,
          })
          .expect(400);

        expect(res.body.message).toContain('system root directories');
      }
    });
  });
});
