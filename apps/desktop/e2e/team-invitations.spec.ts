import { test, expect } from '@playwright/test';
import {
  createInitialTeamState,
  setupTeamRoutes,
  type TeamTestState,
} from '@e2e/fixtures/team-mock-data';

test.describe('Desktop App — Запрошення до команди та акцепт інвайту', () => {
  let state: TeamTestState;

  test.beforeEach(async ({ page }) => {
    state = createInitialTeamState();
    await setupTeamRoutes(page, state);
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('1. PRO план: генерує інвайт-лінк, показує екран копіювання та додає в список очікуючих', async ({
    page,
  }) => {
    state.organization.activePlan = 'PRO';
    state.organization.maxTeamSeats = 3;
    state.license.planType = 'PRO';
    state.license.maxTeamSeats = 3;

    await page.goto('/team');
    await expect(page.locator('[data-testid="team-page"]')).toBeVisible();

    await page.locator('[data-testid="invite-member-btn"]').click();

    const inviteDialog = page.locator('[data-testid="invite-member-dialog"]');
    await expect(inviteDialog).toBeVisible();
    await expect(inviteDialog).toContainText('2 з 3 вільних');

    await page.locator('[data-testid="invite-email-input"]').fill('maria@rozetka.ua');
    await page.locator('[data-testid="role-admin-btn"]').click();
    await page.locator('[data-testid="submit-invite-btn"]').click();

    await expect(page.locator('[data-testid="copy-invite-link-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="generated-invite-link-input"]')).toHaveValue(
      /.*\/invite\?token=SF-INV-.*/,
    );

    await page.locator('[data-testid="done-invite-btn"]').click();
    await expect(inviteDialog).not.toBeVisible();

    await expect(page.locator('[data-testid="pending-invitations-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-invitations-card"]')).toContainText(
      'maria@rozetka.ua',
    );
  });

  test('2. Прийняття інвайту (/invite?token=...) новим користувачем', async ({ page }) => {
    await page.goto('/invite?token=SF-INV-valid-token-123');

    await expect(page.locator('h1')).toHaveText('Rozetka Top Sellers LLC');

    await page.locator('[data-testid="invite-fullname-input"]').fill('Maria Polishchuk');
    await page.locator('[data-testid="invite-password-input"]').fill('StrongPassword123!');
    await page.locator('[data-testid="submit-accept-invite-btn"]').click();

    await expect(page).toHaveURL(/.*\/team/);
  });
});
