/* eslint-disable */
const fs = require('fs');
const path = require('path');

/**
 * Batch HTTP Flow Updater Utility
 * Scans directories of .http files and applies standardized pre/post script updates,
 * payload signatures, or global variable synchronization.
 *
 * Usage:
 *   node .agents/skills/http-flow-builder/scripts/batch-update-http.js <DIRECTORY_PATH>
 * Example:
 *   node .agents/skills/http-flow-builder/scripts/batch-update-http.js "tools/http/lead"
 */

function getAllHttpFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllHttpFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.http')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

const targetDir = process.argv[2] || 'tools/http/lead';
const resolvedDir = path.resolve(process.cwd(), targetDir);

if (!fs.existsSync(resolvedDir)) {
  console.error(`Directory not found: ${resolvedDir}`);
  process.exit(1);
}

const files = getAllHttpFiles(resolvedDir);
console.log(`[Batch HTTP Updater] Found ${files.length} .http files in ${targetDir}`);

let updatedCount = 0;
files.forEach((filepath) => {
  let content = fs.readFileSync(filepath, 'utf-8');
  let changed = false;

  // Example transformation: normalize payment postback attribute references
  if (content.includes('/postback/payment')) {
    const postbackStart = content.indexOf('/postback/payment');
    const before = content.substring(0, postbackStart);
    let after = content.substring(postbackStart);

    if (after.includes('"amount":')) {
      after = after.replace(/"amount":\s*\{\{[^\}]+\}\}/g, '"amount": {{PAYMENT_AMOUNT}}');
      content = before + after;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`  Updated: ${path.relative(process.cwd(), filepath)}`);
    updatedCount++;
  }
});

console.log(`[Batch HTTP Updater] Finished. Updated ${updatedCount} files.`);
