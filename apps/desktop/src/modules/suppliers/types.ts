import type { CurrencyCode } from '@smartfeed/shared';

export type SupplierTabType = 'feeds' | 'categories' | 'pricing' | 'currencies' | 'products';

export interface SupplierFiltersState {
  search: string;
  currency: 'ALL' | CurrencyCode;
  status: 'ALL' | 'ACTIVE' | 'INACTIVE';
}

export type SupplierSortField =
  'name' | 'productsCount' | 'activeFeedsCount' | 'createdAt' | 'defaultMarginPercent';

export interface SupplierSortState {
  field: SupplierSortField;
  direction: 'asc' | 'desc';
}

export interface SupplierKpiMetrics {
  totalSuppliers: number;
  activeFeeds: number;
  totalProducts: number;
  activePricingRules: number;
  suppliersLimit: number;
}

export type SupplierColumnId =
  | 'vendor'
  | 'contacts'
  | 'feeds'
  | 'products'
  | 'currencyMarkup'
  | 'isActiveToggle'
  | 'status'
  | 'actions';

export const SUPPLIER_COLUMNS = [
  {
    id: 'vendor' as SupplierColumnId,
    labelUk: 'Постачальник',
    labelEn: 'Supplier',
    canHide: false,
    defaultVisible: true,
  },
  {
    id: 'contacts' as SupplierColumnId,
    labelUk: 'Контакти',
    labelEn: 'Contacts',
    canHide: true,
    defaultVisible: true,
  },
  {
    id: 'feeds' as SupplierColumnId,
    labelUk: 'Джерела фідів',
    labelEn: 'Feed Sources',
    canHide: true,
    defaultVisible: true,
  },
  {
    id: 'products' as SupplierColumnId,
    labelUk: 'Товари',
    labelEn: 'Products',
    canHide: true,
    defaultVisible: true,
  },
  {
    id: 'currencyMarkup' as SupplierColumnId,
    labelUk: 'Валюта / Націнка',
    labelEn: 'Currency / Markup',
    canHide: true,
    defaultVisible: true,
  },
  {
    id: 'isActiveToggle' as SupplierColumnId,
    labelUk: 'Активність',
    labelEn: 'Activity',
    canHide: true,
    defaultVisible: true,
  },
  {
    id: 'status' as SupplierColumnId,
    labelUk: 'Статус',
    labelEn: 'Status',
    canHide: true,
    defaultVisible: true,
  },
  {
    id: 'actions' as SupplierColumnId,
    labelUk: 'Дії',
    labelEn: 'Actions',
    canHide: false,
    defaultVisible: true,
  },
];
