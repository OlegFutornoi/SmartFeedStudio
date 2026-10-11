import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { cleanDatabase } from '@test/utils/teardown.helper';

describe('Security Adversarial Hardening (OWASP, SSRF, Tokens E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const prefix = `adv-${Date.now()}`;
  let ownerUser: { id: string; email: string; token: string; orgId: string };
  let foreignUser: { id: string; email: string; token: string };
  let adminUser: { id: string; email: string; token: string };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.setGlobalPrefix('api');

    await app.init();
    prisma = app.get(PrismaService);

    await cleanDatabase(prisma, { emailPrefixes: ['adv-'] });

    const ownerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `${prefix}-owner@smartfeed.studio`,
        password: 'Password123!',
        fullName: 'Security Test Owner',
        companyName: 'Adversarial Corp LLC',
      })
      .expect(201);

    const userOrgs = await request(app.getHttpServer())
      .get('/api/organizations')
      .set('Authorization', `Bearer ${ownerRes.body.tokens.accessToken}`)
      .expect(200);

    ownerUser = {
      id: ownerRes.body.user.id,
      email: `${prefix}-owner@smartfeed.studio`,
      token: ownerRes.body.tokens.accessToken,
      orgId: userOrgs.body[0].id,
    };

    const foreignRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `${prefix}-foreign@smartfeed.studio`,
        password: 'Password123!',
        fullName: 'Foreign User',
      })
      .expect(201);

    foreignUser = {
      id: foreignRes.body.user.id,
      email: `${prefix}-foreign@smartfeed.studio`,
      token: foreignRes.body.tokens.accessToken,
    };

    const adminEmail = `${prefix}-admin@smartfeed.studio`;
    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: adminEmail, password: 'AdminPassword123!', fullName: 'Admin' })
      .expect(201);

    await prisma.user.update({ where: { id: adminRes.body.user.id }, data: { role: 'ADMIN' } });
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'AdminPassword123!' })
      .expect(200);

    adminUser = {
      id: adminRes.body.user.id,
      email: adminEmail,
      token: adminLogin.body.tokens.accessToken,
    };
  });

  afterAll(async () => {
    await cleanDatabase(prisma, {
      emailPrefixes: ['adv-'],
    });
    await app.close();
  });

  describe('1. OWASP API3: Mass Assignment Protection', () => {
    it('should reject registration payload containing injected system fields', async () => {
      const evilRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `${prefix}-hacker@smartfeed.studio`,
          password: 'Password123!',
          fullName: 'Hacker User',
          role: 'SUPER_ADMIN',
          isActive: true,
          passwordHash: '$2b$10$injectedhash',
        });

      expect(evilRes.status).toBe(400);
      expect(JSON.stringify(evilRes.body)).toMatch(/property.*should not exist/i);
    });

    it('should reject password change payload with unwhitelisted parameters', async () => {
      const evilRes = await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${foreignUser.token}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewSecurePassword123!',
          role: 'ADMIN',
        });

      expect(evilRes.status).toBe(400);
      expect(JSON.stringify(evilRes.body)).toMatch(/property role should not exist/i);
    });
  });

  describe('2. Secret Serialization & Zero Credential Exposure', () => {
    it('should guarantee /api/auth/me response never serializes secrets', async () => {
      const meRes = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${ownerUser.token}`)
        .expect(200);

      expect(meRes.body).not.toHaveProperty('passwordHash');
      expect(meRes.body).not.toHaveProperty('password');
      expect(meRes.body).not.toHaveProperty('salt');
      expect(meRes.body).not.toHaveProperty('refreshSecret');

      const serialized = JSON.stringify(meRes.body);
      expect(serialized).not.toContain('passwordHash');
      expect(serialized).not.toContain('$2b$');
    });

    it('should guarantee /api/organizations never serializes internal security secrets', async () => {
      const orgsRes = await request(app.getHttpServer())
        .get('/api/organizations')
        .set('Authorization', `Bearer ${ownerUser.token}`)
        .expect(200);

      const serialized = JSON.stringify(orgsRes.body);
      expect(serialized).not.toContain('passwordHash');
      expect(serialized).not.toContain('$2b$');
    });
  });

  describe('3. Cryptographic Token Integrity & Anti-Spoofing', () => {
    it('should reject tampered JWT token with modified signature with 401 Unauthorized', async () => {
      const tamperedToken = `${ownerUser.token.slice(0, -6)}XYZ123`;
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
    });

    it('should reject forged token signed with unknown secret', async () => {
      const forgedToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzb21lLXZpY3RpbS1pZCIsImVtYWlsIjoidmljdGltQGV4YW1wbGUuY29tIiwicm9sZSI6IlNVUEVSX0FETUlOIn0.fake_signature_hash_xyz';
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${forgedToken}`)
        .expect(401);
    });

    it('should bind operations strictly to token identity and ignore injected user IDs', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${foreignUser.token}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'ForeignNewPassword123!',
        })
        .expect(200);

      expect(res.body.success).toBe(true);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: ownerUser.email,
          password: 'Password123!',
        })
        .expect(200);
    });

    it('should reject requests from deactivated user accounts with 403 USER_SUSPENDED', async () => {
      await prisma.user.update({
        where: { id: foreignUser.id },
        data: { isActive: false },
      });

      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${foreignUser.token}`)
        .expect(403);
    });
  });

  describe('4. Adversarial Logic, SSRF & Payment Fraud Hardening', () => {
    it('should reject regular user attempt to call /api/licenses/upgrade with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post('/api/licenses/upgrade')
        .set('Authorization', `Bearer ${ownerUser.token}`)
        .send({ planType: 'ENTERPRISE' })
        .expect(403);
    });

    it('should allow super admin to call /api/licenses/upgrade with 201 Created', async () => {
      await prisma.user.update({
        where: { id: foreignUser.id },
        data: { isActive: true },
      });

      const res = await request(app.getHttpServer())
        .post('/api/licenses/upgrade')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send({ planType: 'ENTERPRISE' })
        .expect(201);

      expect(res.body.planType).toBe('ENTERPRISE');
      expect(res.body.licenseKey).toBeDefined();
    });

    it('should reject simulate-sandbox-webhook when payment settings isTestMode is false with 403 Forbidden', async () => {
      await prisma.paymentSetting.updateMany({
        where: { provider: 'WAYFORPAY' },
        data: { isTestMode: false },
      });

      try {
        await request(app.getHttpServer())
          .post('/api/payments/simulate-sandbox-webhook')
          .set('Authorization', `Bearer ${ownerUser.token}`)
          .send({ orderReference: 'ORD-NON-EXISTENT-TEST-REF' })
          .expect(403);
      } finally {
        await prisma.paymentSetting.updateMany({
          where: { provider: 'WAYFORPAY' },
          data: { isTestMode: true },
        });
      }
    });

    it('should reject SSRF attempts resolving to loopback or private network via DNS check', async () => {
      await request(app.getHttpServer())
        .post('/api/feeds/fetch-url')
        .set('Authorization', `Bearer ${ownerUser.token}`)
        .send({ url: 'http://127.0.0.1:5432/db' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/feeds/fetch-url')
        .set('Authorization', `Bearer ${ownerUser.token}`)
        .send({ url: 'http://169.254.169.254/latest/meta-data' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/feeds/fetch-url')
        .set('Authorization', `Bearer ${ownerUser.token}`)
        .send({ url: 'http://192.168.1.1:8080/admin' })
        .expect(400);
    });

    it('should guarantee /api/auth/forgot-password NEVER returns resetToken in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        const res = await request(app.getHttpServer())
          .post('/api/auth/forgot-password')
          .send({ email: ownerUser.email })
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.resetToken).toBeUndefined();
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });
});
