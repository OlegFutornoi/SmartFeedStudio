import type { Page } from '@playwright/test';
import { mockUser, mockPlans, type LicenseStateHolder } from '@e2e/fixtures/plans-mock-data';

export async function setupPlansRoutes(page: Page, stateHolder: LicenseStateHolder) {
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
      body: JSON.stringify(stateHolder.current),
    });
  });

  await page.route('**/api/licenses/select-plan', async (route) => {
    const payload = JSON.parse(route.request().postData() || '{}');
    const selected = mockPlans.find((p) => p.code === payload.planCode) || mockPlans[2];
    const duration = payload.billingInterval === 'yearly' ? 365 : selected.durationDays || 30;

    stateHolder.current = {
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
      body: JSON.stringify(stateHolder.current),
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
      stateHolder.current = {
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
}
