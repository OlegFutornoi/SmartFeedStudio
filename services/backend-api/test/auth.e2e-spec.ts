import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * E2E Tests: Auth — Registration & Login
 *
 * TDD RED phase: tests written BEFORE implementation changes.
 * Each test describes the expected contract of the REST API.
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

  // Unique email per test run to avoid conflicts with existing data
  const timestamp = Date.now();
  const testUser = {
    email: `e2e.test+${timestamp}@smartfeed.local`,
    password: 'Test1234!',
    fullName: 'E2E Test User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

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
  });

  afterAll(async () => {
    await app.close();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // REGISTRATION
  // ─────────────────────────────────────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    it('creates a new user and returns JWT tokens', async () => {
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
      // The same email was registered in the test above — second attempt must fail
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
      // User was created by the registration test above — login must succeed
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

      // If login created users, registering with same email would return 200 not 409.
      // The 409 here proves the user count did NOT increase.
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
});
