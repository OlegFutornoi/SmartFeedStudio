import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { Role } from '@smartfeed/shared';
import { cleanDatabase } from '@test/utils/teardown.helper';

describe('Storage Semantic Naming & Orphan Cleanup (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  let userToken: string;
  let userId: string;
  const userEmail = `storage.orphan+${timestamp}@smartfeed.local`;

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
      emailPrefixes: ['storage.orphan+'],
    });

    const res = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: userEmail,
      password: 'UserPassword123!',
      fullName: 'Storage Orphan Tester',
      role: Role.USER,
    });
    userToken = res.body.tokens.accessToken;
    userId = res.body.user.id;

    await prisma.license.updateMany({
      where: { userId },
      data: {
        maxStorageGb: 5,
        canCloudBackup: true,
        usedStorageBytes: BigInt(0),
      },
    });
  });

  afterAll(async () => {
    await cleanDatabase(prisma, {
      emailPrefixes: ['storage.orphan+'],
    });
    await app.close();
  });

  it('generates semantic S3 key starting with human-readable name rather than timestamp', async () => {
    const semanticName = 'websklad_art-10492-chornyi_01.webp';

    const res = await request(app.getHttpServer())
      .post('/api/storage/presigned-url')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        fileName: semanticName,
        contentType: 'image/webp',
        folder: 'images',
      });

    expect(res.status).toBe(201);
    expect(res.body.s3Key).toBeDefined();

    // Verify key format: images/{userId}/websklad_art-10492-chornyi_01_{shortHex}.webp
    const expectedPrefix = `images/${userId}/websklad_art-10492-chornyi_01_`;
    expect(res.body.s3Key.startsWith(expectedPrefix)).toBe(true);
    expect(res.body.s3Key.endsWith('.webp')).toBe(true);

    // Assert that the timestamp is NOT prepended at the start of the filename
    expect(res.body.s3Key).not.toMatch(new RegExp(`images/${userId}/\\d{13}-`));
  });

  it('runs orphan cleanup in dry-run mode and reports orphan statistics without deletion', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/storage/cleanup-orphans')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        dryRun: true,
        folder: 'images',
      });

    expect(res.status).toBe(201);
    expect(res.body.dryRun).toBe(true);
    expect(typeof res.body.orphanCount).toBe('number');
    expect(typeof res.body.orphanSizeBytes).toBe('number');
    expect(res.body.freedBytes).toBe(0);
    expect(Array.isArray(res.body.deletedKeys)).toBe(true);
  });

  it('executes orphan cleanup purge in live mode and reclaims space', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/storage/cleanup-orphans')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        dryRun: false,
        folder: 'images',
      });

    expect(res.status).toBe(201);
    expect(res.body.dryRun).toBe(false);
    expect(typeof res.body.orphanCount).toBe('number');
    expect(typeof res.body.freedBytes).toBe('number');
    expect(Array.isArray(res.body.deletedKeys)).toBe(true);
  });

  it('detects and purges registered storage files not present in activeKeys and recalibrates quota', async () => {
    const abandonedKey = `images/${userId}/abandoned_feed_photo_01.webp`;
    await prisma.storageFile.create({
      data: {
        userId,
        bucketName: 'smartfeed-test',
        s3Key: abandonedKey,
        publicUrl: `https://test.cdn/${abandonedKey}`,
        originalName: 'abandoned_feed_photo_01.webp',
        mimeType: 'image/webp',
        sizeBytes: BigInt(204800),
        status: 'ACTIVE',
        category: 'PRODUCT_IMAGE',
      },
    });

    await prisma.license.updateMany({
      where: { userId, isActive: true },
      data: { usedStorageBytes: BigInt(204800) },
    });

    // 1. Dry run with activeKeys = [] (feed was deleted, 0 products in catalog)
    const dryRes = await request(app.getHttpServer())
      .post('/api/storage/cleanup-orphans')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        dryRun: true,
        folder: 'images',
        activeKeys: [],
      });

    expect(dryRes.status).toBe(201);
    expect(dryRes.body.orphanCount).toBeGreaterThanOrEqual(1);
    expect(dryRes.body.deletedKeys).toContain(abandonedKey);

    // 2. Live purge
    const purgeRes = await request(app.getHttpServer())
      .post('/api/storage/cleanup-orphans')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        dryRun: false,
        folder: 'images',
        activeKeys: [],
      });

    expect(purgeRes.status).toBe(201);
    expect(purgeRes.body.deletedKeys).toContain(abandonedKey);

    // 3. Assert DB record was purged and license quota recalibrated
    const deletedRecord = await prisma.storageFile.findUnique({
      where: { s3Key: abandonedKey },
    });
    expect(deletedRecord).toBeNull();

    const license = await prisma.license.findFirst({
      where: { userId, isActive: true },
    });
    expect(license?.usedStorageBytes).toBe(BigInt(0));
  });
});
