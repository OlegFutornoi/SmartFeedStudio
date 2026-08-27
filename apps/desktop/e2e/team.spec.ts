import { test, expect } from '@playwright/test';

test.describe('Desktop App — Команда, Компанія та Командні Місця (Team Workspace & Access Control)', () => {
  const mockUser = {
    id: 'usr-team-owner',
    email: 'alex@rozetka.ua',
    fullName: 'Alex Shevchenko',
    role: 'USER',
    organization: {
      id: 'org-rozetka-1',
      name: 'Rozetka Top Sellers LLC',
      role: 'OWNER',
    },
  };

  let mockOrganizationState = {
    id: 'org-rozetka-1',
    name: 'Rozetka Top Sellers LLC',
    ownerId: mockUser.id,
    activePlan: 'STARTER',
    maxTeamSeats: 1,
    usedTeamSeats: 1,
    currentUserRole: 'OWNER',
    members: [
      {
        id: 'mem-1',
        organizationId: 'org-rozetka-1',
        userId: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: 'OWNER',
        joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };

  let mockLicenseState = {
    id: 'lic-org-1',
    userId: mockUser.id,
    organizationId: 'org-rozetka-1',
    organizationName: 'Rozetka Top Sellers LLC',
    licenseKey: 'SF-STARTER-ABCD-EFGH-1234',
    planType: 'STARTER',
    canCloudBackup: false,
    maxXmlLimit: 500,
    maxTeamSeats: 1,
    aiCredits: 0,
    isActive: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isExpired: false,
    daysRemaining: 7,
  };

  test.beforeEach(async ({ page }) => {
    // 100% test isolation & clean storage
    await page.addInitScript((user) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem('smartfeed_access_token', 'mock-valid-token');
      window.localStorage.setItem('smartfeed_user_profile', JSON.stringify(user));
      window.localStorage.setItem('smartfeed_language', 'uk');
    }, mockUser);

    mockOrganizationState = {
      id: 'org-rozetka-1',
      name: 'Rozetka Top Sellers LLC',
      ownerId: mockUser.id,
      activePlan: 'STARTER',
      maxTeamSeats: 1,
      usedTeamSeats: 1,
      currentUserRole: 'OWNER',
      members: [
        {
          id: 'mem-1',
          organizationId: 'org-rozetka-1',
          userId: mockUser.id,
          email: mockUser.email,
          fullName: mockUser.fullName,
          role: 'OWNER',
          joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    };

    mockLicenseState = {
      id: 'lic-org-1',
      userId: mockUser.id,
      organizationId: 'org-rozetka-1',
      organizationName: 'Rozetka Top Sellers LLC',
      licenseKey: 'SF-STARTER-ABCD-EFGH-1234',
      planType: 'STARTER',
      canCloudBackup: false,
      maxXmlLimit: 500,
      maxTeamSeats: 1,
      aiCredits: 0,
      isActive: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isExpired: false,
      daysRemaining: 7,
    };

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    });

    await page.route('**/api/licenses/my', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLicenseState),
      });
    });

    await page.route('**/api/organizations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockOrganizationState]),
      });
    });

    await page.route('**/api/organizations/org-rozetka-1', async (route) => {
      if (route.request().method() === 'PATCH') {
        const payload = JSON.parse(route.request().postData() || '{}');
        mockOrganizationState.name = payload.name;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockOrganizationState),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockOrganizationState),
        });
      }
    });

    await page.route('**/api/organizations/org-rozetka-1/members', async (route) => {
      if (route.request().method() === 'POST') {
        const payload = JSON.parse(route.request().postData() || '{}');
        const newMember = {
          id: `mem-${Date.now()}`,
          organizationId: 'org-rozetka-1',
          userId: `usr-${Date.now()}`,
          email: payload.email,
          fullName: payload.email.split('@')[0],
          role: payload.role || 'MEMBER',
          joinedAt: new Date().toISOString(),
        };
        mockOrganizationState.members.push(newMember);
        mockOrganizationState.usedTeamSeats = mockOrganizationState.members.length;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newMember),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockOrganizationState.members),
        });
      }
    });

    await page.route('**/api/organizations/org-rozetka-1/members/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        const urlParts = route.request().url().split('/');
        const memberId = urlParts[urlParts.length - 1];
        mockOrganizationState.members = mockOrganizationState.members.filter(
          (m) => m.id !== memberId,
        );
        mockOrganizationState.usedTeamSeats = mockOrganizationState.members.length;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });
  });

  test.afterEach(async ({ page }) => {
    // Zero leftovers policy
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('1. Повинен відкрити сторінку Команда через сайдбар та відобразити дані компанії', async ({
    page,
  }) => {
    await page.goto('/');

    // Клік по пункту Команда в навігації
    const teamNav = page.locator('[data-testid="nav-item-team"]').first();
    await teamNav.waitFor({ state: 'visible' });
    await teamNav.click();

    await expect(page).toHaveURL(/.*\/team/);
    await expect(page.locator('[data-testid="team-page"]')).toBeVisible();

    // Заголовок та бейдж плану
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

    // Квота 1/1
    await expect(page.locator('[data-testid="seats-count-label"]')).toContainText('1 / 1');
    await expect(page.locator('[data-testid="solo-plan-notice"]')).toBeVisible();

    // Кнопка Запросити є клікабельною
    const inviteBtn = page.locator('[data-testid="invite-member-btn"]');
    await expect(inviteBtn).toBeVisible();
    await inviteBtn.click();

    // Відкривається UpgradeTeamSeatsDialog
    const upgradeDialog = page.locator('[data-testid="upgrade-team-dialog"]');
    await expect(upgradeDialog).toBeVisible();
    await expect(upgradeDialog).toContainText('Розширте можливості вашої команди');

    // Клік на кнопку апгрейду веде до тарифів
    const toPlansBtn = page.locator('[data-testid="upgrade-to-plans-btn"]');
    await toPlansBtn.click();
    await expect(page).toHaveURL(/.*\/plans/);
  });

  test('3. PRO план: дозволяє запросити співробітника та збільшує лічильник місць', async ({
    page,
  }) => {
    // Встановлюємо стан PRO з 3 місцями
    mockOrganizationState.activePlan = 'PRO';
    mockOrganizationState.maxTeamSeats = 3;
    mockLicenseState.planType = 'PRO';
    mockLicenseState.maxTeamSeats = 3;

    await page.goto('/team');
    await expect(page.locator('[data-testid="team-page"]')).toBeVisible();

    // Квота 1/3
    await expect(page.locator('[data-testid="seats-count-label"]')).toContainText('1 / 3');

    // Клік на Запросити колегу
    await page.locator('[data-testid="invite-member-btn"]').click();

    // Відкривається InviteMemberDialog
    const inviteDialog = page.locator('[data-testid="invite-member-dialog"]');
    await expect(inviteDialog).toBeVisible();
    await expect(inviteDialog).toContainText('2 з 3 вільних');

    // Заповнюємо форму інвайту
    await page.locator('[data-testid="invite-email-input"]').fill('maria@rozetka.ua');
    await page.locator('[data-testid="role-admin-btn"]').click();
    await page.locator('[data-testid="submit-invite-btn"]').click();

    // Перевіряємо повідомлення успіху
    await expect(page.locator('[data-testid="team-success-alert"]')).toBeVisible();

    // Лічильник став 2 / 3
    await expect(page.locator('[data-testid="seats-count-label"]')).toContainText('2 / 3');

    // Список містить нового співробітника
    await expect(page.locator('[data-testid="team-members-list"]')).toContainText(
      'maria@rozetka.ua',
    );
  });

  test('4. PRO план: коли ліміт 3/3 вичерпано, клік на Запросити відкриває модалку апгрейду до Enterprise', async ({
    page,
  }) => {
    // Стан 3/3
    mockOrganizationState.activePlan = 'PRO';
    mockOrganizationState.maxTeamSeats = 3;
    mockOrganizationState.usedTeamSeats = 3;
    mockOrganizationState.members = [
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

    // Ліміт 3/3
    await expect(page.locator('[data-testid="seats-count-label"]')).toContainText('3 / 3');
    await expect(page.locator('[data-testid="limit-reached-notice"]')).toBeVisible();

    // Клікаємо Запросити колегу
    await page.locator('[data-testid="invite-member-btn"]').click();

    // Відкривається UpgradeTeamSeatsDialog
    const upgradeDialog = page.locator('[data-testid="upgrade-team-dialog"]');
    await expect(upgradeDialog).toBeVisible();
    await expect(upgradeDialog).toContainText('ENTERPRISE');
  });

  test('5. Видалення співробітника вивільняє командне місце', async ({ page }) => {
    // Початково 2 з 3
    mockOrganizationState.activePlan = 'PRO';
    mockOrganizationState.maxTeamSeats = 3;
    mockOrganizationState.usedTeamSeats = 2;
    mockOrganizationState.members = [
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
        email: 'colleague@rozetka.ua',
        fullName: 'Colleague Dev',
        role: 'MEMBER',
        joinedAt: new Date().toISOString(),
      },
    ];

    await page.goto('/team');
    await expect(page.locator('[data-testid="team-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="seats-count-label"]')).toContainText('2 / 3');

    // Клік на кнопку видалення другого учасника
    const removeBtn = page.locator('[data-testid="remove-member-btn-mem-2"]');
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();

    // Діалог підтвердження
    const removeDialog = page.locator('[data-testid="remove-member-dialog"]');
    await expect(removeDialog).toBeVisible();
    await expect(removeDialog).toContainText('colleague@rozetka.ua');

    // Підтвердження видалення
    await page.locator('[data-testid="confirm-remove-member-btn"]').click();

    // Повідомлення про вивільнення місця
    await expect(page.locator('[data-testid="team-success-alert"]')).toBeVisible();

    // Лічильник зменшився до 1 / 3
    await expect(page.locator('[data-testid="seats-count-label"]')).toContainText('1 / 3');
  });

  test('6. Зміна назви компанії через діалог оновлення', async ({ page }) => {
    await page.goto('/team');
    await expect(page.locator('[data-testid="team-page"]')).toBeVisible();

    // Клік на іконку редагування
    await page.locator('[data-testid="edit-company-name-btn"]').click();

    const editDialog = page.locator('[data-testid="edit-company-dialog"]');
    await expect(editDialog).toBeVisible();

    const input = page.locator('[data-testid="edit-company-name-input"]');
    await input.fill('Rozetka Enterprise LLC');
    await page.locator('[data-testid="save-company-name-btn"]').click();

    // Успіх та оновлений заголовок
    await expect(page.locator('[data-testid="team-success-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="company-title"]')).toHaveText(
      'Rozetka Enterprise LLC',
    );
  });

  test('7. Локалізація (UA ⇄ EN): всі елементи команди та діалоги перекладаються миттєво', async ({
    page,
  }) => {
    await page.goto('/team');
    await expect(page.locator('[data-testid="team-page"]')).toBeVisible();

    // Перевірка UA тексту
    await expect(page.locator('[data-testid="team-seats-quota-card"]')).toContainText(
      'Командні місця',
    );
    await expect(page.locator('[data-testid="invite-member-btn"]')).toContainText(
      'Запросити колегу',
    );

    // Перемикання мови на EN
    const langToggle = page.locator('[data-testid="language-toggle"]');
    if (await langToggle.isVisible()) {
      await langToggle.click();
    } else {
      await page.evaluate(() => {
        window.localStorage.setItem('smartfeed_language', 'en');
        window.location.reload();
      });
    }

    // Перевірка EN тексту
    await expect(page.locator('[data-testid="team-seats-quota-card"]')).toContainText('Team Seats');
    await expect(page.locator('[data-testid="invite-member-btn"]')).toContainText(
      'Invite Colleague',
    );
  });
});
