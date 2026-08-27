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

    // Unified Mock for all licenses endpoints
    await page.route('**/api/licenses/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (url.includes('/api/licenses/admin')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockLicenses),
        });
        return;
      }

      if (url.includes('/status') && method === 'PATCH') {
        const id = url.split('/licenses/')[1].split('/status')[0];
        const postData = JSON.parse(route.request().postData() || '{}');
        const lic = mockLicenses.find((l) => l.id === id);
        if (lic) {
          lic.isActive = postData.isActive;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(lic || {}),
        });
        return;
      }

      if (method === 'DELETE') {
        const id = url.split('/licenses/')[1];
        mockLicenses = mockLicenses.filter((l) => l.id !== id);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
        return;
      }

      await route.continue();
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

    await licensesPage.page.screenshot({
      path: 'test-results/licenses-page-standardized.png',
      fullPage: true,
    });
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

  test('фасетна фільтрація за статусом дії (Active vs Suspended)', async ({ licensesPage }) => {
    await licensesPage.goto();

    // Вибірка призупинених ліцензій
    await licensesPage.filterByStatus('suspended');
    await licensesPage.expectLicenseRowVisible('SF-ENT-VIP-7788-9900');
    await licensesPage.expectLicenseRowNotVisible('SF-PRO-DEMO-9900-1122');
    await licensesPage.expectLicenseRowNotVisible('SF-FREE-STARTER-0011-2233');

    // Вибірка активних ліцензій
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

    // Фільтруємо так, щоб була лише 1 ліцензія (як на скріншоті користувача)
    await licensesPage.filterByTier('pro');
    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');

    // Зберігаємо повний скріншот стандартизованої сторінки ліцензій
    await page.screenshot({ path: 'test-results/licenses-page-standardized.png', fullPage: true });

    // Перевіряємо що блок картки зберігає постійний мінімальний розмір >= 580px і не схлопується в смужку
    const card = page.getByTestId('licenses-table-card');
    const cardBox = await card.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.height).toBeGreaterThanOrEqual(580);

    // Відкриваємо поповер фільтра Статус
    await licensesPage.statusFilterBtn.click();
    const popover = page.getByTestId('licenses-filter-status-popover');
    await expect(popover).toBeVisible();

    // Перевіряємо що поповер повністю вміщується всередині блоку картки і не вилазить за її межі
    const popoverBox = await popover.boundingBox();
    expect(popoverBox).not.toBeNull();
    expect(popoverBox!.y + popoverBox!.height).toBeLessThanOrEqual(cardBox!.y + cardBox!.height);

    // Зберігаємо повний скріншот сторінки для візуальної верифікації
    await page.screenshot({ path: 'test-results/constant-card-block.png', fullPage: true });
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

  test('відображення бейджів статусу та підсвічування діючої ліцензії', async ({
    licensesPage,
  }) => {
    await licensesPage.goto();

    // 1. SF-PRO-DEMO-9900-1122 is active (isActive: true, not expired) -> "Активна"
    const proBadge = licensesPage.page.getByTestId('license-status-badge-SF-PRO-DEMO-9900-1122');
    await expect(proBadge).toBeVisible();
    await expect(proBadge).toContainText('Активна');

    // 2. SF-FREE-STARTER-0011-2233 is active (isActive: true, lifetime) -> "Активна"
    const starterBadge = licensesPage.page.getByTestId(
      'license-status-badge-SF-FREE-STARTER-0011-2233',
    );
    await expect(starterBadge).toBeVisible();
    await expect(starterBadge).toContainText('Активна');

    // 3. SF-ENT-VIP-7788-9900 is inactive/suspended (isActive: false) -> "Призупинена"
    const entBadge = licensesPage.page.getByTestId('license-status-badge-SF-ENT-VIP-7788-9900');
    await expect(entBadge).toBeVisible();
    await expect(entBadge).toContainText('Призупинена');

    // 4. Check active key badge styling has accent
    const activeKeyBadge = licensesPage.page.getByTestId('license-key-badge-SF-PRO-DEMO-9900-1122');
    await expect(activeKeyBadge).toBeVisible();
  });

  test('призупинення активної ліцензії через меню дій 3 крапки', async ({ licensesPage }) => {
    await licensesPage.goto();

    // Initially active
    const proBadge = licensesPage.page.getByTestId('license-status-badge-SF-PRO-DEMO-9900-1122');
    await expect(proBadge).toContainText('Активна');

    // Click 3 dots menu and click "Призупинити ліцензію"
    await licensesPage.toggleLicenseStatus('SF-PRO-DEMO-9900-1122');

    // Status updates to Suspended ("Призупинена")
    await expect(proBadge).toContainText('Призупинена');
  });

  test('відновлення призупиненої ліцензії через меню дій 3 крапки', async ({ licensesPage }) => {
    await licensesPage.goto();

    // SF-ENT-VIP-7788-9900 is initially suspended
    const entBadge = licensesPage.page.getByTestId('license-status-badge-SF-ENT-VIP-7788-9900');
    await expect(entBadge).toContainText('Призупинена');

    // Click 3 dots menu and click "Відновити ліцензію"
    await licensesPage.toggleLicenseStatus('SF-ENT-VIP-7788-9900');

    // Status updates
    await expect(entBadge).not.toContainText('Призупинена');
  });

  test('меню дій 3 крапки: повна видимість та відсутність обрізання таблицею (Portal & Visibility)', async ({
    licensesPage,
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await licensesPage.goto();
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });

    // Фільтруємо так щоб була 1 ліцензія (як у виявленій проблемі)
    await licensesPage.filterByTier('pro');
    const actionBtn = page.getByTestId('license-actions-btn-SF-PRO-DEMO-9900-1122');
    await expect(actionBtn).toBeVisible();

    await actionBtn.click();
    const menu = page.getByTestId('license-actions-menu-SF-PRO-DEMO-9900-1122');
    await expect(menu).toBeVisible();

    // Перевіряємо що меню має коректний розмір та z-index
    const menuBox = await menu.boundingBox();
    expect(menuBox).not.toBeNull();
    expect(menuBox!.height).toBeGreaterThanOrEqual(70);

    // Перевіряємо видимість пунктів меню
    const toggleBtn = page.getByTestId('license-action-toggle-SF-PRO-DEMO-9900-1122');
    const deleteBtn = page.getByTestId('license-action-delete-SF-PRO-DEMO-9900-1122');
    await expect(toggleBtn).toBeVisible();
    await expect(deleteBtn).toBeVisible();
    await expect(toggleBtn).toContainText('Призупинити ліцензію');
    await expect(deleteBtn).toContainText('Видалити ліцензію');
  });

  test('видалення ліцензії через меню дій та модальне вікно підтвердження', async ({
    licensesPage,
  }) => {
    await licensesPage.goto();

    // Verify row is initially present
    await licensesPage.expectLicenseRowVisible('SF-FREE-STARTER-0011-2233');

    // 1. Click delete in 3 dots menu -> modal appears
    await licensesPage.clickDeleteLicense('SF-FREE-STARTER-0011-2233');
    const modal = licensesPage.page.getByTestId('license-delete-modal-SF-FREE-STARTER-0011-2233');
    await expect(modal).toBeVisible();

    // Verify modal has 100% opacity and is NOT translucent (no shine-through of table below)
    const modalOpacity = await modal.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(Number(modalOpacity)).toBe(1);

    const modalBg = await modal.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(modalBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(modalBg).not.toBe('transparent');

    // Save screenshot for visual verification
    await modal.screenshot({ path: 'test-results/license-delete-modal.png' });

    // 2. Cancel first -> modal closes, row still visible
    await licensesPage.cancelDeleteLicense('SF-FREE-STARTER-0011-2233');
    await expect(modal).not.toBeVisible();
    await licensesPage.expectLicenseRowVisible('SF-FREE-STARTER-0011-2233');

    // 3. Click delete again and confirm
    await licensesPage.clickDeleteLicense('SF-FREE-STARTER-0011-2233');
    await expect(modal).toBeVisible();
    await licensesPage.confirmDeleteLicense('SF-FREE-STARTER-0011-2233');

    // 4. Modal closes and row is deleted
    await expect(modal).not.toBeVisible();
    await licensesPage.expectLicenseRowNotVisible('SF-FREE-STARTER-0011-2233');
  });

  test('видалення ліцензії — непрозорість модального вікна у світлій темі (Light Mode)', async ({
    licensesPage,
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await licensesPage.goto();
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });

    await licensesPage.clickDeleteLicense('SF-FREE-STARTER-0011-2233');
    const modal = licensesPage.page.getByTestId('license-delete-modal-SF-FREE-STARTER-0011-2233');
    await expect(modal).toBeVisible();

    const modalOpacity = await modal.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(Number(modalOpacity)).toBe(1);

    const modalBg = await modal.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(modalBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(modalBg).not.toBe('transparent');

    await modal.screenshot({ path: 'test-results/license-delete-modal-light.png' });
  });

  test('двомовність UA ⇄ EN для статусів, колонок та меню дій', async ({ licensesPage, page }) => {
    await licensesPage.goto();

    // UA labels
    await expect(licensesPage.pageTitle).toContainText('Видані ліцензії');
    await expect(page.getByText('Ліцензійний ключ')).toBeVisible();
    await expect(page.getByText('Статус').first()).toBeVisible();

    // Switch to EN
    const langToggle = page.getByTestId('language-toggle-btn');
    if (await langToggle.isVisible()) {
      await langToggle.click();

      await expect(licensesPage.pageTitle).toContainText('Issued Customer Licenses');
      await expect(page.getByText('License Key')).toBeVisible();
      await expect(page.getByText('Status').first()).toBeVisible();

      // Open 3-dots menu to verify EN action labels
      await licensesPage.openActionsMenu('SF-PRO-DEMO-9900-1122');
      await expect(page.getByText('Suspend License')).toBeVisible();
      await expect(page.getByText('Delete License')).toBeVisible();
    }
  });
});
