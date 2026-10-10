#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Validates 100% i18n parity across UK and EN locale bundles for:
 * 1. apps/desktop/src/i18n/locales
 * 2. apps/admin-portal/src/i18n/locales
 *
 * Checks:
 * - Missing namespaces between UK and EN
 * - Missing keys within matching namespaces
 * - Empty string values
 */

const APPS = [
  { name: 'desktop', path: resolve('apps/desktop/src/i18n/locales') },
  { name: 'admin-portal', path: resolve('apps/admin-portal/src/i18n/locales') },
];

let totalErrors = 0;

function flattenKeys(obj, prefix = '') {
  const result = new Map();
  if (!obj || typeof obj !== 'object') return result;
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = flattenKeys(value, fullKey);
      for (const [nKey, nVal] of nested) {
        result.set(nKey, nVal);
      }
    } else {
      result.set(fullKey, value);
    }
  }
  return result;
}

for (const app of APPS) {
  const ukDir = join(app.path, 'uk');
  const enDir = join(app.path, 'en');

  let ukFiles = [];
  let enFiles = [];
  try {
    ukFiles = readdirSync(ukDir).filter((f) => f.endsWith('.json'));
    enFiles = readdirSync(enDir).filter((f) => f.endsWith('.json'));
  } catch (err) {
    console.error(`[i18n-check] Could not read locales in ${app.name}:`, err.message);
    totalErrors++;
    continue;
  }

  const allNamespaces = new Set([...ukFiles, ...enFiles]);

  for (const file of allNamespaces) {
    const hasUk = ukFiles.includes(file);
    const hasEn = enFiles.includes(file);

    if (!hasUk) {
      console.error(`❌ [${app.name}] Missing UK locale file: uk/${file}`);
      totalErrors++;
      continue;
    }
    if (!hasEn) {
      console.error(`❌ [${app.name}] Missing EN locale file: en/${file}`);
      totalErrors++;
      continue;
    }

    let ukJson, enJson;
    try {
      ukJson = JSON.parse(readFileSync(join(ukDir, file), 'utf-8'));
    } catch (e) {
      console.error(`❌ [${app.name}] Invalid JSON in uk/${file}: ${e.message}`);
      totalErrors++;
      continue;
    }
    try {
      enJson = JSON.parse(readFileSync(join(enDir, file), 'utf-8'));
    } catch (e) {
      console.error(`❌ [${app.name}] Invalid JSON in en/${file}: ${e.message}`);
      totalErrors++;
      continue;
    }

    const ukKeys = flattenKeys(ukJson);
    const enKeys = flattenKeys(enJson);

    // Check missing in EN
    for (const [key, val] of ukKeys) {
      if (!enKeys.has(key)) {
        console.error(`❌ [${app.name}:${file}] Key "${key}" exists in UK but is missing in EN`);
        totalErrors++;
      } else if (typeof val === 'string' && val.trim() === '') {
        console.warn(`⚠️ [${app.name}:${file}] Key "${key}" in UK has an empty value`);
      }
    }

    // Check missing in UK
    for (const [key, val] of enKeys) {
      if (!ukKeys.has(key)) {
        console.error(`❌ [${app.name}:${file}] Key "${key}" exists in EN but is missing in UK`);
        totalErrors++;
      } else if (typeof val === 'string' && val.trim() === '') {
        console.warn(`⚠️ [${app.name}:${file}] Key "${key}" in EN has an empty value`);
      }
    }
  }
}

if (totalErrors > 0) {
  console.error(`\n💥 i18n parity check failed with ${totalErrors} error(s).\n`);
  process.exit(1);
} else {
  console.log(`\n✅ 100% i18n parity check passed across all applications.\n`);
  process.exit(0);
}
