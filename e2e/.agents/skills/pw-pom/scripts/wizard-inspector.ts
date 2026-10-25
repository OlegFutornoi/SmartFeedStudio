/* eslint-disable */
import { chromium, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Wizard & Modal Inspector Utility
 * Inspects multi-step modal dialogs, client wizards, and inline forms.
 * Extracts active screens, data-state attributes, inputs, and action buttons.
 *
 * Usage:
 *   npx ts-node .agents/skills/pw-pom/scripts/wizard-inspector.ts <URL> <TRIGGER_SELECTOR> [output_name]
 * Example:
 *   npx ts-node .agents/skills/pw-pom/scripts/wizard-inspector.ts "https://minfin.com.ua/ua/insurance/osago/" "button[data-state='searchByCarNumberComponent']" "osago_wizard"
 */

async function inspectModal(
  page: Page,
  modalSelector: string = "#modalContentId, [role='dialog'], .TR_WL_Wizard, [data-active-screen]",
) {
  return await page.evaluate((sel) => {
    const modal = document.querySelector(sel);
    if (!modal) return { found: false, message: 'Modal/Wizard container not found' };

    const activeScreen =
      modal.getAttribute('data-active-screen') || modal.getAttribute('data-state') || 'unknown';

    const inputs = Array.from(modal.querySelectorAll('input, textarea, select')).map((el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type') || '',
      id: el.getAttribute('id') || '',
      name: el.getAttribute('name') || '',
      dataState: el.getAttribute('data-state') || '',
      dataTestId: el.getAttribute('data-testid') || '',
      placeholder: el.getAttribute('placeholder') || '',
      ariaLabel: el.getAttribute('aria-label') || '',
      value: (el as HTMLInputElement).value || '',
    }));

    const buttons = Array.from(modal.querySelectorAll("button, a[role='button']")).map((el) => ({
      tag: el.tagName.toLowerCase(),
      text: el.textContent?.trim().replace(/\s+/g, ' ') || '',
      dataState: el.getAttribute('data-state') || '',
      dataTestId: el.getAttribute('data-testid') || '',
      disabled: (el as HTMLButtonElement).disabled || false,
    }));

    const headings = Array.from(modal.querySelectorAll('h1, h2, h3, h4, h5')).map((el) => ({
      tag: el.tagName.toLowerCase(),
      text: el.textContent?.trim() || '',
    }));

    return {
      found: true,
      activeScreen,
      inputs,
      buttons,
      headings,
    };
  }, modalSelector);
}

(async () => {
  const url = process.argv[2] || 'https://minfin.com.ua/ua/insurance/osago/';
  const triggerSelector = process.argv[3];
  const outputName = process.argv[4] || 'wizard_inspection';

  console.log(`[Wizard Inspector] Navigating to ${url}...`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    if (triggerSelector) {
      console.log(`[Wizard Inspector] Triggering modal via ${triggerSelector}...`);
      const trigger = page.locator(triggerSelector).first();
      if (await trigger.isVisible().catch(() => false)) {
        await trigger.click();
        await page.waitForTimeout(3000);
      }
    }

    const inspection = await inspectModal(page);
    console.log(
      `[Wizard Inspector] Result: Active Screen = "${inspection.activeScreen}", Inputs = ${inspection.inputs?.length}, Buttons = ${inspection.buttons?.length}`,
    );

    const tempDir = path.resolve(process.cwd(), '.temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputPath = path.join(tempDir, `${outputName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(inspection, null, 2));
    console.log(`[Wizard Inspector] Saved inspection to ${outputPath}`);
  } catch (err) {
    console.error('[Wizard Inspector] Error:', err);
  } finally {
    await browser.close();
  }
})();
