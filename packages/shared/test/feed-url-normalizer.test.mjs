import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  normalizeFeedUrl,
  computeFeedContentHash,
  generateDisambiguatedFeedName,
  areFeedUrlsEquivalent,
} from '../dist/index.js';

describe('feed-url-normalizer', () => {
  it('normalizes URLs by stripping protocol variances, trailing slashes, and tracking params', () => {
    const url1 = 'https://livolo.kiev.ua/products_feed.xml';
    const url2 = 'http://livolo.kiev.ua/products_feed.xml/';
    const url3 = 'livolo.kiev.ua/products_feed.xml';
    const url4 =
      'https://www.livolo.kiev.ua/products_feed.xml?utm_source=facebook&utm_medium=cpc&fbclid=IwAR123';

    const res1 = normalizeFeedUrl(url1);
    const res2 = normalizeFeedUrl(url2);
    const res3 = normalizeFeedUrl(url3);
    const res4 = normalizeFeedUrl(url4);

    assert.strictEqual(res1.canonicalUrl, 'https://livolo.kiev.ua/products_feed.xml');
    assert.strictEqual(res1.canonicalUrl, res2.canonicalUrl);
    assert.strictEqual(res1.canonicalUrl, res3.canonicalUrl);
    assert.strictEqual(res1.canonicalUrl, res4.canonicalUrl);
    assert.strictEqual(res1.urlFingerprint, res4.urlFingerprint);
    assert.ok(res1.urlFingerprint.length === 64, 'SHA-256 fingerprint should be 64 hex chars');
  });

  it('preserves functional query parameters while sorting them deterministically', () => {
    const urlA = 'https://supplier.com/feed.xml?category_id=45&hash_tag=xyz&token=abc';
    const urlB = 'https://supplier.com/feed.xml?token=abc&hash_tag=xyz&category_id=45&utm_campaign=spring';

    const resA = normalizeFeedUrl(urlA);
    const resB = normalizeFeedUrl(urlB);

    assert.strictEqual(resA.canonicalUrl, 'https://supplier.com/feed.xml?category_id=45&hash_tag=xyz&token=abc');
    assert.strictEqual(resA.canonicalUrl, resB.canonicalUrl);
    assert.strictEqual(resA.urlFingerprint, resB.urlFingerprint);
  });

  it('computes content hashes deterministically including UTF-8 Cyrillic XML catalogs', () => {
    const xml = '<yml_catalog><shop><offers><offer id="1"><price>100</price></offer></offers></shop></yml_catalog>';
    const hash1 = computeFeedContentHash(xml);
    const hash2 = computeFeedContentHash(xml);

    assert.strictEqual(hash1, hash2);
    assert.strictEqual(hash1.length, 64);

    const cyrillicXml =
      '<?xml version="1.0" encoding="UTF-8"?><yml_catalog><shop><name>Магазин Електроніки Київ</name><offers><offer id="101"><name>Вимикач сенсорний Livolo білий</name><price>850</price></offer></offers></shop></yml_catalog>';
    const cyrillicHash1 = computeFeedContentHash(cyrillicXml);
    const cyrillicHash2 = computeFeedContentHash(cyrillicXml);

    assert.strictEqual(cyrillicHash1, cyrillicHash2);
    assert.strictEqual(cyrillicHash1.length, 64, 'Cyrillic XML must produce a 64-char SHA-256 hex digest');
    assert.notStrictEqual(cyrillicHash1, hash1);
  });

  it('disambiguates feed names with existing names and supplier prefix', () => {
    const existing = [
      'livolo.kiev.ua (products_feed.xml)',
      'livolo.kiev.ua (products_feed.xml) [Livolo Kyiv]',
    ];

    const unique = generateDisambiguatedFeedName(
      'livolo.kiev.ua (products_feed.xml)',
      existing,
      'Livolo Kyiv',
    );
    assert.strictEqual(unique, 'livolo.kiev.ua (products_feed.xml) #2');

    const freshName = generateDisambiguatedFeedName('unique_feed.xml', existing);
    assert.strictEqual(freshName, 'unique_feed.xml');
  });

  it('detects equivalent feed URLs across query param variations and base paths', () => {
    const rawClean = 'https://livolo.kiev.ua/products_feed.xml';
    const rawWithParams =
      'https://livolo.kiev.ua/products_feed.xml?hash_tag=313e3f0e4bd4878fa657c5c5d544b64d&sales_notes=&product_ids=&label_ids=&exclude_fields=&html_description=1';
    const rawDifferentFeed = 'https://livolo.kiev.ua/different_feed.xml';

    assert.strictEqual(areFeedUrlsEquivalent(rawClean, rawWithParams), true);
    assert.strictEqual(areFeedUrlsEquivalent(rawClean, rawDifferentFeed), false);
  });
});
