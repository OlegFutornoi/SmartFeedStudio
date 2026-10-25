/* eslint-disable */
/**
 * @file parse-trace.js
 * @description Parses trace.zip (trace.trace, trace.network) to extract console logs,
 * network navigation/API requests, and dataLayer actions.
 *
 * Usage:
 *   node .agents/skills/pw-heal/scripts/parse-trace.js [path/to/trace.zip] [filter]
 *
 * Examples:
 *   node .agents/skills/pw-heal/scripts/parse-trace.js
 *   node .agents/skills/pw-heal/scripts/parse-trace.js test-results/my-run/trace.zip
 *   node .agents/skills/pw-heal/scripts/parse-trace.js test-results/my-run/trace.zip console
 */

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

function findLatestTraceZip(baseDir = 'test-results') {
  if (!fs.existsSync(baseDir)) return null;
  let latestFile = null;
  let latestMtime = 0;

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name === 'trace.zip') {
        const stat = fs.statSync(fullPath);
        if (stat.mtimeMs > latestMtime) {
          latestMtime = stat.mtimeMs;
          latestFile = fullPath;
        }
      }
    }
  }

  walk(baseDir);
  return latestFile;
}

function inspectTrace(tracePath, filter = '') {
  if (!tracePath || !fs.existsSync(tracePath)) {
    console.error(`❌ Trace file not found: ${tracePath}`);
    process.exit(1);
  }

  console.log(`📦 Inspecting trace: ${tracePath}`);
  const filterLower = filter.toLowerCase();

  const zip = new AdmZip(tracePath);
  const zipEntries = zip.getEntries();

  for (const entry of zipEntries) {
    const name = entry.entryName;
    if (name.endsWith('trace.trace') || name.endsWith('trace.network')) {
      console.log(`\n--- Stream: ${name} ---`);
      const content = entry.getData().toString('utf8');
      const lines = content.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);

          // 1. Console messages
          if (parsed.type === 'console') {
            if (
              !filterLower ||
              filterLower === 'console' ||
              (parsed.text && parsed.text.toLowerCase().includes(filterLower))
            ) {
              console.log(`[CONSOLE]`, parsed.text);
            }
          }

          // 2. Action / API events (dataLayer, clicks, navigation)
          if (parsed.type === 'before' || parsed.type === 'after') {
            if (parsed.apiName) {
              const isDl =
                parsed.apiName.includes('dataLayer') ||
                JSON.stringify(parsed.params || {}).includes('dataLayer');
              if (
                !filterLower ||
                (filterLower === 'datalayer' && isDl) ||
                parsed.apiName.toLowerCase().includes(filterLower)
              ) {
                console.log(
                  `[ACTION] ${parsed.apiName}`,
                  parsed.params ? JSON.stringify(parsed.params) : '',
                );
              }
            }
          }

          // 3. Network requests
          if (parsed.method === 'request' && parsed.params && parsed.params.request) {
            const url = parsed.params.request.url;
            if (
              !filterLower ||
              filterLower === 'network' ||
              url.toLowerCase().includes(filterLower)
            ) {
              console.log(`[NETWORK] ${parsed.params.request.method} ${url}`);
            }
          }
        } catch (e) {}
      }
    }
  }
}

const tracePath = process.argv[2] || findLatestTraceZip();
const filter = process.argv[3] || '';

if (!tracePath) {
  console.error('❌ No trace.zip specified and none found in test-results/.');
  process.exit(1);
}

inspectTrace(tracePath, filter);
