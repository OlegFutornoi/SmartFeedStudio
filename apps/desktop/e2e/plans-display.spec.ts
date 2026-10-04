import { test, expect } from '@playwright/test';
import { createInitialLicenseState, mockUser } from '@e2e/fixtures/plans-mock-data';
import { setupPlansRoutes } from '@e2e/fixtures/plans-mock-routes';

test.describe('Desktop App — Тарифні плани, білінгові періоди та порівняльна матриця', () => {
  const licenseStateHolder = {
    current: createInitialLicenseState(),
  };

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    licenseStateHolder.current = createInitialLicenseState();
    await setupPlansRoutes(page, licenseStateHolder);
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
    await expect(page.getByTestId('plan-card-pro')).toBeVisible();

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
