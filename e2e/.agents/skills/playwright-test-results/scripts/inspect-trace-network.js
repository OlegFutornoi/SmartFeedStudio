/* eslint-disable */
/**
 * @file inspect-trace-network.js
 * @description Inspects network dumps and cached HTML snapshots inside Playwright trace.zip files
 * to extract window.APP_INITIAL_STATE (e.g., Redux state, productsApi queries, initial configuration).
 *
 * Usage:
 *   node .agents/skills/playwright-test-results/scripts/inspect-trace-network.js [path/to/trace.zip or directory]
 *
 * Examples:
 *   node .agents/skills/playwright-test-results/scripts/inspect-trace-network.js
 *   node .agents/skills/playwright-test-results/scripts/inspect-trace-network.js test-results/
 */

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

function findTraceFiles(targetPath = 'test-results') {
  if (!fs.existsSync(targetPath)) return [];
  const stat = fs.statSync(targetPath);
  if (stat.isFile() && targetPath.endsWith('.zip')) {
    return [targetPath];
  }

  const results = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name === 'trace.zip') {
        results.push(fullPath);
      }
    }
  }
  walk(targetPath);
  return results;
}

function inspectTraceState(tracePath) {
  console.log(`\n====================================================`);
  console.log(`📦 Inspecting trace: ${tracePath}`);
  console.log(`====================================================`);

  try {
    const zip = new AdmZip(tracePath);
    const entries = zip.getEntries();
    let foundState = false;

    for (const entry of entries) {
      if (
        entry.entryName.startsWith('resources/') &&
        (entry.entryName.endsWith('.html') || !entry.entryName.includes('.'))
      ) {
        const text = zip.readAsText(entry);
        if (text && text.includes('APP_INITIAL_STATE')) {
          const match = text.match(/window\.APP_INITIAL_STATE\s*=\s*(\{[\s\S]*?\});\s*window/);
          if (match) {
            foundState = true;
            try {
              const state = Function(`return (${match[1]})`)();
              console.log(`✅ Found APP_INITIAL_STATE in: ${entry.entryName}`);
              if (state.productsApi && state.productsApi.queries) {
                console.log('📊 productsApi.queries:');
                console.log(JSON.stringify(state.productsApi.queries, null, 2));
              } else {
                console.log('📊 State Keys:', Object.keys(state));
              }
            } catch (e) {
              console.log(`⚠️ Error parsing APP_INITIAL_STATE: ${e.message}`);
            }
          }
        }
      }
    }

    if (!foundState) {
      console.log('ℹ️ No APP_INITIAL_STATE found in resources.');
    }
  } catch (err) {
    console.error(`❌ Failed to read trace ${tracePath}: ${err.message}`);
  }
}

const target = process.argv[2] || 'test-results';
const traceFiles = findTraceFiles(target);

if (traceFiles.length === 0) {
  console.log(`ℹ️ No trace.zip files found in: ${target}`);
  process.exit(0);
}

for (const tracePath of traceFiles) {
  inspectTraceState(tracePath);
}
