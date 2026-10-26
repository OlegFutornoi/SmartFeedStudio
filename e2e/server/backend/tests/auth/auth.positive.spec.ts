/**
 * @fileoverview Auth API Positive Lifecycle & Integration Scenarios
 *
 * ARCHITECTURAL DEFENSE LAYERS:
 * 1. Status Code Defense: Strictly 2xx status assertions (200 OK, 201 Created); non-500 crash guard.
 * 2. Protocol Integrity: Content-Type application/json; X-Content-Type-Options: nosniff validation.
 * 3. Contract & Data Parity: Runtime Zod contract schema validation against AuthResponseSchema & UserProfileSchema.
 * 4. Business Parity: Verification of generated JWT tokens, user role (USER), and Unicode name persistence.
 */

import { test, expect } from '@playwright/test';
import { AuthClient } from '@/server/backend/clients/auth.client';
import { urls } from '@/config/urls';
import { assertSuccessResponse } from '@/core/assertions/response.assertions';
import { AuthResponseSchema, UserProfileSchema } from '@/core/contracts/schemas';

test.describe('Auth API Positive Lifecycle Tests (Strictly 2xx Responses)', () => {
  let authClient: AuthClient;

  test.beforeEach(async ({ request }) => {
    authClient = new AuthClient(request, urls.server.api);
  });

  test('TC-AUTH-00-01: Легітимна реєстрація нового користувача з валідними даними повинна повертати 201 Created', async () => {
    const timestamp = Date.now();
    const email = `e2e.user.${timestamp}@smartfeed.local`;
    const password = 'ValidPassword123!';
    const fullName = 'Олег Тестовий';

    const { response, data } = await authClient.register({
      email,
      password,
      fullName,
    });

    // 4-Layer Response Verification: strictly 201 Created + AuthResponseSchema
    const registered = assertSuccessResponse(response, data, 201, AuthResponseSchema, {
      method: 'POST',
      endpoint: '/api/auth/register',
    });

    expect(registered.user.email).toBe(email);
    expect(registered.user.role).toBe('USER');
    expect(registered.user.fullName).toBe(fullName);
    expect(registered.tokens.tokenType).toBe('Bearer');
    expect(registered.tokens.accessToken.length).toBeGreaterThan(10);
  });

  test('TC-AUTH-00-02: Легітимний вхід за паролем (POST /api/auth/login) повинен повертати 200 OK', async () => {
    const timestamp = Date.now();
    const email = `e2e.login.${timestamp}@smartfeed.local`;
    const password = 'LoginPassword123!';

    // Provision user
    await authClient.register({
      email,
      password,
      fullName: 'Login User',
    });

    // Authenticate
    const { response, data } = await authClient.login(email, password);
    const authData = assertSuccessResponse(response, data, 200, AuthResponseSchema, {
      method: 'POST',
      endpoint: '/api/auth/login',
    });

    expect(authData.user.email).toBe(email);
    expect(authData.user.role).toBe('USER');
    expect(authData.tokens.accessToken).toBeTruthy();
  });

  test('TC-AUTH-00-03: Отримання профілю поточного користувача (GET /api/auth/me) повинно повертати 200 OK', async () => {
    const timestamp = Date.now();
    const email = `e2e.profile.${timestamp}@smartfeed.local`;
    const password = 'ProfilePassword123!';

    // Provision and authenticate
    const regRes = await authClient.register({
      email,
      password,
      fullName: 'Profile User',
    });
    const token = regRes.data?.tokens?.accessToken || '';
    authClient.setAuthToken(token);

    // Fetch profile
    const { response, data } = await authClient.getMe();
    const profile = assertSuccessResponse(response, data, 200, UserProfileSchema, {
      method: 'GET',
      endpoint: '/api/auth/me',
    });

    expect(profile.email).toBe(email);
    expect(profile.role).toBe('USER');
  });

  test('TC-AUTH-00-04: Реєстрація з допустимими складними Unicode / українськими символами в імені (201 Created)', async () => {
    const timestamp = Date.now();
    const email = `e2e.unicode.${timestamp}@smartfeed.local`;
    const password = 'UnicodePassword123!';
    const fullName = "Дмитро О'Браєн-Ковальчук";

    const { response, data } = await authClient.register({
      email,
      password,
      fullName,
    });

    const registered = assertSuccessResponse(response, data, 201, AuthResponseSchema, {
      method: 'POST',
      endpoint: '/api/auth/register',
    });

    expect(registered.user.fullName).toBe(fullName);
    expect(registered.user.role).toBe('USER');
  });
});
