import { test, expect } from '@e2e/fixtures/test';
import { AdminLicenseItemDto } from '@smartfeed/shared';
import { mockLicenses } from '@e2e/fixtures/licenses-mock-data';

test.describe('Admin Portal — Реєстр та Фільтрація Ліцензій (E2E)', () => {
  let licensesList: AdminLicenseItemDto[];

  test.beforeEach(async ({ page }) => {
    licensesList = JSON.parse(JSON.stringify(mockLicenses));

    await page.route(/\/api\/licenses\/admin/, async (route) => {
      const url = new URL(route.request().url());
      const search = url.searchParams.get('search')?.toLowerCase();
      const planType = url.searchParams.get('planType');
      const status = url.searchParams.get('status');
      const cloud = url.searchParams.get('cloud');

      let filtered = [...licensesList];

      if (search) {
        filtered = filtered.filter(
          (lic) =>
            lic.licenseKey.toLowerCase().includes(search) ||
            lic.user?.email.toLowerCase().includes(search) ||
            (lic.user?.fullName && lic.user.fullName.toLowerCase().includes(search)),
        );
      }

      if (planType && planType !== 'ALL') {
        filtered = filtered.filter((lic) => lic.planType === planType.toUpperCase());
      }

      if (status && status !== 'ALL') {
        const isActive = status === 'ACTIVE';
        filtered = filtered.filter((lic) => lic.isActive === isActive);
      }

      if (cloud && cloud !== 'ALL') {
        const hasCloud = cloud === 'WITH_CLOUD';
        filtered = filtered.filter((lic) => lic.canCloudBackup === hasCloud);
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(filtered),
      });
    });
  });

  test('пошук ліцензій за email користувача та частиною ліцензійного ключа', async ({
    licensesPage,
  }) => {
    await licensesPage.goto();

    await licensesPage.searchLicenses('customer@smartfeed.studio');
    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');
    await licensesPage.expectLicenseRowNotVisible('SF-FREE-STARTER-0011-2233');
    await licensesPage.expectLicenseRowNotVisible('SF-ENT-VIP-7788-9900');
    await expect(licensesPage.resultsCount).toContainText('Показано 1 з 3 ліцензій');

    await licensesPage.searchClearBtn.click();
    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');
    await licensesPage.expectLicenseRowVisible('SF-FREE-STARTER-0011-2233');

    await licensesPage.searchLicenses('STARTER');
    await licensesPage.expectLicenseRowVisible('SF-FREE-STARTER-0011-2233');
    await licensesPage.expectLicenseRowNotVisible('SF-PRO-DEMO-9900-1122');
  });

  test('фасетна фільтрація за тарифом (Plan Tier) та непрозорість поповера', async ({
    licensesPage,
  }) => {
    await licensesPage.goto();

    await licensesPage.tierFilterBtn.click();
    const popover = licensesPage.page.getByTestId('licenses-filter-tier-popover');
    await expect(popover).toBeVisible();
    const bgColor = await popover.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(bgColor).not.toBe('transparent');
    const zIndex = await popover.evaluate((el) => window.getComputedStyle(el).zIndex);
    expect(Number(zIndex)).toBeGreaterThanOrEqual(50);

    const proOption = licensesPage.page.getByTestId('licenses-filter-tier-option-pro');
    await proOption.click();
    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');
    await licensesPage.expectLicenseRowNotVisible('SF-FREE-STARTER-0011-2233');
    await expect(licensesPage.resultsCount).toContainText('Показано 1 з 3 ліцензій');

    await licensesPage.filterByTier('starter');
    await licensesPage.expectLicenseRowVisible('SF-FREE-STARTER-0011-2233');
    await licensesPage.expectLicenseRowNotVisible('SF-PRO-DEMO-9900-1122');
  });

  test('фасетна фільтрація за статусом дії (Active vs Suspended)', async ({ licensesPage }) => {
    await licensesPage.goto();

    await licensesPage.filterByStatus('suspended');
    await licensesPage.expectLicenseRowVisible('SF-ENT-VIP-7788-9900');
    await licensesPage.expectLicenseRowNotVisible('SF-PRO-DEMO-9900-1122');

    await licensesPage.filterByStatus('active');
    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');
    await licensesPage.expectLicenseRowVisible('SF-FREE-STARTER-0011-2233');
    await licensesPage.expectLicenseRowNotVisible('SF-ENT-VIP-7788-9900');
  });

  test('постійний розмір блоку картки ліцензій (min-height) та коректне вміщення поповера фільтра', async ({
    licensesPage,
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await licensesPage.goto();
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });

    await licensesPage.filterByTier('pro');
    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');

    const card = page.getByTestId('licenses-table-card');
    const cardBox = await card.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.height).toBeGreaterThanOrEqual(580);

    await licensesPage.statusFilterBtn.click();
    const popover = page.getByTestId('licenses-filter-status-popover');
    await expect(popover).toBeVisible();

    const popoverBox = await popover.boundingBox();
    expect(popoverBox).not.toBeNull();
    expect(popoverBox!.y + popoverBox!.height).toBeLessThanOrEqual(cardBox!.y + cardBox!.height);
  });

  test('фасетна фільтрація за S3 хмарним бекапом', async ({ licensesPage }) => {
    await licensesPage.goto();

    await licensesPage.filterByCloud('no_cloud');
    await licensesPage.expectLicenseRowVisible('SF-FREE-STARTER-0011-2233');
    await licensesPage.expectLicenseRowNotVisible('SF-PRO-DEMO-9900-1122');

    await licensesPage.filterByCloud('with_cloud');
    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');
    await licensesPage.expectLicenseRowVisible('SF-ENT-VIP-7788-9900');
    await licensesPage.expectLicenseRowNotVisible('SF-FREE-STARTER-0011-2233');
  });

  test('скидання всіх фільтрів кнопкою "Скинути фільтри"', async ({ licensesPage }) => {
    await licensesPage.goto();

    await licensesPage.searchLicenses('PRO');
    await licensesPage.filterByTier('pro');
    await expect(licensesPage.resetFiltersBtn).toBeVisible();

    await licensesPage.resetFilters();
    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');
    await licensesPage.expectLicenseRowVisible('SF-FREE-STARTER-0011-2233');
    await licensesPage.expectLicenseRowVisible('SF-ENT-VIP-7788-9900');
    await expect(licensesPage.resultsCount).toContainText('Показано 3 з 3 ліцензій');
  });

  test('відображення порожнього стану при відсутності збігів', async ({ licensesPage }) => {
    await licensesPage.goto();

    await licensesPage.searchLicenses('non-existent-xyz-key');
    await expect(licensesPage.emptyRow).toBeVisible();
    await expect(licensesPage.emptyRow).toContainText(
      'Жодної ліцензії за обраними фільтрами не знайдено',
    );

    const emptyResetBtn = licensesPage.page.getByTestId('licenses-empty-reset-btn');
    await expect(emptyResetBtn).toBeVisible();
    await emptyResetBtn.click();

    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');
    await licensesPage.expectLicenseRowVisible('SF-FREE-STARTER-0011-2233');
  });

  test('відображення бейджів статусу та підсвічування діючої ліцензії', async ({
    licensesPage,
  }) => {
    await licensesPage.goto();

    const proBadge = licensesPage.page.getByTestId('license-status-badge-SF-PRO-DEMO-9900-1122');
    await expect(proBadge).toBeVisible();
    await expect(proBadge).toContainText('Активна');

    const starterBadge = licensesPage.page.getByTestId(
      'license-status-badge-SF-FREE-STARTER-0011-2233',
    );
    await expect(starterBadge).toBeVisible();
    await expect(starterBadge).toContainText('Активна');

    const entBadge = licensesPage.page.getByTestId('license-status-badge-SF-ENT-VIP-7788-9900');
    await expect(entBadge).toBeVisible();
    await expect(entBadge).toContainText('Призупинена');
  });
});
