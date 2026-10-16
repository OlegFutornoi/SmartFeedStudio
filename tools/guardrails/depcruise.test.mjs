import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cruise } from 'dependency-cruiser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

test('depcruise: queries importing from commands violates queries-not-import-commands rule', async () => {
  // Load config
  const configModule = await import(path.join(rootDir, '.dependency-cruiser.cjs'));
  const config = configModule.default || configModule;

  const fixtureDir = path.join(__dirname, '__fixtures__/depcruise/bad-cqrs');
  const result = await cruise([fixtureDir], {
    validate: true,
    ruleSet: config,
  });

  const violations = result.output?.summary?.violations ?? [];
  const queryViolations = violations.filter(
    (v) => v.rule?.name === 'queries-not-import-commands',
  );

  assert.ok(
    queryViolations.length >= 1,
    `Expected at least 1 queries-not-import-commands violation, got ${queryViolations.length}`,
  );
});

test('depcruise: clean CQRS files produce zero violations', async () => {
  const configModule = await import(path.join(rootDir, '.dependency-cruiser.cjs'));
  const config = configModule.default || configModule;

  const fixtureDir = path.join(__dirname, '__fixtures__/depcruise/good-cqrs');
  const result = await cruise([fixtureDir], {
    validate: true,
    ruleSet: config,
  });

  const violations = result.output?.summary?.violations ?? [];
  assert.equal(violations.length, 0, `Expected 0 violations, got ${violations.length}`);
});
