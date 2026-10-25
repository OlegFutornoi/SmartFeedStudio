/* eslint-disable */
/**
 * @file dump-minfin-v3-flow.ts
 * @description Diagnostic script for walking through the complete Minfin OSAGO V3 purchase funnel
 * (Search -> TIN -> Catalog -> Personal -> Car summary -> Docs -> DGO -> Email -> Sign Contract / OTP)
 * and dumping the complete HTML DOM and full-page screenshot of the final screen to .temp/.
 *
 * Use this script when diagnosing broken flows, missing locators, or changed layout on the OTP/Sign Contract screen.
 *
 * Usage:
 *   npx ts-node .agents/skills/pw-heal/scripts/dump-minfin-v3-flow.ts [URL]
 *
 * Example:
 *   npx ts-node .agents/skills/pw-heal/scripts/dump-minfin-v3-flow.ts "https://minfin-osago-stage.treeumapp.net/ua/insurance/osago/"
 */

import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_URL = 'https://minfin-osago-stage.treeumapp.net/ua/insurance/osago/';

async function dumpMinfinV3Flow(baseUrl: string = DEFAULT_URL): Promise<void> {
  console.log(`\n================ 🧪 RUNNING MINFIN V3 FLOW DUMP: ${baseUrl} ================`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();

  const tempDir = path.resolve(process.cwd(), '.temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    // 1. Open Landing
    console.log('➡️ [1/8] Navigating to Minfin OSAGO...');
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 2. Car Number Search
    console.log('➡️ [2/8] Entering car number BE6573HI...');
    const numberInput = page
      .locator(
        "input[placeholder*='AA'][placeholder*='AA'], #carNumberInput, input[data-state='searchByCarNumberComponent'] input",
      )
      .first();
    await numberInput.waitFor({ state: 'visible', timeout: 15000 });
    await numberInput.click();
    await numberInput.pressSequentially('BE6573HI', { delay: 50 });

    const calcLabel = page.getByText(/Розрахувати ціну|Рассчитать цену/i).first();
    if (await calcLabel.isVisible().catch(() => false)) {
      await calcLabel.click();
    } else {
      await numberInput.press('Enter');
    }

    // 3. Car confirm modal / TIN
    console.log('➡️ [3/8] Confirming car & TIN...');
    await page.waitForTimeout(2000);
    const continueBtn1 = page
      .getByRole('button', { name: /^Продовжити$|^Далі$|^Розрахувати/i })
      .first();
    if (await continueBtn1.isVisible({ timeout: 10000 }).catch(() => false)) {
      await continueBtn1.click();
    }

    const tinInput = page
      .getByRole('textbox', { name: /ІПН|ИНН|РНОКПП/i })
      .or(page.getByTestId('input-customerTaxId'))
      .or(page.locator("input[name='customerTaxId'], input[name='taxId'], #customerTaxId"))
      .first();

    if (await tinInput.isVisible({ timeout: 10000 }).catch(() => false)) {
      await tinInput.click();
      await tinInput.pressSequentially('2853717994', { delay: 50 });
      const continueBtn2 = page.getByRole('button', { name: /^Продовжити$|^Далі$/i }).last();
      await continueBtn2.click();
    }

    // 4. Catalog
    console.log('➡️ [4/8] Waiting for catalog and selecting first offer...');
    await page.waitForURL(/.*price.*/, { timeout: 30000 });
    const buyButton = page.getByRole('button', { name: /оформити|оформить/i }).first();
    await buyButton.waitFor({ state: 'visible', timeout: 30000 });
    await buyButton.click();

    // 5. Personal Data
    console.log('➡️ [5/8] Filling personal data...');
    const phoneInput = page
      .locator(
        "input[data-state='input-customerPhone'], input[name='customerPhone'], input[name='phone']",
      )
      .first();
    await phoneInput.waitFor({ state: 'visible', timeout: 20000 });
    await phoneInput.fill('0666666666');

    const lastNameInput = page
      .locator("input[data-state='input-customerLastName'], input[name='customerLastName']")
      .first();
    await lastNameInput.fill('Футорний');

    const firstNameInput = page
      .locator("input[data-state='input-customerFirstName'], input[name='customerFirstName']")
      .first();
    await firstNameInput.fill('Олег');

    const middleNameInput = page
      .locator("input[data-state='input-customerMiddleName'], input[name='customerMiddleName']")
      .first();
    await middleNameInput.fill('Борисович');

    const forwardBtn = page
      .getByRole('button', { name: /^Далі$/i })
      .or(page.locator("button[data-state='button-forward']"))
      .first();
    await forwardBtn.click();

    // 6. Car summary confirm
    console.log('➡️ [6/8] Confirming car parameters...');
    const carForwardBtn = page
      .getByRole('button', { name: /^Далі$/i })
      .or(page.locator('button[data-state="button-forward"]:visible'))
      .first();
    await carForwardBtn.waitFor({ state: 'visible', timeout: 20000 });
    await carForwardBtn.click();

    // 7. Documents & DGO & Email
    console.log('➡️ [7/8] Filling documents, DGO, and email...');
    const seriesInput = page
      .locator("input[data-state='input-passportSeries'], input[name='passportSeries']")
      .first();
    await seriesInput.waitFor({ state: 'visible', timeout: 20000 });
    await seriesInput.fill('ЕО');

    const passNumInput = page
      .locator("input[data-state='input-passportNumber'], input[name='passportNumber']")
      .first();
    await passNumInput.fill('010283');

    const passDateInput = page
      .locator("input[data-state='input-passportDate'], input[name='passportDate']")
      .first();
    await passDateInput.fill('25.05.1995');

    const issuedByInput = page
      .locator("input[data-state='input-passportIssuedBy'], input[name='passportIssuedBy']")
      .first();
    await issuedByInput.fill('Доманівським РВ УМВС');

    const addressInput = page
      .locator("input[data-state='input-address'], input[name='address'], input[name='locality']")
      .first();
    await addressInput.fill('Доманівка, вул. Нова, 7');

    const docForwardBtn = page
      .getByRole('button', { name: /^Далі$/i })
      .or(page.locator("button[data-state='button-forward']"))
      .first();
    await docForwardBtn.click();

    // DGO (if present)
    await page.waitForTimeout(2000);
    const dgoForwardBtn = page
      .getByRole('button', { name: /^Далі$/i })
      .or(page.locator("button[data-state='button-forward']"))
      .first();
    if (await dgoForwardBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dgoForwardBtn.click();
    }

    // Email
    const emailInput = page
      .locator(
        "input[data-state='input-customerEmail'], input[name='customerEmail'], input[type='email']",
      )
      .first();
    await emailInput.waitFor({ state: 'visible', timeout: 20000 });
    await emailInput.fill('o.futornyi@treeum.net');

    const emailForwardBtn = page
      .getByRole('button', { name: /^Далі$/i })
      .or(page.locator("button[data-state='button-forward']"))
      .first();
    await emailForwardBtn.click();

    // 8. Sign Contract / OTP Screen
    console.log('➡️ [8/8] Waiting for OTP / Sign Contract screen...');
    await page.waitForTimeout(6000);

    const html = await page.content();
    const htmlPath = path.join(tempDir, 'v3-otp-page.html');
    fs.writeFileSync(htmlPath, html, 'utf-8');

    const screenshotPath = path.join(tempDir, 'v3-otp-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log(`\n✅ [SUCCESS] Dump completed successfully!`);
    console.log(`📄 HTML dumped to: ${htmlPath}`);
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);
  } catch (error) {
    console.error('❌ Error during Minfin V3 flow dump:', error);
    const errorScreenshot = path.join(tempDir, 'dump-flow-error.png');
    await page.screenshot({ path: errorScreenshot, fullPage: true }).catch(() => {});
    console.log(`📸 Error screenshot saved to: ${errorScreenshot}`);
    throw error;
  } finally {
    await browser.close();
  }
}

const targetUrl = process.argv[2] || DEFAULT_URL;
dumpMinfinV3Flow(targetUrl).catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
