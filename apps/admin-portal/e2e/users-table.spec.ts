import { test, expect } from '@e2e/fixtures/test';
import { UserListItemDto } from '@smartfeed/shared';
import { adminUser, ownerUser, memberUser } from '@e2e/fixtures/users-mock-data';

test.describe('Admin Portal — Таблиця та Фільтрація Користувачів (E2E)', () => {
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

      let filtered = currentMockUsers.filter((u) => {
        if (orgRoleFilter === 'OWNERS') return !u.organization || u.organization.isOwner;
        if (orgRoleFilter === 'MEMBERS') return u.organization && !u.organization.isOwner;
        return true;
      });

      if (role && role !== 'ALL') {
        filtered = filtered.filter((u) => u.role === role);
      }

      if (search) {
        filtered = filtered.filter(
          (u) =>
            u.email.toLowerCase().includes(search) ||
            (u.fullName && u.fullName.toLowerCase().includes(search)),
        );
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(filtered),
      });
    });
  });

  test('рендеринг списку користувачів', async ({ usersPage }) => {
    await usersPage.goto();

    await expect(usersPage.headerTitle).toBeVisible();
    await expect(usersPage.countBadge).toContainText('3');
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).toBeVisible();
  });

  test('розгортання підпунктів через шеврон (Accordion sub-rows)', async ({ usersPage }) => {
    await usersPage.goto();

    await expect(usersPage.page.getByTestId('user-table-subrow-usr-2')).not.toBeVisible();
    await usersPage.page.getByTestId('user-row-expand-btn-usr-3').click();

    await expect(usersPage.page.getByTestId('user-table-subrow-usr-2')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-subrow-usr-2')).toContainText(
      'manager@smartfeed.studio',
    );
    await expect(usersPage.page.getByTestId('user-table-subrow-usr-2')).toContainText('GROWTH');

    await usersPage.page.getByTestId('user-row-expand-btn-usr-3').click();
    await expect(usersPage.page.getByTestId('user-table-subrow-usr-2')).not.toBeVisible();
  });

  test('пошук користувачів за ім’ям або email', async ({ usersPage }) => {
    await usersPage.goto();

    await usersPage.searchUsers('client@shop.ua');
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).not.toBeVisible();

    await usersPage.searchUsers('');
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).toBeVisible();
  });

  test('фільтрація користувачів за системною роллю та роллю в команді', async ({ usersPage }) => {
    await usersPage.goto();

    await usersPage.selectRole('admin');
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).not.toBeVisible();

    await usersPage.selectRole('user');
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).not.toBeVisible();

    await usersPage.selectRole('all');
    await usersPage.selectTeamRole('owners');
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).not.toBeVisible();

    await usersPage.selectTeamRole('all');
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).toBeVisible();
  });

  test('динамічне перемикання мови UA ⇄ EN та перевірка перекладу таблиці', async ({
    usersPage,
  }) => {
    await usersPage.goto();

    await expect(usersPage.thUser).toHaveText('Користувач');
    await expect(usersPage.thRole).toHaveText('Роль');
    await expect(usersPage.thTeam).toHaveText('Організація / Команда');

    await usersPage.toggleLanguage();

    await expect(usersPage.headerTitle).toHaveText('Users');
    await expect(usersPage.thUser).toHaveText('User');
    await expect(usersPage.thRole).toHaveText('Role');

    await usersPage.toggleLanguage();
    await expect(usersPage.headerTitle).toHaveText('Користувачі');
  });

  test('відображення порожнього стану при відсутності збігів', async ({ usersPage }) => {
    await usersPage.goto();

    await usersPage.searchUsers('non_existing_user_xyz_999');
    await expect(usersPage.emptyState).toBeVisible();
    await expect(usersPage.emptyState).toContainText('Користувачів не знайдено');
  });

  test('скидання фільтрів кнопкою Скинути у фасетному тулбарі', async ({ usersPage, page }) => {
    await usersPage.goto();

    await usersPage.searchUsers('client');
    await usersPage.selectTeamRole('owners');

    const resetBtn = page.getByTestId('users-reset-filters-btn');
    await expect(resetBtn).toBeVisible();

    await resetBtn.click();
    await expect(page.getByTestId('user-table-row-usr-1')).toBeVisible();
    await expect(page.getByTestId('user-table-row-usr-3')).toBeVisible();
    await expect(resetBtn).not.toBeVisible();
  });

  test('відсутність кольорових емодзі у тулбарі та таблиці користувачів', async ({
    usersPage,
    page,
  }) => {
    await usersPage.goto();

    const toolbarText = await page.getByTestId('users-table-toolbar').innerText();
    const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/;
    expect(emojiRegex.test(toolbarText)).toBe(false);

    await page.getByTestId('users-filter-role').click();
    const rolePopoverText = await page.getByTestId('users-filter-role-popover').innerText();
    expect(emojiRegex.test(rolePopoverText)).toBe(false);
    expect(rolePopoverText).toContain('Адміністратор');

    await page.getByTestId('users-filter-role').click();
  });
});
