---
name: flakiness-detector
description: >-
  Playwright flakiness, race-condition, and async timing risk detector for insurance-e2e. Analyzes test code (*.finance.ts, *.minfin.ts, *.api.ts) and Page Objects to find hidden causes of intermittent failures, unpolled Promise.race branches, unhandled overlays, brittle button clicks, dynamic selectors, and missing input readiness checks.
---

# Flakiness & Race Condition Detector (`flakiness-detector`)

Static analysis rules to identify and eliminate intermittent test failures and async race conditions before execution under CI concurrency (4 parallel workers).

---

## 7 Core Stability Rules

### 1. Visibility Filtering on Action Buttons

In multi-step wizards, inactive buttons from previous steps remain hidden in the DOM. Using `.first()` may target an invisible element:

```typescript
// Prohibited:
await page.locator('[data-state="button-forward"]').first().click();

// Required:
await page.locator('button[data-state="button-forward"]:visible').click();
```

### 2. Multi-Input Readiness Before Typing

Forms with multiple fields (name, phone, email) trigger sequential React re-renders. Typing immediately into the first field before all inputs are mounted drops characters:

```typescript
// Required:
await expect(this.phoneInput).toBeVisible();
await expect(this.emailInput).toBeVisible();
await this.phoneInput.fill(phone);
```

### 3. `Promise.race` State Confirmation

When awaiting alternative UI branches (e.g., modal vs. redirect), `Promise.race` does not guarantee DOM stabilization:

```typescript
// Required: Follow Promise.race with explicit expect.poll confirmation
await Promise.race([waitModal, waitRedirect]);
await expect.poll(() => page.url(), { timeout: 10_000 }).toContain(expectedPath);
```

### 4. Zero Actionability Bypasses

Bypassing Playwright actionability checks hides overlays, loaders, and disabled states:

```typescript
// Prohibited:
await button.click({ force: true });
await element.evaluate((el) => el.click());

// Required:
await button.scrollIntoViewIfNeeded();
await button.click();
```

### 5. Overlay Dismissal via Keyboard

Coordinate clicks (`page.mouse.click(0, 0)`) hit header logos or navigation bars on different viewports:

```typescript
// Required:
await page.keyboard.press('Escape').catch(() => {});
```

### 6. Semantic Timeouts for API-Backed States

External backend operations (EWA contract draft generation, MTIBU registry verification, SMS OTP dispatch) require 25,000–35,000ms. Short timeouts cause false timeouts under load:

```typescript
// Required:
await expect(this.otpModal).toBeVisible({ timeout: 30_000 });
```

### 7. Lead State Cleanup

Failing to register lead keys causes test data collisions (HTTP 409 Conflict "Active contract exists for vehicle"):

```typescript
// Required:
deletionLeads.push(lead.key);
```
