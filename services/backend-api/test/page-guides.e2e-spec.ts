import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { cleanDatabase } from '@test/utils/teardown.helper';

describe('Page Guides & AI Assistant (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let adminUserId: string;
  let regularUserId: string;

  const testRoute = `/test-guide-${Date.now()}`;
  const adminEmail = `guide-admin-${Date.now()}@example.com`;
  const userEmail = `guide-user-${Date.now()}@example.com`;

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
      }),
    );

    await app.init();

    await cleanDatabase(prisma, {
      emailPrefixes: ['guide-admin-', 'guide-user-'],
    });

    // Create Admin User
    const adminReg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: adminEmail,
        password: 'Password123!',
        fullName: 'Guide Admin',
      })
      .expect(201);
    adminUserId = adminReg.body.user.id;

    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: 'ADMIN' },
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'Password123!' })
      .expect(200);
    adminToken = adminLogin.body.tokens.accessToken;

    // Create Regular User
    const userReg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: userEmail,
        password: 'Password123!',
        fullName: 'Regular User',
      })
      .expect(201);
    regularUserId = userReg.body.user.id;

    const userLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: userEmail, password: 'Password123!' })
      .expect(200);
    userToken = userLogin.body.tokens.accessToken;

    // Clean any leftover test guides and AI settings
    await prisma.pageGuide.deleteMany({
      where: { route: { startsWith: '/test-guide-' } },
    });
    await prisma.aiAssistantSetting.deleteMany({});
  });

  afterAll(async () => {
    await prisma.pageGuide.deleteMany({
      where: { route: { startsWith: '/test-guide-' } },
    });
    await prisma.aiAssistantSetting.deleteMany({});
    await cleanDatabase(prisma, {
      userIds: [adminUserId, regularUserId].filter(Boolean),
      emailPrefixes: ['guide-admin-', 'guide-user-'],
    });
    await app.close();
  });

  it('1. GET /api/page-guides/assistant/profile returns default or configured AI Copilot profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/page-guides/assistant/profile')
      .expect(200);

    expect(res.body).toHaveProperty('name', 'SmartFeed AI Copilot');
    expect(res.body).toHaveProperty('badgeUk');
    expect(res.body).toHaveProperty('roleUk');
  });

  it('2. GET /api/page-guides returns list of page guides with assistant metadata', async () => {
    const res = await request(app.getHttpServer()).get('/api/page-guides').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const cloudGuide = res.body.find(
      (g: { route: string; icon: string; titleUk: string; assistant: unknown }) =>
        g.route === '/cloud-sync',
    );
    expect(cloudGuide).toBeDefined();
    expect(cloudGuide.icon).toBe('Cloud');
    expect(cloudGuide.titleUk).toContain('Хмарн');
    expect(cloudGuide.assistant).toBeDefined();
  });

  it('3. GET /api/page-guides/:routeKey returns specific page guide with route aliasing', async () => {
    const res = await request(app.getHttpServer()).get('/api/page-guides/cloud-sync').expect(200);

    expect(res.body.route).toBe('/cloud-sync');
    expect(res.body.featuresUk.length).toBeGreaterThan(0);
    expect(res.body.proTipUk).toBeDefined();

    // Verify canonical aliasing for /dashboard and /plans
    const dashboardRes = await request(app.getHttpServer())
      .get('/api/page-guides/dashboard')
      .expect(200);
    expect(dashboardRes.body.route).toBe('/');

    const plansRes = await request(app.getHttpServer()).get('/api/page-guides/plans').expect(200);
    expect(plansRes.body.route).toBe('/license');
  });

  it('4. GET /api/page-guides/:routeKey returns 404 for unknown route', async () => {
    await request(app.getHttpServer()).get('/api/page-guides/non-existent-route-xyz').expect(404);
  });

  it('5. Supports dynamic creation in DB with instant API reflection', async () => {
    await prisma.pageGuide.create({
      data: {
        route: testRoute,
        titleUk: 'Тестова сторінка',
        titleEn: 'Test Page',
        icon: 'Sparkles',
        summaryUk: 'Тестовий підсумок',
        summaryEn: 'Test Summary',
        descriptionUk: 'Тестовий опис для перевірки',
        descriptionEn: 'Test description for verification',
        featuresUk: ['Фіча 1'],
        featuresEn: ['Feature 1'],
      },
    });

    const res = await request(app.getHttpServer()).get(`/api/page-guides${testRoute}`).expect(200);

    expect(res.body.titleUk).toBe('Тестова сторінка');
    expect(res.body.icon).toBe('Sparkles');
  });

  it('6. PUT /api/page-guides/assistant/profile requires admin authorization', async () => {
    const customAvatarDataUri =
      'data:image/webp;base64,UklGRgAMAABXRUJQVlA4WAoAAAAgAAAAxwAAxwAAQUxQSAwAAAARBxAR/Q8AAABWUDgg';

    // 1. Unauthenticated -> 401 Unauthorized
    await request(app.getHttpServer())
      .put('/api/page-guides/assistant/profile')
      .send({
        avatarUrl: customAvatarDataUri,
        name: 'Custom AI Assistant',
      })
      .expect(401);

    // 2. Regular User -> 403 Forbidden
    await request(app.getHttpServer())
      .put('/api/page-guides/assistant/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        avatarUrl: customAvatarDataUri,
        name: 'Custom AI Assistant',
      })
      .expect(403);

    // 3. Admin -> 200 OK
    const putRes = await request(app.getHttpServer())
      .put('/api/page-guides/assistant/profile')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        avatarUrl: customAvatarDataUri,
        name: 'Custom AI Assistant',
      })
      .expect(200);

    expect(putRes.body.avatarUrl).toBe(customAvatarDataUri);
    expect(putRes.body.name).toBe('Custom AI Assistant');

    // Verify GET immediately reflects the change
    const getRes = await request(app.getHttpServer())
      .get('/api/page-guides/assistant/profile')
      .expect(200);

    expect(getRes.body.avatarUrl).toBe(customAvatarDataUri);
    expect(getRes.body.name).toBe('Custom AI Assistant');

    // Reset back for test isolation
    await prisma.aiAssistantSetting.deleteMany({});
  });
});
