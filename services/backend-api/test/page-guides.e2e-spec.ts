import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';

describe('Page Guides & AI Assistant (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testRoute = `/test-guide-${Date.now()}`;

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

    // Clean any leftover test guides
    await prisma.pageGuide.deleteMany({
      where: { route: { startsWith: '/test-guide-' } },
    });
  });

  afterAll(async () => {
    await prisma.pageGuide.deleteMany({
      where: { route: { startsWith: '/test-guide-' } },
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

    const cloudGuide = res.body.find((g: any) => g.route === '/cloud-sync');
    expect(cloudGuide).toBeDefined();
    expect(cloudGuide.icon).toBe('Cloud');
    expect(cloudGuide.titleUk).toContain('Хмарн');
    expect(cloudGuide.assistant).toBeDefined();
  });

  it('3. GET /api/page-guides/:routeKey returns specific page guide', async () => {
    const res = await request(app.getHttpServer()).get('/api/page-guides/cloud-sync').expect(200);

    expect(res.body.route).toBe('/cloud-sync');
    expect(res.body.featuresUk.length).toBeGreaterThan(0);
    expect(res.body.proTipUk).toBeDefined();
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

  it('6. PUT /api/page-guides/assistant/profile updates AI assistant avatar and metadata', async () => {
    const customAvatarUrl = 'https://r2.smartfeed.studio/avatars/custom-ai-avatar.png';
    const putRes = await request(app.getHttpServer())
      .put('/api/page-guides/assistant/profile')
      .send({
        avatarUrl: customAvatarUrl,
        name: 'Custom AI Assistant',
      })
      .expect(200);

    expect(putRes.body.avatarUrl).toBe(customAvatarUrl);
    expect(putRes.body.name).toBe('Custom AI Assistant');

    // Verify GET immediately reflects the change
    const getRes = await request(app.getHttpServer())
      .get('/api/page-guides/assistant/profile')
      .expect(200);

    expect(getRes.body.avatarUrl).toBe(customAvatarUrl);
    expect(getRes.body.name).toBe('Custom AI Assistant');

    // Reset back for test isolation
    await prisma.aiAssistantSetting.deleteMany({});
  });
});
