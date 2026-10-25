---
name: pw-arch
description: Playwright architecture & infrastructure skill. Use when designing, scaffolding, or refactoring the core framework architecture (playwright.config.ts, custom typed fixtures, global setup/teardown, envalid environment config, CI/CD pipeline configs, monorepo structure, and base classes BasePage/BaseComponent/Route).
---

# Playwright Architecture & Infrastructure (`pw-arch`)

Framework architecture, core abstractions, environment configurations, and custom fixture design for `SmartFeed Studio E2E`.

---

## 1. Core Architectural Responsibilities

- `playwright.config.ts`: Multi-project configuration (`finance`, `minfin`, `api`), sharding, reporters, timeouts, snapshot thresholds.
- Custom Typed Fixtures (`fixtures/index.ts`): Dependency injection for `finance`, `minfin`, `api`, `portmone`.
- Environment Management (`config/`): `env.ts` (prod), `env.stage.ts` (stage/intg, default), `env.review.ts` (review1-3), selected via `config/env.helper.ts`.
- Core Abstractions (`base/`): `BasePage`, `BaseComponent`, `PageHolder`, `Route`.
- API Abstractions (`api/base/`): `BaseController.abstract.ts`, `RequestHolder`, `BaseRequest`.

---

## 2. Invariants

1. Strict TypeScript: Zero `any`, explicit interfaces, discriminated unions, `satisfies`.
2. Typed Fixtures: Pages and controllers injected exclusively via test fixtures (`e2eTest`, `apiTest`). No manual instantiations in test specs.
3. Teardown Automation: `deletionLeads[]` array processed and leads deleted in fixture teardown.
4. Single Source of Truth for URLs: No hardcoded environment URLs. Import strictly from `@/config/env.helper` or `PagePrefix`.
5. Path Aliases: All imports from root directories must use `@/` alias (`@/fixtures`, `@/api`, `@/config`, `@/base`).

---

## 3. Fixture Architecture Template (`fixtures/index.ts`)

```typescript
import { test as baseTest } from '@playwright/test';
import { AppFinance } from '@/app-finance';
import { AppMinfin } from '@/app-minfin';
import { Api } from '@/api';

export type E2EFixtures = {
  finance: AppFinance;
  minfin: AppMinfin;
  api: Api;
};

export const e2eTest = baseTest.extend<E2EFixtures>({
  finance: async ({ page, request }, use) => {
    const app = new AppFinance(page, request);
    const deletionLeads: string[] = [];
    app.setDeletionLeads(deletionLeads);

    await use(app);

    // Teardown: auto-delete all created leads
    for (const leadKey of deletionLeads) {
      await app.api.crm.lead.deleteLead(leadKey).catch(() => {});
    }
  },
});
```
