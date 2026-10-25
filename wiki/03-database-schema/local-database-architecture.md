# 🏛️ Архітектура Локальної Бази Даних SmartFeed Studio (Local-First SQLite)

Див. повну технічну документацію та ERD діаграму зв'язків у файлі:
👉 [docs/LOCAL_DATABASE_ARCHITECTURE.md](file:///Users/oleg/AQA/SmartFeedStudio/docs/LOCAL_DATABASE_ARCHITECTURE.md)

## Короткий зміст локальних таблиць:

1. `local_suppliers`: Постачальники, їхні контакти, обрана валюта прайсу, обраний банк, динамічний курс обміну, буфер ризику та правила округлення.
2. `local_feed_sources`: Джерела імпорту фідів (XML/YML/CSV), геші контенту, інтервали оновлення.
3. `local_supplier_categories`: Категорії товарів з прайс-листа постачальника.
4. `local_marketplace_categories`: Каталог категорій маркетплейсів (Rozetka, Prom).
5. `local_supplier_category_marketplace_maps`: Зв'язки категорій постачальника з категоріями маркетплейсів.
6. `local_supplier_pricing_rules`: Каскадні правила націнок (діапазони цін, маржа %, фіксована націнка).
7. `local_supplier_sync_settings`: Політики захисту ручних змін при фоновій синхронізації.
8. `local_supplier_sync_logs`: Журнал та історія запусків оновлення фіду.
9. `local_products`: Каталог товарів (до 100k+ SKU) зі швидкими складеними індексами.
10. `local_product_images`: Локальний дисковий кеш та статус завантаження зображень.
11. `local_counters`: Швидкі лічильники для віджетів інтерфейсу.
12. `local_bank_rates`: Офіційні та комерційні курси банків (НБУ, Приват, Моно, Райффайзен, ПУМБ), які завантажуються при старті програми.
