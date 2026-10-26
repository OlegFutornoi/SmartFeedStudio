/**
 * @fileoverview RBAC & Broken Function Level Authorization Negative Audits
 *
 * ARCHITECTURAL DEFENSE LAYERS:
 * 1. Status Code Defense: Strictly 4xx error assertions (401 Unauthorized, 403 Forbidden); non-500 crash guard.
 * 2. Protocol Integrity: Content-Type application/json; X-Content-Type-Options: nosniff validation.
 * 3. Contract & Error Parity: RFC 7807 / NestJS error payload structure validation.
 * 4. Authorization Matrix: Unauthenticated (401), Role.USER privilege restriction (403), IDOR mutation block (403).
 */

import { test, expect } from '@playwright/test';
import { AuthClient } from '@/server/backend/clients/auth.client';
import { UsersClient } from '@/server/backend/clients/users.client';
import { env } from '@/config/env';
import { urls } from '@/config/urls';
import { assertErrorResponse } from '@/core/assertions/response.assertions';

test.describe('RBAC & Broken Function Level Authorization Negative Tests (Strictly 4xx Responses)', () => {
  let usersClient: UsersClient;
  let regularUserToken: string;
  let superadminId: string;

  test.beforeAll(async ({ request }) => {
    const authClient = new AuthClient(request, urls.server.api);

    // 1. Super Admin authentication to capture target Super Admin ID for IDOR tests (silent setup)
    const superadminLogin = await authClient.login(
      env.E2E_SUPERADMIN_EMAIL,
      env.E2E_SUPERADMIN_PASSWORD,
      { silent: true },
    );
    superadminId = superadminLogin.data?.user?.id || '';

    // 2. Provision regular USER token for BFLA/IDOR checks (silent setup)
    const regularEmail = `e2e.rbac.user.${Date.now()}@smartfeed.local`;
    const regRes = await authClient.register(
      {
        email: regularEmail,
        password: 'UserPassword123!',
        fullName: 'RBAC Test User',
      },
      { silent: true },
    );
    regularUserToken = regRes.data?.tokens?.accessToken || '';
  });

  test.beforeEach(async ({ request }) => {
    usersClient = new UsersClient(request, urls.server.api);
  });

  test('TC-SEC-00-05: Спроба неавторизованого доступу до списку користувачів (Unauthenticated) повинна повертати 401 Unauthorized', async () => {
    usersClient.clearAuthToken();
    const { response, data } = await usersClient.getUsers();

    // 4-Layer Response Verification: strictly 401 Unauthorized
    assertErrorResponse(response, data, 401, {
      method: 'GET',
      endpoint: '/api/users',
    });
  });

  test('TC-SEC-00-06: Спроба доступу звичайного користувача до списку клієнтів (BFLA / Role Guard) повинна повертати 403 Forbidden', async () => {
    usersClient.setAuthToken(regularUserToken);
    const { response, data } = await usersClient.getUsers();

    // 4-Layer Response Verification: strictly 403 Forbidden
    assertErrorResponse(response, data, 403, {
      method: 'GET',
      endpoint: '/api/users',
    });
  });

  test('TC-SEC-00-07: Спроба звичайного користувача отримати статистику або огляд адмінки повинна повертати 403 Forbidden', async () => {
    usersClient.setAuthToken(regularUserToken);

    // 1. Stats endpoint: strictly 403
    const statsRes = await usersClient.getUserStats();
    assertErrorResponse(statsRes.response, statsRes.data, 403, {
      method: 'GET',
      endpoint: '/api/users/stats',
    });

    // 2. Dashboard overview endpoint: strictly 403
    const overviewRes = await usersClient.getDashboardOverview();
    assertErrorResponse(overviewRes.response, overviewRes.data, 403, {
      method: 'GET',
      endpoint: '/api/users/dashboard-overview',
    });
  });

  test('TC-SEC-00-08: Спроба звичайного користувача змінити статус чи видалити акаунт суперадміна (IDOR) повинна повертати 403 Forbidden', async () => {
    expect(superadminId, 'Super Admin ID must be resolved in beforeAll').toBeTruthy();
    usersClient.setAuthToken(regularUserToken);

    // 1. Attempt to suspend superadmin: strictly 403
    const updateRes = await usersClient.updateUserStatus(superadminId, { isActive: false });
    assertErrorResponse(updateRes.response, updateRes.data, 403, {
      method: 'PATCH',
      endpoint: `/api/users/${superadminId}/status`,
    });

    // 2. Attempt to delete superadmin: strictly 403
    const deleteRes = await usersClient.deleteUser(superadminId);
    assertErrorResponse(deleteRes.response, deleteRes.data, 403, {
      method: 'DELETE',
      endpoint: `/api/users/${superadminId}`,
    });
  });
});
