/**
 * @fileoverview Auth API Negative Boundary & Attack Security Audits
 *
 * ARCHITECTURAL DEFENSE LAYERS:
 * 1. Status Code Defense: Strictly 4xx error assertions (400 Bad Request, 409 Conflict); non-500 crash guard.
 * 2. Protocol Integrity: Content-Type application/json; X-Content-Type-Options: nosniff validation.
 * 3. Contract & Error Parity: Runtime RFC 7807 / NestJS error payload validation.
 * 4. Boundary Matrix: Malformed emails, short passwords, missing fields, null/undefined payloads.
 * 5. Security Invariants: Mass Assignment role rejection at boundary (400), Account Takeover collision protection (409).
 */

import { test, expect } from '@playwright/test';
import { AuthClient } from '@/server/backend/clients/auth.client';
import { env } from '@/config/env';
import { urls } from '@/config/urls';
import { assertErrorResponse } from '@/core/assertions/response.assertions';

test.describe('Auth API Negative & Attack Boundary Tests (Strictly 4xx Responses)', () => {
  let authClient: AuthClient;

  test.beforeEach(async ({ request }) => {
    authClient = new AuthClient(request, urls.server.api);
  });

  test('TC-SEC-00-01: Спроба передачі забороненого поля role (Mass Assignment) повинна відхилятися з 400 Bad Request', async () => {
    const timestamp = Date.now();
    const attackerEmail = `e2e.attacker.${timestamp}@smartfeed.local`;
    const payload = {
      email: attackerEmail,
      password: 'AttackerPassword123!',
      fullName: 'Attacker Exploit User',
      role: 'SUPER_ADMIN',
    };

    const { response, data } = await authClient.rawRegister(payload);

    // 4-Layer Response Verification: strictly 400 Bad Request
    assertErrorResponse(response, data, 400, {
      method: 'POST',
      endpoint: '/api/auth/register',
    });

    const errorObj = data as { message?: string[] | string };
    const messages = Array.isArray(errorObj.message) ? errorObj.message : [errorObj.message || ''];
    expect(
      messages.some(
        (msg) => msg.includes('role should not exist') || msg.includes('property role'),
      ),
      'ValidationPipe must reject unwhitelisted role property',
    ).toBe(true);
  });

  test('TC-SEC-00-02: Захист від перезапису акаунта суперадміна (Account Takeover / Collision) повинен повертати 409 Conflict', async () => {
    const takeoverPayload = {
      email: env.E2E_SUPERADMIN_EMAIL,
      password: 'HackedPassword999!',
      fullName: 'Hostile Takeover',
    };

    const { response, data } = await authClient.rawRegister(takeoverPayload);

    // 4-Layer Response Verification: strictly 409 Conflict
    assertErrorResponse(response, data, 409, {
      method: 'POST',
      endpoint: '/api/auth/register',
    });
  });

  test('TC-SEC-00-03: Негативні валідаційні кейси реєстрації (Malformed Inputs) повинні повертати 400 Bad Request', async () => {
    const malformedCases = [
      {
        name: 'Invalid email format (missing @)',
        payload: { email: 'invalid-email-format', password: 'ValidPassword123!' },
      },
      {
        name: 'Invalid email format (missing user)',
        payload: { email: '@missing-user.com', password: 'ValidPassword123!' },
      },
      {
        name: 'Password shorter than 8 characters',
        payload: { email: `e2e.short.${Date.now()}@smartfeed.local`, password: 'short' },
      },
      {
        name: 'Weak password without uppercase letter',
        payload: {
          email: `e2e.noupper.${Date.now()}@smartfeed.local`,
          password: 'weakpassword123',
        },
      },
      {
        name: 'Weak password without digits',
        payload: {
          email: `e2e.nodigit.${Date.now()}@smartfeed.local`,
          password: 'WeakPasswordOnly',
        },
      },
      {
        name: 'Malicious full name with XSS script injection',
        payload: {
          email: `e2e.xss.${Date.now()}@smartfeed.local`,
          password: 'ValidPassword123!',
          fullName: '<script>alert("xss")</script>',
        },
      },
      {
        name: 'Full name with forbidden special characters',
        payload: {
          email: `e2e.chars.${Date.now()}@smartfeed.local`,
          password: 'ValidPassword123!',
          fullName: 'Bad User #1 $%^',
        },
      },
      {
        name: 'Empty payload object',
        payload: {},
      },
      {
        name: 'Missing password field',
        payload: { email: `e2e.nopass.${Date.now()}@smartfeed.local` },
      },
      {
        name: 'Explicit undefined email and password',
        payload: { email: undefined, password: undefined },
      },
    ];

    for (const testCase of malformedCases) {
      const { response, data } = await authClient.rawRegister(testCase.payload);
      assertErrorResponse(response, data, 400, {
        method: 'POST',
        endpoint: `/api/auth/register?case=${encodeURIComponent(testCase.name)}`,
      });
    }
  });

  test('TC-SEC-00-04: Інвалідація токена після виклику logout (Token Revocation & Redis Blacklist)', async ({
    request,
  }) => {
    const timestamp = Date.now();
    const email = `e2e.revocation.${timestamp}@smartfeed.local`;
    const password = 'StrongPassword123!';

    // 1. Create and authenticate user
    const regRes = await authClient.register({
      email,
      password,
      fullName: 'Revocation Subject',
    });
    expect(regRes.response.status()).toBe(201);
    const token = regRes.data.tokens.accessToken;

    // 2. Profile request with active token succeeds (200 OK)
    const validProfile = await request.get(`${urls.server.api}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(validProfile.status()).toBe(200);

    // 3. Perform logout to revoke all issued tokens for this user
    const logoutRes = await request.post(`${urls.server.api}/auth/logout`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(logoutRes.status()).toBe(200);

    // 4. Verification: The old token must now be rejected with 401 Unauthorized
    const revokedProfile = await request.get(`${urls.server.api}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(revokedProfile.status()).toBe(401);
  });
});
