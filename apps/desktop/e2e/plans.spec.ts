import { test, expect } from '@playwright/test';

test.describe('Desktop App — Тарифні плани, динамічні терміни та блокування доступу (Plans & Expiration)', () => {
  const mockUser = {
    id: 'usr-plans-100',
    email: 'client@smartfeed.studio',
    fullName: 'Store Owner',
    role: 'USER',
  };

  const mockPlans = [
    {
      id: 'plan-1',
      code: 'FREE',
      nameUk: 'Базовий',
      nameEn: 'Free Tier',
      descriptionUk: 'Для ознайомлення та базового тестування',
      descriptionEn: 'For exploration and basic testing',
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'USD',
      maxXmlLimit: 1000,
      aiCredits: 10,
      canCloudBackup: false,
      isPopular: false,
      durationDays: 7,
      featuresUk: ['До 1 000 товарів', '10 AI кредитів', 'Локальне шифрування'],
      featuresEn: ['Up to 1,000 items', '10 AI credits', 'Local encryption'],
    },
    {
      id: 'plan-2',
      code: 'PRO',
      nameUk: 'Професійний',
      nameEn: 'Pro Plan',
      descriptionUk: 'Для зростаючих інтернет-магазинів',
      descriptionEn: 'For growing e-commerce stores',
      priceMonthly: 29,
      priceYearly: 290,
      currency: 'USD',
      maxXmlLimit: 50000,
      aiCredits: 500,
      canCloudBackup: true,
      isPopular: true,
      durationDays: 30,
      featuresUk: ['До 50 000 товарів', '500 AI кредитів', 'Хмарна синхронізація S3'],
      featuresEn: ['Up to 50,000 items', '500 AI credits', 'S3 Cloud backup'],
    },
    {
      id: 'plan-3',
      code: 'ENTERPRISE',
      nameUk: 'Корпоративний',
      nameEn: 'Enterprise',
      descriptionUk: 'Для великих маркетплейсів',
      descriptionEn: 'For large marketplaces',
      priceMonthly: 99,
      priceYearly: 990,
      currency: 'USD',
      maxXmlLimit: 500000,
      aiCredits: 5000,
      canCloudBackup: true,
      isPopular: false,
      durationDays: 365,
      featuresUk: ['Необмежено товарів', '5 000 AI кредитів', 'Пріоритетна підтримка'],
      featuresEn: ['Unlimited items', '5,000 AI credits', 'Priority support'],
    },
  ];

  let currentLicenseState = {
    id: 'lic-1',
    userId: mockUser.id,
    licenseKey: 'SF-FREE-A1B2-C3D4-E5F6',
    planType: 'FREE',
    canCloudBackup: false,
    maxXmlLimit: 1000,
    aiCredits: 10,
    isActive: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isExpired: false,
    daysRemaining: 7,
    tariffPlan: mockPlans[0],
  };

  test.beforeEach(async ({ page }) => {
    // 100% test isolation & clean storage
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    currentLicenseState = {
      id: 'lic-1',
      userId: mockUser.id,
      licenseKey: 'SF-FREE-A1B2-C3D4-E5F6',
      planType: 'FREE',
      canCloudBackup: false,
      maxXmlLimit: 1000,
      aiCredits: 10,
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
      const selected = mockPlans.find((p) => p.code === payload.planCode) || mockPlans[1];

      currentLicenseState = {
        id: 'lic-updated',
        userId: mockUser.id,
        licenseKey: `SF-${selected.code}-XXXX-YYYY-ZZZZ`,
        planType: selected.code,
        canCloudBackup: selected.canCloudBackup,
        maxXmlLimit: selected.maxXmlLimit,
        aiCredits: selected.aiCredits,
        isActive: true,
        expiresAt: new Date(
          Date.now() + (selected.durationDays || 30) * 24 * 60 * 60 * 1000,
        ).toISOString(),
        isExpired: false,
        daysRemaining: selected.durationDays || 30,
        tariffPlan: selected,
      };

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(currentLicenseState),
      });
    });
  });

  test('перегляд тарифних планів та перехід на сторінку /plans через бокове меню', async ({
    page,
  }) => {
    // 1. Авторизація
    await page.goto('/auth/login');
    await page.getByTestId('email-input').fill(mockUser.email);
    await page.getByTestId('password-input').fill('Password123!');
    await page.getByTestId('login-button').click();

    await expect(page.getByTestId('home-page')).toBeVisible();

    // 2. Натискання на пункт меню "Тарифи"
    const navItem = page.getByTestId('nav-item-plans');
    await expect(navItem).toBeVisible();
    await navItem.click();

    // 3. Сторінка тарифів відкрита
    await expect(page).toHaveURL('/plans');
    await expect(page.getByTestId('plans-page')).toBeVisible();

    // 4. Перевірка карток планів
    await expect(page.getByTestId('plan-card-free')).toBeVisible();
    await expect(page.getByTestId('plan-card-pro')).toBeVisible();
    await expect(page.getByTestId('plan-card-enterprise')).toBeVisible();

    // 5. Перевірка статусу поточного безкоштовного плану
    await expect(page.getByTestId('plan-card-free')).toContainText('Ваш поточний план');
    await expect(page.getByTestId('plan-card-free')).toContainText('Залишилось 7 дн.');
  });

  test('успішний вибір та активація тарифного плану PRO', async ({ page }) => {
    // 1. Авторизація та перехід на /plans
    await page.goto('/auth/login');
    await page.getByTestId('email-input').fill(mockUser.email);
    await page.getByTestId('password-input').fill('Password123!');
    await page.getByTestId('login-button').click();

    await expect(page.getByTestId('home-page')).toBeVisible();
    await page.getByTestId('nav-item-plans').click();
    await expect(page.getByTestId('plans-page')).toBeVisible();

    // 2. Натискаємо "Обрати тариф" на PRO картці
    const selectProBtn = page.getByTestId('select-plan-pro');
    await expect(selectProBtn).toBeVisible();
    await selectProBtn.click();

    // 3. Перевірка сповіщення про успішне перемикання
    await expect(page.getByTestId('plans-success-alert')).toBeVisible();
    await expect(page.getByTestId('plans-success-alert')).toContainText(
      'Тарифний план успішно активовано!',
    );

    // 4. Картка PRO тепер активна
    await expect(page.getByTestId('plan-card-pro')).toContainText('Ваш поточний план');
    await expect(page.getByTestId('plan-card-pro')).toContainText('Залишилось 30 дн.');
  });

  test('блокування доступу до каталогів товарів при закінченні терміну дії та розблокування після вибору тарифу', async ({
    page,
  }) => {
    // Встановлюємо стан завершеного терміну ліцензії
    currentLicenseState.isExpired = true;
    currentLicenseState.daysRemaining = 0;

    // 1. Авторизація
    await page.goto('/auth/login');
    await page.getByTestId('email-input').fill(mockUser.email);
    await page.getByTestId('password-input').fill('Password123!');
    await page.getByTestId('login-button').click();

    // 2. Спроба перейти до каталогів товарів
    await page.getByTestId('nav-item-catalogs').click();
    await expect(page).toHaveURL('/catalogs');

    // 3. Відображається блокувальник ExpiredPlanBlocker
    const blocker = page.getByTestId('expired-plan-blocker');
    await expect(blocker).toBeVisible();
    await expect(blocker).toContainText('Термін дії тарифного плану закінчився');

    // 4. Клік по кнопці "Перейти до тарифів" у блокувальнику
    const choosePlanBtn = page.getByTestId('choose-plan-button');
    await expect(choosePlanBtn).toBeVisible();
    await choosePlanBtn.click();

    // 5. Перехід на сторінку /plans
    await expect(page).toHaveURL('/plans');
    await expect(page.getByTestId('expired-license-banner')).toBeVisible();

    // 6. Обираємо корпоративний тариф для розблокування
    await page.getByTestId('select-plan-enterprise').click();
    await expect(page.getByTestId('plans-success-alert')).toBeVisible();

    // 7. Повертаємось до каталогів — доступ відновлено!
    await page.getByTestId('nav-item-catalogs').click();
    await expect(page.getByTestId('catalogs-page')).toBeVisible();
    await expect(page.getByTestId('expired-plan-blocker')).not.toBeVisible();
  });

  test('повна двомовна локалізація (i18n) сторінки тарифів та блокувальника (UA ⇄ EN)', async ({
    page,
  }) => {
    // 1. Встановлюємо англійську мову
    await page.addInitScript(() => {
      window.localStorage.setItem('smartfeed_language', 'en');
    });

    await page.goto('/auth/login');
    await page.getByTestId('email-input').fill(mockUser.email);
    await page.getByTestId('password-input').fill('Password123!');
    await page.getByTestId('login-button').click();

    await expect(page.getByTestId('home-page')).toBeVisible();
    await page.getByTestId('nav-item-plans').click();
    await expect(page.getByTestId('plans-page')).toBeVisible();

    // 2. Перевірка англійських текстів
    await expect(page.locator('h1')).toContainText('Subscription Plans & Pricing');
    await expect(page.getByTestId('plan-card-free')).toContainText('Your Current Plan');
    await expect(page.getByTestId('plan-card-pro')).toContainText('Choose Plan');
    await expect(page.getByTestId('plan-card-pro')).toContainText('Popular');

    // 3. Перемикаємо на українську мову через UI перемикач
    const langBtn = page.getByTestId('language-toggle');
    if (await langBtn.isVisible()) {
      await langBtn.click();
    } else {
      await page.evaluate(() => {
        window.localStorage.setItem('smartfeed_language', 'uk');
      });
      await page.reload();
    }

    // 4. Перевірка українських текстів
    await expect(page.locator('h1')).toContainText('Тарифні плани та підписка');
    await expect(page.getByTestId('plan-card-free')).toContainText('Ваш поточний план');
    await expect(page.getByTestId('plan-card-pro')).toContainText('Обрати тариф');
  });
});
