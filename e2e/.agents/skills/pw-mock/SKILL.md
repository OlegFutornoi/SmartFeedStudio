---
name: pw-mock
description: Playwright API & mock engineer skill. Use when creating or debugging API tests (*.api.ts), API controllers (api/ directory), network request intercepts (page.route), AJV JSON schema validations (api/schemas/), or seeding test data via API before UI flows.
---

# Playwright API & Mock Engineer (`pw-mock`)

Network request interception, route mocking, contract schema validation, and test data seeding in `insurance-e2e`.

---

## 1. Network Interception & Route Mocking (`page.route`)

Use `finance.route` or `page.route` to simulate backend error states (500, 404) or mock external rate providers:

```typescript
e2eTest(
  'Displays server error message on 500 status',
  { tag: ['@finance', '@osago'] },
  async ({ finance: { landingPage }, finance }) => {
    // Intercept endpoint and return 500
    await finance.route.mockResponseStatus({
      endpoint: /\/api\/osago\/products/,
      statusCode: 500,
    });

    await landingPage.open();
    await landingPage.toBeLoaded();
    // Assert user-facing error notification is visible
  },
);
```

---

## 2. API Test with Schema Validation Template

```typescript
import { expect } from '@playwright/test';
import { apiTest } from '@/fixtures/index';
import { generateOsagoLead } from '@/utils/leadRandom';
import { ApiVersion, SchemaPath } from '@/api/ApiConstants';
import { validateWithSchema } from '@/utils/validation.utils';

apiTest(
  'POST /leads/osago creates lead and satisfies contract schema',
  { tag: ['@crm', '@api'] },
  async ({ api }) => {
    const body = generateOsagoLead();
    const response = await api.crm.lead.createLead({
      body,
      productEndpoint: `${ApiVersion.CRM_V3}/osago`,
    });

    expect(response.code).toBe(200);

    const schemaResult = await validateWithSchema(response, SchemaPath.LEAD_RESPONSE);
    expect(schemaResult.valid, JSON.stringify(schemaResult.errors)).toBe(true);
  },
);
```

---

## 3. Network Inspection Scripts

- Trace Network Calls:
  ```bash
  node .agents/skills/pw-mock/scripts/network-trace.js <target_url> [api_path_filter]
  ```
- Autonomous Lead Runner (Travel):
  ```bash
  node .agents/skills/pw-mock/scripts/travel-lead-api-runner.js [BASE_URL]
  ```
- Autonomous Lead Runner (OSAGO):
  ```bash
  node .agents/skills/pw-mock/scripts/osago-lead-api-runner.js --env=review2 --phone=+380XXXXXXXXX --taxId=XXXXXXXXXX
  ```
