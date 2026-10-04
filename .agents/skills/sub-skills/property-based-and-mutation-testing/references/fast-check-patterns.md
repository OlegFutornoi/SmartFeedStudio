# Fast-Check Patterns — Property-Based тестування фідів та даних

## 1. Концепція Arbitraries у fast-check

Property-based тест не перевіряє конкретний приклад `assert(parse("10.50") === 10.5)`. Він генерує 100+ випадкових комбінацій вхідних даних і перевіряє загальні математичні та бізнес-властивості (інваріанти).

## 2. Генератор валідних та граничних цін

```typescript
import fc from 'fast-check';

// Генератор цін: від'ємні, дробові з багатьма знаками, NaN, екстремальні величини
const priceArbitrary = fc.oneof(
  fc.float({ min: 0.01, max: 10_000_000, noNaN: true }),
  fc.constant('0'),
  fc.constant('0.00'),
  fc.stringMatching(/^[0-9]+(\.[0-9]{1,4})?$/),
);

test('Price normalizer always returns a finite positive number or throws DomainException', () => {
  fc.assert(
    fc.property(priceArbitrary, (rawPrice) => {
      try {
        const normalized = normalizePrice(rawPrice);
        return typeof normalized === 'number' && Number.isFinite(normalized) && normalized >= 0;
      } catch (err) {
        return err instanceof InvalidPriceException;
      }
    }),
    { numRuns: 200 },
  );
});
```

## 3. Фаззінг рядків у XML/CSV (спецсимволи та ін'єкції)

```typescript
// Генератор назв товарів із спецсимволами XML (& < > " ') та Unicode емодзі
const productTitleArbitrary = fc.string({ minLength: 1, maxLength: 500 });

test('XML serializer/parser roundtrip preserves title integrity', () => {
  fc.assert(
    fc.property(productTitleArbitrary, (title) => {
      const xml = serializeToXml({ id: '1', title });
      const parsed = parseXml(xml);
      return parsed.products[0].title === title;
    }),
    { numRuns: 100 },
  );
});
```
