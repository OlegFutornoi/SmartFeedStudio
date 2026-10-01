import { test, expect } from './fixtures/test';
import { TariffPlanDto } from '@smartfeed/shared';

test.describe('Admin Portal — Тарифні плани та порівняльна матриця (POM E2E)', () => {
  let mockPlans: TariffPlanDto[];

  test.beforeEach(async ({ page }) => {
    mockPlans = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        code: 'STARTER',
        nameUk: 'Безкоштовний',
        nameEn: 'Free Trial',
        descriptionUk: 'Спробуй безкоштовно для 1 маркетплейсу',
        descriptionEn: 'Try for free for 1 marketplace',
        priceMonthly: 0,
        priceYearly: 0,
        currency: 'UAH',
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
        featuresUk: ['До 1,000 SKU товарів', '1 постачальник', '1 канал виводу'],
        featuresEn: ['Up to 1,000 product SKUs', '1 supplier', '1 output channel'],
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        code: 'PRO',
        nameUk: 'Професійний',
        nameEn: 'Professional',
        descriptionUk: 'Повна автоматизація та мульти-склад',
        descriptionEn: 'Full automation and multi-warehouse',
        priceMonthly: 1490,
        priceYearly: 14280,
        currency: 'UAH',
        maxXmlLimit: 100000,
        aiCredits: 2500,
        canCloudBackup: true,
        isPopular: true,
        isActive: true,
        order: 3,
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
          'До 100,000 SKU товарів',
          'До 15 постачальників',
          '2,500 AI кредитів',
          'Хмарний бекап 10 GB',
        ],
        featuresEn: [
          'Up to 100,000 product SKUs',
          'Up to 15 suppliers',
          '2,500 AI credits',
          '10 GB Cloud backup',
        ],
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
          currency: body.currency || 'UAH',
          maxXmlLimit: Number(body.maxXmlLimit || 500),
          aiCredits: Number(body.aiCredits || 0),
          canCloudBackup: Boolean(body.canCloudBackup),
          isPopular: Boolean(body.isPopular),
          isActive: true,
          order: 4,
          durationDays: 30,
          maxFeedsLimit: Number(body.maxFeedsLimit || 1),
          maxChannelsLimit: Number(body.maxChannelsLimit || 1),
          syncFrequencyHours: Number(body.syncFrequencyHours || 0),
          maxStorageGb: Number(body.maxStorageGb || 0),
          maxTeamSeats: Number(body.maxTeamSeats || 1),
          maxSuppliersLimit: Number(body.maxSuppliersLimit || 1),
          hasApiAccess: Boolean(body.hasApiAccess),
          hasWebhooks: Boolean(body.hasWebhooks),
          hasFeedDiff: Boolean(body.hasFeedDiff),
          hasWhiteLabel: Boolean(body.hasWhiteLabel),
          hasSso: false,
          hasAuditLog: Boolean(body.hasAuditLog),
          hasCustomS3: Boolean(body.hasCustomS3),
          hasPriorityAi: Boolean(body.hasPriorityAi),
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

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockPlans),
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

  test('відображення карток тарифних планів з доступними та заблокованими фічами', async ({
    plansPage,
    page,
  }) => {
    await plansPage.goto();

    // Verify Title
    await expect(plansPage.pageTitle).toBeVisible();

    // Verify Plan Cards & Quotas
    await plansPage.expectPlanCardVisible('STARTER');
    await plansPage.expectPlanCardVisible('PRO');
    await plansPage.expectPlanMonthlyPrice('STARTER', '0 грн');
    await plansPage.expectPlanMonthlyPrice('PRO', '1490 грн');

    // Verify Unavailable list in STARTER card
    const starterUnavailable = page.getByTestId('plan-unavailable-list-starter');
    await expect(starterUnavailable).toBeVisible();
  });

  test('перемикання між картками та порівняльною таблицею', async ({ plansPage, page }) => {
    await plansPage.goto();

    // Default: Cards view
    await expect(plansPage.plansGrid).toBeVisible();
    await expect(plansPage.comparisonTable).toBeHidden();

    // Switch to Comparison View
    await plansPage.switchToComparisonView();
    await expect(plansPage.comparisonTable).toBeVisible();
    await expect(plansPage.plansGrid).toBeHidden();

    // Check headers in comparison table
    const starterHeader = page.getByTestId('comparison-header-starter');
    const proHeader = page.getByTestId('comparison-header-pro');
    await expect(starterHeader).toBeVisible();
    await expect(proHeader).toBeVisible();

    // Switch back to Cards View
    await plansPage.switchToCardsView();
    await expect(plansPage.plansGrid).toBeVisible();
    await expect(plansPage.comparisonTable).toBeHidden();
  });

  test('редагування тарифу прямо з порівняльної таблиці', async ({ plansPage }) => {
    await plansPage.goto();
    await plansPage.switchToComparisonView();

    // Click Edit button in PRO column header
    await plansPage.openEditFromComparison('PRO');
    await expect(plansPage.planDialog).toBeVisible();
    await expect(plansPage.planCodeInput).toBeDisabled();

    // Update monthly price to 1590
    await plansPage.planPriceMonthlyInput.fill('1590');
    await plansPage.submitPlanForm();

    // Verify updated price in cards
    await plansPage.switchToCardsView();
    await plansPage.expectPlanMonthlyPrice('PRO', '1590 грн');
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
      priceMonthly: '3990',
      maxXmlLimit: '500000',
      aiCredits: '10000',
      featureUk: '500,000 SKU ліміт',
      featureEn: '500,000 SKU items',
    });

    await plansPage.submitPlanForm();

    // Verify new plan card appears in grid
    await plansPage.expectPlanCardVisible('ENTERPRISE');
    await plansPage.expectPlanMonthlyPrice('ENTERPRISE', '3990 грн');
  });

  test('редагування пунктів переваг тарифу (inline feature edit)', async ({ page, plansPage }) => {
    await plansPage.goto();

    // Open Edit Dialog for PRO plan
    await plansPage.openEditDialog('PRO');
    await expect(plansPage.planDialog).toBeVisible();

    // Switch to Features tab
    await plansPage.planDialogTabFeatures.click();

    // Verify edit button is visible for first feature
    const firstEditBtn = page.getByTestId('plan-feature-edit-btn-0');
    await expect(firstEditBtn).toBeVisible();
    await firstEditBtn.click();

    // Verify edit inputs appear
    const editUkInput = page.getByTestId('plan-feature-edit-uk-0');
    const editSaveBtn = page.getByTestId('plan-feature-save-btn-0');
    await expect(editUkInput).toBeVisible();

    // Update feature text
    await editUkInput.fill('Оновлено: До 120,000 SKU товарів');
    await editSaveBtn.click();

    // Verify updated text is displayed
    const featureRow = page.getByTestId('plan-feature-row-0');
    await expect(featureRow).toContainText('Оновлено: До 120,000 SKU товарів');

    // Submit form
    await plansPage.submitPlanForm();
  });

  test('перевірка відсутності дублікатних API запитів (Zero-Duplicate Requests)', async ({
    page,
    plansPage,
  }) => {
    let requestCount = 0;
    page.on('request', (req) => {
      if (req.url().includes('/api/plans')) {
        requestCount++;
      }
    });

    await plansPage.goto();
    await expect(plansPage.pageTitle).toBeVisible();

    // Verify exactly 1 request was sent upon page load
    expect(requestCount).toBe(1);
  });
});
