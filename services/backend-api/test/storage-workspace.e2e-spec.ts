import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '@smartfeed/shared';
import { cleanDatabase } from './utils/teardown.helper';

describe('Storage & Workspace Management (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  let userToken: string;
  const testWorkspaceDir = path.join(os.tmpdir(), `smartfeed_test_workspace_${timestamp}`);
  const migrateTargetDir = path.join(os.tmpdir(), `smartfeed_test_migrated_${timestamp}`);

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
      emailPrefixes: ['storage.test+'],
    });

    // Register test user
    const userEmail = `storage.test+${timestamp}@smartfeed.local`;
    createdEmails.push(userEmail);
    const userRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: userEmail,
      password: 'UserPassword123!',
      fullName: 'Storage Test User',
      role: Role.USER,
    });
    userToken = userRes.body.tokens.accessToken;
  });

  afterAll(async () => {
    // Teardown physical test directories
    if (fs.existsSync(testWorkspaceDir)) {
      fs.rmSync(testWorkspaceDir, { recursive: true, force: true });
    }
    if (fs.existsSync(migrateTargetDir)) {
      fs.rmSync(migrateTargetDir, { recursive: true, force: true });
    }

    await cleanDatabase(prisma, {
      userEmails: createdEmails,
      emailPrefixes: ['storage.test+'],
    });

    await app.close();
  });

  it('1. GET /api/storage/workspace/default-path — should return real system path without ~ literal', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/storage/workspace/default-path')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('defaultPath');
    expect(res.body.defaultPath).toContain('SmartFeedStudioData');
    expect(res.body.defaultPath.startsWith('~')).toBe(false);
  });

  it('2. POST /api/storage/workspace/init — should physically create directories, catalog.db, and workspace.json', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/storage/workspace/init')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        workspacePath: testWorkspaceDir,
        enableEncryption: true,
      })
      .expect(201);

    expect(res.body.workspacePath).toBe(testWorkspaceDir);
    expect(res.body.isInitialized).toBe(true);
    expect(res.body.isEncrypted).toBe(true);

    // Verify disk reality
    expect(fs.existsSync(testWorkspaceDir)).toBe(true);
    expect(fs.existsSync(path.join(testWorkspaceDir, 'database'))).toBe(true);
    expect(fs.existsSync(path.join(testWorkspaceDir, 'database', 'catalog.db'))).toBe(true);
    expect(fs.existsSync(path.join(testWorkspaceDir, 'feeds'))).toBe(true);
    expect(fs.existsSync(path.join(testWorkspaceDir, 'exports'))).toBe(true);
    expect(fs.existsSync(path.join(testWorkspaceDir, 'backups'))).toBe(true);
    expect(fs.existsSync(path.join(testWorkspaceDir, 'logs'))).toBe(true);
    expect(fs.existsSync(path.join(testWorkspaceDir, 'workspace.json'))).toBe(true);
  });

  it('3. GET /api/storage/workspace/info — should return initialized workspace info from disk', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/storage/workspace/info?path=${encodeURIComponent(testWorkspaceDir)}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).not.toBeNull();
    expect(res.body.workspacePath).toBe(testWorkspaceDir);
    expect(res.body.isInitialized).toBe(true);
  });

  it('4. GET /api/storage/workspace/stats — should return real counts (0 products, 0 suppliers, 0 feeds) and accurate byte sizes', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/storage/workspace/stats?path=${encodeURIComponent(testWorkspaceDir)}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.productsCount).toBe(0);
    expect(res.body.suppliersCount).toBe(0);
    expect(res.body.feedsCount).toBe(0);
    expect(res.body.databaseSizeBytes).toBeDefined();
    expect(res.body.feedsSizeBytes).toBe(0);
    expect(res.body.exportsSizeBytes).toBe(0);
    expect(res.body.backupsSizeBytes).toBe(0);
    expect(res.body.totalSizeBytes).toBeDefined();
  });

  it('5. POST /api/storage/workspace/backup — should create a physical .sfdb file in backups folder', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/storage/workspace/backup')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ workspacePath: testWorkspaceDir })
      .expect(201);

    expect(res.body).toHaveProperty('backupPath');
    expect(fs.existsSync(res.body.backupPath)).toBe(true);
  });

  it('6. POST /api/storage/workspace/maintenance — should verify database integrity', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/storage/workspace/maintenance')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ workspacePath: testWorkspaceDir })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.integrityOk).toBe(true);
  });

  it('7. POST /api/storage/workspace/clear-cache — should clear temporary feed files on disk', async () => {
    // Create a dummy cache file in feeds/
    const dummyFeed = path.join(testWorkspaceDir, 'feeds', 'temp_feed.xml');
    fs.writeFileSync(dummyFeed, '<xml>test content</xml>');
    expect(fs.existsSync(dummyFeed)).toBe(true);

    const res = await request(app.getHttpServer())
      .post('/api/storage/workspace/clear-cache')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ workspacePath: testWorkspaceDir })
      .expect(201);

    expect(res.body.bytesFreed).toBeGreaterThan(0);
    expect(res.body.filesRemoved).toBe(1);
    expect(fs.existsSync(dummyFeed)).toBe(false);
  });

  it('8. POST /api/storage/workspace/migrate — should relocate workspace to a new destination folder', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/storage/workspace/migrate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        currentPath: testWorkspaceDir,
        newPath: migrateTargetDir,
        moveExistingData: true,
      })
      .expect(201);

    expect(res.body.workspacePath).toBe(migrateTargetDir);
    expect(fs.existsSync(migrateTargetDir)).toBe(true);
    expect(fs.existsSync(path.join(migrateTargetDir, 'database', 'catalog.db'))).toBe(true);
  });
});
