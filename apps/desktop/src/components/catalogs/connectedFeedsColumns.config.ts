import { ColumnConfig } from '@/hooks/useColumnVisibility';

export type FeedColumnId = 'feed' | 'source' | 'products' | 'lastSynced' | 'status' | 'actions';

export const FEED_COLUMNS: ColumnConfig<FeedColumnId>[] = [
  {
    id: 'feed',
    labelUk: 'Назва та формат',
    labelEn: 'Feed & Format',
    canHide: false,
    defaultVisible: true,
  },
  {
    id: 'source',
    labelUk: 'Джерело / URL',
    labelEn: 'Source / URL',
    canHide: true,
    defaultVisible: true,
  },
  { id: 'products', labelUk: 'Товарів', labelEn: 'Products', canHide: true, defaultVisible: true },
  {
    id: 'lastSynced',
    labelUk: 'Остання синхронізація',
    labelEn: 'Last Synced',
    canHide: true,
    defaultVisible: true,
  },
  { id: 'status', labelUk: 'Статус', labelEn: 'Status', canHide: true, defaultVisible: true },
  { id: 'actions', labelUk: 'Дії', labelEn: 'Actions', canHide: false, defaultVisible: true },
];
