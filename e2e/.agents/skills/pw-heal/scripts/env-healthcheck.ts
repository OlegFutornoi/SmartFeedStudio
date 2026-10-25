/* eslint-disable */
import { chromium } from 'playwright';
import { config } from '../../../../config/env.helper';

/**
 * Multi-Environment Catalog & API Health Check
 * Quickly probes PROD, STAGE, and INTEGRATION environments for product availability
 * to identify whether test failures are due to backend catalog outages or test code.
 *
 * Usage:
 *   npx ts-node .agents/skills/pw-heal/scripts/env-healthcheck.ts [product]
 *   where product is "osago" | "travel" | "greencard" (default: "travel")
 */

(async () => {
  const product = process.argv[2] || 'travel';
  console.log(`[HealthCheck] Running health check for product: ${product.toUpperCase()}...`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const targets: Record<string, { prodUrl: string; stageUrl: string; apiRoot: string }> = {
    travel: {
      prodUrl:
        'https://finance.ua/ua/insurance/travel?catalog=true&country=272&coverage-from=2026-08-25&coverage-to=2026-08-30&locationInsured=UKRAINE&travelers=32&tripProgram=standart',
      stageUrl: `${config.BASE_URL_FINANCE}/ua/insurance/travel?catalog=true&country=272&coverage-from=2026-08-25&coverage-to=2026-08-30&locationInsured=UKRAINE&travelers=32&tripProgram=standart`,
      apiRoot: config.BASE_URL_PRODUCT_MANAGER,
    },
    osago: {
      prodUrl:
        'https://finance.ua/ua/insurance/osago/catalog?coverage=0&vehicleType=car&engineVolume=1600&placeId=7351&privilege=none&contractPeriod=year&registrationType=permanent',
      stageUrl: `${config.BASE_URL_FINANCE}/ua/insurance/osago/catalog?coverage=0&vehicleType=car&engineVolume=1600&placeId=7351&privilege=none&contractPeriod=year&registrationType=permanent`,
      apiRoot: config.BASE_URL_PRODUCT_MANAGER,
    },
    greencard: {
      prodUrl:
        'https://finance.ua/ua/insurance/greencard/catalog?vehicleType=car&countryGroup=europe&contractPeriod=15days',
      stageUrl: `${config.BASE_URL_FINANCE}/ua/insurance/greencard/catalog?vehicleType=car&countryGroup=europe&contractPeriod=15days`,
      apiRoot: config.BASE_URL_PRODUCT_MANAGER,
    },
  };

  const target = targets[product] || targets.travel;

  // 1. Check PROD
  try {
    console.log(`[HealthCheck] Checking PROD...`);
    await page.goto(target.prodUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
    const prodCount = await page
      .locator("#products article:has(button), [data-state*='product-id']")
      .count();
    console.log(`  ✅ PROD Products count: ${prodCount}`);
  } catch (e) {
    console.log(`  ❌ PROD failed: ${(e as Error).message}`);
  }

  // 2. Check STAGE
  try {
    console.log(`[HealthCheck] Checking STAGE (${config.BASE_URL_FINANCE})...`);
    await page.goto(target.stageUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
    const stageCount = await page
      .locator("#products article:has(button), [data-state*='product-id']")
      .count();
    console.log(`  ${stageCount > 0 ? '✅' : '⚠️'} STAGE Products count: ${stageCount}`);
  } catch (e) {
    console.log(`  ❌ STAGE failed: ${(e as Error).message}`);
  }

  // 3. Check INTEGRATION (Proxy) if applicable
  if (target.apiRoot) {
    try {
      console.log(`[HealthCheck] Checking INTEGRATION (${target.apiRoot})...`);
      await page.route(`**/api/v1/insurance/${product}/**`, async (route) => {
        const reqUrl = new URL(route.request().url());
        const newUrl = new URL(reqUrl.pathname + reqUrl.search, target.apiRoot).toString();
        await route.continue({ url: newUrl });
      });
      await page.goto(target.stageUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000);
      const intCount = await page
        .locator("#products article:has(button), [data-state*='product-id']")
        .count();
      console.log(`  ${intCount > 0 ? '✅' : '⚠️'} INTEGRATION Products count: ${intCount}`);
    } catch (e) {
      console.log(`  ❌ INTEGRATION failed: ${(e as Error).message}`);
    }
  }

  await browser.close();
  console.log(`[HealthCheck] Completed.`);
})();
