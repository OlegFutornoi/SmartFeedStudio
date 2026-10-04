# Test Suite Patterns — Патерни тестування паритету

## 1. Спільні сценарії тестування (Parameterized Tests)

Замість дублювання тестів для Browser Mock та Real Backend, пишеться єдиний сценарій:

```typescript
// products-parity.spec.ts
const environments = [
  { name: 'Browser Mock Mode', url: '/products?mock=true' },
  { name: 'Real Backend Mode', url: '/products' },
];

for (const env of environments) {
  test.describe(`[${env.name}] Products Ingestion & Deletion Parity`, () => {
    test('feed deletion cascades to products and atomic counters', async ({ page }) => {
      await page.goto(env.url);

      // 1. Перевірка реальної назви постачальника (не назви колонки!)
      const supplierCell = page.locator('[data-testid="cell-supplier"]').first();
      await expect(supplierCell).not.toHaveText('Постачальник');
      await expect(supplierCell).toHaveText(/Brain|MMM|Websklad/);

      // 2. Видалення фіда
      const initialCount = await getProductsCount(page);
      await deleteFeed(page, 'Test Feed');

      // 3. Перевірка каскадного зменшення кількості товарів
      const finalCount = await getProductsCount(page);
      expect(finalCount).toBeLessThan(initialCount);
    });
  });
}
```

## 2. Ключові перевірки паритету

- **Наявність зв'язаних сутностей**: Обидва режими повертають заповнені назви брендів/категорій.
- **Очищення після видалення**: Товари видаленого фіда зникають з таблиці в обох середовищах.
- **Стабільність лічильників**: Зміна вкладки чи оновлення сторінки не повертає старі значення лічильників.
