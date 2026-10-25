import { Page } from '@playwright/test';

export function createNetworkCounter(page: Page, urlPattern: string | RegExp) {
  let count = 0;
  const isMatch = (url: string) => {
    return typeof urlPattern === 'string' ? url.includes(urlPattern) : urlPattern.test(url);
  };

  page.on('request', (req) => {
    if (isMatch(req.url())) {
      count++;
    }
  });

  return {
    getCount: () => count,
    reset: () => {
      count = 0;
    },
  };
}
