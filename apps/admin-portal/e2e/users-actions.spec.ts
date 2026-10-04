import { test, expect } from '@e2e/fixtures/test';
import { UserListItemDto } from '@smartfeed/shared';
import { adminUser, ownerUser, memberUser } from '@e2e/fixtures/users-mock-data';

test.describe('Admin Portal — Дії та Модалки Користувачів (E2E)', () => {
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

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(currentMockUsers),
      });
    });
  });

  test('модальне вікно перегляду та керування командою організації', async ({ usersPage }) => {
    await usersPage.goto();

    await usersPage.page.getByTestId('user-row-team-badge-usr-3').click();

    const modal = usersPage.page.getByTestId('team-members-modal-usr-3');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('SmartFeed HQ');
    await expect(modal).toContainText('Петро Клієнт');
    await expect(usersPage.page.getByTestId('team-modal-row-usr-2')).toBeVisible();

    await usersPage.page.getByTestId('team-modal-close-btn').click();
    await expect(modal).not.toBeVisible();
  });

  test('меню дій 3 крапки: призупинення/відновлення та видалення користувача', async ({
    usersPage,
    page,
  }) => {
    await usersPage.goto();

    await page.getByTestId('user-actions-btn-usr-3').click();
    const menu = page.getByTestId('user-actions-menu-usr-3');
    await expect(menu).toBeVisible();

    await page.getByTestId('user-action-toggle-usr-3').click();
    await expect(
      page.getByTestId('user-table-row-usr-3').getByTestId('user-row-status'),
    ).toContainText('Призупинений');

    await page.getByTestId('user-actions-btn-usr-3').click();
    await page.getByTestId('user-action-delete-usr-3').click();

    const deleteModal = page.getByTestId('user-delete-modal-usr-3');
    await expect(deleteModal).toBeVisible();

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

    await expect(usersPage.page.getByTestId('create-user-company-input')).toBeVisible();
    await expect(usersPage.page.getByTestId('plan-option-starter')).toBeVisible();

    await usersPage.page.getByTestId('account-type-member').click();

    await expect(usersPage.page.getByTestId('create-user-org-select')).toBeVisible();
    await expect(usersPage.page.getByTestId('create-user-company-input')).not.toBeVisible();
    await expect(usersPage.page.getByTestId('plan-option-starter')).not.toBeVisible();

    await usersPage.page.getByTestId('create-user-cancel-btn').click();
  });
});
