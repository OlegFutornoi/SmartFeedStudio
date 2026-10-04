import { test, expect } from '@e2e/fixtures/test';
import { PaymentProvider, PaymentInterval, PaymentStatus } from '@smartfeed/shared';

import { mockSettings, mockTransactions, mockStats } from '@e2e/fixtures/payments-mock-data';

test.describe('Admin Portal — Платіжні системи та Журнал транзакцій (Payments & Transactions E2E)', () => {
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

  test('пагінація списку транзакцій: перехід по сторінках, зміна розміру сторінки та робота глобального пошуку по всій вибірці', async ({
    page,
  }) => {
    // Generate 25 mock transactions
    const manyTransactions = Array.from({ length: 25 }, (_, i) => ({
      id: `tx-gen-${i + 1}`,
      orderReference: `SF-INV-20260828-${String(i + 1).padStart(3, '0')}`,
      userId: `usr-${i + 1}`,
      userEmail: `user${i + 1}@example.com`,
      userFullName: `Користувач ${i + 1}`,
      planCode: i % 2 === 0 ? 'PRO' : 'GROWTH',
      billingInterval: PaymentInterval.MONTHLY,
      amount: 690 + i * 100,
      currency: 'UAH',
      status: PaymentStatus.APPROVED,
      provider: PaymentProvider.WAYFORPAY,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - i * 3600000).toISOString(),
    }));

    await page.route('**/api/payments/transactions**', async (route) => {
      const url = new URL(route.request().url());
      const search = url.searchParams.get('search')?.toLowerCase();
      const status = url.searchParams.get('status');

      let filtered = [...manyTransactions];
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

    await page.goto('/transactions');
    await expect(page.getByTestId('transactions-page')).toBeVisible();

    // 1. За замовчуванням розмір сторінки 10 -> показує 1–10 із 25
    const pagination = page.getByTestId('transactions-pagination');
    await expect(pagination).toBeVisible();
    await expect(page.getByTestId('transactions-pagination-range-text')).toContainText(
      'Показано 1–10 із 25 записів',
    );

    await page.screenshot({
      path: '/Users/oleg/.gemini/antigravity-ide/brain/d7eed6c3-a334-4c29-a82d-93b7ad73f29a/admin-transactions-pagination-view.png',
      fullPage: true,
    });

    // Рядки 1-10 видимі, 11 не видимий на 1й сторінці
    await expect(page.getByTestId('transaction-row-SF-INV-20260828-001')).toBeVisible();
    await expect(page.getByTestId('transaction-row-SF-INV-20260828-011')).not.toBeVisible();

    // 2. Перехід на наступну сторінку (кнопка Next)
    await page.getByTestId('transactions-pagination-next-btn').click();
    await expect(page.getByTestId('transactions-pagination-range-text')).toContainText(
      'Показано 11–20 із 25 записів',
    );
    await expect(page.getByTestId('transaction-row-SF-INV-20260828-011')).toBeVisible();
    await expect(page.getByTestId('transaction-row-SF-INV-20260828-001')).not.toBeVisible();

    // 3. Зміна розміру сторінки на 25
    await page.getByTestId('transactions-pagination-size-select').selectOption('25');
    await expect(page.getByTestId('transactions-pagination-range-text')).toContainText(
      'Показано 1–25 із 25 записів',
    );
    await expect(page.getByTestId('transaction-row-SF-INV-20260828-001')).toBeVisible();
    await expect(page.getByTestId('transaction-row-SF-INV-20260828-025')).toBeVisible();

    // 4. Глобальний пошук по всій вибірці даних: шукаємо 25-го користувача
    await page.getByTestId('transactions-search-input').fill('user25');
    await expect(page.getByTestId('transactions-pagination-range-text')).toContainText(
      'Показано 1–1 із 1 записів',
    );
    await expect(page.getByTestId('transaction-row-SF-INV-20260828-025')).toBeVisible();
    await expect(page.getByTestId('transaction-row-SF-INV-20260828-001')).not.toBeVisible();
  });

  test('відсутність кольорових емодзі у фільтрі статусів транзакцій', async ({ page }) => {
    await page.goto('/transactions');
    await expect(page.getByTestId('transactions-page')).toBeVisible();

    const selectOptions = await page
      .getByTestId('transactions-status-select')
      .locator('option')
      .allInnerTexts();

    // Regex перевіряє типові кольорові емодзі (✅, ⏳, ❌, 👑, 👥 тощо)
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    for (const optionText of selectOptions) {
      expect(
        emojiRegex.test(optionText),
        `Option '${optionText}' should not contain colored emojis`,
      ).toBe(false);
    }
  });
});
