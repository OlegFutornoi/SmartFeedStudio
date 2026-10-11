import { ColumnConfig } from '@/hooks/useColumnVisibility';

export type TxColumnId =
  'orderRef' | 'customer' | 'plan' | 'interval' | 'amount' | 'status' | 'gateway' | 'date';

export const TX_COLUMNS: ColumnConfig<TxColumnId>[] = [
  {
    id: 'orderRef',
    labelUk: 'Номер замовлення',
    labelEn: 'Order Ref',
    canHide: false,
    defaultVisible: true,
  },
  { id: 'customer', labelUk: 'Клієнт', labelEn: 'Customer', canHide: false, defaultVisible: true },
  { id: 'plan', labelUk: 'Тариф', labelEn: 'Plan', canHide: true, defaultVisible: true },
  { id: 'interval', labelUk: 'Період', labelEn: 'Interval', canHide: true, defaultVisible: true },
  { id: 'amount', labelUk: 'Сума', labelEn: 'Amount', canHide: false, defaultVisible: true },
  { id: 'status', labelUk: 'Статус', labelEn: 'Status', canHide: false, defaultVisible: true },
  {
    id: 'gateway',
    labelUk: 'Шлюз / Картка',
    labelEn: 'Gateway / Card',
    canHide: true,
    defaultVisible: true,
  },
  { id: 'date', labelUk: 'Дата', labelEn: 'Date', canHide: true, defaultVisible: true },
];
