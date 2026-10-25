import { Page } from '@playwright/test';

export async function setLocale(page: Page, locale: 'uk' | 'en') {
  await page.evaluate((loc) => {
    window.localStorage.setItem('smartfeed_locale', loc);
  }, locale);
  await page.reload();
}
