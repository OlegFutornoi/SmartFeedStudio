import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { cleanDatabase } from '@test/utils/teardown.helper';

describe('Auth Avatar Security & Magic Bytes (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;

  const testUser = {
    email: `avatarsec-${Date.now()}@smartfeed.studio`,
    password: 'AvatarSecPassword123!',
    fullName: 'Avatar Security Tester',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');

    await app.init();
    prisma = app.get(PrismaService);

    await cleanDatabase(prisma, {
      emailPrefixes: ['avatarsec-'],
    });

    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    testUserId = regRes.body.user.id;
    authToken = regRes.body.tokens.accessToken;
  });

  afterAll(async () => {
    await cleanDatabase(prisma, {
      userIds: [testUserId].filter(Boolean),
      emailPrefixes: ['avatarsec-'],
    });
    await app.close();
  });

  it('1. rejects SVG avatar (Stored XSS vector) with 400 Bad Request (SEC-07)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/auth/avatar')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        avatarUrl: 'data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+',
      });

    expect(res.status).toBe(400);
  });

  it('2. rejects HTML script payload in avatar with 400 Bad Request (SEC-07)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/auth/avatar')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ avatarUrl: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==' });

    expect(res.status).toBe(400);
  });

  it('3. rejects forged PNG MIME with fake magic bytes with 400 Bad Request (SEC-07)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/auth/avatar')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ avatarUrl: 'data:image/png;base64,AAAAFakeBytes==' });

    expect(res.status).toBe(400);
  });

  it('4. accepts authentic WebP avatar with verified RIFF...WEBP magic bytes (SEC-07)', async () => {
    const authenticWebP =
      'data:image/webp;base64,UklGRgAMAABXRUJQVlA4WAoAAAAgAAAAxwAAxwAAQUxQSAwAAAARBxAR/Q8AAABWUDgg';
    const res = await request(app.getHttpServer())
      .patch('/api/auth/avatar')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ avatarUrl: authenticWebP });

    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toBe(authenticWebP);
  });

  it('5. accepts authentic 1x1 PNG avatar with verified 89 50 4E 47 magic bytes', async () => {
    const authentic1x1Png =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const res = await request(app.getHttpServer())
      .patch('/api/auth/avatar')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ avatarUrl: authentic1x1Png });

    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toBe(authentic1x1Png);
  });
});
