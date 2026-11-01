# Post-Deployment Smoke Verification

## 1. Automated API Smoke Suite

Following deployment to Staging or Production, execute rapid health check:

```bash
#!/bin/bash
set -e

TARGET_URL=${1:-"http://localhost:4000"}
echo "[SMOKE] Probing API target: $TARGET_URL"

# 1. Healthcheck endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/api/health" || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
  echo "[FAIL] Healthcheck returned HTTP $HTTP_CODE"
  exit 1
fi
echo "[PASS] /api/health returned 200 OK"

# 2. Swagger docs
DOCS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/api/docs" || echo "000")
if [ "$DOCS_CODE" != "200" ] && [ "$DOCS_CODE" != "301" ]; then
  echo "[WARN] Swagger docs returned HTTP $DOCS_CODE"
fi

# 3. Public plans (DB connectivity probe)
PLANS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/api/plans" || echo "000")
if [ "$PLANS_CODE" != "200" ]; then
  echo "[FAIL] Database connectivity failure via /api/plans: HTTP $PLANS_CODE"
  exit 1
fi
echo "[PASS] /api/plans returned 200 OK (PostgreSQL active)"
```

## 2. Playwright Headless Smoke Suite for Web Portal

Fast headless check (<30s) asserting zero White Screen of Death (WSOD):

```typescript
import { test, expect } from '@playwright/test';

test.describe('Production Smoke Verification', () => {
  test('Root page loads with 0 console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });
});
```

## 3. Go / No-Go Decision Criteria

- HTTP Error Rate: < 0.1% (trigger immediate rollback if exceeded)
- API Latency (p95): < 300 ms (investigate slow queries if exceeded)
- DB Connection Pool: < 70% of max connections (verify connection leak prevention)
- Console JS Errors: 0 unhandled exceptions (block release on frontend errors)
