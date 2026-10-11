import { ColumnConfig } from '@/hooks/useColumnVisibility';

export type LicenseColumnId =
  | 'key'
  | 'user'
  | 'tier'
  | 'status'
  | 'xmlLimit'
  | 'aiCredits'
  | 'cloudBackup'
  | 'expiresAt'
  | 'actions';

export const LICENSE_COLUMNS: ColumnConfig<LicenseColumnId>[] = [
  { id: 'key', labelUk: 'Ліцензійний ключ', labelEn: 'License Key', canHide: false },
  { id: 'user', labelUk: 'Користувач', labelEn: 'User', canHide: false },
  {
    id: 'tier',
    labelUk: 'Тарифний план',
    labelEn: 'Plan Tier',
    canHide: true,
    defaultVisible: true,
  },
  { id: 'status', labelUk: 'Статус', labelEn: 'Status', canHide: true, defaultVisible: true },
  {
    id: 'xmlLimit',
    labelUk: 'Ліміт XML',
    labelEn: 'XML Limit',
    canHide: true,
    defaultVisible: false,
  },
  {
    id: 'aiCredits',
    labelUk: 'AI Кредити',
    labelEn: 'AI Credits',
    canHide: true,
    defaultVisible: false,
  },
  {
    id: 'cloudBackup',
    labelUk: 'Хмарний бекап',
    labelEn: 'Cloud Backup',
    canHide: true,
    defaultVisible: false,
  },
  {
    id: 'expiresAt',
    labelUk: 'Термін дії',
    labelEn: 'Expires At',
    canHide: true,
    defaultVisible: true,
  },
  { id: 'actions', labelUk: 'Дії', labelEn: 'Actions', canHide: false },
];
