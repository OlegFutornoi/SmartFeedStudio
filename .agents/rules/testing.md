---
trigger: glob
globs: 'e2e/**'
description: Automated testing framework invariants, Playwright E2E, data cleanup, and test isolation.
---

# Testing and Quality Invariants

## TEST-00: Centralized Test Suite Exclusivity

- All automated test suites, specs, page objects, fixtures, and API clients reside strictly in the dedicated `e2e/` package.
- No `*.spec.ts`, `*.test.ts`, `*.e2e-spec.ts`, or test configs are permitted in application or library packages (`apps/*`, `services/*`, `packages/*`).
- Automated tests are authored exclusively by QA Agent (`@agents_qa`) within dedicated `QA-<num>` tasks. Feature agents (`@agents_frontend`, `@agents_backend`) never author test files.
- Reason: Eliminates fragmented testing setups, circular dependencies, and duplicate test drivers.

## TEST-01: Mandatory Teardown and Scoped Cleanup

- Every automated backend test suite creating database rows must perform scoped teardown in setup and teardown phases.
- Server database cleanup strictly scopes deletion to entities matching test-run prefixes (`e2e.<runId>.` or `e2e.test+<timestamp>@smartfeed.local`).
- Never delete manually created developer/QA user accounts (e.g. `qatest@gmail.com`, `shoplinkerxml@gmail.com`) or modify non-test data.
- Teardown strictly follows the foreign-key safe deletion order: Snapshot, ProductImage, OrganizationInvitation, OrganizationMember, License, Organization, User, TariffPlan, NavigationItem.
- Local SQLite cleanup is invoked strictly via `POST /api/reset` against the isolated e2e container (`:5002`), never against active developer database (`:5001`).
- Reason: Leftover test records corrupt subsequent test runs, while touching developer data disrupts local development.

## TEST-02: Frontend Test Isolation

- Playwright UI tests must reset browser `localStorage`, `sessionStorage`, cookies, and route handlers before and after each test case.
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

## TEST-06: Directory & Naming Contract

- Test files adhere to deterministic naming by layer:
  - Specs: `*.spec.ts` in `specs/` directories.
  - Setup and Teardown: `*.setup.ts` and `*.teardown.ts`.
  - Page Object Models: `*.page.ts` in `pages/`.
  - Reusable Components: `*.component.ts` in `components/`.
  - API and Local DB Clients: `*.client.ts` in `clients/`.
  - Test Data Builders: `*.factory.ts` in `factories/`.
- Reason: Standardized naming enables reliable glob matching, project separation, and linting.

## TEST-07: Static Typecheck Clean (Zero Errors)

- `tsc --noEmit` must pass with 0 errors across all monorepo packages, including `@smartfeed/e2e`.
- Never suppress TypeScript compiler errors with `@ts-ignore` without an explicit architectural comment.
- Reason: TypeScript errors hide runtime exceptions and break monorepo build pipelines.

## TEST-08: Isolated Test Entity Prefixes

- All entities created during test execution must incorporate a deterministic run ID: `e2e.<runId>.<entityName>`.
- Generated emails must strictly follow `e2e.test+<timestamp>@smartfeed.local`.
- Reason: Guarantees deterministic filtering during cleanup and avoids unique key collisions in multi-run environments.

## TEST-09: Playwright Resilience & Web-First Assertions

- Explicit sleep timeouts (`page.waitForTimeout`) and hardcoded delays are strictly prohibited.
- Assertions must use web-first locators (`getByTestId`, `getByRole`) and web-first expectations (`await expect(...).toBeVisible()`).
- In CI mode, `forbidOnly` is mandatory to prevent accidental commits of `test.only`.
- Reason: Hardcoded delays induce test flakiness and slow down execution suites.
