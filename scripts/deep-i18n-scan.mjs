#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';

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

function flattenKeys(obj, prefix = '') {
  const result = new Set();
  if (!obj || typeof obj !== 'object') return result;
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = flattenKeys(value, fullKey);
      for (const nKey of nested) {
        result.add(nKey);
      }
    } else {
      result.add(fullKey);
    }
  }
  return result;
}

function getAllFiles(dir, exts = ['.tsx', '.ts']) {
  let results = [];
  try {
    const list = readdirSync(dir);
    for (const file of list) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      if (stat && stat.isDirectory()) {
        if (file === 'node_modules' || file === '__tests__' || file === 'e2e' || file === 'dist') continue;
        results = results.concat(getAllFiles(fullPath, exts));
      } else if (exts.includes(extname(file))) {
        if (file.endsWith('.spec.ts') || file.endsWith('.spec.tsx') || file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue;
        results.push(fullPath);
      }
    }
  } catch (e) {
    // ignore
  }
  return results;
}

console.log('🔍 Starting Deep i18n & Missing Key Detection...\n');

const missingReport = new Map(); // key: `${app}:${ns}:${key}` -> { app, ns, key, missingIn: ['uk', 'en'], occurrences: [{file, line, defaultValue}] }

for (const app of APPS) {
  const ukDir = join(app.localesPath, 'uk');
  const enDir = join(app.localesPath, 'en');

  const dictionaries = { uk: new Map(), en: new Map() };

  for (const lang of ['uk', 'en']) {
    const dir = lang === 'uk' ? ukDir : enDir;
    try {
      const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        const ns = file.replace('.json', '');
        const content = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
        dictionaries[lang].set(ns, flattenKeys(content));
      }
    } catch (e) {
      console.warn(`Could not load ${lang} locales for ${app.name}:`, e.message);
    }
  }

  const srcFiles = getAllFiles(app.srcPath);

  for (const file of srcFiles) {
    const content = readFileSync(file, 'utf-8');

    // Regex to match t('ns:key', ...) or t("ns:key", ...) with optional defaultValue
    const tRegex = /\bt\(\s*['"`]([a-zA-Z0-9_\-]+):([a-zA-Z0-9_\.]+)['"`](?:\s*,\s*(?:\{[^}]*defaultValue:\s*['"`]([^'"`]*)['"`]|['"`]([^'"`]*)['"`]))?/g;
    let match;
    while ((match = tRegex.exec(content)) !== null) {
      const ns = match[1];
      const key = match[2];
      const defaultValue = match[3] || match[4] || '';

      const ukNs = dictionaries.uk.get(ns);
      const enNs = dictionaries.en.get(ns);

      const missingIn = [];
      if (!ukNs || !ukNs.has(key)) missingIn.push('uk');
      if (!enNs || !enNs.has(key)) missingIn.push('en');

      if (missingIn.length > 0) {
        const id = `${app.name}:${ns}:${key}`;
        const charIdx = match.index;
        const line = content.slice(0, charIdx).split('\n').length;
        if (!missingReport.has(id)) {
          missingReport.set(id, {
            app: app.name,
            ns,
            key,
            missingIn,
            defaultValue,
            occurrences: [],
          });
        }
        missingReport.get(id).occurrences.push({ file: file.replace(resolve('.'), ''), line });
      }
    }
  }
}

console.log(`Found ${missingReport.size} distinct missing keys used in code:\n`);
for (const [id, item] of missingReport) {
  console.log(`📌 [${item.app}] ${item.ns}:${item.key} (missing in: ${item.missingIn.join(', ')})`);
  console.log(`   DefaultValue: "${item.defaultValue}"`);
  console.log(`   Occurrences: ${item.occurrences.map((o) => `${o.file}:${o.line}`).join(', ')}`);
  console.log('');
}
