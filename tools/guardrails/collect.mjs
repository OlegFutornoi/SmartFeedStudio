#!/usr/bin/env node

/**
 * SmartFeed Studio — guardrail collector + ratchet gate (`pnpm guardrails:check`).
 *
 * 1. Lints the repo through the ESLint API (same flat config as `pnpm lint`).
 *    Any severity-2 (error) message fails immediately with the stylish report.
 * 2. Tallies warn-level invariant violations per rule ID from ESLint messages tagged `[ID]`
 *    plus mapped typed-lint rules.
 * 3. Adds structural invariants (ARCH-04 / BE-07 / BE-02) from `structural.mjs`.
 * 4. Compares with `baseline.json`: violations may only go DOWN (see ratchet.mjs).
 *
 * Usage:
 *   node tools/guardrails/collect.mjs            # gate
 *   node tools/guardrails/collect.mjs --update   # lock in a decrease (refuses increases)
 *   node tools/guardrails/collect.mjs --json     # print counts only
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { run as runRatchet, serializeCounts } from './ratchet.mjs';
import { checkFile } from './structural.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TAG = /^\[([A-Z0-9]+-\d+)\]/;

/** typed-lint rules have no [ID] tag; map them to project invariant IDs. */
const TYPED_RULE_IDS = {
  '@typescript-eslint/no-floating-promises': 'ASYNC-01',
  '@typescript-eslint/no-misused-promises': 'ASYNC-02',
  '@typescript-eslint/await-thenable': 'ASYNC-03',
};

function bump(counts, key) {
  counts[key] = (counts[key] ?? 0) + 1;
}

export function tallyEslint(results) {
  const counts = {};
  for (const result of results) {
    for (const m of result.messages) {
      const tag = m.message.match(TAG)?.[1] ?? TYPED_RULE_IDS[m.ruleId];
      if (tag) bump(counts, tag);
    }
  }
  return counts;
}

export function tallyStructural(files) {
  const counts = {};
  for (const { relPath, content } of files) {
    for (const v of checkFile(relPath, content)) bump(counts, v.rule);
  }
  return counts;
}

export function mergeCounts(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 0) + v;
  return out;
}

function walkBackend(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'generated' || entry.name === 'dist')
      continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkBackend(full, out);
    else if (entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

function readStructuralInputs() {
  const base = path.join(ROOT, 'services/backend-api/src');
  return walkBackend(base).map((file) => ({
    relPath: path.relative(ROOT, file).split(path.sep).join('/'),
    content: fs.readFileSync(file, 'utf-8'),
  }));
}

async function main(argv) {
  const eslint = new ESLint({ cwd: ROOT });
  const results = await eslint.lintFiles(['.']);

  const errors = results.filter((r) => r.errorCount > 0);
  if (errors.length > 0) {
    const formatter = await eslint.loadFormatter('stylish');
    console.error(await formatter.format(errors));
    console.error('❌ [Guardrails] ESLint errors must be fixed before the ratchet is evaluated.');
    return 1;
  }

  const counts = mergeCounts(tallyEslint(results), tallyStructural(readStructuralInputs()));

  if (argv.includes('--json')) {
    process.stdout.write(serializeCounts(counts));
    return 0;
  }

  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'guardrails-')), 'current.json');
  fs.writeFileSync(tmp, serializeCounts(counts));
  const ratchetArgs = ['--current', tmp];
  if (argv.includes('--update')) ratchetArgs.push('--update');
  return runRatchet(ratchetArgs);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error('❌ [Guardrails] Unexpected failure:', err);
      process.exit(2);
    },
  );
}
