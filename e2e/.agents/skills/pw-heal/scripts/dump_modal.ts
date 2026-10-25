/* eslint-disable */
import { test, expect, chromium } from '@playwright/test';
import { PromocodeFlow } from './tests/finance/regression/finance/helpers/promocode.flow';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(
    'https://finance.ua/ua/insurance/osago/catalog?coverage=0&vehicleType=car&engineVolume=1600&placeId=9&privilege=none&contractPeriod=year&registrationType=permanent&fetchedByNumber=false&ownerBirthYear=1980&customerTaxId=2873293856&tariffDateFrom=02.08.2026&driversAgeMin=25',
    { waitUntil: 'networkidle' },
  );

  await PromocodeFlow.applyInCatalog(page, 'ДРУЗІ8');

  // open edit modal
  await page.locator('[data-state="vehicle-edit-button:ready"]').click();
  await page.waitForTimeout(2000);

  // dump html
  const html = await page.evaluate(() => document.body.innerHTML);
  const fs = require('fs');
  fs.writeFileSync('modal_html.html', html);
  await page.screenshot({ path: 'modal_full.png', fullPage: true });

  await browser.close();
})();
