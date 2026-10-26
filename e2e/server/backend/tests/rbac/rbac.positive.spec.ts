/**
 * @fileoverview RBAC Super Admin Authorized Access Scenarios
 *
 * ARCHITECTURAL DEFENSE LAYERS:
 * 1. Status Code Defense: Strictly 200 OK status assertions; non-500 crash guard.
 * 2. Protocol Integrity: Content-Type application/json; X-Content-Type-Options: nosniff validation.
 * 3. Contract & Data Parity: Runtime Zod validation against UsersListResponseSchema, UsersStatsSchema, DashboardOverviewSchema.
 * 4. Business Parity: Verification of customer list population and analytics consistency.
 */

import { test, expect } from '@playwright/test';
import { AuthClient } from '@/server/backend/clients/auth.client';
import { UsersClient } from '@/server/backend/clients/users.client';
import { env } from '@/config/env';
import { urls } from '@/config/urls';
import { assertSuccessResponse } from '@/core/assertions/response.assertions';
import {
  AuthResponseSchema,
  UsersListResponseSchema,
  UsersStatsSchema,
  DashboardOverviewSchema,
} from '@/core/contracts/schemas';

test.describe('RBAC Super Admin Positive Access Tests (Strictly 200 OK Responses)', () => {
  let authClient: AuthClient;
  let usersClient: UsersClient;

  test.beforeAll(async ({ request }) => {
    const authClient = new AuthClient(request, urls.server.api);
    // Pre-seed 1 customer user silently so customer list & stats have verified records
    await authClient.register(
      {
        email: `e2e.customer.${Date.now()}@smartfeed.local`,
        password: 'CustomerPassword123!',
        fullName: 'Customer User',
      },
      { silent: true },
    );
  });

  test.beforeEach(async ({ request }) => {
    authClient = new AuthClient(request, urls.server.api);
    usersClient = new UsersClient(request, urls.server.api);

    // Authenticate as Super Admin
    const adminLogin = await authClient.login(
      env.E2E_SUPERADMIN_EMAIL,
      env.E2E_SUPERADMIN_PASSWORD,
    );
    const adminAuth = assertSuccessResponse(
      adminLogin.response,
      adminLogin.data,
      200,
      AuthResponseSchema,
      { method: 'POST', endpoint: '/api/auth/login' },
    );
    usersClient.setAuthToken(adminAuth.tokens.accessToken);
  });

  test('TC-SEC-00-09: Легітимний авторизований доступ Super Admin до списку клієнтів (/api/users)', async () => {
    const { response, data } = await usersClient.getUsers();

    // 4-Layer Response Verification: strictly 200 OK + UsersListResponseSchema
    const usersList = assertSuccessResponse(response, data, 200, UsersListResponseSchema, {
      method: 'GET',
      endpoint: '/api/users',
    });

    expect(Array.isArray(usersList)).toBe(true);
    expect(usersList.length).toBeGreaterThan(0);
    // Super Admin list excludes SUPER_ADMIN users (only customers)
    expect(usersList.every((u) => u.role === 'USER' || u.role === 'ADMIN')).toBe(true);
  });

  test('TC-SEC-00-09: Легітимний доступ Super Admin до статистики користувачів (/api/users/stats)', async () => {
    const statsRes = await usersClient.getUserStats();

    // 4-Layer Response Verification: strictly 200 OK + UsersStatsSchema
    const stats = assertSuccessResponse(statsRes.response, statsRes.data, 200, UsersStatsSchema, {
      method: 'GET',
      endpoint: '/api/users/stats',
    });

    expect(stats.totalUsers).toBeGreaterThanOrEqual(1);
    expect(stats.standardUsersCount).toBeGreaterThanOrEqual(0);
  });

  test('TC-SEC-00-09: Легітимний доступ Super Admin до огляду дашборду (/api/users/dashboard-overview)', async () => {
    const overviewRes = await usersClient.getDashboardOverview();

    // 4-Layer Response Verification: strictly 200 OK + DashboardOverviewSchema
    const overview = assertSuccessResponse(
      overviewRes.response,
      overviewRes.data,
      200,
      DashboardOverviewSchema,
      { method: 'GET', endpoint: '/api/users/dashboard-overview' },
    );

    expect(overview.stats).toBeDefined();
    expect(Array.isArray(overview.recentUsers)).toBe(true);
  });
});
