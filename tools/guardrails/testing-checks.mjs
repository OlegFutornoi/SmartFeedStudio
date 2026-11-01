/**
 * SmartFeed Studio — Testing Architecture Guardrails.
 *
 *  TEST-02 Frontend Test Isolation
 *  TEST-03 Real Business Data Assertions
 *  TEST-04 Client Avatar Assertions
 *  TEST-05 Single-Request Performance Tests
 *  TEST-06 Directory & Naming Contract
 */

export function checkTestingRules(relPath, content, out) {
  // TEST-06: Directory & Naming Contract
  if (relPath.startsWith('e2e/tests/') && relPath.endsWith('.ts')) {
    const isSpec = relPath.endsWith('.spec.ts');
    const isPage = relPath.endsWith('.page.ts');
    const isSetup = relPath.endsWith('.setup.ts');
    const isTeardown = relPath.endsWith('.teardown.ts');
    const isHelper =
      relPath.includes('/helpers/') || relPath.includes('/fixtures/');

    if (!isSpec && !isPage && !isSetup && !isTeardown && !isHelper) {
      out.push({
        rule: 'TEST-06',
        line: 1,
        message:
          'Test files must follow naming contract: *.spec.ts, *.page.ts, *.setup.ts, or *.teardown.ts.',
      });
    }
  }

  // TEST-02: Frontend Test Isolation
  if (
    (relPath.startsWith('e2e/tests/') || relPath.includes('/tests/integration/')) &&
    relPath.endsWith('.spec.ts')
  ) {
    if (
      content.includes('localStorage.setItem') &&
      !content.includes('storageState') &&
      !content.includes('clear') &&
      !content.includes('cleanDatabase') &&
      !content.includes('context.clearCookies')
    ) {
      out.push({
        rule: 'TEST-02',
        line: 1,
        message:
          'Test isolation violation: Unscoped localStorage modification without teardown/cleanDatabase.',
      });
    }
  }

  // TEST-03: Real Business Data Assertions (negative check against column header leakage)
  if (relPath.startsWith('e2e/') && relPath.endsWith('.spec.ts')) {
    if (
      content.includes("expect(name).toBe('Постачальник')") ||
      content.includes("expect(name).toBe('Supplier')")
    ) {
      out.push({
        rule: 'TEST-03',
        line: 1,
        message:
          'Column header leakage detected in test assertions. Tests must assert real business entities.',
      });
    }
  }

  // TEST-04: Client Avatar Assertions
  if (
    relPath.startsWith('e2e/tests/') &&
    relPath.includes('user') &&
    relPath.endsWith('.spec.ts')
  ) {
    if (content.includes('UserTable') && !content.includes('user-avatar')) {
      out.push({
        rule: 'TEST-04',
        line: 1,
        message:
          'Client avatar assertion missing: User table tests must assert presence of user avatar.',
      });
    }
  }

  // TEST-05: Single-Request Performance Tests
  if (
    relPath.startsWith('e2e/tests/') &&
    relPath.includes('perf') &&
    relPath.endsWith('.spec.ts')
  ) {
    if (!content.includes('requestCount') && !content.includes('=== 1')) {
      out.push({
        rule: 'TEST-05',
        line: 1,
        message:
          'Performance test must assert single-request invariant (requestCount === 1).',
      });
    }
  }
}
