/* eslint-disable */
/**
 * @file dump-trace-attachments.js
 * @description Extracts and parses attachments (DataLayer logs, network payloads, JSON dumps)
 * from Playwright trace.zip archives.
 *
 * Usage:
 *   node .agents/skills/playwright-test-results/scripts/dump-trace-attachments.js [path/to/trace.zip] [filterKeyword]
 *
 * Examples:
 *   node .agents/skills/playwright-test-results/scripts/dump-trace-attachments.js
 *   node .agents/skills/playwright-test-results/scripts/dump-trace-attachments.js test-results/my-run/trace.zip datalayer
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

function dumpAttachments(tracePath, filterKeyword = '') {
  if (!tracePath || !fs.existsSync(tracePath)) {
    console.error(`❌ Trace file not found: ${tracePath}`);
    process.exit(1);
  }

  console.log(`📦 Inspecting attachments in: ${tracePath}`);
  if (filterKeyword) {
    console.log(`🔍 Filter keyword: "${filterKeyword}"`);
  }

  const zip = new AdmZip(tracePath);
  const entries = zip.getEntries();
  let count = 0;

  for (const entry of entries) {
    const name = entry.entryName;
    // Check if entry matches filter or is an attachment
    if (filterKeyword && !name.toLowerCase().includes(filterKeyword.toLowerCase())) {
      continue;
    }

    const isJson = name.endsWith('.json');
    const isAttachment = name.includes('attachment') || name.includes('datalayer-') || isJson;

    if (isAttachment && !name.includes('resources/')) {
      count++;
      console.log('\n====================================================');
      console.log(`📎 ATTACHMENT [${count}]: ${name}`);
      console.log('====================================================');

      const content = entry.getData().toString('utf8');
      try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object') {
          if (parsed.extractedTriggers) {
            console.log(`  🎯 Extracted Triggers:`, parsed.extractedTriggers);
          }
          if (parsed.total !== undefined) {
            console.log(`  📊 Total: ${parsed.total}, From Index: ${parsed.fromIndex}`);
          }
          if (Array.isArray(parsed.items)) {
            console.log(`  📋 Items (${parsed.items.length}):`);
            for (const item of parsed.items) {
              console.log('    - ', JSON.stringify(item));
            }
          } else {
            console.log(JSON.stringify(parsed, null, 2));
          }
        } else {
          console.log(parsed);
        }
      } catch (e) {
        console.log(content.slice(0, 1000));
      }
    }
  }

  if (count === 0) {
    console.log(`ℹ️ No matching attachments found inside ${tracePath}`);
  } else {
    console.log(`\n✅ Finished dumping ${count} attachment(s).`);
  }
}

const targetTrace = process.argv[2] || findLatestTraceZip();
const keyword = process.argv[3] || '';

if (!targetTrace) {
  console.error('❌ No trace.zip specified and none found in test-results/.');
  process.exit(1);
}

dumpAttachments(targetTrace, keyword);
