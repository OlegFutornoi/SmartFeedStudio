/* eslint-disable */
/**
 * @file inspect-buttons.js
 * @description Inspects interactive buttons, action attributes (data-state, data-gtm-el, data-gtm-ea),
 * and product cards on a target page without hardcoded URLs.
 *
 * Usage:
 *   node .agents/skills/pw-pom/scripts/inspect-buttons.js [URL | ENV] [path]
 *
 * Examples:
 *   node .agents/skills/pw-pom/scripts/inspect-buttons.js review2
 *   node .agents/skills/pw-pom/scripts/inspect-buttons.js stage /ua/insurance/greencard
 *   node .agents/skills/pw-pom/scripts/inspect-buttons.js https://finance.ua/ua/insurance/osago
 *   REVIEW=review2 node .agents/skills/pw-pom/scripts/inspect-buttons.js
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

  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const title = await page.title();
    console.log('📄 Page Title:', title);

    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button'))
        .map((b) => ({
          text: b.innerText.trim(),
          dataState: b.getAttribute('data-state'),
          dataGtmEl: b.getAttribute('data-gtm-el'),
          dataGtmEa: b.getAttribute('data-gtm-ea'),
          type: b.getAttribute('type'),
          disabled: b.disabled,
          classes: b.className,
        }))
        .filter((b) => b.text.length > 0 || b.dataState || b.dataGtmEa);
    });

    console.log(`\n🔘 Found ${buttons.length} interactive button(s):`);
    console.log(JSON.stringify(buttons, null, 2));

    const products = await page
      .locator(
        '#products, [data-state="catalog"], [data-state^="card-offer"], [data-state*="product-id"]',
      )
      .count();
    console.log(`\n📦 Product cards count: ${products}`);
  } catch (err) {
    console.error(`❌ Inspection failed: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
