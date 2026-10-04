import { test, expect } from '@playwright/test';
import {
  createInitialTeamState,
  setupTeamRoutes,
  type TeamTestState,
  mockUser,
} from '@e2e/fixtures/team-mock-data';

test.describe('Desktop App — Управління командою, місця та доступ', () => {
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

  test('1. Повинен відкрити сторінку Команда через сайдбар та відобразити дані компанії', async ({
    page,
  }) => {
    await page.goto('/');

    const teamNav = page.locator('[data-testid="nav-item-team"]').first();
    await teamNav.waitFor({ state: 'visible' });
    await teamNav.click();

    await expect(page).toHaveURL(/.*\/team/);
    await expect(page.locator('[data-testid="team-page"]')).toBeVisible();

    await expect(page.locator('[data-testid="company-title"]')).toHaveText(
      'Rozetka Top Sellers LLC',
    );
    await expect(page.locator('[data-testid="team-plan-badge"]')).toContainText('STARTER');
  });

  test('2. STARTER план: показує 1/1 місць (соло), а клік на Запросити відкриває модалку апгрейду', async ({
    page,
  }) => {
    await page.goto('/team');
    await expect(page.locator('[data-testid="team-page"]')).toBeVisible();

    await expect(page.locator('[data-testid="seats-count-label"]')).toContainText('1 / 1');
    await expect(page.locator('[data-testid="solo-plan-notice"]')).toBeVisible();

    const inviteBtn = page.locator('[data-testid="invite-member-btn"]');
    await expect(inviteBtn).toBeVisible();
    await inviteBtn.click();

    const upgradeDialog = page.locator('[data-testid="upgrade-team-dialog"]');
    await expect(upgradeDialog).toBeVisible();
    await expect(upgradeDialog).toContainText('Розширте можливості вашої команди');

    const toPlansBtn = page.locator('[data-testid="upgrade-to-plans-btn"]');
    await toPlansBtn.click();
    await expect(page).toHaveURL(/.*\/plans/);
  });

  test('3. PRO план: коли ліміт 3/3 вичерпано, клік на Запросити відкриває модалку апгрейду до Enterprise', async ({
    page,
  }) => {
    state.organization.activePlan = 'PRO';
    state.organization.maxTeamSeats = 3;
    state.organization.usedTeamSeats = 3;
    state.organization.members = [
      {
        id: 'mem-1',
        organizationId: 'org-rozetka-1',
        userId: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: 'OWNER',
        joinedAt: new Date().toISOString(),
      },
      {
        id: 'mem-2',
        organizationId: 'org-rozetka-1',
        userId: 'usr-2',
        email: 'maria@rozetka.ua',
        fullName: 'Maria',
        role: 'ADMIN',
        joinedAt: new Date().toISOString(),
      },
      {
        id: 'mem-3',
        organizationId: 'org-rozetka-1',
        userId: 'usr-3',
        email: 'dmytro@rozetka.ua',
        fullName: 'Dmytro',
        role: 'MEMBER',
        joinedAt: new Date().toISOString(),
      },
    ];

    await page.goto('/team');
    await expect(page.locator('[data-testid="team-page"]')).toBeVisible();

    await expect(page.locator('[data-testid="seats-count-label"]')).toContainText('3 / 3');
    await expect(page.locator('[data-testid="limit-reached-notice"]')).toBeVisible();

    await page.locator('[data-testid="invite-member-btn"]').click();

    const upgradeDialog = page.locator('[data-testid="upgrade-team-dialog"]');
    await expect(upgradeDialog).toBeVisible();
    await expect(upgradeDialog).toContainText('ENTERPRISE');
  });

  test('4. Видалення співробітника вивільняє командне місце', async ({ page }) => {
    state.organization.activePlan = 'PRO';
    state.organization.maxTeamSeats = 3;
    state.organization.usedTeamSeats = 2;
    state.organization.members = [
      {
        id: 'mem-1',
        organizationId: 'org-rozetka-1',
        userId: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: 'OWNER',
        joinedAt: new Date().toISOString(),
      },
      {
        id: 'mem-2',
        organizationId: 'org-rozetka-1',
        userId: 'usr-2',
        email: 'maria@rozetka.ua',
        fullName: 'Maria',
        role: 'MEMBER',
        joinedAt: new Date().toISOString(),
      },
    ];

    await page.goto('/team');
    await expect(page.locator('[data-testid="team-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="seats-count-label"]')).toContainText('2 / 3');

    const removeBtn = page.locator('[data-testid="remove-member-btn-mem-2"]');
    await removeBtn.click();

    const removeDialog = page.locator('[data-testid="remove-member-dialog"]');
    await expect(removeDialog).toBeVisible();
    await expect(removeDialog).toContainText('maria@rozetka.ua');

    await page.locator('[data-testid="confirm-remove-member-btn"]').click();
    await expect(page.locator('[data-testid="team-success-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="seats-count-label"]')).toContainText('1 / 3');
  });

  test('5. Зміна назви компанії через діалог оновлює заголовок', async ({ page }) => {
    await page.goto('/team');
    await expect(page.locator('[data-testid="team-page"]')).toBeVisible();

    await page.locator('[data-testid="edit-company-name-btn"]').click();

    const editDialog = page.locator('[data-testid="edit-company-dialog"]');
    await expect(editDialog).toBeVisible();

    const nameInput = page.locator('[data-testid="edit-company-name-input"]');
    await nameInput.fill('Rozetka Global Supermarket');
    await page.locator('[data-testid="save-company-name-btn"]').click();

    await expect(page.locator('[data-testid="team-success-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="company-title"]')).toHaveText(
      'Rozetka Global Supermarket',
    );
  });

  test('6. Двомовність UI (UA ⇄ EN) для розділу Команда', async ({ page }) => {
    await page.goto('/team');
    await expect(page.locator('[data-testid="team-page"]')).toBeVisible();

    await expect(page.locator('[data-testid="invite-member-btn"]')).toContainText(
      'Запросити колегу',
    );
    await expect(page.locator('[data-testid="team-members-list"]')).toContainText(
      'Учасники команди',
    );

    await page.getByTestId('language-toggle').click();

    await expect(page.locator('[data-testid="invite-member-btn"]')).toContainText(
      'Invite Colleague',
    );
    await expect(page.locator('[data-testid="team-members-list"]')).toContainText('Team Members');
  });

  test('7. Запрошений учасник (MEMBER) не бачить меню Тарифи та отримує readonly режим на /plans', async ({
    page,
  }) => {
    const invitedUser = {
      id: 'usr-member-1',
      email: 'member@rozetka.ua',
      fullName: 'Taras Petrenko',
      role: 'USER',
      organization: {
        id: 'org-rozetka-1',
        name: 'Rozetka Top Sellers LLC',
        role: 'MEMBER',
      },
    };

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(invitedUser),
      });
    });

    await page.addInitScript((user) => {
      window.localStorage.setItem('smartfeed_user_profile', JSON.stringify(user));
    }, invitedUser);

    await page.goto('/');
    await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible();

    await expect(page.locator('[data-testid="nav-link-plans"]')).toHaveCount(0);

    await page.goto('/plans');
    await expect(page.locator('[data-testid="invited-member-plan-card"]')).toBeVisible();
  });
});
