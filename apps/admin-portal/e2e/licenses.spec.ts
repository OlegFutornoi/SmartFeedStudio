import { test, expect } from './fixtures/test';
import { TariffPlanDto, AdminLicenseItemDto } from '@smartfeed/shared';

test.describe('Admin Portal — Тарифні плани та ліцензії (POM E2E)', () => {
  let mockPlans: TariffPlanDto[];
  let mockLicenses: AdminLicenseItemDto[];

  test.beforeEach(async ({ page }) => {
    mockPlans = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        code: 'FREE',
        nameUk: 'Базовий Безкоштовний',
        nameEn: 'Free Starter',
        descriptionUk: 'Базовий тариф для тестування',
        descriptionEn: 'Basic starter plan',
        priceMonthly: 0,
        priceYearly: 0,
        currency: 'USD',
        maxXmlLimit: 1000,
        aiCredits: 50,
        canCloudBackup: false,
        isPopular: false,
        isActive: true,
        order: 1,
        durationDays: 7,
        maxFeedsLimit: 1,
        maxChannelsLimit: 1,
        syncFrequencyHours: 0,
        maxStorageGb: 0,
        maxTeamSeats: 1,
        hasApiAccess: false,
        hasWebhooks: false,
        hasFeedDiff: false,
        hasWhiteLabel: false,
        hasSso: false,
        hasAuditLog: false,
        hasCustomS3: false,
        hasPriorityAi: false,
        featuresUk: ['1,000 XML позицій', '50 AI кредитів'],
        featuresEn: ['1,000 XML items', '50 AI credits'],
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        code: 'PRO',
        nameUk: 'Професійний',
        nameEn: 'Professional',
        descriptionUk: 'Для магазинів з розширеним каталогом',
        descriptionEn: 'For growing e-commerce stores',
        priceMonthly: 49,
        priceYearly: 490,
        currency: 'USD',
        maxXmlLimit: 50000,
        aiCredits: 500,
        canCloudBackup: true,
        isPopular: true,
        isActive: true,
        order: 2,
        durationDays: 30,
        maxFeedsLimit: 999999,
        maxChannelsLimit: 15,
        syncFrequencyHours: 4,
        maxStorageGb: 10,
        maxTeamSeats: 3,
        hasApiAccess: true,
        hasWebhooks: false,
        hasFeedDiff: true,
        hasWhiteLabel: false,
        hasSso: false,
        hasAuditLog: false,
        hasCustomS3: false,
        hasPriorityAi: false,
        featuresUk: ['50,000 XML позицій', '500 AI кредитів', 'S3 Cloud Backup'],
        featuresEn: ['50,000 XML items', '500 AI credits', 'S3 Cloud Backup'],
      },
    ];

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
        hasApiAccess: true,
        hasFeedDiff: true,
        hasWhiteLabel: false,
        hasSso: false,
        hasAuditLog: false,
        isActive: true,
        expiresAt: '2027-12-31T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        user: {
          id: 'usr-admin-01',
          email: 'admin@smartfeed.studio',
          fullName: 'Super Administrator',
          role: 'SUPER_ADMIN',
        },
      },
    ];

    // Single unified router for all plans endpoints
    await page.route('**/api/plans**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (url.includes('/api/plans/admin/all')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockPlans),
        });
        return;
      }

      if (method === 'POST') {
        const body = route.request().postDataJSON();
        const newPlan: TariffPlanDto = {
          ...body,
          id: '33333333-3333-3333-3333-333333333333',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockPlans.push(newPlan);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newPlan),
        });
        return;
      }

      if (method === 'PATCH') {
        const body = route.request().postDataJSON();
        const planId = url.split('/').pop()?.split('?')[0];
        const planIndex = mockPlans.findIndex((p) => p.id === planId);
        if (planIndex !== -1) {
          mockPlans[planIndex] = { ...mockPlans[planIndex], ...body };
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockPlans[planIndex] || {}),
        });
        return;
      }

      if (method === 'DELETE') {
        const planId = url.split('/').pop()?.split('?')[0];
        mockPlans = mockPlans.filter((p) => p.id !== planId);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
        return;
      }

      // Default GET /api/plans
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPlans),
      });
    });

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

  test('відображення сторінки тарифних планів та таблиці виданих ліцензій', async ({
    licensesPage,
  }) => {
    await licensesPage.goto();

    // Verify Title and Subtitle
    await expect(licensesPage.pageTitle).toBeVisible();

    // Verify Plan Cards
    await licensesPage.expectPlanCardVisible('FREE');
    await licensesPage.expectPlanCardVisible('PRO');
    await licensesPage.expectPlanMonthlyPrice('FREE', '$0');
    await licensesPage.expectPlanMonthlyPrice('PRO', '$49');

    // Verify License in Table
    await licensesPage.expectLicenseRowVisible('SF-PRO-DEMO-9900-1122');
  });

  test('створення нового тарифного плану через діалогове вікно', async ({ licensesPage }) => {
    await licensesPage.goto();

    await licensesPage.openCreateDialog();
    await expect(licensesPage.planDialog).toBeVisible();

    // Fill form data
    await licensesPage.fillPlanForm({
      code: 'ENTERPRISE',
      nameUk: 'Корпоративний',
      nameEn: 'Enterprise Tier',
      priceMonthly: '199',
      maxXmlLimit: '1000000',
      aiCredits: '5000',
      featureUk: '1,000,000 XML ліміт',
      featureEn: '1,000,000 XML items',
    });

    await licensesPage.submitPlanForm();

    // Verify new plan card appears in grid
    await licensesPage.expectPlanCardVisible('ENTERPRISE');
    await licensesPage.expectPlanMonthlyPrice('ENTERPRISE', '$199');
  });

  test('редагування існуючого тарифного плану', async ({ licensesPage }) => {
    await licensesPage.goto();

    await licensesPage.openEditDialog('PRO');
    await expect(licensesPage.planDialog).toBeVisible();
    await expect(licensesPage.planCodeInput).toBeDisabled();

    // Update monthly price to 59
    await licensesPage.planPriceMonthlyInput.fill('59');
    await licensesPage.submitPlanForm();

    // Verify updated price in card
    await licensesPage.expectPlanMonthlyPrice('PRO', '$59');
  });

  test('видалення тарифного плану з діалоговим підтвердженням', async ({ licensesPage, page }) => {
    // Handle browser confirm dialog automatically
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await licensesPage.goto();
    await licensesPage.expectPlanCardVisible('FREE');

    const deleteBtn = page.getByTestId('plan-delete-btn-free');
    await deleteBtn.click();

    // Verify FREE card is removed from grid
    await expect(page.getByTestId('plan-card-free')).toBeHidden();
  });
});
