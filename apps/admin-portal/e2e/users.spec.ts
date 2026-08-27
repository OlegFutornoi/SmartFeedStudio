import { test, expect } from './fixtures/test';
import { UserListItemDto, Role, PlanType } from '@smartfeed/shared';

test.describe('Admin Portal — Керування Користувачами та Фільтрація (POM E2E)', () => {
  const mockUsers: UserListItemDto[] = [
    {
      id: 'usr-1',
      email: 'admin@smartfeed.studio',
      fullName: 'Головний Адмін',
      role: Role.SUPER_ADMIN,
      createdAt: '2026-01-01T00:00:00.000Z',
      license: {
        licenseKey: 'SF-ENT-VIP-0001',
        planType: PlanType.ENTERPRISE,
        maxXmlLimit: 999999,
        aiCredits: 5000,
        isActive: true,
      },
    },
    {
      id: 'usr-2',
      email: 'manager@smartfeed.studio',
      fullName: 'Менеджер Продажів',
      role: Role.ADMIN,
      createdAt: '2026-02-15T10:30:00.000Z',
      license: {
        licenseKey: 'SF-PRO-DEMO-0002',
        planType: PlanType.PRO,
        maxXmlLimit: 50000,
        aiCredits: 500,
        isActive: true,
      },
    },
    {
      id: 'usr-3',
      email: 'client@shop.ua',
      fullName: 'Петро Клієнт',
      role: Role.USER,
      createdAt: '2026-03-20T14:00:00.000Z',
      license: null,
    },
  ];

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/users*', async (route) => {
      const url = new URL(route.request().url());
      const search = url.searchParams.get('search')?.toLowerCase();
      const role = url.searchParams.get('role');

      let filtered = [...mockUsers];
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

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(filtered),
      });
    });
  });

  test('відображення сторінки користувачів, лічильника та рядків таблиці', async ({
    usersPage,
  }) => {
    await usersPage.goto();

    await expect(usersPage.headerTitle).toHaveText('Користувачі');
    await expect(usersPage.countBadge).toContainText('3');
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-2')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).toBeVisible();
  });

  test('пошук користувачів за ім’ям або email', async ({ usersPage }) => {
    await usersPage.goto();

    // Пошук за email "client@shop.ua"
    await usersPage.searchUsers('client@shop.ua');
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).not.toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-2')).not.toBeVisible();
    await expect(usersPage.countBadge).toContainText('1');

    // Очищення пошуку
    await usersPage.searchUsers('');
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-2')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).toBeVisible();
  });

  test('фільтрація користувачів за системною роллю', async ({ usersPage }) => {
    await usersPage.goto();

    // Фільтр за SUPER_ADMIN
    await usersPage.selectRole('super_admin');
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-2')).not.toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).not.toBeVisible();

    // Фільтр за USER
    await usersPage.selectRole('user');
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).not.toBeVisible();

    // Скидання на ВСІ
    await usersPage.selectRole('all');
    await expect(usersPage.page.getByTestId('user-table-row-usr-1')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-2')).toBeVisible();
    await expect(usersPage.page.getByTestId('user-table-row-usr-3')).toBeVisible();
  });

  test('динамічне перемикання мови UA ⇄ EN та перевірка перекладу таблиці', async ({
    usersPage,
  }) => {
    await usersPage.goto();

    // 1. Перевірка українських заголовків
    await expect(usersPage.thUser).toHaveText('Користувач');
    await expect(usersPage.thRole).toHaveText('Роль');
    await expect(usersPage.thPlan).toHaveText('Ліцензійний план');
    await expect(usersPage.thQuotas).toHaveText('Квоти & Ліміти');
    await expect(usersPage.thStatus).toHaveText('Статус');
    await expect(usersPage.thCreated).toHaveText('Дата реєстрації');

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
    await expect(usersPage.thPlan).toHaveText('License Plan');
    await expect(usersPage.thQuotas).toHaveText('Quotas & Limits');
    await expect(usersPage.thStatus).toHaveText('Status');
    await expect(usersPage.thCreated).toHaveText('Registration Date');

    // 4. Повернення на Українську
    await usersPage.toggleLanguage();
    await expect(usersPage.headerTitle).toHaveText('Користувачі');
  });

  test('відображення порожнього стану при відсутності збігів', async ({ usersPage }) => {
    await usersPage.goto();

    await usersPage.searchUsers('non_existing_user_xyz_999');
    await expect(usersPage.emptyState).toBeVisible();
    await expect(usersPage.emptyState).toContainText('Користувачів не знайдено');
  });
});
