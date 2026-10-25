---
trigger: always_on
---

# Insurance E2E Architectural Context & Guidelines

## 1. Stack & Versions

- TypeScript (strict) · Playwright Test `@playwright/test ^1.64.1` + `APIRequestContext`
- `@faker-js/faker ^9.4.0` · `ajv ^8.17.1` + `ajv-formats ^3.0.1` · `envalid ^7.1.0` · `typescript ^5.8.2` · `eslint ^9.20.1` · Node 18+

## 2. Directory Placement & Decision Tree

- **HTTP Endpoint without UI:** API test (`tests/api/{service}/*.api.ts`). Create new controller in `api/{service}/controllers/` if service is new; otherwise add method to existing controller.
- **Page with dedicated URL:** Create `BasePage` subclass in `app-{finance|minfin}/pages/{product}/`.
- **Visual Block within a Page:** Create `BaseComponent` subclass in `app-{finance|minfin}/pages/{product}/components/` or `app-{finance|minfin}/components/`, expose as `readonly` field.
- **Calculator Wizard Step:** Create `*.screen.ts` in `client-wizard/presets/osago/screens/`.
- **Shared UI Logic:** Check `client-wizard/` for shared components. There is no generic "shared UI" folder; confirm with repository owner before introducing new shared directories.
- **Platform Scope:** Explicitly pick `finance` (`finance.ua`) or `minfin` (`minfin.ua`) based on task domain. Clarify if unspecified; do not guess.

## 3. Object Hierarchy & Inheritance

- **UI:** `PageHolder(page)` → `BaseComponent` (abstract `toBeLoaded`) → `BasePage` (abstract `open`) → `LandingPage` / `CatalogPage` / `HomePage`
- **Routing:** `PageHolder(page)` → `Route` (`mockResponseStatus`, `mockApiResponse`, `enableProdMode`)
- **API:** `RequestHolder(request)` → `Api` (composition: `crm`, `ibpm`, `otp`...) → `BaseController.req()` → `BaseRequest` builder → `LeadController`...

## 4. Fixtures & Teardown

- `e2eTest("title", { tag: [...] }, async ({ finance, minfin, page }) => {})`
- `apiTest("title", { tag: [...] }, async ({ api }) => {})`
- `finance: AppFinance` → `.landingPage`, `.catalogPage`, `.api`, `.route`, `.presetOsago`
- `minfin: AppMinfin` → `.homePage`, `.api`, `.route`
- **Automatic Teardown:** All created leads must register their key in `deletionLeads.push(leadKey)` (`osago_<leadId>`). Fixtures automatically purge registered leads via CRM API after test completion.

## 5. Environments & Credentials

- Auto-resolved via `config/env.helper.ts`:
  - `PROD=1` → `config/env.ts` (requires `ALLOW_PROD_TESTS=1`)
  - `REVIEW=1|2|3` → `config/env.review.ts`
  - `stage` / `intg` / default → `config/env.stage.ts`
- Credentials (`AUTH_IBPM_CLIENT`, `AUTH_CRM`, `AUTH_FINANCE_PAYMENT_CLIENT`) reside in `config.AUTH_*` and default in controllers. Never log or leak secrets in plans or chat.

## 6. Playwright Config & Locator Priorities

- Configuration: `timeout: 150_000`, `retries: IS_CI ? 1 : 0`, `workers: IS_CI ? 4 : 1`, `testIdAttribute: "data-state"`.
- Projects: `finance` (1440×900, `screen: undefined`), `minfin` (1440×1200, `screen: undefined`), `api` (no browser).
- Snapshots: `threshold: 0.35, maxDiffPixelRatio: 0.04, maxDiffPixels: 400`, `toHaveScreenshot: { type: 'webp' }`.
- Concurrency Control: `test.describe.configure({ lock: 'resource-key' })` for mutual exclusion on shared resources.
- **Locator Priority:**
  1. `getByRole("button", { name: /text/i })`
  2. `getByLabel(/text/i)`
  3. `getByText(/text/i)`
  4. `getByTestId("value")` (matches `data-state` or `data-testid`)
  5. `locator("[data-gtm-ea='...']")`
  6. Scoping: `childLocator.within(parentLocator)` (Playwright 1.64+) for modal dialogues, cards, and table columns.
  7. Prohibited: CSS classes (unless unavoidable), XPath (strictly forbidden).

## 7. API Layer & Contracts

- Builder pattern: `this.req(credentials).method("POST").url(url).searchParams(params).body(data).send(schemaPath)`
- Direct Cookies (Playwright 1.64+): `request.cookies(url)`, `request.addCookies([...])`, `request.clearCookies(...)` without creating `BrowserContext`.
- Response 4-Layer Defense: `not.toBe(500)` → exact deterministic status (`toBe(200)` | `toBe(422)`) → JSON content-type regex → non-empty body + AJV schema validation.

## 8. Canonical Code Patterns

### Page Object Pattern

```typescript
export default class CatalogPage extends BasePage {
  private readonly titleHeading = this.page.getByRole('heading', { level: 1 });
  private readonly orderButton = this.page.getByRole('button', { name: /замовити/i });

  @step('Open catalog page')
  public async open(path = '/ua/insurance/osago/catalog'): Promise<void> {
    await this.page.goto(path);
  }

  @step('Verify catalog page loaded')
  public async toBeLoaded(): Promise<void> {
    await expect(this.titleHeading).toBeVisible();
  }

  @step('Click order button')
  public async clickOrder(): Promise<void> {
    await this.toBeLoaded();
    await this.orderButton.first().click();
  }
}
```

### UI Test Pattern

```typescript
e2eTest.describe('Catalog Filters', () => {
  e2eTest.describe.configure({ timeout: 90_000 });

  e2eTest(
    'Filter by vehicle category updates offers',
    {
      tag: ['@finance', '@osago', '@stability'],
      annotation: { type: 'feature', description: 'Filter verification in OSAGO catalog' },
    },
    async ({ finance: { landingPage, catalogPage } }) => {
      // Actions
      await landingPage.open();
      await landingPage.toBeLoaded();
      // Verify
      await catalogPage.toBeLoaded();
      await expect(catalogPage.getTitle()).toContain('ОСАГО');
    },
  );
});
```

### Async Polling Pattern

```typescript
await expect
  .poll(async () => (await api.crm.lead.getLeadByKey({ key, client, resource }))?.data?.status, {
    intervals: [1000, 2000, 3000, 5000],
    timeout: 30_000,
    message: `Lead ${key} not completed within timeout`,
  })
  .toEqual('done');
```

## 9. Common Commands

```bash
npx tsc --noEmit && npm run lint               # Typecheck and linting
npx playwright test --project=finance|minfin|api # Run by project
npx playwright test --shuffle                  # Detect hidden test dependencies
PROD=1 ALLOW_PROD_TESTS=1 npm run catalog:monitoring:prod:osago # Prod monitoring
```
