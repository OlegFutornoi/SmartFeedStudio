# 🧪 Testing, Quality Assurance & Data Teardown Review Matrix

## 1. Zero Leftovers Teardown Policy

Every automated test that writes data to PostgreSQL, Redis, or localStorage must clean up 100% of its data:

### Backend Teardown Hierarchy (`cleanDatabase` helper):

```text
1. Snapshot & ProductImage (catalogs, XML feeds, media)
2. OrganizationInvitation (tokens, emails)
3. OrganizationMember (memberships)
4. License (licenses)
5. Organization (organizations)
6. User (users)
7. TariffPlan & NavigationItem (plans, navigation)
```

- [ ] All `*.e2e-spec.ts` files call `cleanDatabase(prisma)` in both `beforeAll()` (pre-clean) and `afterAll()` (post-clean).
- [ ] No orphaned test records remain after running test suites.

---

## 2. Playwright E2E Best Practices (`apps/desktop`, `apps/admin-portal`)

- [ ] **Page Object Model (POM)**: Tests encapsulate UI actions inside dedicated page classes (`LoginPage`, `SuppliersPage`, `PlansPage`).
- [ ] **Resilient Selectors**: Use `data-testid="..."` instead of brittle CSS/XPath hierarchies.
- [ ] **Condition-Based Waiting**: Replace arbitrary `page.waitForTimeout()` with condition polling (`await expect(locator).toBeVisible()`, `page.waitForResponse()`).
- [ ] **Bilingual Tests (UA ⇄ EN)**: Every major view must include a test asserting dynamic text translation when clicking the language switch button.
- [ ] **Single-Request Performance**: Assert key endpoints are called strictly 1 time on initial load.
- [ ] **Browser Storage Cleanup**: Clear `localStorage` and `sessionStorage` in `beforeEach()`.

---

## 3. Mandatory Verification Checklist

Execute these commands before approving any review:

```bash
# 1. Typecheck all packages
pnpm --filter @smartfeed/shared build
pnpm --filter @smartfeed/backend-api exec tsc --noEmit
pnpm --filter @smartfeed/desktop exec tsc --noEmit
pnpm --filter admin-portal exec tsc --noEmit

# 2. Run automated test suites
pnpm --filter @smartfeed/backend-api test:e2e
pnpm test:desktop
pnpm test:admin

# 3. Format check
pnpm format
```
