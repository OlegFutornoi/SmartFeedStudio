/* eslint-disable */
/**
 * @file inspect-osago-wizard.ts
 * @description Advanced inspection script for exploring OSAGO Landing forms, tabs, dropdowns,
 * promo code dialogs, and multi-step Wizard modals across environments (STAGE / PROD).
 *
 * Usage:
 *   npx ts-node .agents/skills/pw-plan/scripts/inspect-osago-wizard.ts [stage|prod|both]
 */

import { chromium, Page } from 'playwright';
import { getProdConfig, getStageConfig } from '../../../../config/env.helper';

interface ScreenInspectionResult {
  env: string;
  flow: string;
  elementsFound: number;
}

async function inspectPromoDialog(page: Page, envName: string): Promise<void> {
  console.log(`\n  [${envName}] 🎁 --- Step: Inspecting Promo Dialog ---`);
  const promoToggle = page
    .locator(
      "button[data-state='button-toggle-promo'], button[data-state='by-number-promo:toggle']",
    )
    .first();
  if (await promoToggle.isVisible()) {
    await promoToggle.click();
    await page.waitForTimeout(1000);

    const promoElements = await page.evaluate(() => {
      const elements = Array.from(
        document.querySelectorAll('[data-state], [data-testid], input, button'),
      );
      return elements
        .filter((el) => {
          const s =
            (el.getAttribute('data-state') || '') +
            (el.getAttribute('data-testid') || '') +
            (el.className || '') +
            (el.id || '');
          return (
            s.toLowerCase().includes('promo') ||
            s.toLowerCase().includes('dialog') ||
            s.toLowerCase().includes('modal')
          );
        })
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          dataState: el.getAttribute('data-state'),
          dataTestId: el.getAttribute('data-testid'),
          id: el.id,
          placeholder: el.getAttribute('placeholder'),
          text: (el.textContent || '').trim().slice(0, 40),
        }));
    });

    console.log(`    Found ${promoElements.length} promo dialog elements on ${envName}:`);
    for (const el of promoElements) {
      console.log(
        `      <${el.tag}> id="${el.id}" data-state="${el.dataState}" data-testid="${el.dataTestId}" placeholder="${el.placeholder || ''}"`,
      );
    }

    // Close promo dialog
    const modalClose = page
      .locator("[data-state='modal-close'], [data-state='promo-dialog:backdrop']")
      .first();
    if (await modalClose.isVisible()) {
      await modalClose.click({ position: { x: 5, y: 5 } }).catch(() => {});
    } else {
      await page.keyboard.press('Escape').catch(() => {});
    }
    await page.waitForTimeout(500);
  } else {
    console.log(`    ⚠️ Promo toggle button not visible on ${envName}`);
  }
}

async function inspectByNumberFlow(page: Page, envName: string): Promise<void> {
  console.log(`\n  [${envName}] 🚗 --- Step: Inspecting By Number Flow (AA0001AA) ---`);
  const searchInput = page.locator("[data-state='input-car-number'], #search").first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('AA0001AA');
    const calcBtn = page.locator("button[data-state='button-calculate-main']").first();
    await calcBtn.click();
    await page.waitForTimeout(2500);

    const modalElements = await page.evaluate(() => {
      const elements = Array.from(
        document.querySelectorAll('[data-state], [data-testid], [data-active-screen]'),
      );
      return elements.map((el) => ({
        tag: el.tagName.toLowerCase(),
        dataState: el.getAttribute('data-state'),
        dataTestId: el.getAttribute('data-testid'),
        dataActiveScreen: el.getAttribute('data-active-screen'),
        id: el.id,
        text: (el.textContent || '').trim().slice(0, 45),
      }));
    });

    console.log(`    Found ${modalElements.length} elements in Wizard Modal 1 on ${envName}:`);
    for (const item of modalElements.slice(0, 20)) {
      console.log(
        `      <${item.tag}> data-active-screen="${item.dataActiveScreen}" data-state="${item.dataState}" data-testid="${item.dataTestId}" text="${item.text}"`,
      );
    }

    // Click forward if available
    const forwardBtn = page
      .locator(
        "button[data-state='button-forward'], button[data-state='button-calculateByParams'], button:has-text('Далі')",
      )
      .first();
    if (await forwardBtn.isVisible()) {
      console.log(
        `    👉 Clicking forward button in modal: "${(await forwardBtn.textContent())?.trim()}"`,
      );
      await forwardBtn.click();
      await page.waitForTimeout(2500);

      const step2Elements = await page.evaluate(() => {
        const elements = Array.from(
          document.querySelectorAll('[data-state], [data-testid], [data-active-screen]'),
        );
        return elements.map((el) => ({
          tag: el.tagName.toLowerCase(),
          dataState: el.getAttribute('data-state'),
          dataTestId: el.getAttribute('data-testid'),
          dataActiveScreen: el.getAttribute('data-active-screen'),
          text: (el.textContent || '').trim().slice(0, 45),
        }));
      });

      console.log(`    Found ${step2Elements.length} elements in Wizard Step 2 on ${envName}:`);
      for (const item of step2Elements.slice(0, 20)) {
        console.log(
          `      <${item.tag}> data-active-screen="${item.dataActiveScreen}" data-state="${item.dataState}" data-testid="${item.dataTestId}" text="${item.text}"`,
        );
      }
    }
  }
}

async function inspectByParamsFlow(page: Page, envName: string): Promise<void> {
  console.log(`\n  [${envName}] ⚙️ --- Step: Inspecting By Params Form & Dropdowns ---`);
  const tabParams = page
    .locator(
      "button[data-state*='landing-tabs:params'], button[data-state='tab-by-params'], button:has-text('параметр')",
    )
    .first();
  if (await tabParams.isVisible()) {
    await tabParams.click();
    await page.waitForTimeout(1500);

    // Inspect place container
    const placeContainer = page.locator("[data-state='select-registration-place']");
    if (await placeContainer.isVisible()) {
      console.log(`    📍 Found registration place container. Opening options...`);
      const placeInput = placeContainer.locator('input, button').first();
      await placeInput.click();
      await page.waitForTimeout(1000);

      const placeHtmlSnippet = await placeContainer.innerHTML();
      console.log(
        `    Registration place container snippet length: ${placeHtmlSnippet.length} chars`,
      );
      await page.keyboard.press('Escape').catch(() => {});
    }

    const paramsElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('[data-state], [data-testid]'));
      return elements.map((el) => ({
        tag: el.tagName.toLowerCase(),
        dataState: el.getAttribute('data-state'),
        dataTestId: el.getAttribute('data-testid'),
        text: (el.textContent || '').trim().slice(0, 45),
      }));
    });

    console.log(`    Found ${paramsElements.length} elements in Params tab on ${envName}:`);
    for (const item of paramsElements.slice(0, 25)) {
      console.log(
        `      <${item.tag}> data-state="${item.dataState}" data-testid="${item.dataTestId}" text="${item.text}"`,
      );
    }
  }
}

export async function inspectEnvironment(url: string, envName: string): Promise<void> {
  console.log(
    `\n🚀 ================= INSPECTING OSAGO WIZARD [${envName}]: ${url} ================= 🚀`,
  );
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    await inspectPromoDialog(page, envName);
    await inspectByParamsFlow(page, envName);

    // Reload page to reset state for By Number flow
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await inspectByNumberFlow(page, envName);

    console.log(`\n✅ Inspection for [${envName}] completed successfully.`);
  } catch (err) {
    console.error(`❌ Inspection failed on [${envName}]:`, err);
  } finally {
    await browser.close();
  }
}

async function run() {
  const targetEnv = (process.argv[2] || 'both').toLowerCase();

  if (targetEnv === 'stage' || targetEnv === 'both') {
    const stageConfig = getStageConfig();
    await inspectEnvironment(`${stageConfig.BASE_URL_FINANCE}/ua/insurance/osago`, 'STAGE');
  }
  if (targetEnv === 'prod' || targetEnv === 'both') {
    const prodConfig = getProdConfig();
    await inspectEnvironment(`${prodConfig.BASE_URL_FINANCE}/ua/insurance/osago`, 'PROD');
  }
}

if (require.main === module) {
  run().catch(console.error);
}
