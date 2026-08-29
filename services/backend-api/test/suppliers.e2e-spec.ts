import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '@smartfeed/shared';
import { cleanDatabase } from './utils/teardown.helper';

describe('Suppliers Management (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  let userToken: string;
  let otherUserToken: string;
  let createdSupplierId: string;

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
      emailPrefixes: ['supplier.test+', 'other.sup+'],
    });

    // 1. Register main test user
    const userEmail = `supplier.test+${timestamp}@smartfeed.local`;
    createdEmails.push(userEmail);
    const userRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: userEmail,
      password: 'UserPassword123!',
      fullName: 'Supplier Test User',
      role: Role.USER,
    });
    userToken = userRes.body.tokens.accessToken;

    // 2. Register other user for tenant isolation tests
    const otherEmail = `other.sup+${timestamp}@smartfeed.local`;
    createdEmails.push(otherEmail);
    const otherRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: otherEmail,
      password: 'OtherPassword123!',
      fullName: 'Other Supplier User',
      role: Role.USER,
    });
    otherUserToken = otherRes.body.tokens.accessToken;
  });

  afterAll(async () => {
    await cleanDatabase(prisma, {
      userEmails: createdEmails,
      emailPrefixes: ['supplier.test+', 'other.sup+'],
    });
    await app.close();
  });

  describe('POST /api/suppliers', () => {
    it('should create a new supplier with markup rules successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Постачальник Одяг-Опт',
          code: 'SUP-CLOTH-01',
          contactPhone: '+380501234567',
          contactEmail: 'sales@cloth-opt.ua',
          website: 'https://cloth-opt.ua',
          notes: 'Прямий імпортер трикотажу',
          defaultMarginPercent: 20,
          defaultFixedMarkup: 50,
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Постачальник Одяг-Опт');
      expect(res.body.code).toBe('SUP-CLOTH-01');
      expect(res.body.defaultMarginPercent).toBe(20);
      expect(res.body.defaultFixedMarkup).toBe(50);
      expect(res.body.isActive).toBe(true);

      createdSupplierId = res.body.id;
    });

    it('should reject duplicate supplier code for the same user with 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Дублікат постачальника',
          code: 'SUP-CLOTH-01',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });

    it('should allow another user to use the same supplier code (Tenant Isolation)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          name: 'Постачальник іншого юзера',
          code: 'SUP-CLOTH-01',
        });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe('SUP-CLOTH-01');
    });
  });

  describe('GET /api/suppliers', () => {
    it('should return list of suppliers for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/suppliers')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body.some((s: any) => s.id === createdSupplierId)).toBe(true);
    });

    it('should filter suppliers by search term', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/suppliers?search=Одяг')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toContain('Одяг');
    });
  });

  describe('GET /api/suppliers/:id', () => {
    it('should return supplier details by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/suppliers/${createdSupplierId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdSupplierId);
      expect(res.body.name).toBe('Постачальник Одяг-Опт');
    });

    it('should return 404 for other user attempting to access supplier', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/suppliers/${createdSupplierId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/suppliers/:id', () => {
    it('should update supplier markup and details', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/suppliers/${createdSupplierId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Постачальник Одяг-Опт (Оновлено)',
          defaultMarginPercent: 25,
          defaultFixedMarkup: 100,
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Постачальник Одяг-Опт (Оновлено)');
      expect(res.body.defaultMarginPercent).toBe(25);
      expect(res.body.defaultFixedMarkup).toBe(100);
    });
  });

  describe('DELETE /api/suppliers/:id', () => {
    it('should delete supplier successfully', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/suppliers/${createdSupplierId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });

      // Verify deletion
      const verifyRes = await request(app.getHttpServer())
        .get(`/api/suppliers/${createdSupplierId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(verifyRes.status).toBe(404);
    });
  });
});
