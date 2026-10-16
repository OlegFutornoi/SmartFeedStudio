import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { compareCounts, run, serializeCounts } from './ratchet.mjs';

function tmpFile(name, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchet-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, content);
  return file;
}

test('compareCounts: equal counts are ok', () => {
  const res = compareCounts({ 'UI-02': 3 }, { 'UI-02': 3 });
  assert.equal(res.ok, true);
});

test('compareCounts: increase is reported with rule and delta', () => {
  const res = compareCounts({ 'UI-02': 3 }, { 'UI-02': 5 });
  assert.equal(res.ok, false);
  assert.deepEqual(res.increased, [{ rule: 'UI-02', from: 3, to: 5 }]);
});

test('compareCounts: a brand-new rule with violations counts as increase', () => {
  const res = compareCounts({}, { 'BE-01': 1 });
  assert.deepEqual(res.increased, [{ rule: 'BE-01', from: 0, to: 1 }]);
});

test('compareCounts: decrease is reported separately so gains get locked in', () => {
  const res = compareCounts({ 'UI-02': 5 }, { 'UI-02': 2 });
  assert.equal(res.ok, false);
  assert.deepEqual(res.decreased, [{ rule: 'UI-02', from: 5, to: 2 }]);
  assert.equal(res.increased.length, 0);
});

test('serializeCounts: sorted keys, zero counts dropped, trailing newline', () => {
  assert.equal(serializeCounts({ b: 1, a: 2, c: 0 }), '{\n  "a": 2,\n  "b": 1\n}\n');
});

test('run: exit 1 on increase, 1 on decrease w/o --update, 0 when equal', () => {
  const baseline = tmpFile('baseline.json', '{"UI-02":3}');
  const up = tmpFile('up.json', '{"UI-02":4}');
  const down = tmpFile('down.json', '{"UI-02":1}');
  const same = tmpFile('same.json', '{"UI-02":3}');
  assert.equal(run(['--current', up, '--baseline', baseline]), 1);
  assert.equal(run(['--current', down, '--baseline', baseline]), 1);
  assert.equal(run(['--current', same, '--baseline', baseline]), 0);
});

test('run: --update locks in a decrease but refuses an increase', () => {
  const baseline = tmpFile('baseline.json', '{"UI-02":3}');
  const down = tmpFile('down.json', '{"UI-02":1}');
  const up = tmpFile('up.json', '{"UI-02":9}');
  assert.equal(run(['--current', up, '--baseline', baseline, '--update']), 1);
  assert.equal(fs.readFileSync(baseline, 'utf-8'), '{"UI-02":3}');
  assert.equal(run(['--current', down, '--baseline', baseline, '--update']), 0);
  assert.equal(fs.readFileSync(baseline, 'utf-8'), '{\n  "UI-02": 1\n}\n');
});

test('run: missing --current is a usage error (exit 2)', () => {
  assert.equal(run([]), 2);
});
