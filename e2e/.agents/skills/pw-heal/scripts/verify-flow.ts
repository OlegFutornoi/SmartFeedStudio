/* eslint-disable */
/**
 * @file verify-flow.ts
 * @description Standalone fast smoke verification script for OSAGO UI flows.
 * Tests Promo code modal error handling, By Params vehicle type selection,
 * registration place selection, wizard modal transition, and catalog navigation across STAGE and PROD.
 *
 * Usage:
 *   npx ts-node .agents/skills/pw-heal/scripts/verify-flow.ts [stage|prod|both]
 */

import { chromium, expect, Page } from '@playwright/test';
import { getProdConfig, getStageConfig } from '../../../../config/env.helper';

export async function verifyOsagoFlow(url: string, envName: string): Promise<boolean> {
  console.log(`\n================ 🧪 VERIFYING FLOW ON [${envName}]: ${url} ================`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    // 1. Check Promo on Landing
    console.log(`[1/5] 🎁 Testing Promo Dialog validation on Landing...`);
    const promoToggle = page
      .locator(
        "button[data-state='button-toggle-promo'], button[data-state='by-number-promo:toggle']",
      )
      .first();
    await expect(promoToggle).toBeVisible({ timeout: 10000 });
    await promoToggle.click();

    const promoDialog = page.locator("[data-state='promo-dialog:content']");
    await expect(promoDialog).toBeVisible({ timeout: 10000 });

    const promoInput = page
      .locator(
        "input[data-state='input-promo'], input[data-state='modal-input-promo'], input[placeholder*='ромокод']",
      )
      .first();
    await expect(promoInput).toBeVisible({ timeout: 5000 });
    await promoInput.fill('INVALID_TEST_CODE');

    const promoApply = page
      .locator(
        "button[data-state='button-apply-promo'], button[data-state='modal-button-apply-promo'], button[data-state='promo-dialog:apply']",
      )
      .first();
    await expect(promoApply).toBeVisible({ timeout: 5000 });
    await promoApply.click();

    const promoError = promoDialog
      .getByText(/Невірний промокод|Промокод не працює|Термін дії/i)
      .first();
    await expect(promoError).toBeVisible({ timeout: 10000 });
    console.log(`      ✅ Promo error message displayed correctly.`);

    // Close promo dialog
    const modalClose = page.locator("[data-state='modal-close']");
    const backdrop = page.locator("[data-state='promo-dialog:backdrop']");
    if (await modalClose.isVisible()) {
      await modalClose.click();
    } else if (await backdrop.isVisible()) {
      await backdrop.click({ position: { x: 10, y: 10 } });
    } else {
      await page.keyboard.press('Escape');
    }
    await expect(promoDialog).toBeHidden({ timeout: 5000 });
    console.log(`      ✅ Promo dialog closed.`);

    // 2. Select "За параметрами" tab
    console.log(`[2/5] ⚙️ Testing 'За параметрами' tab activation...`);
    const tabParams = page
      .locator("button[data-state*='landing-tabs:params'], button[data-state='tab-by-params']")
      .first();
    await tabParams.click();
    await expect(page.locator("[data-state='by-params-form:ready']")).toBeVisible({
      timeout: 10000,
    });
    console.log(`      ✅ By Params form ready.`);

    // 3. Select vehicle type: Вантажівка + вантажопідйомність
    console.log(`[3/5] 🚚 Selecting Vehicle Type (Вантажівка) and Capacity...`);
    const vehicleTypeToggle = page
      .locator(
        "[data-state='select-vehicle-type'] button, [data-state='select-vehicle-type'] [data-state^='select-toggle']",
      )
      .first();
    await vehicleTypeToggle.click();
    const truckOption = page
      .locator("[data-state='select-vehicle-type']")
      .getByText('Вантажівка', { exact: true })
      .or(page.getByText('Вантажівка', { exact: true }))
      .last();
    await truckOption.click();

    const capacityToggle = page
      .getByText(/Вантажопідйомність/i)
      .locator('..')
      .locator('button')
      .or(page.locator("[data-state*='capacity'] button"))
      .first();
    await capacityToggle.click();
    const capacityOption = page.getByText(/до 2\s*т/i).last();
    await capacityOption.click();
    console.log(`      ✅ Vehicle type & capacity configured.`);

    // 4. Select Registration place: Одеса
    console.log(`[4/5] 📍 Selecting Registration Place (Одеса)...`);
    const placeInput = page
      .locator("[data-state='select-registration-place'] input, input[placeholder*='техпаспорт']")
      .first();
    await placeInput.click();
    const odesaOption = page
      .locator("[data-state='select-registration-place'] label")
      .filter({ hasText: /Одеса/i })
      .first();
    await odesaOption.click();
    await page.keyboard.press('Escape').catch(() => {});
    console.log(`      ✅ Registration place selected.`);

    // 5. Submit form and navigate to Catalog
    console.log(`[5/5] 🚀 Submitting form and waiting for Wizard Modal / Catalog...`);
    const calcButton = page
      .locator(
        "button[data-state='button-calculate-main'], button[data-state='by-params-submit:ready']",
      )
      .first();
    await expect(calcButton).toBeVisible({ timeout: 5000 });
    await calcButton.click();

    const nextScreen = await Promise.race([
      page
        .locator("[data-active-screen='calculateAdditionalInfo']")
        .waitFor({ state: 'visible', timeout: 15000 })
        .then(() => 'modal'),
      page
        .waitForURL(/\/insurance\/(car|osago)\/.*catalog/i, { timeout: 15000 })
        .then(() => 'catalog'),
    ]);
    console.log(`      ➡️ Screen transition: ${nextScreen}`);

    if (nextScreen === 'modal') {
      const taxId = page
        .locator(
          "#customerTaxId, input[data-state='input-tin'], input[data-state='modal-input-tin']",
        )
        .first();
      await expect(taxId).toBeVisible({ timeout: 5000 });
      await taxId.fill('2948607491');

      const birthYear = page
        .locator(
          "#ownerBirthYear, input[data-state='input-owner-year'], input[data-state='modal-input-owner-year']",
        )
        .first();
      await expect(birthYear).toBeVisible({ timeout: 5000 });
      await birthYear.fill('1980');

      const calcAddBtn = page
        .locator(
          "[data-state='button-calculateByAdditionalInfo'], [data-state='modal-button-calculate']",
        )
        .first();
      await calcAddBtn.click();
    }

    await expect(page).toHaveURL(/\/insurance\/(car|osago)\/.*catalog/i, { timeout: 30000 });
    console.log(`✅ [${envName}] PASSED: Reached catalog at ${page.url()}`);
    return true;
  } catch (err) {
    console.error(`❌ [${envName}] FAILED:`, err);
    return false;
  } finally {
    await browser.close();
  }
}

async function run() {
  const targetEnv = (process.argv[2] || 'both').toLowerCase();
  let stageSuccess = true;
  let prodSuccess = true;

  if (targetEnv === 'stage' || targetEnv === 'both') {
    const stageConfig = getStageConfig();
    stageSuccess = await verifyOsagoFlow(
      `${stageConfig.BASE_URL_FINANCE}/ua/insurance/osago`,
      'STAGE',
    );
  }
  if (targetEnv === 'prod' || targetEnv === 'both') {
    const prodConfig = getProdConfig();
    prodSuccess = await verifyOsagoFlow(
      `${prodConfig.BASE_URL_FINANCE}/ua/insurance/osago`,
      'PROD',
    );
  }

  if (!stageSuccess || !prodSuccess) {
    process.exit(1);
  }
}

if (require.main === module) {
  run().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
