/* eslint-disable */
import { chromium, request, Browser, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * HTTP Flow Builder - Network Recorder Script
 *
 * This script is used by the Antigravity agent to capture UI API flows.
 * DO NOT modify this source file directly!
 * Copy it to .temp/run-flow.ts and modify the copy.
 */

(async () => {
  console.log('🚀 Starting Network Recorder...');
  const browser: Browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page: Page = await context.newPage();

  const networkLog: any[] = [];
  const capturePath = path.join(process.cwd(), '.temp', 'network_dump.json');

  page.on('request', async (req) => {
    if (req.resourceType() === 'fetch' || req.resourceType() === 'xhr') {
      try {
        const postData = req.postData();
        networkLog.push({
          url: req.url(),
          method: req.method(),
          headers: req.headers(),
          postData: postData ? JSON.parse(postData) : null,
          requestTime: Date.now(),
        });
      } catch (e) {
        // Ignore parsing errors for non-JSON post data
      }
    }
  });

  page.on('response', async (res) => {
    if (res.request().resourceType() === 'fetch' || res.request().resourceType() === 'xhr') {
      try {
        const reqIndex = networkLog.findIndex((r) => r.url === res.url());
        if (reqIndex !== -1) {
          networkLog[reqIndex].status = res.status();
          const body = await res.json().catch(() => null);
          networkLog[reqIndex].responseBody = body;
          networkLog[reqIndex].responseTime = Date.now();
        }
      } catch (e) {}
    }
  });

  try {
    // =========================================================================
    // AGENT INSERTS UI STEPS HERE
    // Example:
    // await page.goto('https://minfin-osago-stage.treeumapp.net/insurance/osago/price/');
    // await page.fill('input[name="phone"]', '+380666666666');
    // await page.click('button[type="submit"]');
    // =========================================================================

    console.log('⏳ Waiting for UI flow to settle...');
    await page.waitForTimeout(5000); // Give enough time for final requests to finish
  } catch (err) {
    console.error('❌ Error during flow execution:', err);
  } finally {
    console.log(`💾 Saving network dump to ${capturePath}`);
    fs.mkdirSync(path.dirname(capturePath), { recursive: true });
    fs.writeFileSync(capturePath, JSON.stringify(networkLog, null, 2));
    await browser.close();
    console.log('✅ Done.');
  }
})();
