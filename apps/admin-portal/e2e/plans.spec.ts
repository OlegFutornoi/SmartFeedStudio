import { test, expect } from './fixtures/test';
import { TariffPlanDto } from '@smartfeed/shared';

test.describe('Admin Portal — Тарифні плани (POM E2E)', () => {
  let mockPlans: TariffPlanDto[];

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
        maxSuppliersLimit: 1,
        hasApiAccess: false,
        hasWebhooks: false,
        hasFeedDiff: false,
        hasWhiteLabel: false,
        hasSso: false,
        hasAuditLog: false,
        hasCustomS3: false,
        hasPriorityAi: false,
        featuresUk: ['1,000 XML позицій', '1 постачальник товарів', '50 AI кредитів'],
        featuresEn: ['1,000 XML items', '1 product supplier', '50 AI credits'],
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
        maxSuppliersLimit: 15,
        hasApiAccess: true,
        hasWebhooks: false,
        hasFeedDiff: true,
        hasWhiteLabel: false,
        hasSso: false,
        hasAuditLog: false,
        hasCustomS3: false,
        hasPriorityAi: false,
        featuresUk: [
          '50,000 XML позицій',
          'До 15 постачальників',
          '500 AI кредитів',
          'S3 Cloud Backup',
        ],
        featuresEn: ['50,000 XML items', 'Up to 15 suppliers', '500 AI credits', 'S3 Cloud Backup'],
      },
    ];

    // Mock GET /api/plans
    await page.route('**/api/plans*', async (route) => {
      const method = route.request().method();

      if (method === 'GET') {
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
          id: '99999999-9999-9999-9999-999999999999',
          code: body.code,
          nameUk: body.nameUk,
          nameEn: body.nameEn,
          descriptionUk: body.descriptionUk || '',
          descriptionEn: body.descriptionEn || '',
          priceMonthly: Number(body.priceMonthly || 0),
          priceYearly: Number(body.priceYearly || 0),
          currency: 'USD',
          maxXmlLimit: Number(body.maxXmlLimit || 500),
          aiCredits: Number(body.aiCredits || 0),
          canCloudBackup: Boolean(body.canCloudBackup),
          isPopular: Boolean(body.isPopular),
          isActive: true,
          order: 3,
          durationDays: 30,
          maxFeedsLimit: 1,
          maxChannelsLimit: 1,
          syncFrequencyHours: 0,
          maxStorageGb: 0,
          maxTeamSeats: 1,
          maxSuppliersLimit: 1,
          hasApiAccess: false,
          hasWebhooks: false,
          hasFeedDiff: false,
          hasWhiteLabel: false,
          hasSso: false,
          hasAuditLog: false,
          hasCustomS3: false,
          hasPriorityAi: false,
          featuresUk: body.featuresUk || [],
          featuresEn: body.featuresEn || [],
        };
        mockPlans.push(newPlan);

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newPlan),
        });
        return;
      }

      await route.continue();
    });

    // Mock PATCH & DELETE /api/plans/:id
    await page.route('**/api/plans/*', async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      const planId = url.split('/').pop();

      if (method === 'PATCH') {
        const body = route.request().postDataJSON();
        const target = mockPlans.find((p) => p.id === planId);
        if (target) {
          if (body.priceMonthly !== undefined) target.priceMonthly = Number(body.priceMonthly);
          if (body.nameUk !== undefined) target.nameUk = body.nameUk;
          if (body.nameEn !== undefined) target.nameEn = body.nameEn;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(target || {}),
        });
        return;
      }

      if (method === 'DELETE') {
        mockPlans = mockPlans.filter((p) => p.id !== planId);
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

  test('відображення сторінки тарифних планів', async ({ plansPage }) => {
    await plansPage.goto();

    // Verify Title
    await expect(plansPage.pageTitle).toBeVisible();

    // Verify Plan Cards
    await plansPage.expectPlanCardVisible('FREE');
    await plansPage.expectPlanCardVisible('PRO');
    await plansPage.expectPlanMonthlyPrice('FREE', '$0');
    await plansPage.expectPlanMonthlyPrice('PRO', '$49');
  });

  test('створення нового тарифного плану через діалогове вікно', async ({ plansPage }) => {
    await plansPage.goto();

    await plansPage.openCreateDialog();
    await expect(plansPage.planDialog).toBeVisible();

    // Fill form data
    await plansPage.fillPlanForm({
      code: 'ENTERPRISE',
      nameUk: 'Корпоративний',
      nameEn: 'Enterprise Tier',
      priceMonthly: '199',
      maxXmlLimit: '1000000',
      aiCredits: '5000',
      featureUk: '1,000,000 XML ліміт',
      featureEn: '1,000,000 XML items',
    });

    await plansPage.submitPlanForm();

    // Verify new plan card appears in grid
    await plansPage.expectPlanCardVisible('ENTERPRISE');
    await plansPage.expectPlanMonthlyPrice('ENTERPRISE', '$199');
  });

  test('редагування існуючого тарифного плану', async ({ plansPage }) => {
    await plansPage.goto();

    await plansPage.openEditDialog('PRO');
    await expect(plansPage.planDialog).toBeVisible();
    await expect(plansPage.planCodeInput).toBeDisabled();

    // Update monthly price to 59
    await plansPage.planPriceMonthlyInput.fill('59');
    await plansPage.submitPlanForm();

    // Verify updated price in card
    await plansPage.expectPlanMonthlyPrice('PRO', '$59');
  });

  test('видалення тарифного плану з діалоговим підтвердженням', async ({ plansPage, page }) => {
    // Handle browser confirm dialog automatically
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await plansPage.goto();
    await plansPage.expectPlanCardVisible('FREE');

    const deleteBtn = page.getByTestId('plan-delete-btn-free');
    await deleteBtn.click();

    // Verify FREE card is removed from grid
    await expect(page.getByTestId('plan-card-free')).toBeHidden();
  });
});
