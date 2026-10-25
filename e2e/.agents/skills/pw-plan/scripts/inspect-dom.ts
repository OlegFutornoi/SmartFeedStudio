/* eslint-disable */
/**
 * @file inspect-dom.ts
 * @description General-purpose DOM Inspector for test automation engineers.
 * Scans a target web page (or compares STAGE vs PROD) and extracts all elements with
 * testability attributes (`data-state`, `data-testid`, IDs, classes, and ARIA roles).
 *
 * Usage:
 *   npx ts-node .agents/skills/pw-plan/scripts/inspect-dom.ts [optional-url] [optional-env-name]
 *   npx ts-node .agents/skills/pw-plan/scripts/inspect-dom.ts https://cms-stage.finance.ua/ua/insurance/osago STAGE
 */

import { chromium } from 'playwright';
import { getProdConfig, getStageConfig } from '../../../../config/env.helper';

interface DomElementSummary {
  tag: string;
  id: string;
  dataState: string | null;
  dataTestId: string | null;
  dataGtm: string | null;
  role: string | null;
  text: string;
  className: string;
}

export async function inspectUrlDom(url: string, envName = 'TARGET'): Promise<DomElementSummary[]> {
  console.log(`\n🔍 ================= INSPECTING ${envName}: ${url} ================= 🔍`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    const elements = await page.evaluate((): DomElementSummary[] => {
      const nodes = Array.from(
        document.querySelectorAll(
          '[data-state], [data-testid], [data-gtm-ea], [role], input, button, select',
        ),
      );
      return nodes.map((el): DomElementSummary => ({
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        dataState: el.getAttribute('data-state'),
        dataTestId: el.getAttribute('data-testid'),
        dataGtm: el.getAttribute('data-gtm-ea'),
        role: el.getAttribute('role'),
        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 45),
        className: el.className ? String(el.className).slice(0, 40) : '',
      }));
    });

    console.log(`📊 Found ${elements.length} testable elements on ${envName}:`);
    for (const item of elements) {
      const attrs = [
        item.dataState ? `data-state="${item.dataState}"` : '',
        item.dataTestId ? `data-testid="${item.dataTestId}"` : '',
        item.dataGtm ? `data-gtm-ea="${item.dataGtm}"` : '',
        item.role ? `role="${item.role}"` : '',
        item.id ? `id="${item.id}"` : '',
      ]
        .filter(Boolean)
        .join(' ');

      console.log(`  <${item.tag}> ${attrs} text="${item.text}"`);
    }

    return elements;
  } catch (err) {
    console.error(`❌ Error inspecting ${envName} (${url}):`, err);
    return [];
  } finally {
    await browser.close();
  }
}

async function run() {
  const customUrl = process.argv[2];
  const customEnv = process.argv[3] || 'CUSTOM';

  if (customUrl) {
    await inspectUrlDom(customUrl, customEnv);
  } else {
    console.log(
      'ℹ️ No URL provided via CLI argument. Running default STAGE vs PROD inspection for OSAGO landing...',
    );
    const stageConfig = getStageConfig();
    const prodConfig = getProdConfig();
    await inspectUrlDom(`${stageConfig.BASE_URL_FINANCE}/ua/insurance/osago`, 'STAGE');
    await inspectUrlDom(`${prodConfig.BASE_URL_FINANCE}/ua/insurance/osago`, 'PROD');
  }
}

if (require.main === module) {
  run().catch(console.error);
}
