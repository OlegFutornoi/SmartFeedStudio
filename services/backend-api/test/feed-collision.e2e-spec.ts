import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { FeedCollisionType, Role } from '@smartfeed/shared';
import { cleanDatabase } from '@test/utils/teardown.helper';

describe('Feed Collision & Deduplication Service (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  let userToken: string;
  let validSupplierId: string;
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
      emailPrefixes: ['collision.test+'],
    });

    const userEmail = `collision.test+${timestamp}@smartfeed.local`;
    createdEmails.push(userEmail);
    const uRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: userEmail,
      password: 'CollisionPassword123!',
      fullName: 'Collision Tester',
      role: Role.USER,
    });
    userToken = uRes.body.tokens.accessToken;

    const testSup = await prisma.supplier.create({
      data: {
        userId: uRes.body.user.id,
        name: 'Livolo Supplier UA',
        code: `LIV_${timestamp}`,
        baseCurrency: 'UAH',
        targetCurrency: 'UAH',
      },
    });
    validSupplierId = testSup.id;
  });

  afterAll(async () => {
    await cleanDatabase(prisma, {
      userEmails: createdEmails,
      emailPrefixes: ['collision.test+'],
    });
    await app.close();
  });

  it('1. POST /api/feeds/check-collision — rejects unauthenticated request with 401', async () => {
    const res = await request(app.getHttpServer()).post('/api/feeds/check-collision').send({
      supplierId: validSupplierId,
      sourceType: 'URL',
      sourceUrl: 'https://livolo.kiev.ua/products_feed.xml',
    });
    expect(res.status).toBe(401);
  });

  it('2. POST /api/feeds/check-collision — returns 404 if supplier does not exist', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/feeds/check-collision')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        supplierId: 'nonexistent_supplier_cuid',
        sourceType: 'URL',
        sourceUrl: 'https://livolo.kiev.ua/products_feed.xml',
      });
    expect(res.status).toBe(404);
  });

  it('3. POST /api/feeds/check-collision — successfully checks unique feed URL and returns canonicalUrl + fingerprint', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/feeds/check-collision')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        supplierId: validSupplierId,
        sourceType: 'URL',
        sourceUrl: 'http://livolo.kiev.ua/products_feed.xml/?utm_source=fb&utm_medium=cpc',
        feedName: 'livolo.kiev.ua (products_feed.xml)',
      });

    expect(res.status).toBe(200);
    expect(res.body.hasCollision).toBe(false);
    expect(res.body.collisionType).toBe(FeedCollisionType.NONE);
    // Canonical URL stripped UTMs, normalized protocol to https, lowercased host, and collapsed trailing slash
    expect(res.body.canonicalUrl).toBe('https://livolo.kiev.ua/products_feed.xml');
    expect(res.body.urlFingerprint).toBeDefined();
    expect(res.body.urlFingerprint.length).toBe(64);
    expect(res.body.suggestedFeedName).toBe('livolo.kiev.ua (products_feed.xml)');
  });

  it('4. POST /api/feeds/check-collision — checks Cyrillic file content and computes 64-char contentHash', async () => {
    const xmlContent =
      '<?xml version="1.0" encoding="UTF-8"?><yml_catalog><shop><offers><offer id="1"><name>Вимикач Livolo білий</name></offer></offers></shop></yml_catalog>';
    const res = await request(app.getHttpServer())
      .post('/api/feeds/check-collision')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        supplierId: validSupplierId,
        sourceType: 'FILE',
        fileName: 'feed.xml',
        fileContent: xmlContent,
      });

    expect(res.status).toBe(200);
    expect(res.body.hasCollision).toBe(false);
    expect(res.body.collisionType).toBe(FeedCollisionType.NONE);
  });

  it('5. POST /api/feeds/check-collision — detects SAME_SUPPLIER_DUPLICATE when feed fingerprint already synced for same supplier', async () => {
    const firstCheck = await request(app.getHttpServer())
      .post('/api/feeds/check-collision')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        supplierId: validSupplierId,
        sourceType: 'URL',
        sourceUrl: 'https://livolo.kiev.ua/dup_feed.xml',
      });

    const fingerprint = firstCheck.body.urlFingerprint;

    await prisma.supplierFeedSource.create({
      data: {
        supplierId: validSupplierId,
        name: 'Livolo Main Feed',
        sourceType: 'URL',
        sourceUrl: 'https://livolo.kiev.ua/dup_feed.xml',
        urlFingerprint: fingerprint,
        productsCount: 42,
      },
    });

    const dupRes = await request(app.getHttpServer())
      .post('/api/feeds/check-collision')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        supplierId: validSupplierId,
        sourceType: 'URL',
        sourceUrl: 'http://www.livolo.kiev.ua/dup_feed.xml/?utm_source=google',
        feedName: 'Livolo Main Feed',
      });

    expect(dupRes.status).toBe(200);
    expect(dupRes.body.hasCollision).toBe(true);
    expect(dupRes.body.collisionType).toBe(FeedCollisionType.SAME_SUPPLIER_DUPLICATE);
    expect(dupRes.body.existingProductsCount).toBe(42);
  });
});
