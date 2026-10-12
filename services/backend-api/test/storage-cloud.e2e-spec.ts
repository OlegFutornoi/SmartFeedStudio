import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { Role, StorageFileCategory, StorageFileStatus } from '@smartfeed/shared';
import { cleanDatabase } from '@test/utils/teardown.helper';

describe('Cloudflare R2 Cloud Storage & Security Defense (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  let userAToken: string;
  let userAId: string;
  let userBToken: string;
  let userBId: string;

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
      emailPrefixes: ['storage.cloud+'],
    });

    // 1. Create User A (Tenant A)
    const userAEmail = `storage.cloud+a_${timestamp}@smartfeed.local`;
    createdEmails.push(userAEmail);
    const resA = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: userAEmail,
      password: 'UserPassword123!',
      fullName: 'Storage User A',
      role: Role.USER,
    });
    userAToken = resA.body.tokens.accessToken;
    userAId = resA.body.user.id;

    // 2. Create User B (Tenant B)
    const userBEmail = `storage.cloud+b_${timestamp}@smartfeed.local`;
    createdEmails.push(userBEmail);
    const resB = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: userBEmail,
      password: 'UserPassword123!',
      fullName: 'Storage User B',
      role: Role.USER,
    });
    userBToken = resB.body.tokens.accessToken;
    userBId = resB.body.user.id;
  });

  afterAll(async () => {
    await cleanDatabase(prisma, {
      userEmails: createdEmails,
      emailPrefixes: ['storage.cloud+'],
    });
    await app.close();
  });

  describe('1. Storage Quotas & Tariff Gating', () => {
    it('GET /api/storage/quota - returns initial quota stats for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/storage/quota')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('canCloudStorage');
      expect(res.body).toHaveProperty('maxStorageGb');
      expect(res.body).toHaveProperty('usedStorageBytes');
      expect(res.body).toHaveProperty('availableBytes');
      expect(res.body).toHaveProperty('usedPercentage');
      expect(res.body).toHaveProperty('totalFilesCount');
    });

    it('POST /api/storage/presigned-url - blocks starter user with 0GB quota (Layer 2 Defense)', async () => {
      // Ensure User A license has 0 GB and cannot use cloud backup
      await prisma.license.updateMany({
        where: { userId: userAId },
        data: {
          maxStorageGb: 0,
          canCloudBackup: false,
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/storage/presigned-url')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          fileName: 'catalog-image.webp',
          contentType: 'image/webp',
          folder: 'images',
        })
        .expect(403);

      expect(res.body.message).toContain('STORAGE_ACCESS_REQUIRED');
    });

    it('POST /api/storage/presigned-url - grants upload URL when user has PRO storage quota', async () => {
      // Grant User A 5 GB cloud storage quota
      await prisma.license.updateMany({
        where: { userId: userAId },
        data: {
          maxStorageGb: 5,
          canCloudBackup: true,
          usedStorageBytes: BigInt(0),
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/storage/presigned-url')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          fileName: 'product_photo.jpg',
          contentType: 'image/jpeg',
          folder: 'images',
        })
        .expect(201);

      expect(res.body).toHaveProperty('uploadUrl');
      expect(res.body).toHaveProperty('s3Key');
      expect(res.body).toHaveProperty('publicUrl');
      expect(res.body).toHaveProperty('expiresInSeconds');
      expect(res.body.s3Key).toContain(`images/${userAId}/`);

      // Verify PENDING_UPLOAD record was created in database
      const pendingRecord = await prisma.storageFile.findUnique({
        where: { s3Key: res.body.s3Key },
      });
      expect(pendingRecord).toBeDefined();
      expect(pendingRecord?.status).toBe(StorageFileStatus.PENDING_UPLOAD);
      expect(pendingRecord?.userId).toBe(userAId);
    });
  });

  describe('2. Security & Penetration Hardening', () => {
    it('POST /api/storage/presigned-url - rejects unsafe content type (CWE-434)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/storage/presigned-url')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          fileName: 'malware.exe',
          contentType: 'application/x-msdownload',
        })
        .expect(400);

      expect(res.body.message).toContain('Unsupported or unsafe Content-Type');
    });

    it('POST /api/storage/confirm-upload - rejects path traversal in s3Key (CWE-22)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/storage/confirm-upload')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          s3Key: '../../etc/passwd',
        })
        .expect(400);

      expect(res.body.message).toContain('path traversal');
    });

    it('POST /api/storage/confirm-upload - rejects cross-tenant confirmation (BOLA/IDOR defense)', async () => {
      // User A attempts to confirm a file path belonging to User B
      const fakeUserBKey = `images/${userBId}/123456-secret-photo.jpg`;

      const res = await request(app.getHttpServer())
        .post('/api/storage/confirm-upload')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          s3Key: fakeUserBKey,
        })
        .expect(403);

      expect(res.body.message).toContain('You cannot confirm files outside your tenant workspace');
    });
  });

  describe('3. Upload Confirmation, Quotas & Idempotency', () => {
    let testS3Key: string;

    beforeEach(async () => {
      const presignedRes = await request(app.getHttpServer())
        .post('/api/storage/presigned-url')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          fileName: 'camera_sample.webp',
          contentType: 'image/webp',
          folder: 'images',
        });
      testS3Key = presignedRes.body.s3Key;
    });

    it('POST /api/storage/confirm-upload - confirms upload, sets ACTIVE, and updates quota', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/storage/confirm-upload')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          s3Key: testS3Key,
          category: StorageFileCategory.PRODUCT_IMAGE,
          originalName: 'camera_sample.webp',
          width: 800,
          height: 600,
        })
        .expect(201);

      expect(res.body.s3Key).toBe(testS3Key);
      expect(res.body.status).toBe(StorageFileStatus.ACTIVE);
      expect(res.body.userId).toBe(userAId);

      // Verify License quota was incremented
      const license = await prisma.license.findFirst({
        where: { userId: userAId, isActive: true },
      });
      expect(license?.usedStorageBytes).toBeGreaterThan(BigInt(0));
    });

    it('POST /api/storage/confirm-upload - idempotent: does not duplicate quota on repeat calls', async () => {
      // First confirmation
      await request(app.getHttpServer())
        .post('/api/storage/confirm-upload')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ s3Key: testS3Key })
        .expect(201);

      const licenseAfterFirst = await prisma.license.findFirst({
        where: { userId: userAId, isActive: true },
      });
      const firstUsage = licenseAfterFirst?.usedStorageBytes || BigInt(0);

      // Second identical confirmation
      await request(app.getHttpServer())
        .post('/api/storage/confirm-upload')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ s3Key: testS3Key })
        .expect(201);

      const licenseAfterSecond = await prisma.license.findFirst({
        where: { userId: userAId, isActive: true },
      });
      const secondUsage = licenseAfterSecond?.usedStorageBytes || BigInt(0);

      // Usage MUST remain exactly identical (zero quota skew!)
      expect(secondUsage).toBe(firstUsage);
    });

    it('POST /api/storage/confirm-upload - blocks upload if quota exceeded (Layer 2 Defense)', async () => {
      // Set User A's usedStorageBytes equal to maxStorageBytes (quota exhausted)
      const maxBytes = BigInt(5 * 1024 * 1024 * 1024);
      await prisma.license.updateMany({
        where: { userId: userAId },
        data: {
          usedStorageBytes: maxBytes,
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/storage/confirm-upload')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ s3Key: testS3Key })
        .expect(403);

      expect(res.body.message).toContain('STORAGE_QUOTA_EXCEEDED');
    });
  });

  describe('4. File Deletion & Tenant Boundary Protection', () => {
    let createdFileId: string;

    beforeEach(async () => {
      // Reset User A quota to 0 bytes
      await prisma.license.updateMany({
        where: { userId: userAId },
        data: {
          maxStorageGb: 5,
          usedStorageBytes: BigInt(0),
        },
      });

      const presignedRes = await request(app.getHttpServer())
        .post('/api/storage/presigned-url')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          fileName: 'to_delete.png',
          contentType: 'image/png',
          folder: 'images',
        });

      const confirmRes = await request(app.getHttpServer())
        .post('/api/storage/confirm-upload')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ s3Key: presignedRes.body.s3Key });

      createdFileId = confirmRes.body.id;
    });

    it('DELETE /api/storage/files/:id - blocks cross-tenant deletion by User B (BOLA Protection)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/storage/files/${createdFileId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(403);

      expect(res.body.message).toContain('You do not have permission to delete this file');
    });

    it('DELETE /api/storage/files/:id - successfully deletes owned file and frees quota', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/storage/files/${createdFileId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.freedBytes).toBeGreaterThanOrEqual(0);

      // Verify file is removed from DB
      const fileRecord = await prisma.storageFile.findUnique({
        where: { id: createdFileId },
      });
      expect(fileRecord).toBeNull();
    });

    it('DELETE /api/storage/files/:id - returns 404 for nonexistent file ID', async () => {
      await request(app.getHttpServer())
        .delete('/api/storage/files/nonexistent_file_id_123')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(404);
    });
  });
});
