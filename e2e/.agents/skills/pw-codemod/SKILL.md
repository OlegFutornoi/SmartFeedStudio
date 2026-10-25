---
name: pw-codemod
description: >-
  Safe automated codemod and batch refactoring skill for SmartFeed Studio E2E. Use when migrating legacy anti-patterns (deep relative imports to @/ alias, removing force: true, replacing waitForTimeout with expect.poll, converting XPath to user-facing locators, splitting monolithic spec files). Enforces single-rule-per-batch, atomic commits, and tsc/lint verification gates after every step.
---

# Safe Batch Refactoring & Codemods (`pw-codemod`)

Methodologies and automated recipes for eliminating technical debt across the `SmartFeed Studio E2E` codebase.

---

## 1. Safety Invariants

1. Single Concern: Exactly one rule migrated per batch. Never mix import fixes with locator or logic edits.
2. Batch Scope: 10–20 files per batch, grouped strictly by module directory.
3. Verification Gate: Run `npx tsc --noEmit && npm run lint` after every batch. Revert immediately on any failure.
4. Regression Execution: Execute the corresponding Playwright test suite to verify runtime behavior before committing.
5. Atomic Commit: Commit changes immediately after verification via standard Conventional Commits.

---

## 2. Codemod Recipes

### Recipe 1: Migrating Deep Relative Imports to `@/` Alias

Find candidate files:

```bash
grep -rnE 'from\s+["'"'"'](\.\./){2,}(fixtures|utils|api|appConstants|config|services|base|tests)' tests/ app-finance/ app-minfin/
```

Substitution pattern:

- Replace `../../../../fixtures` with `@/fixtures`
- Replace `../../../../utils/apiLogger` with `@/utils/apiLogger`
- Replace `../../../../api` with `@/api`
- Replace `../../../../config` with `@/config`

### Recipe 2: Removing `click({ force: true })`

```typescript
// Before:
await button.click({ force: true });

// After:
await page.keyboard.press('Escape').catch(() => {});
await button.scrollIntoViewIfNeeded();
await button.click();
```

### Recipe 3: Replacing `waitForTimeout` with `expect.poll`

```typescript
// Before:
await page.waitForTimeout(5000);

// After:
await expect
  .poll(async () => await getEntityStatus(), {
    intervals: [1000, 2000, 3000],
    timeout: 15_000,
  })
  .toBe('ready');
```

### Recipe 4: Converting XPath to User-Facing Locators

```typescript
// Before:
await page.locator("//button[contains(text(), 'Оформити')]").click();

// After:
await page.getByRole('button', { name: /оформити/i }).click();
```
