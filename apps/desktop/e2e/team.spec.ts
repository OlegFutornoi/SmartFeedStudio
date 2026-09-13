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

  interface MockInvitationState {
    id: string;
    organizationId: string;
    email: string;
    role: string;
    token: string;
    inviteUrl: string;
    status: string;
    expiresAt: string;
    createdAt: string;
  }

  let mockInvitationsState: MockInvitationState[] = [];

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

    mockInvitationsState = [];
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

    await page.route(/\/api\/organizations$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockOrganizationState]),
      });
    });

    await page.route(/\/api\/organizations\/org-rozetka-1$/, async (route) => {
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

    await page.route(/\/api\/organizations\/org-rozetka-1\/invitations$/, async (route) => {
      if (route.request().method() === 'POST') {
        const payload = JSON.parse(route.request().postData() || '{}');
        const token = `SF-INV-mock-${Date.now()}`;
        const newInv = {
          id: `inv-${Date.now()}`,
          organizationId: 'org-rozetka-1',
          email: payload.email,
          role: payload.role || 'MEMBER',
          token,
          inviteUrl: `http://localhost:1420/invite?token=${token}`,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        };
        mockInvitationsState.push(newInv);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newInv),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockInvitationsState),
        });
      }
    });

    await page.route(/\/api\/organizations\/org-rozetka-1\/invitations\/[^/]+$/, async (route) => {
      if (route.request().method() === 'DELETE') {
        const urlParts = route.request().url().split('/');
        const invId = urlParts[urlParts.length - 1];
        mockInvitationsState = mockInvitationsState.filter((i) => i.id !== invId);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await page.route(/\/api\/organizations\/org-rozetka-1\/members$/, async (route) => {
      if (route.request().method() === 'POST') {
        const payload = JSON.parse(route.request().postData() || '{}');
        const token = `SF-INV-mock-${Date.now()}`;
        const newInv = {
          id: `inv-${Date.now()}`,
          organizationId: 'org-rozetka-1',
          email: payload.email,
          role: payload.role || 'MEMBER',
          token,
          inviteUrl: `http://localhost:1420/invite?token=${token}`,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        };
        mockInvitationsState.push(newInv);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newInv),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockOrganizationState.members),
        });
      }
    });

    await page.route(/\/api\/organizations\/org-rozetka-1\/members\/[^/]+$/, async (route) => {
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

    await page.route(/\/api\/invitations\/[^/]+$/, async (route) => {
      const url = route.request().url();
      if (url.includes('/accept')) {
        const payload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'usr-invited-1',
              email: 'maria@rozetka.ua',
              fullName: payload.fullName || 'Maria',
              role: 'USER',
              organization: {
                id: 'org-rozetka-1',
                name: 'Rozetka Top Sellers LLC',
                role: 'MEMBER',
              },
            },
            tokens: {
              accessToken: 'mock-invited-token',
              refreshToken: 'mock-invited-refresh',
              tokenType: 'Bearer',
              expiresIn: 900,
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'SF-INV-valid-token-123',
            email: 'maria@rozetka.ua',
            role: 'MEMBER',
            organizationName: 'Rozetka Top Sellers LLC',
            inviterName: 'Alex Shevchenko',
            isExistingUser: false,
            isValid: true,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          }),
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

  test('3. PRO план: генерує інвайт-лінк, показує екран копіювання та додає в список очікуючих', async ({
    page,
  }) => {
    // Встановлюємо стан PRO з 3 місцями
    mockOrganizationState.activePlan = 'PRO';
    mockOrganizationState.maxTeamSeats = 3;
    mockLicenseState.planType = 'PRO';
    mockLicenseState.maxTeamSeats = 3;

    await page.goto('/team');
    await expect(page.locator('[data-testid="team-page"]')).toBeVisible();

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

    // Перевіряємо екран згенерованого посилання
    await expect(page.locator('[data-testid="copy-invite-link-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="generated-invite-link-input"]')).toHaveValue(
      /.*\/invite\?token=SF-INV-.*/,
    );

    // Клік на Готово
    await page.locator('[data-testid="done-invite-btn"]').click();
    await expect(inviteDialog).not.toBeVisible();

    // Перевіряємо блок "Очікують прийняття"
    await expect(page.locator('[data-testid="pending-invitations-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-invitations-card"]')).toContainText(
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
        email: 'maria@rozetka.ua',
        fullName: 'Maria',
        role: 'MEMBER',
        joinedAt: new Date().toISOString(),
      },
    ];

    await page.goto('/team');
    await expect(page.locator('[data-testid="team-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="seats-count-label"]')).toContainText('2 / 3');

    // Клік на кнопку видалення для maria@rozetka.ua
    const removeBtn = page.locator('[data-testid="remove-member-btn-mem-2"]');
    await removeBtn.click();

    // Модальне вікно підтвердження
    const removeDialog = page.locator('[data-testid="remove-member-dialog"]');
    await expect(removeDialog).toBeVisible();
    await expect(removeDialog).toContainText('maria@rozetka.ua');

    // Підтверджуємо видалення
    await page.locator('[data-testid="confirm-remove-member-btn"]').click();

    // Перевіряємо повідомлення успіху
    await expect(page.locator('[data-testid="team-success-alert"]')).toBeVisible();

    // Лічильник зменшився до 1 / 3
    await expect(page.locator('[data-testid="seats-count-label"]')).toContainText('1 / 3');
  });

  test('6. Зміна назви компанії через діалог оновлює заголовок', async ({ page }) => {
    await page.goto('/team');
    await expect(page.locator('[data-testid="team-page"]')).toBeVisible();

    // Відкриваємо діалог зміни назви
    await page.locator('[data-testid="edit-company-name-btn"]').click();

    const editDialog = page.locator('[data-testid="edit-company-dialog"]');
    await expect(editDialog).toBeVisible();

    // Вводимо нову назву
    const nameInput = page.locator('[data-testid="edit-company-name-input"]');
    await nameInput.fill('Rozetka Global Supermarket');
    await page.locator('[data-testid="save-company-name-btn"]').click();

    // Перевіряємо оновлення заголовку
    await expect(page.locator('[data-testid="team-success-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="company-title"]')).toHaveText(
      'Rozetka Global Supermarket',
    );
  });

  test('7. Прийняття інвайту (/invite?token=...) новим користувачем', async ({ page }) => {
    await page.goto('/invite?token=SF-INV-valid-token-123');

    // Перевіряємо інформацію про компанію
    await expect(page.locator('h1')).toHaveText('Rozetka Top Sellers LLC');

    // Заповнюємо ім'я та пароль
    await page.locator('[data-testid="invite-fullname-input"]').fill('Maria Polishchuk');
    await page.locator('[data-testid="invite-password-input"]').fill('StrongPassword123!');
    await page.locator('[data-testid="submit-accept-invite-btn"]').click();

    // Перенаправлення на /team
    await expect(page).toHaveURL(/.*\/team/);
  });

  test('8. Двомовність UI (UA ⇄ EN) для розділу Команда', async ({ page }) => {
    await page.goto('/team');
    await expect(page.locator('[data-testid="team-page"]')).toBeVisible();

    // Перевіряємо український текст
    await expect(page.locator('[data-testid="invite-member-btn"]')).toContainText(
      'Запросити колегу',
    );
    await expect(page.locator('[data-testid="team-members-list"]')).toContainText(
      'Учасники команди',
    );

    // Перемикаємо мову на EN
    await page.getByTestId('language-toggle').click();

    // Перевіряємо англійський текст
    await expect(page.locator('[data-testid="invite-member-btn"]')).toContainText(
      'Invite Colleague',
    );
    await expect(page.locator('[data-testid="team-members-list"]')).toContainText('Team Members');
  });

  test('9. Запрошений учасник (MEMBER) не бачить меню Тарифи та отримує readonly режим на /plans', async ({
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

    // Перевіряємо, що пункт "Тарифи" (/plans) відсутній у сайдбарі
    await expect(page.locator('[data-testid="nav-link-plans"]')).toHaveCount(0);

    // Прямий перехід на /plans показує корпоративну картку без кнопок зміни тарифу
    await page.goto('/plans');
    await expect(page.locator('[data-testid="invited-member-plan-card"]')).toBeVisible();
  });
});
