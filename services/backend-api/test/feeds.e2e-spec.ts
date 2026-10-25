import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { Role } from '@smartfeed/shared';
import { cleanDatabase } from '@test/utils/teardown.helper';

describe('Feeds & Background Jobs API (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  let userToken: string;
  const createdEmails: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    await cleanDatabase(prisma, {
      emailPrefixes: ['feed.job.test+'],
    });

    const userEmail = `feed.job.test+${timestamp}@smartfeed.local`;
    createdEmails.push(userEmail);
    const uRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: userEmail,
      password: 'UserPassword123!',
      fullName: 'Feed Job Tester',
      role: Role.USER,
    });
    userToken = uRes.body.tokens.accessToken;

    const testSup = await prisma.supplier.create({
      data: {
        userId: uRes.body.user.id,
        name: 'Feed Test Supplier',
        code: `FTS_${timestamp}`,
      },
    });
    validSupplierId = testSup.id;
  });

  let validSupplierId: string;

  afterAll(async () => {
    await cleanDatabase(prisma, {
      userEmails: createdEmails,
      emailPrefixes: ['feed.job.test+'],
    });
    await app.close();
  });

  it('1. GET /api/feeds/jobs/active — rejects unauthorized requests with 401', async () => {
    const res = await request(app.getHttpServer()).get('/api/feeds/jobs/active');
    expect(res.status).toBe(401);
  });

  it('2. GET /api/feeds/jobs/active — returns 200 OK and array for authenticated user', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/feeds/jobs/active')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('3. GET /api/feeds/jobs/:id — returns 200 OK and job details', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/feeds/jobs/job_test_123')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'job_test_123');
    expect(res.body).toHaveProperty('status');
  });

  it('4. POST /api/feeds/import-async — queues job and returns 200 OK with valid supplierId', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/feeds/import-async')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        supplierId: validSupplierId,
        sourceType: 'URL',
        sourceUrl: 'https://example.com/feed.xml',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('jobId');
    expect(res.body).toHaveProperty('feedSourceId');
  });

  it('4b. POST /api/feeds/import-async — rejects nonexistent supplier with 404 (DB-REF-01)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/feeds/import-async')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        supplierId: 'nonexistent_supplier_cuid_123',
        sourceType: 'URL',
        sourceUrl: 'https://example.com/feed.xml',
      });

    expect(res.status).toBe(404);
  });

  it('4c. POST /api/feeds/import-async — rejects invalid feed file extension (.md, .exe) with 400 (SEC-07)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/feeds/import-async')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        supplierId: validSupplierId,
        sourceType: 'FILE',
        fileName: 'xml_link.md',
        fileContent: '# Markdown content instead of feed',
      });

    expect(res.status).toBe(400);
  });

  it('4d. POST /api/feeds/import-async — rejects invalid feed content with 400 (SEC-08)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/feeds/import-async')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        supplierId: validSupplierId,
        sourceType: 'FILE',
        fileName: 'feed.xml',
        fileContent: 'This is not valid XML or CSV format at all',
      });

    expect(res.status).toBe(400);
  });

  it('5. POST /api/feeds/import-async — rejects unauthenticated request with 401', async () => {
    const res = await request(app.getHttpServer()).post('/api/feeds/import-async').send({
      supplierId: 'supplier_123',
      sourceType: 'URL',
    });
    expect(res.status).toBe(401);
  });

  it('6. GET /api/feeds/jobs/:id — rejects unauthenticated request with 401', async () => {
    const res = await request(app.getHttpServer()).get('/api/feeds/jobs/job_test_123');
    expect(res.status).toBe(401);
  });

  it('7. POST /api/feeds/import-async — rejects invalid DTO (missing supplierId) with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/feeds/import-async')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        sourceType: 'URL',
      });
    expect(res.status).toBe(400);
  });

  it('8. POST /api/feeds/import-async — rejects non-whitelisted properties (Mass Assignment protection) with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/feeds/import-async')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        supplierId: 'supplier_123',
        sourceType: 'URL',
        maliciousExtraProperty: 'exploit',
      });
    expect(res.status).toBe(400);
  });
});
