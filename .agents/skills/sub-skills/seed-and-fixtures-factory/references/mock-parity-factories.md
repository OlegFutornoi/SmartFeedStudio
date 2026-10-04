# 🔄 Mock Parity Factories — Єдині фабрики для Mock та Real середовищ

## 1. Проблема розриву даних між середовищами

Якщо в реальному API сутність `Feed` містить:

```typescript
{
  id: 'feed_123',
  supplierId: 'sup_456',
  supplierName: 'Brain Distribution', // Гідратовано з зв'язаної таблиці
  activeFeedsCount: 3,
  productsCount: 1540
}
```

А в `mockDatabaseDriver` (або local SQLite) це повертається без поля `supplierName` (або з кодом 'Постачальник'), то:

1. Тести UI почнуть пропускати витік назв колонок замість реальних даних.
2. Користувач у браузерному dev-режимі бачитиме битий інтерфейс.

---

## 2. Канонічні фабрики спільного контракту

```typescript
// packages/shared/src/testing/factories.ts
import { SupplierDto, FeedDto, ProductDto } from '@smartfeed/shared';

let mockId = 1;

export function buildMockSupplier(overrides: Partial<SupplierDto> = {}): SupplierDto {
  const id = `sup_${mockId++}`;
  return {
    id,
    name: overrides.name || `Постачальник Brain Distribution #${id}`,
    code: `BRAIN_${id}`,
    isActive: true,
    feedsCount: 1,
    productsCount: 250,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildMockFeed(supplier: SupplierDto, overrides: Partial<FeedDto> = {}): FeedDto {
  const id = `feed_${mockId++}`;
  return {
    id,
    supplierId: supplier.id,
    supplierName: supplier.name, // 100% паритет: поле обов'язково гідратоване!
    name: overrides.name || `Каталог електроніки (${supplier.name})`,
    format: 'XML',
    url: `https://mock-supplier.test/feeds/${id}.xml`,
    status: 'ACTIVE',
    productsCount: 250,
    lastSyncedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildMockProduct(feed: FeedDto, overrides: Partial<ProductDto> = {}): ProductDto {
  const id = `prod_${mockId++}`;
  return {
    id,
    feedId: feed.id,
    supplierId: feed.supplierId,
    supplierName: feed.supplierName,
    sku: `SKU-${id}`,
    name: `Ноутбук Asus ZenBook 14 #${id}`,
    price: 34999.0,
    currency: 'UAH',
    inStock: true,
    categoryName: 'Ноутбуки',
    images: [`https://example.com/products/${id}.webp`],
    ...overrides,
  };
}
```

---

## 3. Використання в клієнтських тестах Playwright

```typescript
test('Таблиця відображає реальну назву постачальника (без витоку назв колонок)', async ({
  page,
}) => {
  const supplier = buildMockSupplier({ name: 'Asbis Distribution' });
  const feed = buildMockFeed(supplier);

  await page.route('**/api/feeds', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([feed]),
    });
  });

  await page.goto('/feeds');

  // Інваріант: реальна назва постачальника присутня
  await expect(page.locator(`text=${supplier.name}`)).toBeVisible();

  // Інваріант: технічна заглушка відсутня
  const cellText = await page.locator('[data-testid="supplier-cell"]').first().innerText();
  expect(cellText.trim()).not.toBe('Постачальник');
});
```
