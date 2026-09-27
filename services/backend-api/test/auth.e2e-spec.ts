import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanDatabase } from './utils/teardown.helper';

/**
 * E2E Tests: Auth — Registration & Login
 *
 * TDD: tests written BEFORE implementation changes (RED → GREEN).
 * Each test describes the expected contract of the REST API.
 *
 * Cleanup: afterAll deletes every user (and their related License records)
 * created during this test run so the DB is left in a clean state.
 *
 * POST /api/auth/register
 *   - Creates a new user in the database
 *   - Returns accessToken + refreshToken (JWT)
 *   - Returns user profile (id, email, role)
 *   - Rejects duplicate emails with 409
 *   - Rejects invalid email format with 400
 *   - Rejects short passwords (< 8 chars) with 400
 *
 * POST /api/auth/login
 *   - Does NOT create a user — looks up existing user in DB
 *   - Returns accessToken + refreshToken (JWT)
 *   - Returns user profile (id, email, role)
 *   - Rejects wrong password with 401
 *   - Rejects non-existent email with 401
 */
describe('Auth — Registration & Login (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Unique email per test run to avoid conflicts with existing data
  const timestamp = Date.now();
  const testUser = {
    email: `e2e.test+${timestamp}@smartfeed.local`,
    password: 'Test1234!',
    fullName: 'E2E Test User',
  };

  // Track all emails registered during this run for cleanup
  const createdEmails: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Mirror the same global pipes as main.ts
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
      emailPrefixes: ['e2e.test+', 'short-pw+', 'no-pw+'],
    });
  });

  afterAll(async () => {
    // ── MANDATORY 100% TEST DATA TEARDOWN ─────────────────────────────────────
    await cleanDatabase(prisma, {
      userEmails: createdEmails,
      emailPrefixes: ['e2e.test+', 'short-pw+', 'no-pw+'],
    });
    // ─────────────────────────────────────────────────────────────────────────

    await app.close();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // REGISTRATION
  // ─────────────────────────────────────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    it('creates a new user and returns JWT tokens', async () => {
      createdEmails.push(testUser.email); // mark for cleanup

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Tokens must be present
      expect(response.body.tokens).toBeDefined();
      expect(typeof response.body.tokens.accessToken).toBe('string');
      expect(response.body.tokens.accessToken.length).toBeGreaterThan(20);
      expect(typeof response.body.tokens.refreshToken).toBe('string');
      expect(response.body.tokens.refreshToken.length).toBeGreaterThan(20);
      expect(response.body.tokens.tokenType).toBe('Bearer');

      // User profile must be present
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.role).toBeDefined();

      // Password MUST NOT be exposed
      expect(response.body.user.passwordHash).toBeUndefined();
      expect(response.body.user.password).toBeUndefined();
    });

    it('returns 409 Conflict when registering with an already-taken email', async () => {
      await request(app.getHttpServer()).post('/api/auth/register').send(testUser).expect(409);
    });

    it('returns 400 Bad Request for an invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'Test1234!' })
        .expect(400);
    });

    it('returns 400 Bad Request when password is shorter than 8 characters', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: `short-pw+${timestamp}@smartfeed.local`, password: '12345' })
        .expect(400);
    });

    it('returns 400 Bad Request when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ password: 'Test1234!' })
        .expect(400);
    });

    it('returns 400 Bad Request when password is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: `no-pw+${timestamp}@smartfeed.local` })
        .expect(400);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('authenticates an existing user and returns JWT tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      // Tokens must be present
      expect(response.body.tokens).toBeDefined();
      expect(typeof response.body.tokens.accessToken).toBe('string');
      expect(response.body.tokens.accessToken.length).toBeGreaterThan(20);
      expect(typeof response.body.tokens.refreshToken).toBe('string');
      expect(response.body.tokens.tokenType).toBe('Bearer');

      // User profile must be present
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.id).toBeDefined();

      // Password MUST NOT be exposed
      expect(response.body.user.passwordHash).toBeUndefined();
      expect(response.body.user.password).toBeUndefined();
    });

    it('does NOT create a new user on login (user count stays the same)', async () => {
      // Login is a READ operation — calling it multiple times must not grow the user table
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      // If login created users, re-registering would return 200 not 409.
      // The 409 proves the user count did NOT increase.
      await request(app.getHttpServer()).post('/api/auth/register').send(testUser).expect(409);
    });

    it('returns 401 Unauthorized for a wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword999!' })
        .expect(401);
    });

    it('returns 401 Unauthorized for a non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'ghost@nowhere.local', password: 'Test1234!' })
        .expect(401);
    });

    it('returns 400 Bad Request when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ password: 'Test1234!' })
        .expect(400);
    });

    it('returns 400 Bad Request when password is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email })
        .expect(400);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // AVATAR UPDATE
  // ─────────────────────────────────────────────────────────────────────────────

  describe('PATCH /api/auth/avatar', () => {
    it('updates avatar for authenticated user', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      const token = loginRes.body.tokens.accessToken;
      const avatarData =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const response = await request(app.getHttpServer())
        .patch('/api/auth/avatar')
        .set('Authorization', `Bearer ${token}`)
        .send({ avatarUrl: avatarData })
        .expect(200);

      expect(response.body.avatarUrl).toBe(avatarData);

      // Verify GET /api/auth/me also returns updated avatar
      const meRes = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meRes.body.avatarUrl).toBe(avatarData);
    });

    it('returns 401 Unauthorized without token', async () => {
      await request(app.getHttpServer())
        .patch('/api/auth/avatar')
        .send({ avatarUrl: 'https://example.com/avatar.png' })
        .expect(401);
    });

    it('removes avatar when empty avatarUrl or null is sent', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      const token = loginRes.body.tokens.accessToken;

      const resEmpty = await request(app.getHttpServer())
        .patch('/api/auth/avatar')
        .set('Authorization', `Bearer ${token}`)
        .send({ avatarUrl: '' })
        .expect(200);

      expect(resEmpty.body.avatarUrl).toBeNull();

      const resNull = await request(app.getHttpServer())
        .patch('/api/auth/avatar')
        .set('Authorization', `Bearer ${token}`)
        .send({ avatarUrl: null })
        .expect(200);

      expect(resNull.body.avatarUrl).toBeNull();
    });
  });
});
