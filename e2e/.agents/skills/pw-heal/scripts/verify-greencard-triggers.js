/* eslint-disable */
/**
 * @file verify-greencard-triggers.js
 * @description Standalone end-to-end verifier for GreenCard wizard flow and DataLayer / GTM triggers.
 * Verifies car error triggers (car-info-error-nonum), Checkout to OTP (wizard.*_sms),
 * invalid OTP submission (wizard.*_otp-error), and valid OTP submission (wizard.*_otp-success) without hardcoded URLs.
 *
 * Usage:
 *   node .agents/skills/pw-heal/scripts/verify-greencard-triggers.js [URL | ENV] [path]
 *
 * Examples:
 *   node .agents/skills/pw-heal/scripts/verify-greencard-triggers.js review2
 *   node .agents/skills/pw-heal/scripts/verify-greencard-triggers.js stage /ua/insurance/greencard
 *   node .agents/skills/pw-heal/scripts/verify-greencard-triggers.js https://finance-greencard.review2.treeumapp.net/insurance/greencard
 *   REVIEW=review2 node .agents/skills/pw-heal/scripts/verify-greencard-triggers.js
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

async function createTrackedPage(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'uk-UA',
  });
  const page = await context.newPage();

  const dataLayerLog = [];

  await page.addInitScript(() => {
    window.__capturedDataLayer = [];
    const originalPush = window.dataLayer ? window.dataLayer.push : Array.prototype.push;
    const recordItem = (item) => {
      const entry = {
        time: Date.now(),
        url: window.location.href,
        item: JSON.parse(JSON.stringify(item)),
      };
      window.__capturedDataLayer.push(entry);
      console.log('__TRACK_DL__:' + JSON.stringify(entry));
    };

    if (Array.isArray(window.dataLayer)) {
      for (const it of window.dataLayer) recordItem(it);
    }

    const dl = window.dataLayer || [];
    const patchedPush = function (...args) {
      for (const arg of args) recordItem(arg);
      return originalPush.apply(this, args);
    };
    dl.push = patchedPush;
    window.dataLayer = dl;
  });

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.startsWith('__TRACK_DL__:')) {
      try {
        dataLayerLog.push(JSON.parse(text.slice('__TRACK_DL__:'.length)));
      } catch (e) {}
    }
  });

  return { page, context, dataLayerLog };
}

function extractTriggersFromEntries(entries) {
  const names = [];
  for (const entry of entries) {
    const item = entry.item;
    if (!item || typeof item !== 'object') continue;
    if (item['data-gtm-ename']) names.push(item['data-gtm-ename']);
    if (item['eventName']) {
      names.push(item['eventName']);
      if (item['eventLabel']) names.push(`${item['eventName']}_${item['eventLabel']}`);
    }
    if (item['eventAction']) names.push(item['eventAction']);
    if (item['event'] && typeof item['event'] === 'string' && !item['event'].startsWith('gtm.')) {
      names.push(item['event']);
    }
  }
  return Array.from(new Set(names));
}

(async () => {
  const targetUrl = resolveTargetUrl();
  console.log(`🚀 Running GreenCard Triggers Verification against: ${targetUrl}`);

  const browser = await chromium.launch({ headless: true });
  const results = {};

  try {
    console.log('\n================================================================');
    console.log('🧪 TEST 1: Номер машини не знайдено в базі (car-info-error-nonum)');
    console.log('================================================================');
    {
      const { page, context, dataLayerLog } = await createTrackedPage(browser);
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      const orderBtn = page
        .locator('button[data-gtm-ea="order-button"], button[data-state^="checkout-"]')
        .first();
      await orderBtn.waitFor({ state: 'visible', timeout: 15000 });
      await orderBtn.click();

      // Personal data
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
      await lastName.fill('SHEVCHENKO');
      await firstName.fill('TARAS');
      await phone.fill('0666666666');
      await email.fill('o.futornyi@treeum.net');

      const fwd1 = page
        .locator(
          'button[data-state="button-forward"]:visible, button:has-text("Далі"):visible, button:has-text("Далее"):visible',
        )
        .first();
      await fwd1.click();

      // Vehicle screen
      const vehicleInput = page
        .getByRole('textbox', { name: /номер транспортного засобу/i })
        .or(page.getByTestId('input-vehicleNumber'))
        .or(page.locator('input[placeholder*="AA"]'));
      await vehicleInput.waitFor({ state: 'visible', timeout: 15000 });

      const fromIdx = dataLayerLog.length;
      console.log('  Вводимо невалідний номер авто ФФ0000ФФ...');
      await vehicleInput.fill('ФФ0000ФФ');

      const fwd2 = page
        .locator(
          'button[data-state="button-forward"]:visible, button:has-text("Далі"):visible, button:has-text("Далее"):visible',
        )
        .first();
      await fwd2.click();

      await page.waitForTimeout(5000);
      const newEvents = dataLayerLog.slice(fromIdx);
      const triggers = extractTriggersFromEntries(newEvents);
      console.log('  Тригери після відправки невалідного номера:');
      console.log(' ', triggers);

      results['car-info-error-nonum'] = {
        expected: 'wizard.greencardv2_car-info-error-nonum',
        actualFired: triggers,
        hasExpected:
          triggers.includes('wizard.greencardv2_car-info-error-nonum') ||
          triggers.includes('wizard.greencard_car-info-error-nonum'),
        passed:
          triggers.includes('wizard.greencardv2_car-info-error-nonum') ||
          triggers.includes('wizard.greencard_car-info-error-nonum'),
      };
      await context.close();
    }

    console.log('\n================================================================');
    console.log('🧪 TEST 2: Flow до OTP, помилка OTP, успішний OTP');
    console.log('================================================================');
    {
      const { page, context, dataLayerLog } = await createTrackedPage(browser);
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      const orderBtn = page
        .locator('button[data-gtm-ea="order-button"], button[data-state^="checkout-"]')
        .first();
      await orderBtn.waitFor({ state: 'visible', timeout: 15000 });
      await orderBtn.click();

      // 1. Personal data
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
      await lastName.fill('SHEVCHENKO');
      await firstName.fill('TARAS');
      await phone.fill('0666666666');
      await email.fill('o.futornyi@treeum.net');

      const fwd1 = page
        .locator(
          'button[data-state="button-forward"]:visible, button:has-text("Далі"):visible, button:has-text("Далее"):visible',
        )
        .first();
      await fwd1.click();

      // 2. Vehicle
      const vehicleInput = page
        .getByRole('textbox', { name: /номер транспортного засобу/i })
        .or(page.getByTestId('input-vehicleNumber'))
        .or(page.locator('input[placeholder*="AA"]'));
      await vehicleInput.waitFor({ state: 'visible', timeout: 15000 });
      await vehicleInput.fill('BE6573HI');

      const fwd2 = page
        .locator(
          'button[data-state="button-forward"]:visible, button:has-text("Далі"):visible, button:has-text("Далее"):visible',
        )
        .first();
      await fwd2.click();

      // 3. Promo code
      const promoToggle = page.getByText(/У мене є промокод|У меня есть промокод/i).first();
      await promoToggle.waitFor({ state: 'visible', timeout: 15000 });
      await promoToggle.click();

      const promoInput = page
        .getByTestId('input-promoCode')
        .or(page.getByTestId('input-promocode'))
        .or(page.getByLabel(/Ваш промокод|промокод/i))
        .first();
      await promoInput.waitFor({ state: 'visible', timeout: 15000 });
      await promoInput.fill('january2026');

      const applyBtn = page
        .locator('button[data-state="button-applyPromocode"]')
        .or(page.getByRole('button', { name: /Застосувати промокод|Применить промокод/i }))
        .first();
      await applyBtn.click();
      await applyBtn.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

      const fwd3 = page
        .getByRole('button', { name: /Далі|Далее/i })
        .filter({ visible: true })
        .first();
      await fwd3.click();

      // 4. Document data
      const seriesInput = page
        .getByTestId('input-passportSeries')
        .or(page.getByLabel(/Серія|Серия/i));
      const numberInput = page.getByTestId('input-passportNumber').or(page.getByLabel(/Номер/i));
      const dateInput = page
        .getByTestId('input-passportDate')
        .or(page.getByLabel(/Коли видано|Когда выдан/i));
      const issuedByInput = page
        .getByTestId('input-passportIssuedBy')
        .or(page.getByLabel(/Ким видано|Кем выдан/i));
      const tinInput = page.getByTestId('input-taxId').or(page.getByLabel(/ІПН|ИНН/i));
      const addressInput = page
        .getByTestId('input-registrationAddress')
        .or(page.getByLabel(/Адреса|Адрес/i));

      await seriesInput.waitFor({ state: 'visible', timeout: 15000 });
      await seriesInput.fill('ЕО');
      await numberInput.fill('010283');
      await dateInput.fill('25.05.1995');
      await issuedByInput.fill('Доманівським РВ УМВС');
      await tinInput.fill('2853717994');
      await addressInput.fill('Доманівка, вул. Нова, 7');

      const fwd4 = page
        .locator(
          'button[data-state="button-forward"]:visible, button:has-text("Далі"):visible, button:has-text("Далее"):visible',
        )
        .first();
      await fwd4.click();

      // Summary screen -> Checkout to OTP
      const summaryBoard = page.locator('[data-state="button-summary-board"]');
      await summaryBoard.waitFor({ state: 'visible', timeout: 30000 });

      console.log('  --- Submitting Checkout to reach OTP screen ---');
      const fromCheckoutIdx = dataLayerLog.length;
      const fwdCheckout = page
        .locator(
          'button[data-state="button-forward"]:visible, button:has-text("Далі"):visible, button:has-text("Далее"):visible',
        )
        .first();
      await fwdCheckout.click();

      const otpInput = page
        .locator(
          "input[data-state='input-otp'], input[data-state='input-confirmSms'], input[data-state='input-customerSmsCode'], input#one-time-code, input[autocomplete='one-time-code']",
        )
        .or(page.getByRole('textbox', { name: /Код із SMS|Код из SMS/i }))
        .first();

      await otpInput.waitFor({ state: 'visible', timeout: 45000 });
      await page.waitForTimeout(3000);

      const checkoutToOtpEvents = dataLayerLog.slice(fromCheckoutIdx);
      const checkoutToOtpTriggers = extractTriggersFromEntries(checkoutToOtpEvents);
      console.log('  Тригери Checkout -> OTP:', checkoutToOtpTriggers);

      results['checkout-to-otp'] = {
        expected: 'wizard.greencardv2_sms',
        actualFired: checkoutToOtpTriggers,
        passed:
          checkoutToOtpTriggers.includes('wizard.greencardv2_sms') ||
          checkoutToOtpTriggers.includes('wizard.greencard_sms'),
      };

      // OTP Error
      console.log('  --- Перевірка невірного OTP коду (999999) ---');
      const fromOtpErrorIdx = dataLayerLog.length;
      await otpInput.fill('999999');

      const consentCheckbox = page
        .locator(
          ".TR_WL_CheckBox, [data-state='checkbox-otp-consent'], label.TR_WL_CheckBox_checkmark",
        )
        .or(page.locator("label:has(input[type='checkbox'])"))
        .or(page.getByRole('checkbox'))
        .first();
      if (await consentCheckbox.isVisible()) {
        await consentCheckbox.click();
      }

      const submitBtn = page
        .getByRole('button', { name: /підписати|підтвердити|оплатити|подтвердить/i })
        .or(
          page.locator(
            "button[data-state='button-submit-otp'], button[data-state='button-confirmSms']",
          ),
        )
        .first();
      await submitBtn.click();

      await page.waitForTimeout(4000);
      const otpErrorEvents = dataLayerLog.slice(fromOtpErrorIdx);
      const otpErrorTriggers = extractTriggersFromEntries(otpErrorEvents);
      console.log('  Тригери після невірного OTP:', otpErrorTriggers);

      results['otp-error'] = {
        expected: 'wizard.greencardv2_otp-error',
        actualFired: otpErrorTriggers,
        passed:
          otpErrorTriggers.includes('wizard.greencardv2_otp-error') ||
          otpErrorTriggers.includes('wizard.greencard_otp-error'),
      };

      // OTP Success
      console.log('  --- Перевірка вірного OTP коду (111111) ---');
      const fromOtpSuccessIdx = dataLayerLog.length;
      await otpInput.fill('');
      await otpInput.fill('111111');
      await submitBtn.click();

      await page.waitForURL(/portmone\.com\.ua|prt\.mn/i, { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(3000);

      const otpSuccessEvents = dataLayerLog.slice(fromOtpSuccessIdx);
      const otpSuccessTriggers = extractTriggersFromEntries(otpSuccessEvents);
      console.log('  Тригери після успішного OTP (Portmone redirect):', otpSuccessTriggers);

      results['otp-success'] = {
        expected: 'wizard.greencardv2_otp-success',
        actualFired: otpSuccessTriggers,
        passed:
          otpSuccessTriggers.includes('wizard.greencardv2_otp-success') ||
          otpSuccessTriggers.includes('wizard.greencard_otp-success'),
      };

      await context.close();
    }

    console.log('\n================================================================');
    console.log('📊 FINAL RESULTS SUMMARY');
    console.log('================================================================');
    console.log(JSON.stringify(results, null, 2));

    const allPassed = Object.values(results).every((r) => r.passed);
    if (allPassed) {
      console.log('\n✅ All GreenCard wizard triggers verified successfully!');
    } else {
      console.log('\n⚠️ Some triggers did not fire as expected. Review output above.');
    }
  } catch (err) {
    console.error(`❌ Verification failed: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
