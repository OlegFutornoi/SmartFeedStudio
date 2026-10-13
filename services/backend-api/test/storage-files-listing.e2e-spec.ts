import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { Role, StorageFileDto } from '@smartfeed/shared';
import { cleanDatabase } from '@test/utils/teardown.helper';

describe('Storage Files Listing & Tenant Isolation (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  let userAToken: string;
  let userAId: string;
  let userBToken: string;
  let testFileId: string;

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
      emailPrefixes: ['storage.listing+'],
    });

    // 1. User A
    const userAEmail = `storage.listing+a_${timestamp}@smartfeed.local`;
    createdEmails.push(userAEmail);
    const resA = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: userAEmail,
      password: 'UserPassword123!',
      fullName: 'Storage Listing A',
      role: Role.USER,
    });
    userAToken = resA.body.tokens.accessToken;
    userAId = resA.body.user.id;

    // Grant User A quota to upload
    await prisma.license.updateMany({
      where: { userId: userAId },
      data: {
        maxStorageGb: 10,
        canCloudBackup: true,
        usedStorageBytes: BigInt(0),
      },
    });

    // 2. User B
    const userBEmail = `storage.listing+b_${timestamp}@smartfeed.local`;
    createdEmails.push(userBEmail);
    const resB = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: userBEmail,
      password: 'UserPassword123!',
      fullName: 'Storage Listing B',
      role: Role.USER,
    });
    userBToken = resB.body.tokens.accessToken;

    // 3. Upload and confirm a file for User A
    const presignedRes = await request(app.getHttpServer())
      .post('/api/storage/presigned-url')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        fileName: 'listing_catalog_photo.jpg',
        contentType: 'image/jpeg',
        folder: 'images',
      });

    const confirmRes = await request(app.getHttpServer())
      .post('/api/storage/confirm-upload')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ s3Key: presignedRes.body.s3Key });

    testFileId = confirmRes.body.id;
  });

  afterAll(async () => {
    await cleanDatabase(prisma, {
      userEmails: createdEmails,
      emailPrefixes: ['storage.listing+'],
    });
    await app.close();
  });

  it('GET /api/storage/files - returns paginated file list for authenticated user', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/storage/files?page=1&limit=10')
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('totalPages');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(1);

    const items: StorageFileDto[] = res.body.items;
    const found = items.find((f) => f.id === testFileId);
    expect(found).toBeDefined();
    expect(found?.originalName).toBe('listing_catalog_photo.jpg');
    expect(found?.mimeType).toBe('image/jpeg');
    expect(found?.publicUrl).toBeDefined();
  });

  it('GET /api/storage/files - filters by folder (images vs snapshots)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/storage/files?folder=images')
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);

    const items: StorageFileDto[] = res.body.items;
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items.every((f) => f.s3Key.startsWith('images/'))).toBe(true);
  });

  it('GET /api/storage/files - filters by search term', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/storage/files?search=listing_catalog')
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);

    const items: StorageFileDto[] = res.body.items;
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0].originalName).toContain('listing_catalog');
  });

  it('GET /api/storage/files - enforces tenant isolation (User B does not see User A files)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/storage/files')
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(200);

    const items: StorageFileDto[] = res.body.items;
    const found = items.find((f) => f.id === testFileId);
    expect(found).toBeUndefined();
  });
});
