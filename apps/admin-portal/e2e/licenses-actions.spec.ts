import { test, expect } from '@e2e/fixtures/test';
import { AdminLicenseItemDto } from '@smartfeed/shared';
import { mockLicenses } from '@e2e/fixtures/licenses-mock-data';

test.describe('Admin Portal — Дії та Модалки Ліцензій (E2E)', () => {
  let licensesList: AdminLicenseItemDto[];

  test.beforeEach(async ({ page }) => {
    licensesList = JSON.parse(JSON.stringify(mockLicenses));

    await page.route(/\/api\/licenses\/admin/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(licensesList),
      });
    });

    await page.route(/\/api\/licenses\/[^/]+\/status/, async (route) => {
      const id = route.request().url().split('/')[5];
      const lic = licensesList.find((l) => l.id === id);
      if (lic) lic.isActive = !lic.isActive;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(lic),
      });
    });

    await page.route(/\/api\/licenses\/[^/]+$/, async (route) => {
      if (route.request().method() === 'DELETE') {
        const id = route.request().url().split('/')[5];
        licensesList = licensesList.filter((l) => l.id !== id);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });
  });

  test('призупинення активної ліцензії через меню дій 3 крапки', async ({ licensesPage }) => {
    await licensesPage.goto();

    const proBadge = licensesPage.page.getByTestId('license-status-badge-SF-PRO-DEMO-9900-1122');
    await expect(proBadge).toContainText('Активна');

    await licensesPage.toggleLicenseStatus('SF-PRO-DEMO-9900-1122');
    await expect(proBadge).toContainText('Призупинена');
  });

  test('відновлення призупиненої ліцензії через меню дій 3 крапки', async ({ licensesPage }) => {
    await licensesPage.goto();

    const entBadge = licensesPage.page.getByTestId('license-status-badge-SF-ENT-VIP-7788-9900');
    await expect(entBadge).toContainText('Призупинена');

    await licensesPage.toggleLicenseStatus('SF-ENT-VIP-7788-9900');
    await expect(entBadge).not.toContainText('Призупинена');
  });

  test('меню дій 3 крапки: повна видимість та відсутність обрізання таблицею', async ({
    licensesPage,
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await licensesPage.goto();
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });

    const actionBtn = page.getByTestId('license-actions-btn-SF-PRO-DEMO-9900-1122');
    await expect(actionBtn).toBeVisible();

    await actionBtn.click();
    const menu = page.getByTestId('license-actions-menu-SF-PRO-DEMO-9900-1122');
    await expect(menu).toBeVisible();

    const menuBox = await menu.boundingBox();
    expect(menuBox).not.toBeNull();
    expect(menuBox!.height).toBeGreaterThanOrEqual(70);

    const toggleBtn = page.getByTestId('license-action-toggle-SF-PRO-DEMO-9900-1122');
    const deleteBtn = page.getByTestId('license-action-delete-SF-PRO-DEMO-9900-1122');
    await expect(toggleBtn).toBeVisible();
    await expect(deleteBtn).toBeVisible();
  });

  test('видалення ліцензії через меню дій та модальне вікно підтвердження', async ({
    licensesPage,
  }) => {
    await licensesPage.goto();

    await licensesPage.expectLicenseRowVisible('SF-FREE-STARTER-0011-2233');

    await licensesPage.clickDeleteLicense('SF-FREE-STARTER-0011-2233');
    const modal = licensesPage.page.getByTestId('license-delete-modal-SF-FREE-STARTER-0011-2233');
    await expect(modal).toBeVisible();

    const modalOpacity = await modal.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(Number(modalOpacity)).toBe(1);

    await licensesPage.cancelDeleteLicense('SF-FREE-STARTER-0011-2233');
    await expect(modal).not.toBeVisible();
    await licensesPage.expectLicenseRowVisible('SF-FREE-STARTER-0011-2233');

    await licensesPage.clickDeleteLicense('SF-FREE-STARTER-0011-2233');
    await expect(modal).toBeVisible();
    await licensesPage.confirmDeleteLicense('SF-FREE-STARTER-0011-2233');

    await expect(modal).not.toBeVisible();
    await licensesPage.expectLicenseRowNotVisible('SF-FREE-STARTER-0011-2233');
  });

  test('двомовність UA ⇄ EN для статусів, колонок та меню дій', async ({ licensesPage, page }) => {
    await licensesPage.goto();

    await expect(licensesPage.pageTitle).toContainText('Видані ліцензії');
    await expect(page.getByText('Ліцензійний ключ')).toBeVisible();

    const langToggle = page.getByTestId('language-toggle-btn');
    if (await langToggle.isVisible()) {
      await langToggle.click();

      await expect(licensesPage.pageTitle).toContainText('Issued Customer Licenses');
      await expect(page.getByText('License Key')).toBeVisible();

      await licensesPage.openActionsMenu('SF-PRO-DEMO-9900-1122');
      await expect(page.getByText('Suspend License')).toBeVisible();
      await expect(page.getByText('Delete License')).toBeVisible();
    }
  });
});
