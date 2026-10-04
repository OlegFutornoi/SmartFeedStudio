---
name: performance-budget
version: 1.0.0
description: 'Use for enforcing performance budgets: JS bundle size limits (<150KB gzip), single-request network deduplication, React render budgets, and feed ingestion throughput benchmarks.'
metadata:
  requires:
    packages: ['@playwright/test', 'vitest', 'benchmark']
---

# performance-budget

Інженерний стандарт бюджетів продуктивності (Performance Budgets & Benchmarks) у SmartFeed Studio: ліміти розміру клієнтських бандлів, нуль дублюючих HTTP-запитів, бюджет рендерингу React та бенчмарки пропускної здатності імпорту фідів.

## Залізні принципи бюджету продуктивності

1. **Бюджет бандла (<150 КБ gzip на чанк)**: Заборонено імпортувати важкі не-деревовидні бібліотеки (`lodash` повністю, `moment.js`). Використовувати `date-fns` або нативний `Intl`. Усі важкі модальні вікна (імпортери, графіки) завантажуються виключно динамічно через `next/dynamic` або `React.lazy()`.
2. **Нуль дублюючих запитів на завантаження (Network Budget)**: При первинному рендері сторінки будь-який ендпоінт API (`/api/plans`, `/api/feeds`, `/api/licenses`) **зобов'язаний викликатися рівно 1 раз** (`requestCount === 1`). Усі виклики дедуплікуються через `useRef` у контекстах.
3. **Бюджет рендерингу (Zero Cascade Rerenders)**: Зміна локалі (`i18n`) чи теми (`Dark/Light`) не повинна викликати повторні мережеві запити. Мемоізація `useCallback`/`useMemo` повинна містити тільки необхідні залежності.
4. **Бенчмарк пропускної здатності імпорту (Ingestion Throughput)**:
   - SAX-парсинг XML у пам'яті: **≥ 2,000 SKU/сек**.
   - Пакетний запис у базу даних (PostgreSQL / SQLite): **≥ 500 SKU/сек**.
   - Споживання оперативної пам'яті процесом Node.js: **≤ 512 МБ** навіть на файлах у 1 ГБ.

## Матриця виклику інструкцій (Triggers → References)

| Тригер / Потреба                                  | Цільовий reference-файл                                                                        | Ключовий фокус                                                                         |
| :------------------------------------------------ | :--------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| Контроль розміру JS бандла, динамічні імпорти     | [`references/bundle-size-and-code-splitting.md`](references/bundle-size-and-code-splitting.md) | Next.js Bundle Analyzer, ліміти 150KB gzip, code splitting через `React.lazy`          |
| Перевірка мережевих дублів і бюджету рендерингу   | [`references/network-and-render-budgets.md`](references/network-and-render-budgets.md)         | Playwright тест `requestCount === 1`, дедуплікація `useRef`, усунення ререндерів       |
| Бенчмарки швидкодії парсингу фідів та запису в БД | [`references/feed-ingestion-benchmarks.md`](references/feed-ingestion-benchmarks.md)           | Vitest/Benchmark тести, вимірювання SKU/sec, контроль витоків RAM під час навантаження |

## Категорично заборонено

- Допускати дублюючі HTTP-запити до того самого ендпоінту під час монтування сторінки.
- Імпортувати важкі монолітні бібліотеки в клієнтські компоненти без динамічного імпорту.
- Писати алгоритми імпорту, що споживають більше 512 МБ RAM на великих каталогах.
- Включати UI-стан (`isUk`, `theme`) у dependency arrays хуків вибірки даних API.
