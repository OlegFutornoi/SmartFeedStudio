import type { ColumnConfig } from '@/hooks/useColumnVisibility';
import type { ProductColumnId } from '@/components/products/ProductTableRow';

export const PRODUCT_COLUMNS: ColumnConfig<ProductColumnId>[] = [
  { id: 'select', labelUk: 'Вибір', labelEn: 'Select', canHide: false, defaultVisible: true },
  { id: 'image', labelUk: 'Зображення', labelEn: 'Image', canHide: true, defaultVisible: true },
  { id: 'sku', labelUk: 'Артикул / SKU', labelEn: 'SKU', canHide: false, defaultVisible: true },
  {
    id: 'title',
    labelUk: 'Назва товару',
    labelEn: 'Product Title',
    canHide: false,
    defaultVisible: true,
  },
  {
    id: 'supplier',
    labelUk: 'Постачальник',
    labelEn: 'Supplier',
    canHide: true,
    defaultVisible: true,
  },
  {
    id: 'price',
    labelUk: 'Роздрібна ціна',
    labelEn: 'Retail Price',
    canHide: true,
    defaultVisible: true,
  },
  { id: 'margin', labelUk: 'Маржа', labelEn: 'Margin', canHide: true, defaultVisible: false },
  { id: 'stock', labelUk: 'Залишок', labelEn: 'Stock', canHide: true, defaultVisible: false },
  { id: 'actions', labelUk: 'Дії', labelEn: 'Actions', canHide: false, defaultVisible: true },
];
