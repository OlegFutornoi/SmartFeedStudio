import { test, expect } from './fixtures/test';
import { UserListItemDto, Role, PlanType } from '@smartfeed/shared';

test.describe('Admin Portal — Керування Користувачами та Фільтрація (POM E2E)', () => {
  const memberUser: UserListItemDto = {
    id: 'usr-2',
    email: 'manager@smartfeed.studio',
    fullName: 'Менеджер Продажів',
    role: Role.USER,
    isActive: true,
    organization: {
      organizationId: 'org-1',
      organizationName: 'SmartFeed HQ',
      memberRole: 'MEMBER',
      isOwner: false,
      ownerEmail: 'client@shop.ua',
      ownerFullName: 'Петро Клієнт',
    },
    createdAt: '2026-02-15T10:30:00.000Z',
    license: {
      licenseKey: 'SF-PRO-DEMO-0002',
      planType: PlanType.PRO,
      maxXmlLimit: 50000,
      aiCredits: 500,
      isActive: true,
    },
  };

  const ownerUser: UserListItemDto = {
    id: 'usr-3',
    email: 'client@shop.ua',
    fullName: 'Петро Клієнт',
    role: Role.USER,
    isActive: true,
    organization: {
      organizationId: 'org-1',
      organizationName: 'SmartFeed HQ',
      memberRole: 'OWNER',
      isOwner: true,
    },
    membersCount: 1,
    teamMembers: [memberUser],
    createdAt: '2026-03-20T14:00:00.000Z',
    license: {
      licenseKey: 'SF-GROWTH-0003',
      planType: PlanType.GROWTH,
      maxXmlLimit: 10000,
      aiCredits: 100,
      isActive: true,
    },
  };

  const adminUser: UserListItemDto = {
    id: 'usr-1',
    email: 'admin1@smartfeed.studio',
    fullName: 'Головний Адміністратор',
    role: Role.ADMIN,
    isActive: true,
    organization: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    license: null,
  };

  let currentMockUsers: UserListItemDto[];

  test.beforeEach(async ({ page }) => {
    currentMockUsers = JSON.parse(JSON.stringify([adminUser, ownerUser, memberUser]));

    await page.route(/\/api\/users/, async (route) => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());

      if (method === 'PATCH' && url.pathname.includes('/status')) {
        const postData = JSON.parse(request.postData() || '{}');
        const userId = url.pathname.split('/')[3];
        const user = currentMockUsers.find((u) => u.id === userId);
        if (user) {
          user.isActive = postData.isActive;
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(user || { ...currentMockUsers[0], isActive: postData.isActive }),
        });
      }

      if (method === 'DELETE') {
        const userId = url.pathname.split('/')[3];
        currentMockUsers = currentMockUsers.filter((u) => u.id !== userId);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }

      const search = url.searchParams.get('search')?.toLowerCase();
      const role = url.searchParams.get('role');
      const orgRoleFilter = url.searchParams.get('orgRoleFilter');

      let filtered = [...currentMockUsers];
      if (search) {
        filtered = filtered.filter(
          (u) =>
            u.email.toLowerCase().includes(search) ||
            (u.fullName && u.fullName.toLowerCase().includes(search)),
        );
      }
      if (role && role !== 'ALL') {
        filtered = filtered.filter((u) => u.role === role);
      }
      if (orgRoleFilter && orgRoleFilter !== 'ALL') {
        if (orgRoleFilter === 'OWNERS') {
          filtered = filtered
            .filter((u) => u.organization?.isOwner === true)
            .map((u) => ({ ...u, teamMembers: [] }));
        } else if (orgRoleFilter === 'MEMBERS') {
          filtered = filtered.filter((u) => u.organization && !u.organization.isOwner);
        }
      } else if (!search && !role) {
        // By default without search/role filters, top-level rows are Owners or Standalone users
        filtered = filtered.filter((u) => !u.organization || u.organization.isOwner);
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(filtered),
      });
    });
  });

  test('відображення сторінки користувачів, лічильника та рядків таблиці з бейджами команд', async ({
    usersPage,
  }) => {
    await usersPage.goto();

    await expect(usersPage.headerTitle).toHaveText('Користувачі');
    await expect(usersPage.countBadge).toContainText('3');
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).toBeVisible();

    // Перевірка бейджів ролі в команді
    await expect(
      usersPage.page.getByTestId('user-table-row-usr-3').getByTestId('user-row-role-owner'),
    ).toBeVisible();
    await expect(
      usersPage.page.getByTestId('user-table-row-usr-3').getByTestId('user-row-team-badge-usr-3'),
    ).toBeVisible();

    // Зберігаємо скріншот оновленої сторінки користувачів
    await usersPage.page.screenshot({
      path: 'test-results/users-page-minimalist.png',
      fullPage: true,
    });
  });

  test('розгортання підпунктів запрошених співробітників через шеврон (Accordion sub-rows)', async ({
    usersPage,
  }) => {
    await usersPage.goto();

    // Спочатку вкладений рядок під власником схований
    await expect(usersPage.page.getByTestId('user-table-subrow-usr-2')).not.toBeVisible();

    // Натискаємо кнопку-шеврон на рядку власника
    await usersPage.page.getByTestId('user-row-expand-btn-usr-3').click();

    // Вкладений рядок розгорнувся безпосередньо під власником
    await expect(usersPage.page.getByTestId('user-table-subrow-usr-2')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-subrow-usr-2')).toContainText(
      'manager@smartfeed.studio',
    );
    await expect(usersPage.page.getByTestId('user-table-subrow-usr-2')).toContainText('GROWTH');

    await usersPage.page.screenshot({
      path: 'test-results/users-hierarchical-expanded.png',
    });

    // Повторний клік згортає вкладений список
    await usersPage.page.getByTestId('user-row-expand-btn-usr-3').click();
    await expect(usersPage.page.getByTestId('user-table-subrow-usr-2')).not.toBeVisible();
  });

  test('модальне вікно перегляду та керування командою організації', async ({ usersPage }) => {
    await usersPage.goto();

    // Клікаємо на бейдж команди у рядку власника
    await usersPage.page.getByTestId('user-row-team-badge-usr-3').click();

    // Модальне вікно команди відкрито
    const modal = usersPage.page.getByTestId('team-members-modal-usr-3');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('SmartFeed HQ');
    await expect(modal).toContainText('Петро Клієнт');
    await expect(usersPage.page.getByTestId('team-modal-row-usr-2')).toBeVisible();

    await usersPage.page.screenshot({
      path: 'test-results/users-team-modal.png',
    });

    // Закриваємо модалку
    await usersPage.page.getByTestId('team-modal-close-btn').click();
    await expect(modal).not.toBeVisible();
  });

  test('меню дій 3 крапки: призупинення/відновлення та видалення користувача', async ({
    usersPage,
    page,
  }) => {
    await usersPage.goto();

    // 1. Відкриваємо меню дій для usr-3
    await page.getByTestId('user-actions-btn-usr-3').click();
    const menu = page.getByTestId('user-actions-menu-usr-3');
    await expect(menu).toBeVisible();

    await page.screenshot({
      path: 'test-results/users-actions-menu.png',
    });

    // 2. Клікаємо "Призупинити користувача"
    await page.getByTestId('user-action-toggle-usr-3').click();
    await expect(
      page.getByTestId('user-table-row-usr-3').getByTestId('user-row-status'),
    ).toContainText('Призупинений');

    // 3. Відкриваємо меню та клікаємо "Видалити користувача"
    await page.getByTestId('user-actions-btn-usr-3').click();
    await page.getByTestId('user-action-delete-usr-3').click();

    // Відкрився діалог підтвердження видалення
    const deleteModal = page.getByTestId('user-delete-modal-usr-3');
    await expect(deleteModal).toBeVisible();

    // Підтверджуємо видалення
    await page.getByTestId('user-delete-confirm-btn').click();
    await expect(deleteModal).not.toBeVisible();
    await expect(page.getByTestId('user-table-row-usr-3')).not.toBeVisible();
  });

  test('діалог створення користувача: приховування тарифного плану для Запрошеного співробітника', async ({
    usersPage,
  }) => {
    await usersPage.goto();
    await usersPage.page.getByTestId('open-create-user-dialog-btn').click();
    await expect(usersPage.page.getByTestId('create-user-dialog')).toBeVisible();

    // За замовчуванням Власник: видно назву компанії та вибір тарифу
    await expect(usersPage.page.getByTestId('create-user-company-input')).toBeVisible();
    await expect(usersPage.page.getByTestId('plan-option-starter')).toBeVisible();

    // Перемикаємося на Запрошений
    await usersPage.page.getByTestId('account-type-member').click();

    // Перевіряємо, що з'явився вибір компанії, а вибір тарифного плану та назва компанії ПРИХОВАНІ
    await expect(usersPage.page.getByTestId('create-user-org-select')).toBeVisible();
    await expect(usersPage.page.getByTestId('create-user-company-input')).not.toBeVisible();
    await expect(usersPage.page.getByTestId('plan-option-starter')).not.toBeVisible();

    // Зберігаємо скріншот модалки для запрошеного
    await usersPage.page.screenshot({
      path: 'test-results/create-user-member-dialog.png',
    });

    await usersPage.page.getByTestId('create-user-cancel-btn').click();
  });

  test('пошук користувачів за ім’ям або email', async ({ usersPage }) => {
    await usersPage.goto();

    // Пошук за email "client@shop.ua"
    await usersPage.searchUsers('client@shop.ua');
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).not.toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-2')).not.toBeVisible();
    await expect(usersPage.countBadge).toContainText('2');

    // Очищення пошуку
    await usersPage.searchUsers('');
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).toBeVisible();
  });

  test('фільтрація користувачів за системною роллю та роллю в команді', async ({ usersPage }) => {
    await usersPage.goto();

    // Фільтр за ADMIN
    await usersPage.selectRole('admin');
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-2')).not.toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).not.toBeVisible();

    // Фільтр за USER
    await usersPage.selectRole('user');
    await expect(usersPage.page.getByTestId('user-table-row-usr-2')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).not.toBeVisible();

    // Скидання на ВСІ системні ролі
    await usersPage.selectRole('all');

    // Фільтр за Власниками компаній
    await usersPage.selectTeamRole('owners');
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).not.toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-2')).not.toBeVisible();
    await expect(usersPage.countBadge).toContainText('1');

    await usersPage.page.screenshot({
      path: 'test-results/users-filter-owners-clean.png',
      fullPage: true,
    });

    // Фільтр за Запрошеними співробітниками
    await usersPage.selectTeamRole('members');
    await expect(usersPage.page.getByTestId('user-table-row-usr-2')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).not.toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).not.toBeVisible();
    await expect(usersPage.countBadge).toContainText('1');

    await usersPage.page.screenshot({
      path: 'test-results/users-filter-members-clean.png',
      fullPage: true,
    });

    // Скидання на ВСІ статуси
    await usersPage.selectTeamRole('all');
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).toBeVisible();
  });

  test('динамічне перемикання мови UA ⇄ EN та перевірка перекладу таблиці', async ({
    usersPage,
  }) => {
    await usersPage.goto();

    // 1. Перевірка українських заголовків та кнопок фільтрів
    await expect(usersPage.thUser).toHaveText('Користувач');
    await expect(usersPage.thRole).toHaveText('Роль');
    await expect(usersPage.thTeam).toHaveText('Організація / Команда');
    await expect(usersPage.thPlan).toHaveText('Ліцензійний план');
    await expect(usersPage.thStatus).toHaveText('Статус');
    await expect(usersPage.thCreated).toHaveText('Дата реєстрації');
    await expect(usersPage.thActions).toHaveText('Дії');
    await expect(usersPage.page.getByTestId('users-filter-role')).toContainText('Роль');
    await expect(usersPage.page.getByTestId('users-filter-team')).toContainText('Команда');

    // 2. Перемикання на Англійську
    await usersPage.toggleLanguage();

    // 3. Перевірка оновлення англійською
    await expect(usersPage.headerTitle).toHaveText('Users');
    await expect(usersPage.headerSubtitle).toHaveText(
      'Manage platform user accounts, security roles, and subscriptions',
    );
    await expect(usersPage.searchInput).toHaveAttribute(
      'placeholder',
      'Search by email or name...',
    );
    await expect(usersPage.thUser).toHaveText('User');
    await expect(usersPage.thRole).toHaveText('Role');
    await expect(usersPage.thTeam).toHaveText('Organization / Team');
    await expect(usersPage.thPlan).toHaveText('License Plan');
    await expect(usersPage.thStatus).toHaveText('Status');
    await expect(usersPage.thCreated).toHaveText('Registration Date');
    await expect(usersPage.thActions).toHaveText('Actions');
    await expect(usersPage.page.getByTestId('users-filter-role')).toContainText('Role');
    await expect(usersPage.page.getByTestId('users-filter-team')).toContainText('Team');

    // 4. Повернення на Українську
    await usersPage.toggleLanguage();
    await expect(usersPage.headerTitle).toHaveText('Користувачі');
    await expect(usersPage.page.getByTestId('users-filter-role')).toContainText('Роль');
    await expect(usersPage.page.getByTestId('users-filter-team')).toContainText('Команда');
  });

  test('відображення порожнього стану при відсутності збігів', async ({ usersPage }) => {
    await usersPage.goto();

    await usersPage.searchUsers('non_existing_user_xyz_999');
    await expect(usersPage.emptyState).toBeVisible();
    await expect(usersPage.emptyState).toContainText('Користувачів не знайдено');
  });

  test('скидання фільтрів кнопкою Скинути у фасетному тулбарі', async ({ usersPage, page }) => {
    await usersPage.goto();

    // Застосовуємо фільтр та пошук
    await usersPage.searchUsers('client');
    await usersPage.selectTeamRole('owners');

    // Кнопка скидання з'явилася
    const resetBtn = page.getByTestId('users-reset-filters-btn');
    await expect(resetBtn).toBeVisible();

    // Натискаємо кнопку скидання
    await resetBtn.click();

    // Всі користувачі знову відображаються
    await expect(page.getByTestId('user-table-row-usr-1')).toBeVisible();
    await expect(page.getByTestId('user-table-row-usr-3')).toBeVisible();
    await expect(resetBtn).not.toBeVisible();
  });

  test('відсутність кольорових емодзі у тулбарі та таблиці користувачів', async ({
    usersPage,
    page,
  }) => {
    await usersPage.goto();

    // Перевіряємо текст тулбара
    const toolbarText = await page.getByTestId('users-table-toolbar').innerText();
    // Regex перевіряє типові системні емодзі (👑, 👥, 👤, тощо)
    const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/;
    expect(emojiRegex.test(toolbarText)).toBe(false);

    // Відкриваємо дропдаун ролей та перевіряємо переклад варіантів
    await page.getByTestId('users-filter-role').click();
    const rolePopoverText = await page.getByTestId('users-filter-role-popover').innerText();
    expect(emojiRegex.test(rolePopoverText)).toBe(false);
    expect(rolePopoverText).toContain('Адміністратор');
    expect(rolePopoverText).toContain('Користувач');

    await page.screenshot({
      path: 'test-results/users-role-filter-clean.png',
    });

    await page.getByTestId('users-filter-role').click();

    // Відкриваємо дропдаун команд та перевіряємо відсутність емодзі у варіантах
    await page.getByTestId('users-filter-team').click();
    const popoverText = await page.getByTestId('users-filter-team-popover').innerText();
    expect(emojiRegex.test(popoverText)).toBe(false);
    expect(popoverText).not.toContain('Solo');

    await page.screenshot({
      path: 'test-results/users-team-filter-clean.png',
    });
  });
});
