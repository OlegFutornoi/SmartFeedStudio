import { test, expect } from './fixtures/test';
import { AdminLicenseItemDto } from '@smartfeed/shared';

test.describe('Admin Portal — Реєстр Ліцензій та Фільтрація (POM E2E)', () => {
  let mockLicenses: AdminLicenseItemDto[];

  test.beforeEach(async ({ page }) => {
    mockLicenses = [
      {
        id: 'lic-1',
        userId: 'usr-01',
        licenseKey: 'SF-PRO-DEMO-9900-1122',
        planType: 'PRO',
        tariffPlanId: '22222222-2222-2222-2222-222222222222',
        tariffPlanNameUk: 'Професійний',
        tariffPlanNameEn: 'Professional',
        canCloudBackup: true,
        maxXmlLimit: 50000,
        aiCredits: 500,
        maxFeedsLimit: 999999,
        maxChannelsLimit: 15,
        maxTeamSeats: 3,
        maxSuppliersLimit: 15,
        hasApiAccess: true,
        hasFeedDiff: true,
        hasWhiteLabel: false,
        hasSso: false,
        hasAuditLog: false,
        isActive: true,
        expiresAt: '2026-12-31T23:59:59.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        user: {
          id: 'usr-01',
          email: 'customer@smartfeed.studio',
          fullName: 'Олег Футорний',
          role: 'USER',
        },
      },
      {
        id: 'lic-2',
        userId: 'usr-02',
        licenseKey: 'SF-FREE-STARTER-0011-2233',
        planType: 'STARTER',
        tariffPlanId: '11111111-1111-1111-1111-111111111111',
        tariffPlanNameUk: 'Старт',
        tariffPlanNameEn: 'Starter',
        canCloudBackup: false,
        maxXmlLimit: 500,
        aiCredits: 0,
        maxFeedsLimit: 1,
        maxChannelsLimit: 1,
        maxTeamSeats: 1,
        maxSuppliersLimit: 1,
        hasApiAccess: false,
        hasFeedDiff: false,
        hasWhiteLabel: false,
        hasSso: false,
        hasAuditLog: false,
        isActive: true,
        expiresAt: null,
        createdAt: '2026-01-02T00:00:00.000Z',
        user: {
          id: 'usr-02',
          email: 'kompdrivexxx@gmail.com',
          fullName: 'Іван Коваленко',
          role: 'USER',
        },
      },
      {
        id: 'lic-3',
        userId: 'usr-03',
        licenseKey: 'SF-ENT-VIP-7788-9900',
        planType: 'ENTERPRISE',
        tariffPlanId: '33333333-3333-3333-3333-333333333333',
        tariffPlanNameUk: 'Корпоративний',
        tariffPlanNameEn: 'Enterprise',
        canCloudBackup: true,
        maxXmlLimit: 500000,
        aiCredits: 2000,
        maxFeedsLimit: 999999,
        maxChannelsLimit: 999999,
        maxTeamSeats: 9999,
        maxSuppliersLimit: 9999,
        hasApiAccess: true,
        hasFeedDiff: true,
        hasWhiteLabel: true,
        hasSso: true,
        hasAuditLog: true,
        isActive: false,
        expiresAt: '2024-01-01T00:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        user: {
          id: 'usr-03',
          email: 'corp@bigtech.ua',
          fullName: 'Марія Сидоренко',
          role: 'USER',
        },
      },
    ];

    // Mock licenses endpoint: /api/licenses/admin
    await page.route('**/api/licenses/admin**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLicenses),
      });
    });
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('відображення сторінки виданих ліцензій та таблиці користувачів', async ({
    licensesPage,
  }) => {
    await licensesPage.goto();

    // Verify Title and Subtitle
    await expect(licensesPage.pageTitle).toBeVisible();

    // Verify all 3 licenses are initially visible
    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');
    await licensesPage.expectLicenseRowVisible('SF-FREE-STARTER-0011-2233');
    await licensesPage.expectLicenseRowVisible('SF-ENT-VIP-7788-9900');
    await expect(licensesPage.resultsCount).toContainText('Показано 3 з 3 ліцензій');
  });

  test('пошук ліцензій за ключем, email або ім’ям клієнта', async ({ licensesPage }) => {
    await licensesPage.goto();

    // 1. Пошук за ім'ям "Олег"
    await licensesPage.searchLicenses('Олег');
    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');
    await licensesPage.expectLicenseRowNotVisible('SF-FREE-STARTER-0011-2233');
    await licensesPage.expectLicenseRowNotVisible('SF-ENT-VIP-7788-9900');
    await expect(licensesPage.resultsCount).toContainText('Показано 1 з 3 ліцензій');

    // 2. Очищення пошуку
    await licensesPage.searchClearBtn.click();
    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');
    await licensesPage.expectLicenseRowVisible('SF-FREE-STARTER-0011-2233');
    await licensesPage.expectLicenseRowVisible('SF-ENT-VIP-7788-9900');

    // 3. Пошук за частиною ліцензійного ключа "STARTER"
    await licensesPage.searchLicenses('STARTER');
    await licensesPage.expectLicenseRowVisible('SF-FREE-STARTER-0011-2233');
    await licensesPage.expectLicenseRowNotVisible('SF-PRO-DEMO-9900-1122');
  });

  test('фасетна фільтрація за тарифом (Plan Tier) та непрозорість поповера', async ({
    licensesPage,
  }) => {
    await licensesPage.goto();

    // Перевірка візуальної непрозорості випадаючого меню (захист від просвічування контенту таблиці)
    await licensesPage.tierFilterBtn.click();
    const popover = licensesPage.page.getByTestId('licenses-filter-tier-popover');
    await expect(popover).toBeVisible();
    const bgColor = await popover.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(bgColor).not.toBe('transparent');
    const zIndex = await popover.evaluate((el) => window.getComputedStyle(el).zIndex);
    expect(Number(zIndex)).toBeGreaterThanOrEqual(50);

    // Вибірка тільки тарифу PRO
    const proOption = licensesPage.page.getByTestId('licenses-filter-tier-option-pro');
    await proOption.click();
    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');
    await licensesPage.expectLicenseRowNotVisible('SF-FREE-STARTER-0011-2233');
    await licensesPage.expectLicenseRowNotVisible('SF-ENT-VIP-7788-9900');
    await expect(licensesPage.resultsCount).toContainText('Показано 1 з 3 ліцензій');

    // Перемикання на STARTER
    await licensesPage.filterByTier('starter');
    await licensesPage.expectLicenseRowVisible('SF-FREE-STARTER-0011-2233');
    await licensesPage.expectLicenseRowNotVisible('SF-PRO-DEMO-9900-1122');
  });

  test('фасетна фільтрація за статусом дії (Active vs Expired)', async ({ licensesPage }) => {
    await licensesPage.goto();

    // Вибірка прострочених / неактивних ліцензій
    await licensesPage.filterByStatus('expired');
    await licensesPage.expectLicenseRowVisible('SF-ENT-VIP-7788-9900');
    await licensesPage.expectLicenseRowNotVisible('SF-PRO-DEMO-9900-1122');
    await licensesPage.expectLicenseRowNotVisible('SF-FREE-STARTER-0011-2233');

    // Вибірка активних ліцензій
    await licensesPage.filterByStatus('active');
    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');
    await licensesPage.expectLicenseRowVisible('SF-FREE-STARTER-0011-2233');
    await licensesPage.expectLicenseRowNotVisible('SF-ENT-VIP-7788-9900');
  });

  test('фасетна фільтрація за S3 хмарним бекапом', async ({ licensesPage }) => {
    await licensesPage.goto();

    // Вибірка ліцензій без хмарного бекапу
    await licensesPage.filterByCloud('no_cloud');
    await licensesPage.expectLicenseRowVisible('SF-FREE-STARTER-0011-2233');
    await licensesPage.expectLicenseRowNotVisible('SF-PRO-DEMO-9900-1122');
    await licensesPage.expectLicenseRowNotVisible('SF-ENT-VIP-7788-9900');

    // Вибірка ліцензій з S3 бекапом
    await licensesPage.filterByCloud('with_cloud');
    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');
    await licensesPage.expectLicenseRowVisible('SF-ENT-VIP-7788-9900');
    await licensesPage.expectLicenseRowNotVisible('SF-FREE-STARTER-0011-2233');
  });

  test('скидання всіх фільтрів кнопкою "Скинути фільтри"', async ({ licensesPage }) => {
    await licensesPage.goto();

    // Застосовуємо пошук і фільтр
    await licensesPage.searchLicenses('PRO');
    await licensesPage.filterByTier('pro');
    await expect(licensesPage.resetFiltersBtn).toBeVisible();

    // Скидаємо фільтри
    await licensesPage.resetFilters();
    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');
    await licensesPage.expectLicenseRowVisible('SF-FREE-STARTER-0011-2233');
    await licensesPage.expectLicenseRowVisible('SF-ENT-VIP-7788-9900');
    await expect(licensesPage.resultsCount).toContainText('Показано 3 з 3 ліцензій');
  });

  test('відображення порожнього стану при відсутності збігів', async ({ licensesPage }) => {
    await licensesPage.goto();

    // Пошук за неіснуючим значенням
    await licensesPage.searchLicenses('non-existent-xyz-key');
    await expect(licensesPage.emptyRow).toBeVisible();
    await expect(licensesPage.emptyRow).toContainText(
      'Жодної ліцензії за обраними фільтрами не знайдено',
    );

    // Скидання через кнопку в порожньому стані
    const emptyResetBtn = licensesPage.page.getByTestId('licenses-empty-reset-btn');
    await expect(emptyResetBtn).toBeVisible();
    await emptyResetBtn.click();

    // Всі ліцензії повертаються
    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');
    await licensesPage.expectLicenseRowVisible('SF-FREE-STARTER-0011-2233');
    await licensesPage.expectLicenseRowVisible('SF-ENT-VIP-7788-9900');
  });
});
