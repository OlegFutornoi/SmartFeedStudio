#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';

/**
 * Validates 100% i18n parity across UK and EN locale bundles AND verifies
 * that all t('ns:key') calls in application source code exist in both locales:
 * 1. apps/desktop (locales + src)
 * 2. apps/admin-portal (locales + src)
 *
 * Checks:
 * - Missing namespaces between UK and EN
 * - Missing keys within matching namespaces
 * - Empty string values
 * - TSX/TS code calls to t('namespace:key') where key is missing in UK or EN dictionaries
 */

const APPS = [
  {
    name: 'desktop',
    localesPath: resolve('apps/desktop/src/i18n/locales'),
    srcPath: resolve('apps/desktop/src'),
  },
  {
    name: 'admin-portal',
    localesPath: resolve('apps/admin-portal/src/i18n/locales'),
    srcPath: resolve('apps/admin-portal/src'),
  },
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

function getAllSourceFiles(dir, exts = ['.tsx', '.ts']) {
  let results = [];
  try {
    const list = readdirSync(dir);
    for (const file of list) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      if (stat && stat.isDirectory()) {
        if (file === 'node_modules' || file === '__tests__' || file === 'e2e' || file === 'dist') continue;
        results = results.concat(getAllSourceFiles(fullPath, exts));
      } else if (exts.includes(extname(file))) {
        if (
          file.endsWith('.spec.ts') ||
          file.endsWith('.spec.tsx') ||
          file.endsWith('.test.ts') ||
          file.endsWith('.test.tsx')
        )
          continue;
        results.push(fullPath);
      }
    }
  } catch (e) {
    // ignore
  }
  return results;
}

for (const app of APPS) {
  const ukDir = join(app.localesPath, 'uk');
  const enDir = join(app.localesPath, 'en');

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
  const loadedDictionaries = { uk: new Map(), en: new Map() };

  // Phase 1: Locale file symmetry
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
    const ns = file.replace('.json', '');

    loadedDictionaries.uk.set(ns, ukKeys);
    loadedDictionaries.en.set(ns, enKeys);

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

  // Phase 2: Source Code Usage Verification (t('ns:key'))
  const srcFiles = getAllSourceFiles(app.srcPath);
  for (const file of srcFiles) {
    const content = readFileSync(file, 'utf-8');
    const tRegex = /\bt\(\s*['"`]([a-zA-Z0-9_\-]+):([a-zA-Z0-9_\.]+)['"`]/g;
    let match;
    while ((match = tRegex.exec(content)) !== null) {
      const ns = match[1];
      const key = match[2];

      const ukNs = loadedDictionaries.uk.get(ns);
      const enNs = loadedDictionaries.en.get(ns);

      if (!ukNs) {
        console.error(`❌ [${app.name}] Namespace "${ns}" missing in UK dictionaries! Used in ${file}`);
        totalErrors++;
      } else if (!ukNs.has(key)) {
        const charIdx = match.index;
        const line = content.slice(0, charIdx).split('\n').length;
        console.error(`❌ [${app.name}] Key "${ns}:${key}" MISSING in uk/${ns}.json! Used in ${file}:${line}`);
        totalErrors++;
      }

      if (!enNs) {
        console.error(`❌ [${app.name}] Namespace "${ns}" missing in EN dictionaries! Used in ${file}`);
        totalErrors++;
      } else if (!enNs.has(key)) {
        const charIdx = match.index;
        const line = content.slice(0, charIdx).split('\n').length;
        console.error(`❌ [${app.name}] Key "${ns}:${key}" MISSING in en/${ns}.json! Used in ${file}:${line}`);
        totalErrors++;
      }
    }
  }
}

// Clean up temporary scanner script if present
try {
  const tmpScript = resolve('scripts/deep-i18n-scan.mjs');
  statSync(tmpScript);
  import('node:fs').then(({ unlinkSync }) => unlinkSync(tmpScript));
} catch (e) {
  // ignore
}

if (totalErrors > 0) {
  console.error(`\n💥 i18n parity check failed with ${totalErrors} error(s).\n`);
  process.exit(1);
} else {
  console.log(`\n✅ 100% i18n parity & code-usage check passed across all applications.\n`);
  process.exit(0);
}
