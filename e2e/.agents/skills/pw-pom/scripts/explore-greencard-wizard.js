/* eslint-disable */
/**
 * @file explore-greencard-wizard.js
 * @description Fast exploratory script to navigate GreenCard wizard from landing to vehicle screen
 * and verify form inputs without hardcoded URLs.
 *
 * Usage:
 *   node .agents/skills/pw-pom/scripts/explore-greencard-wizard.js [URL | ENV] [path]
 *
 * Examples:
 *   node .agents/skills/pw-pom/scripts/explore-greencard-wizard.js review2
 *   node .agents/skills/pw-pom/scripts/explore-greencard-wizard.js stage /ua/insurance/greencard
 */

const { chromium } = require('@playwright/test');

function resolveTargetUrl(defaultPath = '/insurance/greencard') {
  const cliArg = process.argv[2];
  const customPath = process.argv[3] || defaultPath;

  if (cliArg && (cliArg.startsWith('http://') || cliArg.startsWith('https://'))) {
    return cliArg;
  }

  if (
    process.env.TARGET_URL &&
    (process.env.TARGET_URL.startsWith('http://') || process.env.TARGET_URL.startsWith('https://'))
  ) {
    return process.env.TARGET_URL;
  }

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
  console.log(`🌐 Opening: ${targetUrl}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    locale: 'uk-UA',
  });

  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const orderBtn = page
      .locator('button[data-gtm-ea="order-button"], button[data-state^="checkout-"]')
      .first();
    await orderBtn.waitFor({ state: 'visible', timeout: 15000 });
    await orderBtn.click();

    const lastName = page
      .getByRole('textbox', { name: /shevchenko/i })
      .or(page.getByTestId('input-customerLastNameLatin'))
      .or(page.locator('input[name="lastName"]'));
    const firstName = page
      .getByRole('textbox', { name: /taras/i })
      .or(page.getByTestId('input-customerFirstNameLatin'))
      .or(page.locator('input[name="firstName"]'));
    const phone = page
      .getByRole('textbox', { name: /номер телефону/i })
      .or(page.getByTestId('input-customerPhoneNumber'))
      .or(page.locator('input[type="tel"]'));
    const email = page
      .getByRole('textbox', { name: /email/i })
      .or(page.getByTestId('input-customerEmail'))
      .or(page.locator('input[type="email"]'));

    await lastName.waitFor({ state: 'visible', timeout: 15000 });
    await lastName.pressSequentially('SHEVCHENKO', { delay: 30 });
    await firstName.pressSequentially('TARAS', { delay: 30 });
    await phone.click();
    await phone.pressSequentially('0666666666', { delay: 30 });
    await email.pressSequentially('o.futornyi@treeum.net', { delay: 30 });

    console.log('✅ Personal data filled:');
    console.log('  Phone:', await phone.inputValue());
    console.log('  Email:', await email.inputValue());

    const fwd1 = page
      .locator(
        'button[data-state="button-forward"]:visible, button:has-text("Далі"):visible, button:has-text("Далее"):visible',
      )
      .first();
    console.log('  Forward button enabled:', await fwd1.isEnabled());
    await fwd1.click();

    const vehicleInput = page
      .getByRole('textbox', { name: /номер транспортного засобу/i })
      .or(page.getByTestId('input-vehicleNumber'))
      .or(page.locator('[data-state="input-carNumber"]'))
      .or(page.locator('input[placeholder*="AA"]'));
    await vehicleInput.waitFor({ state: 'visible', timeout: 15000 });
    console.log('✅ Vehicle input reached and visible!');
  } catch (err) {
    console.error(`❌ Exploration failed: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
