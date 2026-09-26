---
name: playwright-best-practices
description: >-
  Comprehensive Playwright testing master skill for SmartFeedStudio (React 18/19, Next.js 14,
  Tauri v2, Electron) with embedded TDD discipline, anti-patterns enforcement, and SmartFeed-specific
  testing patterns. Consolidates: test-driven-development-tdd (RED-GREEN-REFACTOR cycle),
  testing-anti-patterns (3 Iron Laws), condition-based-waiting (replace sleep with polling),
  verification-before-completion (run before claiming success), systematic-debugging, root-cause-tracing.
  Enforces: cleanDatabase teardown, bilingual UA/EN tests, network dedup assertions (requestCount===1),
  Page Object Model, data-testid selectors. Covers E2E, component, API, visual, accessibility, security,
  i18n, Electron, mobile, multi-user, and performance testing. Use when writing Playwright tests, fixing
  flaky tests, debugging failures, implementing POM, configuring CI/CD, mocking APIs, testing
  authentication, accessibility (axe-core), file operations, date/time, WebSockets, geolocation,
  multi-tab flows, mobile/responsive, GraphQL, offline mode, multi-user collaboration, third-party
  services (payments, email), security (XSS, CSRF), performance budgets (Web Vitals), iframes,
  canvas/WebGL, service workers, i18n/localization. Triggers on any test, spec, playwright, E2E,
  testing, flaky, тест, автотест, coverage task.
license: MIT
metadata:
  author: currents.dev (extended for SmartFeed Studio)
  version: '2.0'
---

# 🧪 Playwright Best Practices (SmartFeed Studio)

Comprehensive Playwright testing master skill combining universal Playwright best practices with SmartFeed-specific patterns, TDD discipline, anti-pattern enforcement, and condition-based waiting.

---

## 🏗️ 1. SmartFeed Studio Testing Architecture

### Project-Specific Context

```text
SmartFeed Studio Test Locations:
├── apps/admin-portal/tests/     # Next.js 14 Admin Portal E2E (pnpm test:admin)
├── apps/desktop/tests/          # Tauri v2 + React Desktop E2E (pnpm test:desktop)
└── services/backend-api/test/   # NestJS E2E with Supertest (pnpm --filter @smartfeed/backend-api test:e2e)
```

### SmartFeed Test Commands

```bash
# Run all E2E tests
pnpm test:admin               # Admin Portal (headless)
pnpm test:admin:headed        # Admin Portal (headed, visible browser)
pnpm test:admin:ui            # Admin Portal (Playwright UI mode)
pnpm test:desktop             # Desktop Client (headless)
pnpm test:desktop:headed      # Desktop Client (headed)
pnpm test:desktop:ui          # Desktop Client (Playwright UI mode)
pnpm --filter @smartfeed/backend-api test:e2e  # Backend E2E

# Run specific test file
pnpm test:admin -- <feature>.spec.ts
pnpm test:desktop -- <feature>.spec.ts
```

> [!WARNING]
> **NEVER** call `browser_subagent` or `open_browser_url`. They unconditionally fail on macOS ARM64.
> **ALWAYS** use direct Playwright MCP tools (`call_mcp_tool` with `ServerName: "playwright"`) or the test runners above.

---

## 🔌 1.5 MCP Research Tools — Use During Test Development

### 📚 context7 — Документація Playwright API

Перед написанням тестів — отримай актуальні Playwright patterns:

```
# Playwright документація
call_mcp_tool(ServerName: "context7", ToolName: "resolve-library-id",
  Arguments: { libraryName: "playwright" })
call_mcp_tool(ServerName: "context7", ToolName: "query-docs",
  Arguments: { context7CompatibleLibraryID: "/microsoft/playwright",
               topic: "expect.poll condition polling" })

# Next.js тестування patterns
call_mcp_tool(ServerName: "context7", ToolName: "query-docs",
  Arguments: { context7CompatibleLibraryID: "/vercel/next.js",
               topic: "Playwright testing App Router" })
```

**Коли використовувати**:

- `waitForResponse`, `expect.poll` — актуальний синтаксис
- Page Object Model паттерни в Playwright v1.4x+
- Network interception API (`route`, `fulfill`, `abort`)
- `expect` matchers перед написанням асерцій
- Electron/Tauri testing специфіка API

### 🔥 firecrawl — Пошук Тестових Patterns

```
# Playwright best practices для специфічного сценарію
call_mcp_tool(ServerName: "firecrawl", ToolName: "firecrawl_search",
  Arguments: { query: "Playwright test file upload Next.js App Router" })

# Реальні приклади i18n тестів
call_mcp_tool(ServerName: "firecrawl", ToolName: "firecrawl_search",
  Arguments: { query: "Playwright i18n language switch test example" })

# Flaky test solutions
call_mcp_tool(ServerName: "firecrawl", ToolName: "firecrawl_search",
  Arguments: { query: "Playwright flaky tests race condition fix waitForResponse" })
```

**Коли використовувати**:

- Жоден flaky test — шукати реальні приклади вирішення
- Специфічні сценарії (file upload, OAuth, WebSocket)
- CI/CD Playwright налаштування (GitHub Actions, Docker)
- Accessibility testing patterns (axe-core integration)

### 🎭 playwright MCP — Інспекція під час Тестування

Використовуй для інспекції live додатку **до/під час написання автотестів**:

```
# Інспекція DOM для пошуку правильних selectors
call_mcp_tool(ServerName: "playwright", ToolName: "browser_navigate",
  Arguments: { url: "http://localhost:3000/dashboard" })
call_mcp_tool(ServerName: "playwright", ToolName: "browser_snapshot",
  Arguments: {})  # Повертає структуру DOM з ARIA roles

# Перевірка що елемент існує
call_mcp_tool(ServerName: "playwright", ToolName: "browser_find",
  Arguments: { selector: "[data-testid='create-feed-btn']" })

# Скриншот для visual regression порівняння
call_mcp_tool(ServerName: "playwright", ToolName: "browser_take_screenshot",
  Arguments: {})

# Клік + інспекція dialog state
call_mcp_tool(ServerName: "playwright", ToolName: "browser_click",
  Arguments: { selector: "[data-testid='create-btn']" })
call_mcp_tool(ServerName: "playwright", ToolName: "browser_snapshot", Arguments: {})
```

**Коли використовувати**:

- Пошук `data-testid` selectors в live DOM перед написанням локаторів
- Інспекція ARIA structure для accessibility tests
- Візуальна перевірка після написання RED тесту
- Дебаг flaky test — бачити що справді відбувається на сторінці
- Порівняння screenshot before/after для visual regression

---

## 🔴 2. TDD Integration: RED-GREEN-REFACTOR

_Embedded from `test-driven-development-tdd` skill_

### The Iron Law of TDD

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

**Cycle for every SmartFeed feature**:

1. **RED** — Write the Playwright test first:
   - Write `<feature>.spec.ts` asserting the desired behavior.
   - Run: `pnpm test:admin -- <feature>.spec.ts`
   - **Verify**: Test FAILS for the expected functional reason (element not found, missing translation, wrong data) — NOT due to syntax errors or config issues.

2. **GREEN** — Write minimal implementation:
   - Implement ONLY what the test needs to pass.
   - Run tests again. **Verify**: Tests pass cleanly.

3. **REFACTOR** — Improve without breaking:
   - Refactor component structure, modularity, and styling.
   - Run tests after each refactor. Tests must stay green.

### SmartFeed RED Phase Verification Checklist

Before moving from RED to GREEN, confirm:

- [ ] Test runs without syntax/import errors
- [ ] Test fails for the **expected UI/functional reason**
- [ ] Test covers the **5 mandatory UI states** (loading, empty, data, error, success)
- [ ] Bilingual test (UA⇄EN) is included

---

## 🚫 3. Testing Anti-Patterns: 3 Iron Laws

_Embedded from `testing-anti-patterns` skill_

### Law 1: Never Test Mock Behavior

```typescript
// ❌ WRONG: Testing that the mock was called
mockApiClient.getUsers.mockResolvedValue([user]);
await component.loadUsers();
expect(mockApiClient.getUsers).toHaveBeenCalledTimes(1); // Testing the mock, not behavior!

// ✅ CORRECT: Test observable behavior
await page.goto('/users');
await expect(page.locator('[data-testid="user-row"]')).toBeVisible();
await expect(page.locator('[data-testid="user-name"]')).toHaveText('John Doe');
```

### Law 2: Never Add Test-Only Methods to Production Classes

```typescript
// ❌ WRONG: Adding method just for testing
class UserService {
  // This method exists only for tests — production anti-pattern!
  getInternalState() {
    return this._cache;
  }
}

// ✅ CORRECT: Test through public API behavior only
await page.goto('/users');
await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
```

### Law 3: Understand Dependencies Before Mocking

Before mocking any service/API:

1. What does the real implementation actually do?
2. What are its side effects?
3. Does the mock faithfully represent ALL those behaviors?
4. Would a real integration test be more valuable here?

---

### 🚨 Law 4: Exact Backend URL Scoping in Mocks (Vite Collision Prevention)

> [!CAUTION]
> **NEVER USE LOOSE GLOBS LIKE `**/api/products*` OR `**/api/suppliers*`!**
> In Vite dev server (`apps/desktop` :1420), frontend TypeScript modules are imported over HTTP (e.g. `http://localhost:1420/src/lib/api/products.ts`).
> A loose pattern like `'**/api/products*'` will intercept the Vite frontend source module and return JSON, causing:
> `Failed to load module script: Expected a JavaScript module script but received application/json`!

```typescript
// ❌ WRONG: Collides with Vite frontend source files (/src/lib/api/products.ts)
await page.route('**/api/products*', (route) => route.fulfill({ json: [] }));

// ✅ CORRECT: Explicitly scope to backend API origin port 4000
await page.route('http://localhost:4000/api/products*', (route) => route.fulfill({ json: [] }));
// Or regex requiring /api/ preceded by port 4000:
await page.route(/.*:4000\/api\/products.*/, (route) => route.fulfill({ json: [] }));
```

---

### 🧵 Law 5: Desktop Playwright Worker Concurrency (`workers: 1`)

Desktop client (`apps/desktop`) tests run against a single shared local SQLite/state instance and localStorage.

- **NEVER** run desktop Playwright tests with multiple parallel workers (`workers: > 1`).
- `apps/desktop/playwright.config.ts` **MUST ALWAYS** configure `workers: 1` to prevent state collision, session invalidation, and flaky tests.

---

### 🔒 Law 6: Zero `any` in Test Mock Stores

Mocks in E2E tests must have explicit TypeScript types, never `any[]` or `Record<string, any>`:

```typescript
// ❌ WRONG
let mockRules: any[] = [];

// ✅ CORRECT
interface MockPricingRule {
  id: string;
  name: string;
  markupPercent: number;
  isActive: boolean;
}
let mockRules: MockPricingRule[] = [];
```

---

## ⏱️ 4. Condition-Based Waiting (Zero `sleep()`)

_Embedded from `condition-based-waiting` skill_

**Core Principle**: Never use `sleep()` or `waitForTimeout()`. Always wait for a specific condition.

```typescript
// ❌ WRONG: Arbitrary timeout
await page.waitForTimeout(2000);

// ✅ CORRECT: Wait for condition
await page.waitForResponse((resp) => resp.url().includes('/api/users') && resp.status() === 200);
await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
await expect(page.locator('[data-testid="loading-skeleton"]')).not.toBeVisible();
```

### SmartFeed Condition Patterns

```typescript
// Wait for API response
await page.waitForResponse((resp) => resp.url().includes('/api/plans') && resp.status() === 200);

// Wait for element state
await expect(page.locator('[data-testid="submit-btn"]')).toBeEnabled();
await expect(page.locator('[data-testid="error-toast"]')).toBeVisible();

// Poll with expect.poll
await expect
  .poll(
    async () => {
      return page.locator('[data-testid="sync-status"]').textContent();
    },
    { timeout: 10000 },
  )
  .toBe('Synced');

// Wait for navigation
await Promise.all([
  page.waitForURL('/dashboard'),
  page.locator('[data-testid="login-btn"]').click(),
]);
```

---

## 🎯 5. SmartFeed-Specific Testing Patterns

### 5.1 Mandatory Test Coverage for Every Feature

Every new or modified screen MUST include:

```typescript
describe('<Feature> Tests', () => {
  // 1. Loading state
  test('shows loading skeleton while data is fetching', async ({ page }) => {
    // Intercept and delay API (always scoped to backend port 4000)
    await page.route('http://localhost:4000/api/target', (route) =>
      setTimeout(() => route.continue(), 500),
    );
    await page.goto('/target-page');
    await expect(page.locator('[data-testid="skeleton-loader"]')).toBeVisible();
  });

  // 2. Empty state
  test('shows empty state with CTA when no data exists', async ({ page }) => {
    await page.route('http://localhost:4000/api/target', (route) => route.fulfill({ json: [] }));
    await page.goto('/target-page');
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-btn"]')).toBeVisible();
  });

  // 3. Data state
  test('renders data table with all columns', async ({ page }) => {
    await page.goto('/target-page');
    await expect(page.locator('[data-testid="data-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="data-row"]')).toHaveCount(5);
  });

  // 4. Error state
  test('shows localized error when API fails', async ({ page }) => {
    await page.route('http://localhost:4000/api/target', (route) => route.fulfill({ status: 500 }));
    await page.goto('/target-page');
    await expect(page.locator('[data-testid="error-banner"]')).toBeVisible();
  });
});
```

### 5.2 Mandatory Bilingual Test (UA⇄EN)

Every view MUST have dedicated language switching tests:

```typescript
test('all UI elements translate correctly UA → EN', async ({ page }) => {
  // Start in Ukrainian (default)
  await page.goto('/target-page');
  await expect(page.locator('h1')).toHaveText('Цільова сторінка');
  await expect(page.locator('[data-testid="create-btn"]')).toHaveText('Створити');

  // Switch to English
  await page.locator('[data-testid="language-switcher"]').click();
  await page.locator('[data-testid="lang-en"]').click();

  // Assert all elements translated
  await expect(page.locator('h1')).toHaveText('Target Page');
  await expect(page.locator('[data-testid="create-btn"]')).toHaveText('Create');
  await expect(page.locator('[data-testid="table-header-name"]')).toHaveText('Name');

  // Table headers, badges, tooltips, error messages all translated
  await expect(page.locator('[data-testid="status-badge"]')).toHaveText('Active');
});
```

### 5.3 Mandatory Network Deduplication Assertion

Every page load test MUST verify API called exactly once:

```typescript
test('loads page data with exactly 1 API request', async ({ page }) => {
  let requestCount = 0;
  page.on('request', (req) => {
    if (req.url().includes(':4000/api/target')) requestCount++;
  });

  await page.goto('/target-page');
  await expect(page.locator('[data-testid="data-table"]')).toBeVisible();

  expect(requestCount).toBe(1); // Zero duplicates
});
```

### 5.4 Test Isolation (Frontend)

Before and after each test, clean all browser state:

```typescript
test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  // Clear route mocks
  await page.unrouteAll();
});
```

### 5.5 Backend Test Isolation (`cleanDatabase`)

Every backend E2E test file MUST use `cleanDatabase`:

```typescript
import { cleanDatabase } from '../utils/teardown.helper';

beforeAll(async () => {
  await cleanDatabase(prisma);
  // Setup test data
});

afterAll(async () => {
  await cleanDatabase(prisma); // Zero leftovers
  await app.close();
});
```

FK-safe teardown order:
`Snapshot`/`ProductImage` → `OrganizationInvitation` → `OrganizationMember` → `License` → `Organization` → `User` → `TariffPlan`/`NavigationItem`

---

### 5.6 Adversarial Race Condition & Quota Stress Tests

Critical operations guarded by quotas (e.g. member invitations, XML feeds, AI credits) MUST include concurrent adversarial tests to prove that mutex locks prevent race condition overruns:

```typescript
it('should reject concurrent requests exceeding quota limits (TOCTOU protection)', async () => {
  // Scenario: Organization has only 1 remaining seat available
  // Launch 10 simultaneous invite requests concurrently
  const promises = Array.from({ length: 10 }).map((_, i) =>
    request(app.getHttpServer())
      .post(`/organizations/${orgId}/invitations`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: `race_test_${i}@example.com`, role: 'MEMBER' }),
  );

  const results = await Promise.all(promises);
  const successes = results.filter((r) => r.status === 201);
  const rejections = results.filter((r) => r.status === 403);

  // Exactly 1 request succeeds; exactly 9 are safely rejected by mutex
  expect(successes.length).toBe(1);
  expect(rejections.length).toBe(9);
});
```

---

### 5.7 Empty State Single CTA Assertion

Tests MUST assert that when an empty state is rendered, duplicate action buttons in toolbar or header are completely hidden:

```typescript
test('hides toolbar action button when empty state card provides CTA', async ({ page }) => {
  await page.route('http://localhost:4000/api/channels*', (route) => route.fulfill({ json: [] }));
  await page.goto('/export');

  // Empty state card CTA is visible
  await expect(page.locator('[data-testid="empty-state-add-channel-btn"]')).toBeVisible();

  // Toolbar action button MUST NOT be rendered
  await expect(page.locator('[data-testid="toolbar-add-channel-btn"]')).not.toBeVisible();
});
```

---

## 📖 6. Activity-Based Reference Guide

### Writing New Tests

| Activity                   | Reference Files                                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Writing E2E tests**      | [core/test-suite-structure.md](core/test-suite-structure.md), [core/locators.md](core/locators.md), [core/assertions-waiting.md](core/assertions-waiting.md)     |
| **Structuring with POM**   | [core/page-object-model.md](core/page-object-model.md), [core/test-suite-structure.md](core/test-suite-structure.md)                                             |
| **Setting up fixtures**    | [core/fixtures-hooks.md](core/fixtures-hooks.md), [core/test-data.md](core/test-data.md)                                                                         |
| **Authentication testing** | [advanced/authentication.md](advanced/authentication.md), [advanced/authentication-flows.md](advanced/authentication-flows.md)                                   |
| **i18n / localization**    | [testing-patterns/i18n.md](testing-patterns/i18n.md)                                                                                                             |
| **Accessibility testing**  | [testing-patterns/accessibility.md](testing-patterns/accessibility.md)                                                                                           |
| **Forms & validation**     | [testing-patterns/forms-validation.md](testing-patterns/forms-validation.md)                                                                                     |
| **File upload/download**   | [testing-patterns/file-operations.md](testing-patterns/file-operations.md), [testing-patterns/file-upload-download.md](testing-patterns/file-upload-download.md) |
| **Security (XSS, CSRF)**   | [testing-patterns/security-testing.md](testing-patterns/security-testing.md)                                                                                     |
| **Electron app testing**   | [testing-patterns/electron.md](testing-patterns/electron.md)                                                                                                     |
| **Component testing**      | [testing-patterns/component-testing.md](testing-patterns/component-testing.md)                                                                                   |
| **API testing**            | [testing-patterns/api-testing.md](testing-patterns/api-testing.md)                                                                                               |
| **Visual regression**      | [testing-patterns/visual-regression.md](testing-patterns/visual-regression.md)                                                                                   |

### Debugging & Troubleshooting

| Activity               | Reference Files                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Debugging failures** | [debugging/debugging.md](debugging/debugging.md), [core/assertions-waiting.md](core/assertions-waiting.md)     |
| **Fixing flaky tests** | [debugging/flaky-tests.md](debugging/flaky-tests.md), [debugging/debugging.md](debugging/debugging.md)         |
| **Race conditions**    | [debugging/flaky-tests.md](debugging/flaky-tests.md), [core/assertions-waiting.md](core/assertions-waiting.md) |
| **Console/JS errors**  | [debugging/console-errors.md](debugging/console-errors.md)                                                     |
| **Selector issues**    | [core/locators.md](core/locators.md), [debugging/debugging.md](debugging/debugging.md)                         |
| **Timeout issues**     | [core/assertions-waiting.md](core/assertions-waiting.md), [debugging/debugging.md](debugging/debugging.md)     |

### Advanced Patterns

| Activity                    | Reference Files                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Mocking API responses**   | [advanced/network-advanced.md](advanced/network-advanced.md)                                                           |
| **Network interception**    | [advanced/network-advanced.md](advanced/network-advanced.md), [core/assertions-waiting.md](core/assertions-waiting.md) |
| **OAuth/SSO mocking**       | [advanced/third-party.md](advanced/third-party.md), [advanced/multi-context.md](advanced/multi-context.md)             |
| **Payment gateway mocking** | [advanced/third-party.md](advanced/third-party.md)                                                                     |
| **Multi-user testing**      | [advanced/multi-user.md](advanced/multi-user.md)                                                                       |
| **WebSocket/real-time**     | [browser-apis/websockets.md](browser-apis/websockets.md)                                                               |
| **Performance budgets**     | [testing-patterns/performance-testing.md](testing-patterns/performance-testing.md)                                     |
| **Mobile/responsive**       | [advanced/mobile-testing.md](advanced/mobile-testing.md)                                                               |

### Infrastructure & CI/CD

| Activity               | Reference Files                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **CI/CD setup**        | [infrastructure-ci-cd/ci-cd.md](infrastructure-ci-cd/ci-cd.md), [infrastructure-ci-cd/github-actions.md](infrastructure-ci-cd/github-actions.md) |
| **Parallel execution** | [infrastructure-ci-cd/parallel-sharding.md](infrastructure-ci-cd/parallel-sharding.md)                                                           |
| **Docker setup**       | [infrastructure-ci-cd/docker.md](infrastructure-ci-cd/docker.md)                                                                                 |
| **Test coverage**      | [infrastructure-ci-cd/test-coverage.md](infrastructure-ci-cd/test-coverage.md)                                                                   |
| **Reporting**          | [infrastructure-ci-cd/reporting.md](infrastructure-ci-cd/reporting.md)                                                                           |

---

## ✅ 7. Test Validation Loop

After writing or modifying tests (`verification-before-completion` embedded):

```bash
# 1. Run tests
pnpm test:admin -- <feature>.spec.ts
# or
pnpm test:desktop -- <feature>.spec.ts

# 2. If failing → review error output and trace
npx playwright show-trace

# 3. Fix locators, waits, or assertions (never add sleep())

# 4. Re-run — must pass consistently
pnpm test:admin -- <feature>.spec.ts --repeat-each=3

# 5. Only proceed when all tests pass 3+ consecutive runs
```

### Systematic Debugging for Test Failures (`systematic-debugging`)

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

1. **Root Cause**: Read full error output. Is it a selector issue, timing, missing test data, or logic error?
2. **Trace Viewer**: `npx playwright show-trace trace.zip` — inspect exact DOM state at failure.
3. **Hypothesis**: _"I think the test fails because the button is not yet rendered when we click."_
4. **Minimal Fix**: Smallest possible change — add condition wait, fix selector, or adjust test data.
5. **Verify**: Run 3+ times to confirm stability. Check no regressions in related tests.

**🚨 Circuit Breaker**: If 3+ different fixes fail → STOP. The test architecture itself needs redesign.

---

## 🔖 8. Quick Decision Tree

```
What are you doing?
│
├─ SmartFeed-specific?
│  ├─ Writing feature test → Section 5: SmartFeed Patterns
│  ├─ TDD RED phase → Section 2: TDD Integration
│  ├─ Test is flaky → Section 4: Condition-Based Waiting
│  └─ Backend teardown → Section 5.5: cleanDatabase
│
├─ Writing a new test?
│  ├─ E2E → core/test-suite-structure.md, core/locators.md
│  ├─ Component → testing-patterns/component-testing.md
│  ├─ API → testing-patterns/api-testing.md
│  ├─ Accessibility → testing-patterns/accessibility.md
│  ├─ i18n → testing-patterns/i18n.md
│  ├─ Electron → testing-patterns/electron.md
│  └─ Visual regression → testing-patterns/visual-regression.md
│
├─ Test is failing/flaky?
│  ├─ Flaky → debugging/flaky-tests.md + Section 4 (no sleep!)
│  ├─ Timeout → core/assertions-waiting.md + Section 4
│  ├─ Selector → core/locators.md
│  └─ Race condition → debugging/flaky-tests.md + Section 4
│
├─ Architecture decisions?
│  ├─ POM vs fixtures → architecture/pom-vs-fixtures.md
│  ├─ Test type selection → architecture/test-architecture.md
│  └─ Mock vs real → architecture/when-to-mock.md + Section 3 Law 3
│
├─ Framework-specific?
│  ├─ React/Next.js → frameworks/react.md, frameworks/nextjs.md
│  └─ Electron/Tauri → testing-patterns/electron.md
│
└─ CI/CD setup?
   ├─ GitHub Actions → infrastructure-ci-cd/github-actions.md
   ├─ Parallel runs → infrastructure-ci-cd/parallel-sharding.md
   └─ Reporting → infrastructure-ci-cd/reporting.md
```

**Related Project Rules** (always active):

- [testing_and_quality.md](../../../rules/testing_and_quality.md) — cleanDatabase, 100% i18n tests, Git policy
- [commands.md](../../../rules/commands.md) — SmartFeed test commands & ports
- [frontend_network_dedup.md](../../../rules/frontend_network_dedup.md) — requestCount===1 assertions
