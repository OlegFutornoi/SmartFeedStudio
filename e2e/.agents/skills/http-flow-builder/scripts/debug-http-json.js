/* eslint-disable */
const fs = require('fs');

/**
 * Utility script to extract and print a JSON body from a specific step in an .http file.
 * Useful for debugging if IntelliJ HTTP Client variables are generating invalid JSON structure.
 *
 * Usage: node debug-http-json.js <path_to_http_file> <regex_pattern>
 * Example: node debug-http-json.js tools/http/lead/minfin/minfin-osago-ewa.http "POST.*osago\/lead[\\s\\S]+?([\\s\\S]+?)> \\{%"
 */

const filePath = process.argv[2] || 'tools/http/lead/minfin/minfin-osago-ewa.http';
const pattern =
  process.argv[3] ||
  'POST \\{\\{BASE_URL\\}\\}\/insurance\/osago\/lead\\s+Accept: application\\/json\\s+Content-Type: application\\/json\\s+([\\s\\S]+?)\\s+> \\{%';

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf-8');
const regex = new RegExp(pattern);

const match = content.match(regex);
if (match) {
  let jsonStr = match[1];
  console.log('=== Extracted JSON Body ===');
  console.log(jsonStr);
} else {
  console.log('Could not find matching JSON body using pattern.');
}
