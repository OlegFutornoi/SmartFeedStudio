---
name: playwright-automation
description: >-
  Enterprise Playwright E2E and UI automation engineering for Desktop and Admin Portal.
  Consolidates POM patterns, bilingual UI assertions (UA ⇄ EN), network deduplication tests,
  visual regression snapshots, accessibility scans, and condition-based waiting.
  Use when writing, refactoring, or running Playwright tests in apps/desktop or apps/admin-portal.
---

# 🎭 Playwright Automation (SmartFeed Studio)

Enterprise UI and E2E automation standard for SmartFeed Studio Desktop (`apps/desktop`) and Admin Portal (`apps/admin-portal`).

## 🧭 1. Core Testing Invariants

1. **Page Object Model (POM) & Resilient Selectors**:
   - Use `data-testid` attributes or accessible role selectors (`page.getByRole('button', { name: ... })`).
   - Never use fragile CSS class chains (`.flex > div:nth-child(2) > span`).
2. **Mandatory Bilingual UI Tests (UA ⇄ EN)**:
   - Every key view MUST include tests verifying that switching languages dynamically updates all titles, buttons, placeholders, badges, and alerts.
   - Assert zero leaked raw translation keys (e.g. `expect(text).not.toContain('common:')`).
3. **Real Business Data Invariants (Zero "Smoke-Only" Tests)**:
   - Tests must assert actual entity values (e.g. supplier name `Brain Distribution`).
   - Strictly assert `expect(text).not.toBe('Постачальник')` to catch column-name leakages.
   - Assert cascade deletion effects (deleting a feed decreases product count).
4. **Network Deduplication Assertions**:
   - Verify endpoints are called strictly **1 time** upon page load:
     ```typescript
     let requestCount = 0;
     page.on('request', (req) => {
       if (req.url().includes('/api/endpoint')) requestCount++;
     });
     await page.goto('/target-page');
     expect(requestCount).toBe(1);
     ```
5. **Clean Data Teardown**:
   - Always clear `localStorage`, `sessionStorage`, and cookies before and after tests.

## ⏱️ 2. Condition-Based Waiting (Zero Flaky Sleeps)

- Prohibit arbitrary `page.waitForTimeout(2000)`.
- Use condition-based predicates:
  - `await expect(locator).toBeVisible()`
  - `await page.waitForResponse(resp => resp.url().includes('/api/...') && resp.status() === 200)`
  - `await expect.poll(async () => ...).toBe(...)`

## 🖥️ 3. Execution Commands

- Desktop Tests: `pnpm test:desktop` (Headed: `pnpm test:desktop:headed`, UI: `pnpm test:desktop:ui`)
- Admin Portal Tests: `pnpm test:admin` (Headed: `pnpm test:admin:headed`, UI: `pnpm test:admin:ui`)
