---
name: playwright-e2e
description: Project-specific reference for writing, editing, and debugging Playwright E2E/API tests, Page Objects, POM components, wizard screens, and API controllers in insurance-e2e (finance.ua / minfin.ua). Activate for creating or maintaining tests, POMs, API clients, route mocks, or debugging test failures.
---

# Playwright E2E Conventions (`insurance-e2e`)

Core technical specifications and conventions for Playwright E2E and API testing in `insurance-e2e`.

---

## 1. Stack & Architecture

- **Runtime:** TypeScript (strict mode) on Node 18+.
- **Test Runner:** `@playwright/test` + `APIRequestContext`.
- **Validation & Data:** `@faker-js/faker`, AJV (Draft-07), `envalid`.
- **Code Style:** ESLint v9 flat config (210 chars, 4 spaces, double quotes, semicolons).

### Directory Placement

- Page Objects: `app-{finance|minfin}/pages/{product}/Name.page.ts` (extends `BasePage`)
- Components: `app-{finance|minfin}/pages/{product}/components/Name.component.ts` (extends `BaseComponent`)
- Wizard Screens: `client-wizard/presets/osago/screens/*.screen.ts`
- API Controllers: `api/{service}/controllers/Name.controller.ts` (extends `BaseController`)
- API Schemas: `api/schemas/{service}/*.schema.json`
- UI Tests: `tests/{finance|minfin}/{product}/pages/*.{finance|minfin}.ts`
- API Tests: `tests/api/{service}/*.api.ts`

---

## 2. Fixtures & Execution Context

### Test Fixtures (`@/fixtures/index`)

- `e2eTest`: UI test fixture providing `finance`, `minfin`, `portmone`, `page`.
  - Automatic teardown: Leads added to `deletionLeads.push(lead.key)` are deleted via CRM API after test run.
- `apiTest`: API test fixture providing `api` (`crm`, `ibpm`, `productManager`, `otp`, `bazaGai`).

### Environment Flags

- Default: Stage / Integration (`config/env.stage.ts`).
- Review stands: `REVIEW=1|2|3` (`config/env.review.ts`).
- Production: `PROD=1 ALLOW_PROD_TESTS=1` (`config/env.ts`). Note: `env.dev.ts` does not exist.

---

## 3. Locator Priority & Actionability

1. `page.getByRole("button", { name: /text/i })`
2. `page.getByLabel(/text/i)`
3. `page.getByText(/text/i)`
4. `page.getByTestId("value")` (maps to `[data-state="value"]` via `testIdAttribute: "data-state"`)
5. `page.locator("[data-gtm-ea='value']")`

### Strict Invariants

- ❌ **Forbidden:** XPath (`xpath=`, `//`), CSS class selectors, `force: true`, `page.waitForTimeout()`, `element.evaluate(el => el.click())`.
- ✅ **Required:** Web-first assertions (`await expect(el).toBeVisible()`), `expect.poll` for async polling, `scrollIntoViewIfNeeded()`.
- Overlay dismissal: `try { await el.click({ timeout: 10_000 }); } catch { await page.keyboard.press("Escape"); await el.click({ timeout: 10_000 }); }`.

---

## 4. Code Templates

### 4.1 Page Object (`BasePage`)

```typescript
import { expect } from '@playwright/test';
import { BasePage } from '@/base/BasePage.abstract';
import { step } from '@/utils/step';

export default class CatalogPage extends BasePage {
  private readonly catalogTitle = this.page.getByRole('heading', { level: 1 });
  private readonly filterButton = this.page.getByRole('button', { name: /фільтри/i });

  @step('Open Catalog')
  public async open(): Promise<void> {
    await this.page.goto('/ua/insurance/osago/catalog');
  }

  @step('Ensure Catalog Loaded')
  protected async toBeLoaded(): Promise<void> {
    await expect(this.catalogTitle).toBeVisible();
  }

  @step('Apply Filters')
  public async openFilters(): Promise<void> {
    await this.toBeLoaded();
    await this.filterButton.click();
  }
}
```

### 4.2 Component (`BaseComponent`)

```typescript
import { expect } from '@playwright/test';
import { BaseComponent } from '@/base/BaseComponent.abstract';
import { step } from '@/utils/step';

export default class PolicyCardComponent extends BaseComponent {
  private readonly root = this.page.locator("[data-state='policy-card']");
  private readonly buyButton = this.root.getByRole('button', { name: /купити/i });

  @step('Ensure Policy Card Loaded')
  protected async toBeLoaded(): Promise<void> {
    await expect(this.root.first()).toBeVisible();
  }

  @step('Click Buy First Policy')
  public async buyFirstPolicy(): Promise<void> {
    await this.toBeLoaded();
    await this.buyButton.first().click();
  }
}
```

### 4.3 UI Spec File (`*.finance.ts` / `*.minfin.ts`)

```typescript
import { expect } from '@playwright/test';
import { e2eTest } from '@/fixtures/index';

e2eTest.describe('OSAGO Policy Selection Flow', () => {
  e2eTest.describe.configure({ timeout: 90_000 });

  e2eTest(
    'User can calculate and view OSAGO offers by car number',
    {
      tag: ['@finance', '@osago'],
      annotation: { type: 'feature', description: 'Search by vehicle plate' },
    },
    async ({ finance: { landingPage, catalogPage } }) => {
      // Actions
      await landingPage.open();
      await landingPage.toBeLoaded();
      await landingPage.searchByVehiclePlate('AA1234BB');

      // Verify
      await catalogPage.toBeLoaded();
      expect(await catalogPage.getTitle()).toContain('ОСАГО');
    },
  );
});
```

### 4.4 API Spec File (`*.api.ts`)

```typescript
import { expect } from '@playwright/test';
import { apiTest } from '@/fixtures/index';
import { generateOsagoLead } from '@/utils/leadRandom';
import { ApiVersion } from '@/api/ApiConstants';

apiTest(
  '[POST /leads] Create OSAGO lead returns 200',
  { tag: ['@crm', '@api'] },
  async ({ api }) => {
    const body = generateOsagoLead();
    const response = await api.crm.lead.createLead({
      body,
      productEdpoint: `${ApiVersion.CRM_V3}/osago`,
    });
    expect(response.code).toBe(200);
  },
);
```

---

## 5. UI Domain Specifics (OSAGO Redesign)

- **Landing vs. Catalog:**
  - Landing: Vehicle parameter toggles use direct button locators.
  - Catalog: Editing parameters opens "Calculation Data" modal with MUI Select dropdowns. Click parent label, then select option with `getByRole("option", { name: /value/i })`.
- **Wizard Calculator ("By Params"):**
  - Prefer `getByTestId()` mapped to `data-state` (`data-state="input-ownerBirthYear"`, `data-state="input-confirmSms"`).
- **Datepicker Fallback:**
  - If datepicker day clicks flake, use keyboard navigation (`page.keyboard.press("ArrowRight")`).
- **Global DGO Dropdown:**
  - DGO options are duplicated in hidden cards. Target open container: `page.locator('div[data-state="custom-select-options:open"] div[data-state="dgoProductList"]').first()`.
