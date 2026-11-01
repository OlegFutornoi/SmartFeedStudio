import assert from 'node:assert/strict';
import test from 'node:test';
import { checkFile } from './structural.mjs';

test('BE-12 and SEC-04: Anti-BOLA detects missing organizationId / tenancyWhere in suppliers', () => {
  const badCode = `
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, userId },
    });
  `;
  const v = checkFile(
    'services/backend-api/src/modules/suppliers/commands/handlers/test.handler.ts',
    badCode,
  );
  assert.ok(v.some((x) => x.rule === 'BE-12'));
  assert.ok(v.some((x) => x.rule === 'SEC-04'));

  const goodCode = `
    const tenancyWhere = await getSupplierTenancyWhere(this.prisma, userId);
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, ...tenancyWhere },
    });
  `;
  const clean = checkFile(
    'services/backend-api/src/modules/suppliers/commands/handlers/test.handler.ts',
    goodCode,
  );
  assert.ok(!clean.some((x) => x.rule === 'BE-12'));
  assert.ok(!clean.some((x) => x.rule === 'SEC-04'));
});

test('BE-06: Commercial plan selection must validate payment', () => {
  const bad = `export class SelectTariffPlanHandler {}`;
  const v = checkFile(
    'services/backend-api/src/modules/billing/commands/handlers/select-tariff-plan.handler.ts',
    bad,
  );
  assert.ok(v.some((x) => x.rule === 'BE-06'));
});

test('BE-09: Synchronous fs.readFileSync is prohibited in feeds module', () => {
  const bad = `const content = fs.readFileSync(path, 'utf8');`;
  const v = checkFile(
    'services/backend-api/src/modules/feeds/feed-import.ts',
    bad,
  );
  assert.ok(v.some((x) => x.rule === 'BE-09'));
});

test('BE-10: BullMQ addBulk jobs must declare deterministic jobId', () => {
  const bad = `await this.queue.addBulk([{ name: 'sync', data }]);`;
  const v = checkFile(
    'services/backend-api/src/modules/sync/sync.service.ts',
    bad,
  );
  assert.ok(v.some((x) => x.rule === 'BE-10'));
});

test('BE-13: Payment webhook approval must atomically provision license', () => {
  const bad = `export class HandleWayforpayWebhookHandler {}`;
  const v = checkFile(
    'services/backend-api/src/modules/billing/commands/handlers/handle-wayforpay-webhook.handler.ts',
    bad,
  );
  assert.ok(v.some((x) => x.rule === 'BE-13'));
});

test('SEC-09: Strict Public DTO rejects privilege properties', () => {
  const bad = `export class RegisterDto { role?: Role; }`;
  const v = checkFile(
    'packages/shared/src/contracts/auth/register.dto.ts',
    bad,
  );
  assert.ok(v.some((x) => x.rule === 'SEC-09'));
});

test('FE-02: React.StrictMode is reported', () => {
  const badNext = `const nextConfig = { reactStrictMode: true }; export default nextConfig;`;
  const v1 = checkFile('apps/admin-portal/next.config.mjs', badNext);
  assert.ok(v1.some((x) => x.rule === 'FE-02'));

  const badDesktop = `createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);`;
  const v2 = checkFile('apps/desktop/src/main.tsx', badDesktop);
  assert.ok(v2.some((x) => x.rule === 'FE-02'));
});

test('FE-03: Redundant post-auth /auth/me call is reported', () => {
  const bad = `await login(dto); await refreshProfile();`;
  const v = checkFile('apps/desktop/src/modules/auth/login.ts', bad);
  assert.ok(v.some((x) => x.rule === 'FE-03'));
});

test('FE-07: Prohibit direct auth token in localStorage within components', () => {
  const bad = `localStorage.setItem('authToken', token);`;
  const v = checkFile('apps/desktop/src/components/auth/AuthForm.tsx', bad);
  assert.ok(v.some((x) => x.rule === 'FE-07'));
});

test('FE-08: mockDatabaseDriver header string leaks are reported', () => {
  const bad = `const data = { supplierName: 'Постачальник' };`;
  const v = checkFile('apps/desktop/src/services/mockDatabaseDriver.ts', bad);
  assert.ok(v.some((x) => x.rule === 'FE-08'));
});

test('FE-12: Raw fetch calls in API client services are reported', () => {
  const bad = `export function getSuppliers() { return fetch('/api/suppliers'); }`;
  const v = checkFile('apps/desktop/src/services/api/suppliers.ts', bad);
  assert.ok(v.some((x) => x.rule === 'FE-12'));
});

test('FE-13: Scoped domain DataSync prevents catch-all all subscription', () => {
  const bad = `useDataSync(['all']);`;
  const v = checkFile('apps/desktop/src/components/FeedList.tsx', bad);
  assert.ok(v.some((x) => x.rule === 'FE-13'));
});

test('TEST-02: Test isolation catches unscoped localStorage mutations', () => {
  const bad = `localStorage.setItem('test', '1');`;
  const v = checkFile('e2e/tests/auth.spec.ts', bad);
  assert.ok(v.some((x) => x.rule === 'TEST-02'));
});

test('TEST-03: Real business entity assertions catch header leakage', () => {
  const bad = `expect(name).toBe('Постачальник');`;
  const v = checkFile('e2e/tests/suppliers.spec.ts', bad);
  assert.ok(v.some((x) => x.rule === 'TEST-03'));
});

test('OPS-01: AGENTS.md must synchronize with wiki', () => {
  const bad = `# Agents guide`;
  const v = checkFile('AGENTS.md', bad);
  assert.ok(v.some((x) => x.rule === 'OPS-01'));
});

test('OPS-05: Monorepo port mapping violations are reported in package.json', () => {
  const bad = JSON.stringify({ scripts: { 'dev:backend': 'nest start --port 5000' } });
  const v = checkFile('package.json', bad);
  assert.ok(v.some((x) => x.rule === 'OPS-05'));
});

test('CORE-12: Unannotated @ts-ignore is prohibited', () => {
  const bad = `// @ts-ignore\nconst x = 1;`;
  const v = checkFile('apps/desktop/src/test.ts', bad);
  assert.ok(v.some((x) => x.rule === 'CORE-12'));

  const good = `// @ts-ignore (ticket: SF-123)\nconst x = 1;`;
  const clean = checkFile('apps/desktop/src/test.ts', good);
  assert.ok(!clean.some((x) => x.rule === 'CORE-12'));
});
