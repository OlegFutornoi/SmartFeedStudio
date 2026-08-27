import { test, expect } from './fixtures/test';
import { AdminLicenseItemDto } from '@smartfeed/shared';

test.describe('Admin Portal — Реєстр Ліцензій (POM E2E)', () => {
  let mockLicenses: AdminLicenseItemDto[];

  test.beforeEach(async ({ page }) => {
    mockLicenses = [
      {
        id: 'lic-1',
        userId: 'usr-admin-01',
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
          id: 'usr-admin-01',
          email: 'customer@smartfeed.studio',
          fullName: 'Олег Футорний',
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

    // Verify License in Table
    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');
  });

  test('перевірка оновлення списку ліцензій за допомогою кнопки оновлення', async ({
    licensesPage,
  }) => {
    await licensesPage.goto();
    await expect(licensesPage.refreshLicensesBtn).toBeVisible();
    await licensesPage.refreshLicensesBtn.click();
    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');
  });
});
