---
name: playwright-best-practices
description: Core Playwright best practices, locator guidelines, web-first assertions, test isolation, and Page Object architecture for the SmartFeed Studio E2E test suite. Use when creating or refactoring Playwright UI tests, ensuring parallel test safety, or debugging test flakiness.
---

# Playwright Best Practices (`playwright-best-practices`)

Authoritative guidelines for scalable, deterministic, and maintainable Playwright tests.

---

## 1. Locators & Element Selection

- Prefer User-Facing Locators: `getByRole`, `getByLabel`, `getByText`, `getByTestId` (`data-state`).
- Avoid Brittle Selectors: Never rely on CSS class names, XPath, or dynamic auto-generated IDs.
- Chain Locators & Use `within()`: Narrow down within component containers using chained calls or `locator.within(parent)`:
  ```typescript
  // Natural reading & column-like resolution (Playwright 1.64+)
  const orderButton = page.getByRole('button', { name: 'Замовити' });
  const card = page.getByTestId('tariff-card-ewa');
  await orderButton.within(card).click();
  ```

---

## 2. Web-First Assertions & Auto-Waiting

- Leverage Auto-Waiting: Playwright automatically checks actionability (visible, stable, enabled, editable) before actions (`click`, `fill`, `check`).
- Web-First Assertions: Always use async `expect(locator).toBeVisible()`, `expect(locator).toHaveText()` with automatic retries.
- Polling for Async State: Use `expect.poll()` for backend polling or state transitions. Never use hardcoded sleeps (`waitForTimeout`).

---

## 3. Test Isolation & Concurrency

- Zero Shared State: Tests must execute independently and cleanly in parallel (`workers: 4`).
- Setup & Teardown: Utilize Playwright fixtures (`finance`, `minfin`, `api`) rather than global variables.
- Unique Test Data: Generate unique lead attributes per test (`leadRandom`, Faker) to prevent database collisions.
- Guaranteed Teardown: Always push created lead keys to `deletionLeads` for post-test cleanup.
- Test Locks & Shuffle (Playwright 1.64+): Use `test.describe.configure({ lock: 'key' })` when tests must not run concurrently with each other, and verify isolation using `npx playwright test --shuffle`.

---

## 4. Page Object Model (POM) Discipline

- Encapsulate Locators: Mark all locators `private readonly` inside Page and Component classes.
- Expose Business Intent: POM methods represent user workflows (`fillForm()`, `selectCategory()`), returning void or child components.
- Anchor Verification: Implement `toBeLoaded()` checking primary landmarks before interacting.
- Reporting Hierarchy: Decorate public action methods with `@step()` from `@/utils/step`.
