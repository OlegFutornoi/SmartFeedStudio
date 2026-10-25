/* eslint-disable */
/**
 * @file inspect-initial-page.js
 * @description Injects DataLayer listener before navigation, loads page, captures initial
 * dataLayer pushes, and inspects primary call-to-action buttons without hardcoded URLs.
 *
 * Usage:
 *   node .agents/skills/pw-plan/scripts/inspect-initial-page.js [URL | ENV] [path]
 *
 * Examples:
 *   node .agents/skills/pw-plan/scripts/inspect-initial-page.js review2
 *   node .agents/skills/pw-plan/scripts/inspect-initial-page.js stage /ua/insurance/greencard
 *   node .agents/skills/pw-plan/scripts/inspect-initial-page.js https://cms-stage.finance.ua/ua/insurance/osago
 */

const { chromium } = require('@playwright/test');

function resolveTargetUrl(defaultPath = '/insurance/greencard') {
  const cliArg = process.argv[2];
  const customPath = process.argv[3] || defaultPath;

  // 1. Full URL provided
  if (cliArg && (cliArg.startsWith('http://') || cliArg.startsWith('https://'))) {
    return cliArg;
  }

  // 2. Explicit TARGET_URL in env
  if (
    process.env.TARGET_URL &&
    (process.env.TARGET_URL.startsWith('http://') || process.env.TARGET_URL.startsWith('https://'))
  ) {
    return process.env.TARGET_URL;
  }

  // 3. Resolve environment (review1, review2, stage, prod)
  const envArg =
    cliArg || process.env.TARGET_ENV || process.env.REVIEW || process.env.ENV || 'review2';
  const envLower = envArg
    .toLowerCase()
    .replace(/^--env=/, '')
    .replace(/^env=/, '');

  let domain = '';
  let resolvedPath = customPath;

  if (envLower === 'prod') {
    domain = 'https://finance.ua';
    if (!resolvedPath.startsWith('/ua/')) {
      resolvedPath = `/ua${resolvedPath.startsWith('/') ? '' : '/'}${resolvedPath}`;
    }
  } else if (envLower === 'stage') {
    domain = 'https://cms-stage.finance.ua';
    if (!resolvedPath.startsWith('/ua/')) {
      resolvedPath = `/ua${resolvedPath.startsWith('/') ? '' : '/'}${resolvedPath}`;
    }
  } else {
    const reviewNum = envLower.replace('review', '') || '2';
    domain = `https://finance-greencard.review${reviewNum}.treeumapp.net`;
  }

  const cleanDomain = domain.replace(/\/$/, '');
  const cleanPath = resolvedPath.startsWith('/') ? resolvedPath : `/${resolvedPath}`;
  return `${cleanDomain}${cleanPath}`;
}

(async () => {
  const targetUrl = resolveTargetUrl();
  console.log(`🌐 Connecting to: ${targetUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'uk-UA',
  });
  const page = await context.newPage();

  // Attach dataLayer interception before any script loads
  await page.addInitScript(() => {
    window.__capturedDataLayer = [];
    const originalPush = window.dataLayer ? window.dataLayer.push : Array.prototype.push;
    const capture = (items) => {
      for (const item of items) {
        window.__capturedDataLayer.push({
          time: Date.now(),
          url: window.location.href,
          item: JSON.parse(JSON.stringify(item)),
        });
      }
    };

    if (Array.isArray(window.dataLayer)) {
      capture(window.dataLayer);
    }

    const dl = window.dataLayer || [];
    const patchedPush = function (...args) {
      capture(args);
      return originalPush.apply(this, args);
    };
    dl.push = patchedPush;
    window.dataLayer = dl;
  });

  try {
    console.log(`⏳ Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

    const initialDl = await page.evaluate(() => window.__capturedDataLayer || []);
    console.log(`\n📊 Initial dataLayer items captured: ${initialDl.length}`);
    initialDl.forEach((entry, idx) => {
      console.log(`  [${idx + 1}]`, JSON.stringify(entry.item));
    });

    const buyButtons = await page.getByRole('button', { name: /Оформити|Купити|Придбати/i }).all();
    console.log(`\n🔘 CTA buttons count ('Оформити' / 'Купити'): ${buyButtons.length}`);
  } catch (err) {
    console.error(`❌ Initial inspection failed: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
