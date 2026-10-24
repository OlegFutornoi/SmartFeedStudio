---
trigger: glob
globs: '{**/*.spec.ts,**/*.e2e-spec.ts,**/e2e/**,**/test/**}'
description: Automated testing, Playwright, Jest E2E, data cleanup, and test isolation invariants.
---

# Testing and Quality Invariants

## TEST-01: Mandatory `cleanDatabase` Teardown (Zero Leftovers & Zero Manual Data Deletion)

- Every automated backend test suite creating database rows must invoke the centralized `cleanDatabase` helper in `beforeAll` AND `afterAll`.
- Tests and database audits must strictly delete ONLY the specific test records created by that test (identified by explicit test `userIds` or timestamped test prefixes like `e2e.test+<timestamp>@smartfeed.local`).
- Never delete manually created developer/QA user accounts (e.g. `qatest@gmail.com`, `shoplinkerxml@gmail.com`, or any user not created by the test itself) during test teardown, database audits, or cleanup tasks.
- Teardown strictly follows the foreign-key safe deletion order:
  1. `Snapshot` and `ProductImage`
  2. `OrganizationInvitation`
  3. `OrganizationMember`
  4. `License`
  5. `Organization`
  6. `User` (strictly scoped by test-created ID, test email, or test prefix)
  7. `TariffPlan` and `NavigationItem` (test-created entities)
- Reason: Leftover test records corrupt subsequent test runs, while deleting manually created developer accounts destroys active manual testing state.

## TEST-02: Frontend Test Isolation

- Playwright E2E tests must reset browser `localStorage`, `sessionStorage`, cookies, and route handlers before and after each test case.
- Reason: Leaked browser storage causes authentication state bleed between test specs, creating non-deterministic flakiness.

## TEST-03: Real Business Data Assertions (Zero Superficial Tests)

- Playwright UI tests must assert real business entities (e.g. `Brain Distribution`), never settling for superficial smoke checks.
- Mandatory negative assertion: `expect(text).not.toBe('Постачальник')` to verify that table column names do not leak as row data values.
- Reason: Superficial smoke tests pass even when data tables display corrupted or unhydrated values.

## TEST-04: Client Avatar Assertions

- User and client table columns must assert the presence of a visible avatar (`[data-testid="user-avatar"]`).
- Reason: Guarantees that user identity components hydrate properly with user initials or image thumbnails.

## TEST-05: Single-Request Performance Tests

- Key views (Dashboard, Navigation, Suppliers, Licenses) must include tests asserting endpoints are called strictly 1 time on page load (`requestCount === 1`).
- Reason: Prevents silent performance regressions that cause cascading duplicate API calls during navigation.

## TEST-06: Strict TDD RED -> GREEN Cycle

- Write the automated test before writing production implementation.
- Execute the test and verify it fails with the expected functional reason (RED).
- Implement the minimal code required to pass the test (GREEN).
- Reason: Writing tests after code produces biased assertions that test implementation details instead of business behavior.

## TEST-07: Static Typecheck Clean (Zero Errors)

- `tsc --noEmit` must pass with 0 errors across all monorepo packages (`services/backend-api`, `apps/desktop`, `apps/admin-portal`, `packages/shared`).
- Never suppress TypeScript compiler errors with `@ts-ignore` without an explicit architectural comment.
- Reason: TypeScript errors in one package break monorepo compilation and hide runtime exceptions.
