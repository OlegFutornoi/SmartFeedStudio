import { test, expect } from '@playwright/test';
import { createInitialLicenseState, mockUser } from '@e2e/fixtures/plans-mock-data';
import { setupPlansRoutes } from '@e2e/fixtures/plans-mock-routes';

test.describe('Desktop App — Активація планів, Checkout Modal та блокування доступу', () => {
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
    licenseStateHolder.current.isExpired = true;
    licenseStateHolder.current.daysRemaining = 0;

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
    await expect(blocker).toContainText(
      /(7-денний пробний період закінчився|Термін дії тарифного плану закінчився)/,
    );

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
    licenseStateHolder.current.isExpired = true;
    licenseStateHolder.current.daysRemaining = 0;

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
});
