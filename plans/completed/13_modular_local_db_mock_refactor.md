# 🏗️ План: Декомпозиція та Рефакторинг Local Mock DB Driver (Zero God-Files)

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 12.09.2026  
> **Мета:** Ліквідація монолітного God-файлу `mock-driver.ts` (1021 рядок) та розбиття на доменні підмодулі (< 200 рядків кожен) згідно з правилом ❌ 6 (`Zero God-Files`, ліміт 250–300 рядків).

---

## 🏛️ 1. Архітектурне проектування (Domain Decomposition & Facade)

Створено модульну структуру в `apps/desktop/src/services/local-db/mock/`:

```text
apps/desktop/src/services/local-db/
├── mock/
│   ├── mock-state.ts          # 51 рядок: Інтерфейс MockDbState та фабрика initialState, syncCounters
│   ├── mock-seed.ts           # 185 рядків: Генератор демо-даних (постачальники, фіди, товари, канали)
│   ├── mock-suppliers.ts      # 162 рядки: CRUD постачальників та їхніх націнок
│   ├── mock-channels.ts       # 172 рядки: CRUD каналів експорту та розрахунок/симуляція цін
│   ├── mock-products.ts       # 149 рядків: Пошук, фільтрація, категорії, bulkDelete, bulkUpsert
│   ├── mock-feeds.ts          # 114 рядків: Джерела фідів (створення, видалення, лічильники)
│   ├── mock-images.ts         # 123 рядки: Фото товарів (отримання, видалення, reorder, download)
│   ├── mock-storage.ts        # 84 рядки: Збереження в localStorage та проксі-обгортка methodsToHook
│   └── index.ts               # 8 рядків: Фасадний експорт підмодулів
└── mock-driver.ts             # 276 рядків: Тонкий фасад-координатор (MockDatabaseDriver) для 100% зворотної сумісності
```

---

## 🛡️ 2. Контракти та Безпека

- **0 `any`**: Сувора типізація через `@smartfeed/shared`.
- **100% сумісність**: `mockDatabaseDriver` та `window.__MOCK_LOCAL_DB__` зберігають свій публічний API для `client.ts` та E2E тестів без жодних змін контрактів.
- **Стабільність**: Повна підтримка персистентності в `localStorage` та авто-збереження через хуки.

---

## 🔄 3. Етапи виконання

- [x] **Крок 1**: Створення `mock-state.ts` та `mock-seed.ts`.
- [x] **Крок 2**: Створення доменних модулів `mock-suppliers.ts`, `mock-channels.ts`, `mock-products.ts`, `mock-feeds.ts`, `mock-images.ts`.
- [x] **Крок 3**: Створення `mock-storage.ts` для збереження в `localStorage` та персистентних хуків.
- [x] **Крок 4**: Рефакторинг `mock-driver.ts` у лаконічний фасад (зменшено з 1021 до 276 рядків).
- [x] **Крок 5**: Перевірка статичної типізації (`tsc --noEmit` — 0 помилок).
- [x] **Крок 6**: Запуск E2E тестів (`product-images-management.spec.ts`, `products-grid.spec.ts`, `pages-resilience.spec.ts` — 13/13 пройдено).
- [x] **Крок 7**: Перенесення плану в `plans/completed/` та синхронізація `plans/README.md`.
