/* eslint-disable */
import { chromium, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * DOM Explorer Utility
 * Scans any target page URL, extracts all interactive elements (inputs, buttons, links,
 * labels, data-state attributes, headings) and exports structured JSON for POM design.
 *
 * Usage:
 *   npx ts-node .agents/skills/pw-pom/scripts/dom-explorer.ts <URL> [output_name]
 * Example:
 *   npx ts-node .agents/skills/pw-pom/scripts/dom-explorer.ts "http://localhost:3000/feeds" "feeds_landing"
 */

async function extractElements(page: Page) {
  return await page.evaluate(() => {
    const results: any[] = [];

    function isVisible(elem: Element) {
      if (!(elem instanceof HTMLElement)) return false;
      const style = window.getComputedStyle(elem);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        elem.offsetWidth > 0 &&
        elem.offsetHeight > 0
      );
    }

    // 1. Inputs, selects, textareas
    document.querySelectorAll('input, select, textarea').forEach((el) => {
      if (isVisible(el)) {
        const name =
          el.getAttribute('name') || el.getAttribute('id') || el.getAttribute('placeholder') || '';
        const dataState = el.getAttribute('data-state') || '';
        const dataTestId = el.getAttribute('data-testid') || '';
        results.push({
          type: 'Input/Select',
          tag: el.tagName.toLowerCase(),
          label: name.trim(),
          dataState,
          dataTestId,
          value: (el as HTMLInputElement).value || '',
        });
      }
    });

    // 2. Buttons & Links
    document.querySelectorAll('button, a').forEach((el) => {
      if (isVisible(el)) {
        const text = el.textContent?.trim().replace(/\s+/g, ' ');
        const dataState = el.getAttribute('data-state') || '';
        const dataTestId = el.getAttribute('data-testid') || '';
        if (text && text.length < 100) {
          results.push({
            type: el.tagName.toLowerCase() === 'a' ? 'Link' : 'Button',
            tag: el.tagName.toLowerCase(),
            text,
            dataState,
            dataTestId,
          });
        }
      }
    });

    // 3. Headings & Sections
    document.querySelectorAll('h1, h2, h3, h4, [data-state]').forEach((el) => {
      if (isVisible(el)) {
        const text = el.textContent?.trim().replace(/\s+/g, ' ');
        const dataState = el.getAttribute('data-state') || '';
        if (dataState || (el.tagName.startsWith('H') && text)) {
          results.push({
            type: 'Section/Heading/State',
            tag: el.tagName.toLowerCase(),
            text: text ? text.substring(0, 80) : '',
            dataState,
          });
        }
      }
    });

    return results;
  });
}

(async () => {
  const url = process.argv[2] || 'http://localhost:3000';
  const outputName = process.argv[3] || 'dom_elements';

  console.log(`[DOM Explorer] Launching browser and navigating to ${url}...`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const elements = await extractElements(page);
    const tempDir = path.resolve(process.cwd(), '.temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputPath = path.join(tempDir, `${outputName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(elements, null, 2));
    console.log(`[DOM Explorer] Found ${elements.length} unique elements. Saved to ${outputPath}`);
  } catch (err) {
    console.error('[DOM Explorer] Error:', err);
  } finally {
    await browser.close();
  }
})();
