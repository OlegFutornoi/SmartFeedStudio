---
title: Black-Box HTTP Testing for Backend API (e2e/server/backend)
impact: HIGH
impactDescription: Validates real HTTP request/response cycle against running backend instance
tags: testing, e2e, playwright, api, integration
---

## Black-Box HTTP Testing for Backend API

All backend end-to-end integration tests reside in `e2e/server/backend/` and are executed by QA Agent (`@agents_qa`) against the live running NestJS instance. Tests interact strictly as external HTTP clients, exercising real routing, global pipes, guards, filters, database persistence, and Redis queues without internal in-process test harnesses.

```typescript
import { test, expect } from '../../core/fixtures/base.fixture';
import { ServerBackendClient } from '../clients/server-backend.client';

test.describe('Server Backend API Integration', () => {
  test('authenticates and retrieves profile with valid contract', async ({ request, runId }) => {
    const client = new ServerBackendClient(request);
    const response = await client.post('/api/auth/login', {
      email: 'admin@smartfeed.local',
      password: 'adminpassword',
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('accessToken');
  });
});
```
