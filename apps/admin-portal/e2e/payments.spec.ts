import { test, expect } from './fixtures/test';
import { PaymentProvider, PaymentInterval, PaymentStatus } from '@smartfeed/shared';

test.describe('Admin Portal — Платіжні системи та Журнал транзакцій (Payments & Transactions E2E)', () => {
  const mockSettings = [
    {
      id: 'set-wfp-1',
      provider: PaymentProvider.WAYFORPAY,
      isEnabled: true,
      isTestMode: true,
      merchantAccount: 'test_merch_n1',
      merchantSecretKey: 'flk3409refn54t54vk354gh5400ef001',
      merchantDomain: 'localhost',
      serviceUrl: 'http://localhost:4000/api/payments/wayforpay/webhook',
      returnUrl: 'http://localhost:1420/payment/result',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockTransactions = [
    {
      id: 'tx-1',
      orderReference: 'SF-INV-20260828-A1B2C3',
      userId: 'usr-101',
      userEmail: 'alex.store@gmail.com',
      userFullName: 'Олександр Шевченко',
      planCode: 'PRO',
      billingInterval: PaymentInterval.YEARLY,
      amount: 14280,
      currency: 'UAH',
      status: PaymentStatus.APPROVED,
      provider: PaymentProvider.WAYFORPAY,
      providerPaymentId: 'AUTH-889900',
      cardPan: '411111****1111',
      cardType: 'Visa',
      issuerBank: 'Monobank',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tx-2',
      orderReference: 'SF-INV-20260828-D4E5F6',
      userId: 'usr-102',
      userEmail: 'marina.prom@ukr.net',
      userFullName: 'Марина Коваль',
      planCode: 'GROWTH',
      billingInterval: PaymentInterval.MONTHLY,
      amount: 690,
      currency: 'UAH',
      status: PaymentStatus.APPROVED,
      provider: PaymentProvider.WAYFORPAY,
      providerPaymentId: 'AUTH-776655',
      cardPan: '516875****2222',
      cardType: 'MasterCard',
      issuerBank: 'PrivatBank',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'tx-3',
      orderReference: 'SF-INV-20260828-G7H8J9',
      userId: 'usr-103',
      userEmail: 'declined.user@yahoo.com',
      userFullName: 'Ігор Бондар',
      planCode: 'ENTERPRISE',
      billingInterval: PaymentInterval.MONTHLY,
      amount: 3990,
      currency: 'UAH',
      status: PaymentStatus.DECLINED,
      provider: PaymentProvider.WAYFORPAY,
      failureReason: 'Insufficient funds',
      cardPan: '411111****3333',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  const mockStats = {
    totalRevenueUah: 14970,
    successfulCount: 2,
    pendingCount: 0,
    declinedCount: 1,
    averageCheckUah: 7485,
    successRatePercent: 66.7,
  };

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/payments/settings**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSettings),
        });
      } else if (route.request().method() === 'PATCH') {
        const payload = JSON.parse(route.request().postData() || '{}');
        const updated = { ...mockSettings[0], ...payload };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updated),
        });
      }
    });

    await page.route('**/api/payments/transactions**', async (route) => {
      const url = new URL(route.request().url());
      const search = url.searchParams.get('search')?.toLowerCase();
      const status = url.searchParams.get('status');

      let filtered = [...mockTransactions];
      if (status && status !== 'ALL') {
        filtered = filtered.filter((t) => t.status === status);
      }
      if (search) {
        filtered = filtered.filter(
          (t) =>
            t.orderReference.toLowerCase().includes(search) ||
            t.userEmail.toLowerCase().includes(search) ||
            (t.userFullName && t.userFullName.toLowerCase().includes(search)),
        );
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          transactions: filtered,
          total: filtered.length,
        }),
      });
    });

    await page.route('**/api/payments/stats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStats),
      });
    });
  });

  test('перегляд сторінки платіжних систем, відкриття діалогу WayForPay та зміна налаштувань мерчанта', async ({
    page,
  }) => {
    await page.goto('/settings/payments');
    await expect(page.getByTestId('payments-settings-page')).toBeVisible();

    // 1. Перевірка заголовку та карток
    await expect(page.getByTestId('payments-header-title')).toContainText('Платіжні системи');
    await expect(page.getByTestId('gateway-card-wayforpay')).toBeVisible();
    await expect(page.getByTestId('gateway-card-wayforpay')).toContainText('test_merch_n1');
    await expect(page.getByTestId('gateway-card-wayforpay')).toContainText('Тестовий (Sandbox)');

    // 2. Відкриття діалогу налаштувань WayForPay
    await page.getByTestId('configure-wayforpay-btn').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Налаштування WayForPay');

    // 3. Зміна параметрів (перемикання на live та введення нового акаунту)
    await page.getByTestId('merchant-account-input').fill('my_live_store_account');
    await page.getByTestId('wfp-sandbox-switch').click(); // вимикаємо Sandbox

    // 4. Збереження
    await page.getByTestId('save-wfp-settings-btn').click();

    // Діалог закривається після успіху
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('перегляд журналу транзакцій, KPI статистики, пошук та фільтрація за статусом', async ({
    page,
  }) => {
    await page.goto('/transactions');
    await expect(page.getByTestId('transactions-page')).toBeVisible();
    await expect(page.getByTestId('transactions-header-title')).toContainText('Журнал транзакцій');

    // 1. Перевірка статистичних карток з урахуванням форматування локалі
    await expect(page.getByTestId('transaction-stats-grid')).toContainText('14,970 грн');
    await expect(page.getByTestId('transaction-stats-grid')).toContainText('7,485 грн');
    await expect(page.getByTestId('transaction-stats-grid')).toContainText('66.7%');

    // 2. Перевірка списку рядків таблиці
    await expect(page.getByTestId('transaction-row-SF-INV-20260828-A1B2C3')).toBeVisible();
    await expect(page.getByTestId('transaction-row-SF-INV-20260828-A1B2C3')).toContainText(
      'Олександр Шевченко',
    );
    await expect(page.getByTestId('transaction-row-SF-INV-20260828-A1B2C3')).toContainText(
      '14,280 UAH',
    );
    await expect(page.getByTestId('transaction-row-SF-INV-20260828-A1B2C3')).toContainText(
      'Оплачено',
    );

    await expect(page.getByTestId('transaction-row-SF-INV-20260828-G7H8J9')).toContainText(
      'Відхилено',
    );

    // 3. Пошук за номером замовлення
    await page.getByTestId('transactions-search-input').fill('A1B2C3');
    await expect(page.getByTestId('transaction-row-SF-INV-20260828-A1B2C3')).toBeVisible();
    await expect(page.getByTestId('transaction-row-SF-INV-20260828-D4E5F6')).not.toBeVisible();

    // Очищення пошуку
    await page.getByTestId('transactions-search-input').fill('');

    // 4. Фільтрація за статусом DECLINED
    await page.getByTestId('transactions-status-select').selectOption('DECLINED');
    await expect(page.getByTestId('transaction-row-SF-INV-20260828-G7H8J9')).toBeVisible();
    await expect(page.getByTestId('transaction-row-SF-INV-20260828-A1B2C3')).not.toBeVisible();
  });

  test('перевірка відсутності дублюючих запитів на сторінці транзакцій (Zero-Duplicate Requests)', async ({
    page,
  }) => {
    let statsCount = 0;
    let txCount = 0;

    await page.route('**/api/payments/stats*', async (route) => {
      statsCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStats),
      });
    });

    await page.route('**/api/payments/transactions*', async (route) => {
      txCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          transactions: mockTransactions,
          total: mockTransactions.length,
        }),
      });
    });

    await page.goto('/transactions');
    await expect(page.getByTestId('transactions-page')).toBeVisible();
    await expect(page.getByTestId('transaction-row-SF-INV-20260828-A1B2C3')).toBeVisible();

    expect(statsCount).toBe(1);
    expect(txCount).toBe(1);
  });
});
