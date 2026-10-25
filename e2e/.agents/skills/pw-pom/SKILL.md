---
name: pw-pom
description: Page Object Model architect skill. Use when creating, reviewing, or refactoring Page Objects (BasePage subclasses) or reusable components (BaseComponent subclasses), auditing locators for user-facing priority, or encapsulating page actions with @step() decorators.
---

# POM Architect (`pw-pom`)

Design, creation, and refactoring standards for Page Objects (`BasePage`) and reusable components (`BaseComponent`) in `app-finance/` and `app-minfin/`.

---

## 1. POM Design Principles

1. Strict Encapsulation:
   - Locators MUST be `private readonly` (or `protected readonly` when sub-classed).
   - Public methods expose business actions (e.g., `fillPersonalData()`, `selectVehicle()`, `submitOrder()`), never raw locators.

2. User-Facing Locator Priority:
   - Priority 1: `page.getByRole("button" | "textbox" | "link", { name: /text/i })`
   - Priority 2: `page.getByLabel(/label text/i)`
   - Priority 3: `page.getByText(/visible text/i)`
   - Priority 4: `page.getByTestId("value")` (matches `data-state` or `data-testid`)
   - Priority 5: `page.locator("[data-gtm-ea='...']")`
   - Scoping & Nesting: Use `child.within(parent)` (Playwright 1.64+) for modal dialogues, cards, and table columns.
   - Prohibited: XPath (`xpath=`, `//`), CSS class selectors, `input[placeholder*='...']`, `#react-select-*`.

3. Mandatory `toBeLoaded()` Check:
   - Every Page and Component must implement a `toBeLoaded()` method verifying visibility of anchor elements via `await expect(locator).toBeVisible()`.
   - All public action methods must start with `await this.toBeLoaded()`.

4. Structured Reporting Decorator:
   - Decorate public action methods with `@step("Action description")` imported from `@/utils/step`.

---

## 2. Standard Page Object Template

```typescript
import { type Page, expect, type Locator } from '@playwright/test';
import { BasePage } from '@/base/BasePage.abstract';
import { step } from '@/utils/step';

export default class CatalogPage extends BasePage {
  private readonly titleHeading: Locator = this.page.getByRole('heading', { level: 1 });
  private readonly orderButton: Locator = this.page.getByRole('button', { name: /замовити/i });

  @step('Open catalog page')
  public async open(urlPath = '/ua/insurance/osago/catalog'): Promise<void> {
    await this.page.goto(urlPath);
  }

  @step('Verify catalog page loaded')
  public async toBeLoaded(): Promise<void> {
    await expect(this.titleHeading).toBeVisible();
    await expect(this.orderButton.first()).toBeVisible();
  }

  @step('Click order button')
  public async clickOrder(): Promise<void> {
    await this.toBeLoaded();
    await this.orderButton.first().click();
  }
}
```

---

## 3. Standard Component Template

```typescript
import { expect, type Locator } from '@playwright/test';
import { BaseComponent } from '@/base/BaseComponent.abstract';
import { step } from '@/utils/step';

export default class VehicleFilterComponent extends BaseComponent {
  private readonly filterContainer: Locator = this.page.getByTestId('vehicle-filter-container');
  private readonly searchInput: Locator = this.page.getByRole('textbox', { name: /номер авто/i });

  @step('Verify vehicle filter component loaded')
  public async toBeLoaded(): Promise<void> {
    await expect(this.filterContainer).toBeVisible();
    await expect(this.searchInput).toBeVisible();
  }

  @step('Search by plate number: {plate}')
  public async searchPlate(plate: string): Promise<void> {
    await this.toBeLoaded();
    await this.searchInput.fill(plate);
  }
}
```
