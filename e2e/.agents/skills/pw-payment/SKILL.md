---
name: pw-payment
description: Payment flow & checkout testing skill for insurance-e2e (finance.ua / minfin.ua). Use when writing, debugging, or mocking payment gateways, PortmoneService, LiqPay, card form checkout screens, 3DS authentication flows, status callbacks, or payment verification in E2E tests.
---

# Payment Flow & Checkout (`pw-payment`)

Standards for automating payment gateways (Portmone, LiqPay), card form checkout interactions, 3DS challenges, and post-payment order verification in `insurance-e2e`.

---

## 1. Portmone Service Infrastructure

E2E tests access payment gateways via the `portmone` fixture from `@/fixtures/index`:

```typescript
import { e2eTest } from '@/fixtures/index';
import { testCards } from '@/services/portmone/testCards';

e2eTest(
  'Complete OSAGO policy purchase via Portmone',
  { tag: ['@finance', '@osago', '@payment'] },
  async ({ finance, portmone, page }) => {
    // ... Navigate to checkout
    await portmone.cardForm.fillCardDetails({
      cardNumber: testCards.successCard.number,
      expiryDate: testCards.successCard.expiry,
      cvv: testCards.successCard.cvv,
    });
    await portmone.cardForm.clickPay();

    // Verify successful postback and policy screen
    await expect(page).toHaveURL(/success|sign-contract/);
  },
);
```

---

## 2. 3D-Secure (3DS) Handling

- Test environments utilize cards configured to bypass or deterministically pass 3DS authentication.
- For 3DS challenge redirection or iframe:
  1. Await URL match: `await expect(page).toHaveURL(/3ds|secure|portmone/);`
  2. Input test OTP (`111111` or `000000`).
  3. Await redirect back to insurance application domain.

---

## 3. Mocking Payment Status Callbacks

For UI tests isolating checkout error states or callback race conditions without external redirect:

```typescript
await finance.route.mockApiResponse({
  endpoint: /\/api\/v3\/orders\/.*\/payment-status/,
  response: { status: 'SUCCESS', transactionId: 'test-tx-123' },
});
```

---

## 4. Payment Verification Checklist

1. Price Parity: Total on checkout screen must match the selected tariff to the exact kopeck.
2. Complete Lifecycle: Do not stop at gateway redirect; complete card entry and verify final success screen.
3. Rejection Scenarios: Verify declined card states display user-friendly error banners without crashing.
4. Lead Cleanup: Register created lead in `deletionLeads.push(lead.key)`.
