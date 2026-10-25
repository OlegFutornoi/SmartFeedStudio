/* eslint-disable */
/**
 * @file inspect-v3-wizard.ts
 * @description Advanced multi-step inspector for exploring V3 OSAGO Wizard screens (Minfin & Finance).
 * Traverses the full funnel to the OTP / Sign Contract screen, introspects the DOM,
 * extracts all interactive elements, attributes (data-state, data-testid, aria-label, roles),
 * outputs structured JSON to .temp/ and captures a screenshot.
 *
 * Use this script when building or refactoring Page Objects (BasePage) and Components (BaseComponent)
 * to discover user-facing and data-state locators without manual browser inspection.
 *
 * Usage:
 *   npx ts-node .agents/skills/pw-pom/scripts/inspect-v3-wizard.ts [URL] [output_name]
 *
 * Example:
 *   npx ts-node .agents/skills/pw-pom/scripts/inspect-v3-wizard.ts "https://minfin-osago-stage.treeumapp.net/ua/insurance/osago/" "v3_otp_screen"
 */

import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface ElementData {
  tag: string;
  id?: string;
  name?: string;
  type?: string;
  text?: string;
  placeholder?: string;
  dataState?: string | null;
  dataTestId?: string | null;
  ariaLabel?: string | null;
  className?: string;
  disabled?: boolean;
  href?: string | null;
}

interface InspectionReport {
  title: string;
  url: string;
  inputs: ElementData[];
  buttons: ElementData[];
  dataStateElements: ElementData[];
  timestamp: string;
}

const DEFAULT_URL = 'https://minfin-osago-stage.treeumapp.net/ua/insurance/osago/';

async function inspectV3Wizard(
  url: string = DEFAULT_URL,
  outputName: string = 'v3_wizard_inspection',
): Promise<void> {
  console.log(`\n================ 🔍 INSPECTING V3 WIZARD ON: ${url} ================`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();

  const tempDir = path.resolve(process.cwd(), '.temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    console.log('➡️ [1/8] Opening landing page...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('➡️ [2/8] Submitting vehicle number BE6573HI...');
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

    console.log('➡️ [3/8] Confirming vehicle and TIN...');
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

    console.log('➡️ [4/8] Selecting catalog offer...');
    await page.waitForURL(/.*price.*/, { timeout: 30000 });
    const buyButton = page.getByRole('button', { name: /оформити|оформить/i }).first();
    await buyButton.waitFor({ state: 'visible', timeout: 30000 });
    await buyButton.click();

    console.log('➡️ [5/8] Filling customer personal details...');
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

    console.log('➡️ [6/8] Confirming vehicle specs summary...');
    const carForwardBtn = page
      .getByRole('button', { name: /^Далі$/i })
      .or(page.locator('button[data-state="button-forward"]:visible'))
      .first();
    await carForwardBtn.waitFor({ state: 'visible', timeout: 20000 });
    await carForwardBtn.click();

    console.log('➡️ [7/8] Submitting passport & address...');
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

    await page.waitForTimeout(2000);
    const dgoForwardBtn = page
      .getByRole('button', { name: /^Далі$/i })
      .or(page.locator("button[data-state='button-forward']"))
      .first();
    if (await dgoForwardBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dgoForwardBtn.click();
    }

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

    console.log('➡️ [8/8] Reached target screen. Introspecting DOM...');
    await page.waitForTimeout(6000);

    const report: InspectionReport = await page.evaluate(() => {
      const inputs: ElementData[] = Array.from(
        document.querySelectorAll('input, textarea, select'),
      ).map((el) => ({
        tag: el.tagName.toLowerCase(),
        id: el.id || undefined,
        name: (el as HTMLInputElement).name || undefined,
        type: (el as HTMLInputElement).type || undefined,
        placeholder: (el as HTMLInputElement).placeholder || undefined,
        dataState: el.getAttribute('data-state'),
        dataTestId: el.getAttribute('data-testid'),
        ariaLabel: el.getAttribute('aria-label'),
        className: el.className || undefined,
      }));

      const buttons: ElementData[] = Array.from(
        document.querySelectorAll("button, a[role='button'], a"),
      ).map((el) => ({
        tag: el.tagName.toLowerCase(),
        text: (el as HTMLElement).innerText?.trim().replace(/\s+/g, ' ') || '',
        dataState: el.getAttribute('data-state'),
        dataTestId: el.getAttribute('data-testid'),
        className: el.className || undefined,
        disabled: (el as HTMLButtonElement).disabled || false,
        href: el.getAttribute('href'),
      }));

      const dataStateElements: ElementData[] = Array.from(
        document.querySelectorAll('[data-state], [data-testid], [data-active-screen]'),
      ).map((el) => ({
        tag: el.tagName.toLowerCase(),
        dataState: el.getAttribute('data-state'),
        dataTestId: el.getAttribute('data-testid'),
        text: (el as HTMLElement).innerText?.slice(0, 80).trim().replace(/\s+/g, ' ') || undefined,
      }));

      return {
        title: document.title,
        url: window.location.href,
        inputs,
        buttons,
        dataStateElements,
        timestamp: new Date().toISOString(),
      };
    });

    const jsonPath = path.join(tempDir, `${outputName}.json`);
    const screenshotPath = path.join(tempDir, `${outputName}.png`);

    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log(`\n================ 📊 INSPECTION REPORT: ${outputName} ================`);
    console.log(`Title: ${report.title}`);
    console.log(`URL: ${report.url}`);
    console.log(`Inputs found: ${report.inputs.length}`);
    console.log(`Buttons/Links found: ${report.buttons.length}`);
    console.log(`Elements with data-state: ${report.dataStateElements.length}`);
    console.log(`\n📁 Report JSON: ${jsonPath}`);
    console.log(`📸 Screenshot: ${screenshotPath}`);

    console.log('\n--- Top Data-State Locators Found ---');
    const uniqueDataStates = Array.from(
      new Set(report.dataStateElements.map((e) => e.dataState).filter(Boolean)),
    );
    uniqueDataStates.forEach((ds) => console.log(`  [data-state='${ds}']`));
  } catch (err) {
    console.error('❌ Error during V3 wizard inspection:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

const targetUrl = process.argv[2] || DEFAULT_URL;
const outputFileName = process.argv[3] || 'v3_wizard_inspection';

inspectV3Wizard(targetUrl, outputFileName).catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
