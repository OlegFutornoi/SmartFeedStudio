import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeCounts, tallyEslint, tallyStructural } from './collect.mjs';

const msg = (message, ruleId, severity = 1) => ({ message, ruleId, severity });

test('tallyEslint: counts [ID]-tagged messages per invariant and maps typed-lint rules', () => {
  const results = [
    {
      messages: [
        msg('[UI-02] Hardcoded palette color.', 'no-restricted-syntax'),
        msg('[UI-02] Hardcoded palette color.', 'no-restricted-syntax'),
        msg('[UI-05] Raw HTML control.', 'no-restricted-syntax'),
        msg('Promises must be awaited', '@typescript-eslint/no-floating-promises'),
        msg('Unused var', '@typescript-eslint/no-unused-vars'),
      ],
    },
    { messages: [msg('[BE-01] Raw @Query(key).', 'no-restricted-syntax')] },
  ];
  assert.deepEqual(tallyEslint(results), { 'UI-02': 2, 'UI-05': 1, 'ASYNC-01': 1, 'BE-01': 1 });
});

test('tallyStructural: counts violations per rule across files', () => {
  const files = [
    {
      relPath: 'services/backend-api/src/modules/a/a.handlers.ts',
      content: '@QueryHandler(A) class A {}\n@QueryHandler(B) class B {}',
    },
    {
      relPath: 'services/backend-api/src/modules/a/a.controller.ts',
      content: '@Controller() class C { @Post() create() {} }',
    },
  ];
  assert.deepEqual(tallyStructural(files), { 'ARCH-04': 1, 'BE-02': 1 });
});

test('mergeCounts: sums overlapping rules', () => {
  assert.deepEqual(mergeCounts({ 'BE-01': 2 }, { 'BE-01': 1, 'UI-02': 4 }), {
    'BE-01': 3,
    'UI-02': 4,
  });
});
