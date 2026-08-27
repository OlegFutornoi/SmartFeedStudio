import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanDatabase } from './utils/teardown.helper';

/**

 * E2E Tests: Auth — Password Recovery Flow (Forgot Password & Reset Password)
 *
 * TDD: tests written to cover the full recovery lifecycle.
 * Cleanup: afterAll deletes every user created during this test run.
 *
 * Endpoints under test:
 * - POST /api/auth/forgot-password
 * - POST /api/auth/reset-password
 * - POST /api/auth/login (validation of credential rotation)
 */
describe('Auth — Password Recovery (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  const testUser = {
    email: `pw-recovery+${timestamp}@smartfeed.local`,
    password: 'InitialPassword123!',
    fullName: 'Password Recovery Tester',
  };

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
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();

    await cleanDatabase(prisma, {
      emailPrefixes: ['pwreset-', 'pw-recovery+', 'pw-reset+'],
    });

    // Register primary test user
    createdEmails.push(testUser.email);
    await request(app.getHttpServer()).post('/api/auth/register').send(testUser).expect(201);
  });

  afterAll(async () => {
    // ── MANDATORY 100% TEST DATA TEARDOWN ─────────────────────────────────────
    await cleanDatabase(prisma, {
      userEmails: createdEmails,
      emailPrefixes: ['pwreset-', 'pw-recovery+', 'pw-reset+'],
    });
    // ─────────────────────────────────────────────────────────────────────────

    await app.close();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // FORGOT PASSWORD
  // ─────────────────────────────────────────────────────────────────────────────

  describe('POST /api/auth/forgot-password', () => {
    it('returns 200 and a valid resetToken for an existing registered email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBeDefined();
      expect(typeof res.body.resetToken).toBe('string');
      expect(res.body.resetToken.length).toBeGreaterThan(20);
    });

    it('returns 200 without exposing user non-existence for unregistered email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: `nonexistent-${timestamp}@smartfeed.local` })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBeDefined();
      expect(res.body.resetToken).toBeUndefined();
    });

    it('returns 400 Bad Request for an invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email-format' })
        .expect(400);
    });

    it('returns 400 Bad Request when email is missing', async () => {
      await request(app.getHttpServer()).post('/api/auth/forgot-password').send({}).expect(400);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // RESET PASSWORD
  // ─────────────────────────────────────────────────────────────────────────────

  describe('POST /api/auth/reset-password', () => {
    let validResetToken: string;
    const newPassword = 'BrandNewSecurePassword456!';

    beforeAll(async () => {
      const forgotRes = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      validResetToken = forgotRes.body.resetToken;
    });

    it('returns 400 Bad Request when password is shorter than 8 characters', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: validResetToken,
          newPassword: 'short',
        })
        .expect(400);
    });

    it('returns 400 Bad Request when token is invalid or tampered', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid.tampered.jwt-token',
          newPassword,
        })
        .expect(400);
    });

    it('returns 400 Bad Request when token is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          newPassword,
        })
        .expect(400);
    });

    it('successfully resets password with valid token and allows login with new password', async () => {
      // 1. Reset password
      const resetRes = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: validResetToken,
          newPassword,
        })
        .expect(200);

      expect(resetRes.body.success).toBe(true);
      expect(resetRes.body.message).toBeDefined();

      // 2. Verify login with old password fails (401)
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(401);

      // 3. Verify login with new password succeeds (200)
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: newPassword,
        })
        .expect(200);

      expect(loginRes.body.tokens).toBeDefined();
      expect(loginRes.body.tokens.accessToken).toBeDefined();
      expect(loginRes.body.user.email).toBe(testUser.email);
    });
  });
});
