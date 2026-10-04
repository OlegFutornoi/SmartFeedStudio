# Parity Contract — Контракт відповідності локального та реального середовищ

## 1. Архітектурні вимоги до адаптерів

Усі клієнтські сервіси даних реалізують спільний інтерфейс (з `@smartfeed/shared` або доменного модуля):

- `ProductsService`: `findProducts(filter): Promise<PaginatedProducts>`
- `FeedsService`: `getFeeds(): Promise<Feed[]>`
- `SuppliersService`: `getSuppliers(): Promise<Supplier[]>`

## 2. Інваріанти даних

1. **Ідентичність DTO**: Тип відповіді, що повертається `MockDatabaseDriver` або Tauri IPC, 100% збігається з JSON відповіддю NestJS API.
2. **Типізація чисел та дат**:
   - Ціни — `number` (float/int), ніколи не `string` в одному місці і `number` в іншому.
   - Дати — ISO-8601 рядки.
3. **Лічильники**:
   - `totalProducts`, `activeFeedsCount`, `categoriesCount` повинні вираховуватись за однаковими правилами (враховуючи фільтри та soft-deletes).

## 3. Обробка помилок

- Якщо бекенд повертає 404/409, локальний драйвер зобов'язаний кидати виняток аналогічної структури: `{ code: 'ENTITY_NOT_FOUND', message: '...' }`, щоб UI обробляв їх через єдиний `getErrorMessage`.
