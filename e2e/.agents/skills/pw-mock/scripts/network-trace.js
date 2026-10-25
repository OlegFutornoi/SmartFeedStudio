/* eslint-disable */
const { chromium } = require('playwright');

/**
 * Helper script to trace API requests made by a page.
 * Usage: node .agents/skills/pw-mock/scripts/network-trace.js <url> <api_path_filter>
 */

(async () => {
  const url = process.argv[2];
  const apiFilter = process.argv[3] || '/api/';

  if (!url) {
    console.error('Usage: node network-trace.js <url> [api_path_filter]');
    process.exit(1);
  }

  console.log(`Starting trace for URL: ${url}`);
  console.log(`Filtering requests by: ${apiFilter}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('request', (request) => {
    if (request.url().includes(apiFilter)) {
      console.log('\n--- REQUEST ---');
      console.log('METHOD:', request.method());
      console.log('URL:', request.url());
      if (request.postData()) {
        console.log('PAYLOAD:', request.postData());
      }
    }
  });

  page.on('response', async (response) => {
    if (response.url().includes(apiFilter)) {
      try {
        const body = await response.json();
        console.log('\n--- RESPONSE ---');
        console.log('URL:', response.url());
        console.log('BODY:', JSON.stringify(body, null, 2));
      } catch (e) {
        // Ignore if not json
      }
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    // wait a bit more for any slow requests after networkidle
    await new Promise((r) => setTimeout(r, 5000));
  } catch (e) {
    console.error('Navigation error:', e.message);
  } finally {
    await browser.close();
    console.log('Trace finished.');
  }
})();
