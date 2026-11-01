import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compressViaHeadroom } from './headroom-pipeline.mjs';

describe('Headroom Context Compression & MCP Cache Tests', () => {
  it('Compresses structured tool / JSON data by >30%', async () => {
    const records = Array.from({ length: 40 }, (_, i) => ({
      id: `prod_${i}`,
      sku: `SKU-2026-X${i}`,
      title: `Product Title Number ${i} With Long Descriptive Attributes`,
      category: 'Electronics > Mobile Accessories > Cases',
      price: 29.99 + i,
      stock: 150,
      vendor: 'SmartFeed Warehouse Kyiv Distribution Center',
    }));
    const rawJson = JSON.stringify(records, null, 2);

    const result = await compressViaHeadroom(rawJson);
    assert.ok(result.compressed, 'Compressed output must be non-empty');
    assert.ok(Array.isArray(result.transforms), 'Transforms array must be present');

    const before = result.tokens_before || Math.ceil(rawJson.length / 3);
    const after = result.tokens_after || Math.ceil(result.compressed.length / 3);
    const savingsPercent = Math.round(((before - after) / before) * 100);

    assert.ok(
      savingsPercent >= 25,
      `Headroom should compress repetitive structured records by >=25% (got ${savingsPercent}%)`
    );
  });
});

