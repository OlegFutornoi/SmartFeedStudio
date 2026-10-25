---
name: pw-payment
description: Payment flow & checkout testing skill for SmartFeed Studio (WayForPay subscription plans, checkout widgets, payment webhooks). Use when writing, debugging, or mocking payment gateways, WayForPay widgets, card form checkout screens, 3DS authentication flows, status webhooks, or license activation verification in E2E tests.
---

# Payment Flow & Checkout (`pw-payment`)

Standards for automating payment gateways (WayForPay), card form checkout interactions, 3DS challenges, webhook verification, and post-payment subscription activation in SmartFeed Studio.

---

## 1. WayForPay Checkout Infrastructure

E2E tests access payment verification via fixtures and API clients:

```typescript
import { test } from '@/core/fixtures/base.fixture';

test(
  'Complete subscription plan purchase via WayForPay checkout',
  { tag: ['@server-admin', '@payment', '@plans'] },
  async ({ page }) => {
    // Navigate to plan checkout
    await page.getByTestId('plan-checkout-button-pro').click();

    // Verify WayForPay checkout widget or form
    await expect(page.getByTestId('wayforpay-widget-frame')).toBeVisible();
  },
);
```

---

## 2. 3D-Secure (3DS) & Mocking Webhooks

- Test environments utilize test cards configured to deterministically pass or fail payment.
- For isolated backend webhook verification:
  - Simulate WayForPay postback webhook to `POST /api/payments/webhook` with signed HMAC-MD5 payload.
  - Assert that license tier and quota limits are immediately updated in `smartfeed_test_db`.

---

## 3. Payment Verification Checklist

1. Price & Currency Parity: Total on checkout screen must match the selected plan in UAH/USD.
2. Complete Lifecycle: Complete card entry, verify success toast/redirect, and verify license status transition (`ACTIVE`).
3. Rejection Scenarios: Verify declined card states display user-friendly error messages without crashing.
4. Tenant Isolation: Verify payment affects only the subscribing tenant's organization quota.
