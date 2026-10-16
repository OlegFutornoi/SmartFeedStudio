#!/usr/bin/env node

/**
 * SmartFeed Studio — Guardrail Ratchet
 *
 * Compares current per-rule violation counts against a committed baseline.
 *  - count increased  -> FAIL (new violation introduced)
 *  - count decreased  -> FAIL with hint, unless --update is passed (locks the gain in)
 *  - counts equal     -> PASS
 *
 * Usage:
 *   node tools/guardrails/ratchet.mjs --current counts.json [--baseline baseline.json] [--update]
 *
 * counts.json shape: { "UI-02": 12, "BE-01": 2 }
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DEFAULT_BASELINE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'baseline.json');

/**
 * @param {Record<string, number>} baseline
 * @param {Record<string, number>} current
 * @returns {{ ok: boolean, increased: Array<{rule: string, from: number, to: number}>, decreased: Array<{rule: string, from: number, to: number}> }}
 */
export function compareCounts(baseline, current) {
  const rules = new Set([...Object.keys(baseline), ...Object.keys(current)]);
  const increased = [];
  const decreased = [];
  for (const rule of [...rules].sort()) {
    const from = baseline[rule] ?? 0;
    const to = current[rule] ?? 0;
    if (to > from) increased.push({ rule, from, to });
    else if (to < from) decreased.push({ rule, from, to });
  }
  return { ok: increased.length === 0 && decreased.length === 0, increased, decreased };
}

/** Stable, merge-friendly serialization: sorted keys, zero counts dropped. */
export function serializeCounts(counts) {
  const sorted = {};
  for (const rule of Object.keys(counts).sort()) {
    if (counts[rule] > 0) sorted[rule] = counts[rule];
  }
  return `${JSON.stringify(sorted, null, 2)}\n`;
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (err) {
    console.warn(`[Ratchet] Cannot read JSON "${file}":`, err);
    throw new Error(`Cannot read counts file: ${file}`, { cause: err });
  }
}

function argValue(argv, flag) {
  const idx = argv.indexOf(flag);
  return idx >= 0 ? argv[idx + 1] : undefined;
}

export function run(argv) {
  const currentPath = argValue(argv, '--current');
  if (!currentPath) {
    console.error('❌ [Ratchet] Missing --current <counts.json>');
    return 2;
  }
  const baselinePath = argValue(argv, '--baseline') ?? DEFAULT_BASELINE;
  const update = argv.includes('--update');

  const baseline = fs.existsSync(baselinePath) ? readJson(baselinePath) : {};
  const current = readJson(currentPath);
  const result = compareCounts(baseline, current);

  for (const { rule, from, to } of result.increased) {
    console.error(
      `❌ [Ratchet] ${rule}: ${from} -> ${to} (+${to - from}) new violation(s) introduced.`,
    );
  }

  if (update) {
    if (result.increased.length > 0) {
      console.error('❌ [Ratchet] Refusing to --update while violations increased.');
      return 1;
    }
    fs.writeFileSync(baselinePath, serializeCounts(current));
    console.log(`✅ [Ratchet] Baseline updated (${path.basename(baselinePath)}).`);
    return 0;
  }

  for (const { rule, from, to } of result.decreased) {
    console.error(
      `❌ [Ratchet] ${rule}: ${from} -> ${to} (-${from - to}) improved. Run "pnpm guardrails:baseline" to lock in the gain.`,
    );
  }

  if (result.ok) {
    console.log('✅ [Ratchet] Violation counts match baseline.');
    return 0;
  }
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(run(process.argv.slice(2)));
}
