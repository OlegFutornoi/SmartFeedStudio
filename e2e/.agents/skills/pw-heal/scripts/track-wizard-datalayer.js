/* eslint-disable */
/**
 * @file track-wizard-datalayer.js
 * @description Streams and extracts dataLayer / GTM events in real-time while navigating
 * multi-step wizard forms (Personal Data -> Vehicle Info -> Error triggers) without hardcoded URLs.
 *
 * Usage:
 *   node .agents/skills/pw-heal/scripts/track-wizard-datalayer.js [URL | ENV] [path]
 *
 * Examples:
 *   node .agents/skills/pw-heal/scripts/track-wizard-datalayer.js review2
 *   node .agents/skills/pw-heal/scripts/track-wizard-datalayer.js stage /ua/insurance/greencard
 *   REVIEW=review2 node .agents/skills/pw-heal/scripts/track-wizard-datalayer.js
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

function createDataLayerTracker(page) {
  const events = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.startsWith('__DL_EVENT__:')) {
      try {
        events.push(JSON.parse(text.slice('__DL_EVENT__:'.length)));
      } catch (e) {}
    }
  });

  return {
    events,
    getEventsSince(index) {
      return events.slice(index);
    },
    getAllEvents() {
      return events;
    },
    extractTriggers(slice) {
      const list = slice || events;
      const triggers = [];
      for (const entry of list) {
        const item = entry.item;
        if (!item || typeof item !== 'object') continue;
        if (item['data-gtm-ename']) triggers.push(item['data-gtm-ename']);
        if (item['eventName']) {
          triggers.push(item['eventName']);
          if (item['eventLabel']) triggers.push(`${item['eventName']}_${item['eventLabel']}`);
        }
        if (item['eventAction']) triggers.push(item['eventAction']);
        if (
          item['event'] &&
          typeof item['event'] === 'string' &&
          !item['event'].startsWith('gtm.')
        ) {
          triggers.push(item['event']);
        }
      }
      return Array.from(new Set(triggers));
    },
  };
}

async function setupTrackedPage(context) {
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__capturedDataLayer = [];
    const originalPush = window.dataLayer ? window.dataLayer.push : Array.prototype.push;
    const notify = (items) => {
      for (const item of items) {
        const record = {
          time: Date.now(),
          url: window.location.href,
          item: JSON.parse(JSON.stringify(item)),
        };
        window.__capturedDataLayer.push(record);
        console.log('__DL_EVENT__:' + JSON.stringify(record));
      }
    };

    if (Array.isArray(window.dataLayer)) {
      notify(window.dataLayer);
    }

    const dl = window.dataLayer || [];
    const patchedPush = function (...args) {
      notify(args);
      return originalPush.apply(this, args);
    };
    dl.push = patchedPush;
    window.dataLayer = dl;
  });
  return page;
}

(async () => {
  const targetUrl = resolveTargetUrl();
  console.log(`🌐 Target URL: ${targetUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'uk-UA',
  });

  try {
    const page = await setupTrackedPage(context);
    const tracker = createDataLayerTracker(page);

    console.log('\n=== STEP 1: Відкриваємо цільову сторінку ===');
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log('Події на сторінці:', tracker.extractTriggers());

    console.log('\n=== STEP 2: Клікаємо Оформити ===');
    const mark1 = tracker.events.length;
    const orderButton = page
      .locator('button[data-gtm-ea="order-button"], button[data-state^="checkout-"]')
      .first();
    await orderButton.waitFor({ state: 'visible', timeout: 15000 });
    await orderButton.click();

    await page.waitForSelector(
      '[data-active-screen], [data-state="input-customerLastNameLatin"], input[name="lastName"]',
      { timeout: 15000 },
    );
    await page.waitForTimeout(2000);

    console.log('Події після кліку Оформити:');
    console.log(tracker.extractTriggers(tracker.getEventsSince(mark1)));

    console.log('\n=== STEP 3: Заповнюємо Персональні дані та переходимо на екран Авто ===');
    const mark2 = tracker.events.length;
    const lastName = page
      .locator(
        'input[data-state="input-customerLastNameLatin"], input[name="lastName"], input[placeholder*="Shevchenko"]',
      )
      .first();
    const firstName = page
      .locator(
        'input[data-state="input-customerFirstNameLatin"], input[name="firstName"], input[placeholder*="Taras"]',
      )
      .first();
    const phone = page
      .locator(
        'input[data-state="input-customerPhoneNumber"], input[name="phone"], input[type="tel"]',
      )
      .first();
    const email = page
      .locator('input[data-state="input-customerEmail"], input[name="email"], input[type="email"]')
      .first();

    await lastName.fill('SHEVCHENKO');
    await firstName.fill('TARAS');
    await phone.fill('0666666666');
    await email.fill('o.futornyi@treeum.net');

    const forwardBtn = page
      .locator(
        'button[data-state="button-forward"]:visible, button:has-text("Далі"):visible, button:has-text("Далее"):visible',
      )
      .first();
    await forwardBtn.click();

    await page.waitForSelector(
      'input[data-state="input-vehicleNumber"], input[name="vehicleNumber"], input[placeholder*="AA"]',
      { timeout: 15000 },
    );
    await page.waitForTimeout(2000);

    console.log('Події після сабміту ПІБ / переходу на авто:');
    console.log(tracker.extractTriggers(tracker.getEventsSince(mark2)));

    console.log('\n=== STEP 4: Вводимо НЕВАЛІДНИЙ номер авто (ФФ0000ФФ) ===');
    const mark3 = tracker.events.length;
    const vehicleInput = page
      .locator('input[data-state="input-vehicleNumber"], input[name="vehicleNumber"]')
      .first();
    await vehicleInput.fill('ФФ0000ФФ');

    const forwardBtn2 = page
      .locator(
        'button[data-state="button-forward"]:visible, button:has-text("Далі"):visible, button:has-text("Далее"):visible',
      )
      .first();
    await forwardBtn2.click();

    await page.waitForTimeout(4000);

    console.log('Події після вводу невалідного авто:');
    console.log(tracker.extractTriggers(tracker.getEventsSince(mark3)));

    console.log('\n✅ DataLayer tracking completed successfully.');
  } catch (err) {
    console.error(`❌ Tracking failed: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
