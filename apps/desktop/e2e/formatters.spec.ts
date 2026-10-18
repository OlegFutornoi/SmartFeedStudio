import { test, expect } from '@playwright/test';
import { formatFeedTitle } from '@/lib/formatters';

test.describe('formatters — formatFeedTitle (short and clean algorithm)', () => {
  test('omits generic boilerplate filename and query parameters, returning clean domain', () => {
    const url =
      'https://livolo.kiev.ua/products_feed.xml?hash_tag=313e3f0e4bd4878fa657c5c5d544b64d&sales_notes=&product_ids=';
    expect(formatFeedTitle(null, url)).toBe('livolo.kiev.ua');
    expect(formatFeedTitle(url)).toBe('livolo.kiev.ua');
  });

  test('strips www. prefix from domain', () => {
    expect(formatFeedTitle('https://www.prom.ua/price_list.xml')).toBe('prom.ua');
  });

  test('cleans legacy formatted strings with generic filenames in parentheses', () => {
    expect(formatFeedTitle('livolo.kiev.ua (products_feed.xml)')).toBe('livolo.kiev.ua');
    expect(formatFeedTitle('livolo.kiev.ua (products_feed)')).toBe('livolo.kiev.ua');
    expect(formatFeedTitle('dropship.ua (catalog.xml)')).toBe('dropship.ua');
  });

  test('preserves specific distinguishing sub-feed names while stripping technical extensions', () => {
    expect(formatFeedTitle('https://supplier.ua/feeds/lighting.xml')).toBe(
      'supplier.ua (lighting)',
    );
    expect(formatFeedTitle('supplier.ua (lighting.xml)')).toBe('supplier.ua (lighting)');
    expect(formatFeedTitle('https://electronics.com/outlet.csv')).toBe('electronics.com (outlet)');
  });

  test('preserves custom human-entered feed titles untouched', () => {
    expect(formatFeedTitle('Офіційний каталог Livolo')).toBe('Офіційний каталог Livolo');
    expect(formatFeedTitle('Основний прайс 2026')).toBe('Основний прайс 2026');
  });

  test('cleans local file uploads', () => {
    expect(formatFeedTitle('products_feed.xml')).toBe('Каталог товарів');
    expect(formatFeedTitle('smart_switches.csv')).toBe('smart_switches');
  });

  test('handles null, undefined, and empty string gracefully', () => {
    expect(formatFeedTitle(null, null)).toBe('');
    expect(formatFeedTitle(undefined, undefined)).toBe('');
    expect(formatFeedTitle('   ')).toBe('');
  });
});
