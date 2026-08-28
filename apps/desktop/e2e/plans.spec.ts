import { test, expect } from '@playwright/test';

test.describe('Desktop App — Тарифні плани, білінгові періоди, порівняльна матриця та блокування доступу', () => {
  const mockUser = {
    id: 'usr-plans-100',
    email: 'client@smartfeed.studio',
    fullName: 'Store Owner',
    role: 'USER',
  };

  const mockPlans = [
    {
      id: 'plan-starter',
      code: 'STARTER',
      nameUk: 'Безкоштовний',
      nameEn: 'Free Trial',
      descriptionUk: 'Для ознайомлення та тестування 1 маркетплейсу',
      descriptionEn: 'For exploration and testing 1 marketplace',
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'UAH',
      maxXmlLimit: 1000,
      maxSuppliersLimit: 1,
      maxFeedsLimit: 1,
      maxChannelsLimit: 1,
      maxTeamSeats: 1,
      maxStorageGb: 0,
      aiCredits: 50,
      syncFrequencyHours: 0,
      canCloudBackup: false,
      hasApiAccess: false,
      hasFeedDiff: false,
      hasWebhooks: false,
      hasCustomS3: false,
      hasAuditLog: false,
      hasWhiteLabel: false,
      hasPriorityAi: false,
      isPopular: false,
      isActive: true,
      order: 1,
      durationDays: 7,
      featuresUk: [
        'До 1,000 SKU товарів',
        '1 постачальник',
        '1 активний фід',
        '1 будь-який канал експорту',
        '50 AI Кредитів на тест',
      ],
      featuresEn: [
        'Up to 1,000 product SKUs',
        '1 product supplier',
        '1 active feed',
        '1 export channel of choice',
        '50 trial AI Credits',
      ],
    },
    {
      id: 'plan-growth',
      code: 'GROWTH',
      nameUk: 'Зріст',
      nameEn: 'Growth',
      descriptionUk: 'Автоматизуй фіди для декількох маркетплейсів',
      descriptionEn: 'Automate feeds for multiple marketplaces',
      priceMonthly: 690,
      priceYearly: 6600,
      currency: 'UAH',
      maxXmlLimit: 20000,
      maxSuppliersLimit: 3,
      maxFeedsLimit: 5,
      maxChannelsLimit: 3,
      maxTeamSeats: 1,
      maxStorageGb: 2,
      aiCredits: 500,
      syncFrequencyHours: 24,
      canCloudBackup: true,
      hasApiAccess: false,
      hasFeedDiff: false,
      hasWebhooks: false,
      hasCustomS3: false,
      hasAuditLog: false,
      hasWhiteLabel: false,
      hasPriorityAi: false,
      isPopular: false,
      isActive: true,
      order: 2,
      durationDays: 30,
      featuresUk: [
        'До 20,000 SKU товарів',
        'До 3 постачальників',
        '5 активних фідів',
        'До 3 каналів одночасно',
        '500 AI Кредитів',
        'Хмарний бекап 2 GB',
      ],
      featuresEn: [
        'Up to 20,000 product SKUs',
        'Up to 3 suppliers',
        '5 active feeds',
        'Up to 3 channels simultaneously',
        '500 AI Credits',
        '2 GB Cloud backup',
      ],
    },
    {
      id: 'plan-pro',
      code: 'PRO',
      nameUk: 'Професійний',
      nameEn: 'Pro Plan',
      descriptionUk: 'Повна автоматизація, мульти-склад та команда',
      descriptionEn: 'Full automation, multi-supplier warehouse & team',
      priceMonthly: 1490,
      priceYearly: 14280,
      currency: 'UAH',
      maxXmlLimit: 100000,
      maxSuppliersLimit: 15,
      maxFeedsLimit: 999999,
      maxChannelsLimit: 15,
      maxTeamSeats: 3,
      maxStorageGb: 10,
      aiCredits: 2500,
      syncFrequencyHours: 4,
      canCloudBackup: true,
      hasApiAccess: true,
      hasFeedDiff: true,
      hasWebhooks: false,
      hasCustomS3: false,
      hasAuditLog: false,
      hasWhiteLabel: false,
      hasPriorityAi: false,
      isPopular: true,
      isActive: true,
      order: 3,
      durationDays: 30,
      featuresUk: [
        'До 100,000 SKU товарів',
        'До 15 постачальників (авто-зіставлення)',
        'Необмежена кількість фідів',
        'До 15 каналів експорту',
        '2,500 AI Кредитів',
        'Хмарний бекап 10 GB + Hub & Spoke sync',
      ],
      featuresEn: [
        'Up to 100,000 product SKUs',
        'Up to 15 suppliers (auto-matching)',
        'Unlimited feeds',
        'Up to 15 output channels',
        '2,500 AI Credits',
        '10 GB Cloud backup + Hub & Spoke sync',
      ],
    },
    {
      id: 'plan-enterprise',
      code: 'ENTERPRISE',
      nameUk: 'Корпоративний',
      nameEn: 'Enterprise',
      descriptionUk: 'Безлімітна потужність, B2B прайси та прямий API',
      descriptionEn: 'Unlimited power, B2B price lists and direct API',
      priceMonthly: 3990,
      priceYearly: 38280,
      currency: 'UAH',
      maxXmlLimit: 500000,
      maxSuppliersLimit: 999999,
      maxFeedsLimit: 999999,
      maxChannelsLimit: 999999,
      maxTeamSeats: 10,
      maxStorageGb: 50,
      aiCredits: 10000,
      syncFrequencyHours: 1,
      canCloudBackup: true,
      hasApiAccess: true,
      hasFeedDiff: true,
      hasWebhooks: true,
      hasCustomS3: true,
      hasAuditLog: true,
      hasWhiteLabel: true,
      hasPriorityAi: true,
      isPopular: false,
      isActive: true,
      order: 4,
      durationDays: 365,
      featuresUk: [
        '500,000+ SKU (Безліміт товарів)',
        'Необмежено постачальників (+ API дилерів)',
        'Необмежено каналів експорту',
        '10,000 AI Кредитів/міс + пріоритет',
        '50 GB сховища + Власний S3 (BYOS)',
        '10+ місць для команди',
      ],
      featuresEn: [
        '500,000+ SKU (Unlimited products)',
        'Unlimited suppliers (+ direct dealer API)',
        'Unlimited output channels',
        '10,000 AI Credits/mo + priority',
        '50 GB storage + Custom S3 (BYOS)',
        '10+ team seats',
      ],
    },
  ];

  let currentLicenseState = {
    id: 'lic-1',
    userId: mockUser.id,
    licenseKey: 'SF-STARTER-A1B2-C3D4-E5F6',
    planType: 'STARTER',
    canCloudBackup: false,
    maxXmlLimit: 1000,
    aiCredits: 50,
    isActive: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isExpired: false,
    daysRemaining: 7,
    tariffPlan: mockPlans[0],
  };

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    currentLicenseState = {
      id: 'lic-1',
      userId: mockUser.id,
      licenseKey: 'SF-STARTER-A1B2-C3D4-E5F6',
      planType: 'STARTER',
      canCloudBackup: false,
      maxXmlLimit: 1000,
      aiCredits: 50,
      isActive: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isExpired: false,
      daysRemaining: 7,
      tariffPlan: mockPlans[0],
    };

    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: mockUser,
          tokens: {
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh',
            tokenType: 'Bearer',
            expiresIn: 900,
          },
        }),
      });
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    });

    await page.route('**/api/plans', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPlans),
      });
    });

    await page.route('**/api/licenses/my', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(currentLicenseState),
      });
    });

    await page.route('**/api/licenses/select-plan', async (route) => {
      const payload = JSON.parse(route.request().postData() || '{}');
      const selected = mockPlans.find((p) => p.code === payload.planCode) || mockPlans[2];
      const duration = payload.billingInterval === 'yearly' ? 365 : selected.durationDays || 30;

      currentLicenseState = {
        id: 'lic-updated',
        userId: mockUser.id,
        licenseKey: `SF-${selected.code}-XXXX-YYYY-ZZZZ`,
        planType: selected.code,
        canCloudBackup: selected.canCloudBackup,
        maxXmlLimit: selected.maxXmlLimit,
        aiCredits: selected.aiCredits,
        isActive: true,
        expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
        isExpired: false,
        daysRemaining: duration,
        tariffPlan: selected,
      };

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(currentLicenseState),
      });
    });

    await page.route('**/api/payments/checkout**', async (route) => {
      const payload = JSON.parse(route.request().postData() || '{}');
      const selected = mockPlans.find((p) => p.code === payload.planCode) || mockPlans[2];
      const isYearly = payload.billingInterval === 'yearly';
      const amount = isYearly
        ? selected.priceYearly || selected.priceMonthly * 12
        : selected.priceMonthly;

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          orderReference: `SF-INV-20260828-TEST`,
          checkoutUrl: 'https://secure.wayforpay.com/pay?behavior=offline',
          amount,
          currency: 'UAH',
          merchantAccount: 'test_merch_n1',
          merchantDomainName: 'localhost',
          merchantSignature: 'mock_signature_hex',
          orderDate: Math.floor(Date.now() / 1000),
          productName: [`Тариф ${selected.nameUk}`],
          productPrice: [amount],
          productCount: [1],
          invoiceUrl: 'https://secure.wayforpay.com/pay?behavior=offline',
        }),
      });
    });

    await page.route('**/api/payments/simulate-sandbox-webhook**', async (route) => {
      const payload = JSON.parse(route.request().postData() || '{}');
      if (payload.status === 'Approved') {
        const selected = mockPlans.find((p) => p.code === 'PRO') || mockPlans[2];
        currentLicenseState = {
          id: 'lic-approved',
          userId: mockUser.id,
          licenseKey: `SF-PRO-XXXX-YYYY-ZZZZ`,
          planType: 'PRO',
          canCloudBackup: true,
          maxXmlLimit: 100000,
          aiCredits: 2500,
          isActive: true,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          isExpired: false,
          daysRemaining: 365,
          tariffPlan: selected,
        };
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'accept' }),
      });
    });
  });

  test('перегляд 4 карток тарифних планів та перемикання щомісячного/річного періоду (Monthly ⇄ Yearly)', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await page.getByTestId('email-input').fill(mockUser.email);
    await page.getByTestId('password-input').fill('Password123!');
    await page.getByTestId('login-button').click();

    await page.getByTestId('nav-item-plans').click();
    await expect(page.getByTestId('plans-page')).toBeVisible();

    // 1. Перевірка заголовку та карток
    await expect(page.getByTestId('plans-header-title')).toContainText('Тарифні плани та підписка');
    await expect(page.getByTestId('plan-card-starter')).toBeVisible();
    await expect(page.getByTestId('plan-card-growth')).toBeVisible();
    await expect(page.getByTestId('plan-card-pro')).toBeVisible();
    await expect(page.getByTestId('plan-card-enterprise')).toBeVisible();

    // 2. За замовчуванням — щомісячний білінг (PRO = 1490 грн/міс)
    await expect(page.getByTestId('plan-price-monthly-pro')).toContainText('1490 грн');
    await expect(page.getByTestId('plan-card-pro')).toContainText('/міс');

    // 3. Перемикання на річний період (-20% знижка)
    await page.getByTestId('billing-cycle-yearly-btn').click();

    // 4. Перевірка оновлених річних цін (PRO = 1190 грн/міс, підказка 14,280 грн/рік)
    await expect(page.getByTestId('plan-price-monthly-pro')).toContainText('1190 грн');
    await expect(page.getByTestId('plan-card-pro')).toContainText('14,280 грн/рік');
    await expect(page.getByTestId('plan-card-pro')).toContainText('Економія 3,600 грн/рік');
  });

  test('перемикання між картками та порівняльною таблицею з перевіркою білінгових інтервалів', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await page.getByTestId('email-input').fill(mockUser.email);
    await page.getByTestId('password-input').fill('Password123!');
    await page.getByTestId('login-button').click();

    await page.getByTestId('nav-item-plans').click();
    await expect(page.getByTestId('plans-page')).toBeVisible();

    // 1. Перемикаємось на порівняльну таблицю
    await page.getByTestId('plans-view-comparison-btn').click();
    await expect(page.getByTestId('plans-comparison-table-container')).toBeVisible();
    await expect(page.getByTestId('plans-grid')).not.toBeVisible();

    // 2. У щомісячному режимі ціна PRO в таблиці 1490 грн
    await expect(page.getByTestId('comparison-price-pro')).toContainText('1490 грн');

    // 3. Перемикаємося на Щорічно — ціна в таблиці стає 1190 грн
    await page.getByTestId('billing-cycle-yearly-btn').click();
    await expect(page.getByTestId('comparison-price-pro')).toContainText('1190 грн');
  });

  test('успішний вибір та активація річного тарифного плану PRO через Checkout Modal', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await page.getByTestId('email-input').fill(mockUser.email);
    await page.getByTestId('password-input').fill('Password123!');
    await page.getByTestId('login-button').click();

    await page.getByTestId('nav-item-plans').click();
    await expect(page.getByTestId('plans-page')).toBeVisible();

    // 1. Обираємо річний період
    await page.getByTestId('billing-cycle-yearly-btn').click();

    // 2. Перемикаємось на порівняльну таблицю
    await page.getByTestId('plans-view-comparison-btn').click();
    await expect(page.getByTestId('plans-comparison-table-container')).toBeVisible();

    // 3. Натискаємо кнопку "Оплатити за рік (-20%)" у колонці PRO
    const selectProBtn = page.getByTestId('comparison-select-btn-pro');
    await expect(selectProBtn).toBeVisible();
    await selectProBtn.click();

    // 4. Відкривається PaymentCheckoutModal
    const modal = page.getByTestId('payment-checkout-modal');
    await expect(modal).toBeVisible();
    await expect(page.getByTestId('checkout-modal-title')).toContainText('Оформлення підписки');
    await expect(page.getByTestId('checkout-total-amount')).toContainText('14,280 грн');
    await expect(page.getByTestId('pay-wayforpay-btn')).toBeVisible();

    // 5. Натискаємо кнопку симуляції успішної оплати
    await page.getByTestId('simulate-payment-success-btn').click();

    // 6. Екран успіху в модалці
    await expect(page.getByTestId('payment-success-title')).toBeVisible();
    await expect(page.getByTestId('payment-success-title')).toContainText(
      'Оплату успішно здійснено!',
    );

    // 7. Закриваємо модалку кнопкою "Розпочати роботу"
    await page.getByTestId('start-working-after-payment-btn').click();
    await expect(modal).not.toBeVisible();

    // 8. Сповіщення про успішну активацію
    await expect(page.getByTestId('plans-success-alert')).toBeVisible();
    await expect(page.getByTestId('plans-success-alert')).toContainText(
      'Тарифний план успішно активовано!',
    );
  });

  test('блокування доступу до каталогів при закінченні терміну та розблокування після успішної оплати', async ({
    page,
  }) => {
    currentLicenseState.isExpired = true;
    currentLicenseState.daysRemaining = 0;

    await page.goto('/auth/login');
    await page.getByTestId('email-input').fill(mockUser.email);
    await page.getByTestId('password-input').fill('Password123!');
    await page.getByTestId('login-button').click();

    // Спроба перейти до каталогів товарів
    await page.getByTestId('nav-item-catalogs').click();
    await expect(page).toHaveURL('/catalogs');

    // Відображається блокувальник ExpiredPlanBlocker
    const blocker = page.getByTestId('expired-plan-blocker');
    await expect(blocker).toBeVisible();
    await expect(blocker).toContainText('Термін дії тарифного плану закінчився');

    // Клік по кнопці "Перейти до тарифів"
    const choosePlanBtn = page.getByTestId('choose-plan-button');
    await expect(choosePlanBtn).toBeVisible();
    await choosePlanBtn.click();

    await expect(page).toHaveURL('/plans');
    await expect(page.getByTestId('expired-license-banner')).toBeVisible();
    await expect(page.getByTestId('plans-grid')).toBeVisible();

    // Обираємо корпоративний тариф для розблокування
    await page.getByTestId('plan-select-btn-enterprise').click();
    await expect(page.getByTestId('payment-checkout-modal')).toBeVisible();
    await page.getByTestId('simulate-payment-success-btn').click();
    await expect(page.getByTestId('payment-success-title')).toBeVisible();
    await page.getByTestId('start-working-after-payment-btn').click();
    await expect(page.getByTestId('plans-success-alert')).toBeVisible();

    // Повертаємось до каталогів — доступ відновлено!
    await page.getByTestId('nav-item-catalogs').click();
    await expect(page.getByTestId('catalogs-page')).toBeVisible();
    await expect(page.getByTestId('expired-plan-blocker')).not.toBeVisible();
  });

  test('блокування доступу залишається активним при відхиленій оплаті (Declined) — доступ НЕ відкривається', async ({
    page,
  }) => {
    currentLicenseState.isExpired = true;
    currentLicenseState.daysRemaining = 0;

    await page.goto('/auth/login');
    await page.getByTestId('email-input').fill(mockUser.email);
    await page.getByTestId('password-input').fill('Password123!');
    await page.getByTestId('login-button').click();

    // Відкриваємо тарифи
    await page.getByTestId('nav-item-plans').click();
    await expect(page.getByTestId('plans-page')).toBeVisible();
    await expect(page.getByTestId('plans-grid')).toBeVisible();

    // Обираємо платний тариф PRO
    const selectProBtn = page.getByTestId('plan-select-btn-pro');
    await expect(selectProBtn).toBeVisible();
    await selectProBtn.click();

    const modal = page.getByTestId('payment-checkout-modal');
    await expect(modal).toBeVisible();

    // Натискаємо емулювати відхилення (Declined)
    await page.getByTestId('simulate-payment-decline-btn').click();

    // Відображається екран помилки відхилення
    await expect(page.getByTestId('payment-declined-title')).toBeVisible();
    await expect(page.getByTestId('payment-declined-title')).toContainText(
      'Оплату відхилено банком',
    );

    // Закриваємо модальне вікно
    await page.getByTestId('close-checkout-modal-btn').click();

    // Переходимо до Каталогів — ExpiredPlanBlocker ВСЕ ЩЕ блокує доступ!
    await page.getByTestId('nav-item-catalogs').click();
    await expect(page.getByTestId('expired-plan-blocker')).toBeVisible();
    await expect(page.getByTestId('catalogs-page')).not.toBeVisible();
  });

  test('перевірка відсутності дублікатних API запитів (Zero-Duplicate Requests)', async ({
    page,
  }) => {
    let plansRequestsCount = 0;
    page.on('request', (req) => {
      if (req.url().includes('/api/plans')) {
        plansRequestsCount++;
      }
    });

    await page.goto('/auth/login');
    await page.getByTestId('email-input').fill(mockUser.email);
    await page.getByTestId('password-input').fill('Password123!');
    await page.getByTestId('login-button').click();

    await page.getByTestId('nav-item-plans').click();
    await expect(page.getByTestId('plans-page')).toBeVisible();

    // Рівно 1 запит до /api/plans
    expect(plansRequestsCount).toBe(1);
  });

  test('повна двомовна локалізація (i18n) сторінки тарифів та перемикача періодів (UA ⇄ EN)', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('smartfeed_language', 'en');
    });

    await page.goto('/auth/login');
    await page.getByTestId('email-input').fill(mockUser.email);
    await page.getByTestId('password-input').fill('Password123!');
    await page.getByTestId('login-button').click();

    await page.getByTestId('nav-item-plans').click();
    await expect(page.getByTestId('plans-page')).toBeVisible();

    // Англійські тексти перемикача та карток
    await expect(page.locator('h1')).toContainText('Subscription Plans & Pricing');
    await expect(page.getByTestId('billing-cycle-monthly-btn')).toContainText('Monthly');
    await expect(page.getByTestId('billing-cycle-yearly-btn')).toContainText('Annual');
    await expect(page.getByTestId('plan-card-pro')).toContainText('Pay Monthly');

    // Перемикаємося на Annual Billing
    await page.getByTestId('billing-cycle-yearly-btn').click();
    await expect(page.getByTestId('plan-card-pro')).toContainText('Pay Annually (-20%)');
  });
});
