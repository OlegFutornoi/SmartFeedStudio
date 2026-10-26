/**
 * @fileoverview Admin Portal Route Protection & Client-side RBAC (UI Access Control)
 *
 * ARCHITECTURAL DEFENSE LAYERS:
 * 1. Status Code Defense: Deterministic status assertion (201) on API provisioning step; non-500 crash guard.
 * 2. Protocol Integrity: Content-Type application/json; X-Content-Type-Options: nosniff on API user generation.
 * 3. Contract & Data Parity: Runtime Zod validation against AuthResponseSchema.
 * 4. UI Access Control: Client AuthGuard redirection of unauthenticated and Role.USER visitors away from /users to /login.
 * 5. Data Privacy: Guaranteed absence of sensitive customer table elements for unauthorized roles.
 */

import { test, expect } from '@playwright/test';
import { urls } from '@/config/urls';
import { AuthClient } from '@/server/backend/clients/auth.client';
import { assertSuccessResponse } from '@/core/assertions/response.assertions';
import { AuthResponseSchema } from '@/core/contracts/schemas';

test.describe('Admin Portal Route Protection & Client-side RBAC (UI Access Control)', () => {
  test('TC-SEC-00-10: Неавторизований відвідувач при переході на /users автоматично редиректиться на /login', async ({
    browser,
  }) => {
    // Isolated context with NO storageState/tokens
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    try {
      await page.goto(`${urls.server.admin}/users`);
      // AuthGuard redirects unauthenticated visitor to /login
      await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('TC-SEC-00-10: Користувач з роллю USER не має доступу до адмін-розділу /users', async ({
    browser,
    request,
  }) => {
    // Provision regular user via API with 4-layer validation
    const authClient = new AuthClient(request, urls.server.api);
    const regularEmail = `e2e.portal.user.${Date.now()}@smartfeed.local`;
    const regularPassword = 'UserPassword123!';

    const regRes = await authClient.register({
      email: regularEmail,
      password: regularPassword,
      fullName: 'Portal Test User',
    });
    const userAuth = assertSuccessResponse(regRes.response, regRes.data, 201, AuthResponseSchema, {
      method: 'POST',
      endpoint: '/api/auth/register',
    });

    const token = userAuth.tokens.accessToken;
    const user = userAuth.user;

    // Create browser context with regular USER localStorage state
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    try {
      // Pre-seed regular user authentication in localStorage
      await page.addInitScript(
        ({ token, user }) => {
          window.localStorage.setItem('auth_token', token);
          window.localStorage.setItem('auth_user', JSON.stringify(user));
        },
        { token, user },
      );

      await page.goto(`${urls.server.admin}/users`);

      // AuthGuard identifies user.role === 'USER' (not ADMIN / SUPER_ADMIN) and evicts to /login
      await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });

      // Confidential user data must NOT be rendered in DOM
      const table = page.locator('table');
      await expect(table).not.toBeVisible();
    } finally {
      await context.close();
    }
  });
});
