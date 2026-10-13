import { test, expect } from '@playwright/test';
import {
  formatProductImageFileName,
  transliterateCyrillicToLatin,
  slugifyFileName,
} from '@smartfeed/shared';

test.describe('Media Semantic Naming & Transliteration (Unit/E2E)', () => {
  test('transliterates Ukrainian Cyrillic characters accurately to Latin', () => {
    expect(transliterateCyrillicToLatin('Вебсклад')).toBe('Vebsklad');
    expect(transliterateCyrillicToLatin('Чорний')).toBe('Chornyy');
    expect(transliterateCyrillicToLatin('Яблуко')).toBe('Yabluko');
    expect(transliterateCyrillicToLatin('Ювелірний')).toBe('Yuvelirnyy');
    expect(transliterateCyrillicToLatin('Їжак')).toBe('Yizhak');
    expect(transliterateCyrillicToLatin('Євген')).toBe('Yevhen');
  });

  test('slugifies text into clean, URL/file-safe slugs', () => {
    expect(slugifyFileName('Вебсклад')).toBe('vebsklad');
    expect(slugifyFileName('АРТ-10492 / ЧОРНИЙ')).toBe('art-10492-chornyy');
    expect(slugifyFileName('Brain Distribution')).toBe('brain-distribution');
    expect(slugifyFileName('ЧОХОЛ #1 (NEW) & RED')).toBe('chokhol-1-new-red');
  });

  test('formats semantic product image filenames with supplier, sku, and zero-padded index', () => {
    const filename1 = formatProductImageFileName({
      supplier: 'Вебсклад',
      sku: 'АРТ-10492/ЧОРНИЙ',
      index: 0,
      isMain: true,
      extension: 'webp',
    });
    expect(filename1).toBe('vebsklad_art-10492-chornyy_01.webp');

    const filename2 = formatProductImageFileName({
      supplier: 'Brain Distribution',
      sku: 'WS-9812',
      index: 1,
      extension: 'webp',
    });
    expect(filename2).toBe('brain-distribution_ws-9812_02.webp');

    const filename10 = formatProductImageFileName({
      supplier: 'Drop Market',
      sku: 'KOL-99',
      index: 9,
    });
    expect(filename10).toBe('drop-market_kol-99_10.webp');
  });

  test('gracefully handles missing supplier and SKU with safe fallbacks', () => {
    const fallbackFilename = formatProductImageFileName({
      supplier: null,
      sku: null,
      index: 0,
    });
    expect(fallbackFilename).toBe('vendor_product_01.webp');
  });
});
