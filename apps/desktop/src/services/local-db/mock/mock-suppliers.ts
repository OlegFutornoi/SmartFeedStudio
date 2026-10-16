import {
  SupplierDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierPricingRuleDto,
  CreateSupplierPricingRuleDto,
  UpdateSupplierPricingRuleDto,
  SupplierSyncSettingDto,
  UpdateSupplierSyncSettingDto,
  SupplierSyncLogDto,
  ImageSyncMode,
  DescriptionSyncMode,
  AttributesSyncMode,
  TitleSyncMode,
  CategorySyncMode,
  BarcodeSyncMode,
  SyncPriceSource,
  SyncZeroPriceAction,
  SyncMissingProductsAction,
  SyncNewProductsAction,
  SyncStatus,
  CurrencyCode,
  ExchangeRateMode,
  PriceRoundingMode,
} from '@smartfeed/shared';
import type { MockDbState } from '@/services/local-db/mock/mock-state';
import { syncCounters } from '@/services/local-db/mock/mock-state';
import { ensureSupplierCategories } from '@/services/local-db/mock/mock-supplier-categories';

export function getSuppliers(state: MockDbState, search?: string): SupplierDto[] {
  let result = state.suppliers.map((s) => {
    const productsCount = state.products.filter((p) => p.supplierId === s.id).length;
    const activeFeedsCount = (state.feedSources.get(s.id) || []).length;
    const cats = ensureSupplierCategories(state, s.id);
    const categoriesCount = cats.length;
    const activeCategoriesCount = cats.filter((c) => c.isActive).length;

    return {
      ...s,
      productsCount,
      activeFeedsCount,
      categoriesCount,
      activeCategoriesCount,
    };
  });

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q),
    );
  }
  return result;
}

export function getSupplierById(state: MockDbState, id: string): SupplierDto | null {
  const s = state.suppliers.find((sup) => sup.id === id);
  if (!s) return null;
  const productsCount = state.products.filter((p) => p.supplierId === s.id).length;
  const activeFeedsCount = (state.feedSources.get(s.id) || []).length;
  const cats = ensureSupplierCategories(state, s.id);
  const categoriesCount = cats.length;
  const activeCategoriesCount = cats.filter((c) => c.isActive).length;

  return {
    ...s,
    productsCount,
    activeFeedsCount,
    categoriesCount,
    activeCategoriesCount,
  };
}

export function createSupplier(state: MockDbState, payload: CreateSupplierDto): SupplierDto {
  const newSupplier: SupplierDto = {
    id: `sup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: 'usr_admin',
    name: payload.name,
    code: payload.code,
    contactPhone: payload.contactPhone,
    contactEmail: payload.contactEmail,
    website: payload.website,
    notes: payload.notes,
    logoUrl: payload.logoUrl,
    legalName: payload.legalName || undefined,
    taxId: payload.taxId || undefined,
    industry: payload.industry || undefined,
    segment: payload.segment || undefined,
    managerName: payload.managerName || undefined,
    managerPosition: payload.managerPosition || undefined,
    managerPhone: payload.managerPhone || undefined,
    managerEmail: payload.managerEmail || undefined,
    managerTelegram: payload.managerTelegram || undefined,
    country: payload.country || undefined,
    city: payload.city || undefined,
    address: payload.address || undefined,
    postcode: payload.postcode || undefined,
    baseCurrency: payload.baseCurrency || CurrencyCode.UAH,
    targetCurrency: payload.targetCurrency || CurrencyCode.UAH,
    exchangeRateMode: payload.exchangeRateMode || ExchangeRateMode.MANUAL,
    exchangeRate: Number(payload.exchangeRate || 1.0),
    currencyBufferPercent: Number(payload.currencyBufferPercent || 0),
    priceRounding: payload.priceRounding || PriceRoundingMode.NONE,
    defaultMarginPercent: Number(payload.defaultMarginPercent || 0),
    defaultFixedMarkup: Number(payload.defaultFixedMarkup || 0),
    isActive: payload.isActive ?? true,
    activeFeedsCount: 0,
    productsCount: 0,
    categoriesCount: 0,
    activeCategoriesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  state.suppliers.unshift(newSupplier);
  ensureSupplierCategories(state, newSupplier.id);
  syncCounters(state);
  return newSupplier;
}

export function updateSupplier(
  state: MockDbState,
  id: string,
  payload: UpdateSupplierDto,
): SupplierDto {
  const index = state.suppliers.findIndex((s) => s.id === id);
  if (index === -1) {
    throw new Error(`Supplier with id ${id} not found`);
  }

  const current = state.suppliers[index];
  const updated: SupplierDto = {
    ...current,
    ...payload,
    baseCurrency: payload.baseCurrency ?? current.baseCurrency,
    targetCurrency: payload.targetCurrency ?? current.targetCurrency,
    exchangeRateMode: payload.exchangeRateMode ?? current.exchangeRateMode,
    exchangeRate:
      payload.exchangeRate !== undefined ? Number(payload.exchangeRate) : current.exchangeRate,
    currencyBufferPercent:
      payload.currencyBufferPercent !== undefined
        ? Number(payload.currencyBufferPercent)
        : current.currencyBufferPercent,
    priceRounding: payload.priceRounding ?? current.priceRounding,
    defaultMarginPercent:
      payload.defaultMarginPercent !== undefined
        ? Number(payload.defaultMarginPercent)
        : current.defaultMarginPercent,
    defaultFixedMarkup:
      payload.defaultFixedMarkup !== undefined
        ? Number(payload.defaultFixedMarkup)
        : current.defaultFixedMarkup,
    updatedAt: new Date().toISOString(),
  };
  state.suppliers[index] = updated;
  return updated;
}

export function deleteSupplier(state: MockDbState, id: string): boolean {
  const initialLen = state.suppliers.length;
  state.suppliers = state.suppliers.filter((s) => s.id !== id);
  state.pricingRules.delete(id);
  state.supplierCategories.delete(id);
  state.feedSources.delete(id);
  state.products = state.products.filter((p) => p.supplierId !== id);

  syncCounters(state);
  return state.suppliers.length < initialLen;
}

// ---------------------------------------------------------------------------
// Supplier Categories Management (Re-exported from mock-supplier-categories)
// ---------------------------------------------------------------------------

export {
  ensureSupplierCategories,
  getSupplierCategories,
  toggleSupplierCategory,
  batchToggleSupplierCategories,
  updateSupplierCategoryRule,
} from '@/services/local-db/mock/mock-supplier-categories';

// ---------------------------------------------------------------------------
// Pricing Rules Management
// ---------------------------------------------------------------------------

export function getPricingRules(state: MockDbState, supplierId: string): SupplierPricingRuleDto[] {
  return state.pricingRules.get(supplierId) || [];
}

export function createPricingRule(
  state: MockDbState,
  supplierId: string,
  payload: CreateSupplierPricingRuleDto,
): SupplierPricingRuleDto {
  const list = state.pricingRules.get(supplierId) || [];
  const newRule: SupplierPricingRuleDto = {
    id: `prule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    supplierId,
    categoryId: payload.categoryId || null,
    minPrice: payload.minPrice !== undefined ? Number(payload.minPrice) : null,
    maxPrice: payload.maxPrice !== undefined ? Number(payload.maxPrice) : null,
    marginPercent: Number(payload.marginPercent || 0),
    fixedMarkup: Number(payload.fixedMarkup || 0),
    priority: payload.priority || 0,
    isActive: payload.isActive ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  list.unshift(newRule);
  state.pricingRules.set(supplierId, list);
  return newRule;
}

export function updatePricingRule(
  state: MockDbState,
  supplierId: string,
  ruleId: string,
  payload: UpdateSupplierPricingRuleDto,
): SupplierPricingRuleDto {
  const list = state.pricingRules.get(supplierId) || [];
  const index = list.findIndex((r) => r.id === ruleId);
  if (index === -1) {
    throw new Error('Правило націнки не знайдено');
  }

  const updated: SupplierPricingRuleDto = {
    ...list[index],
    ...payload,
    minPrice: payload.minPrice !== undefined ? Number(payload.minPrice) : list[index].minPrice,
    maxPrice: payload.maxPrice !== undefined ? Number(payload.maxPrice) : list[index].maxPrice,
    marginPercent:
      payload.marginPercent !== undefined
        ? Number(payload.marginPercent)
        : list[index].marginPercent,
    fixedMarkup:
      payload.fixedMarkup !== undefined ? Number(payload.fixedMarkup) : list[index].fixedMarkup,
    updatedAt: new Date().toISOString(),
  };
  list[index] = updated;
  state.pricingRules.set(supplierId, list);
  return updated;
}

export function deletePricingRule(state: MockDbState, supplierId: string, ruleId: string): boolean {
  const list = state.pricingRules.get(supplierId) || [];
  const filtered = list.filter((r) => r.id !== ruleId);
  state.pricingRules.set(supplierId, filtered);
  return filtered.length < list.length;
}

export function getSupplierSyncSettings(
  state: MockDbState,
  supplierId: string,
): SupplierSyncSettingDto {
  let settings = state.syncSettings.get(supplierId);
  if (!settings) {
    settings = {
      id: `sync_set_${supplierId}`,
      supplierId,
      protectEditedProducts: true,
      syncPrices: true,
      syncStocks: true,
      imageSyncMode: ImageSyncMode.DO_NOT_UPDATE,
      descriptionSyncMode: DescriptionSyncMode.DO_NOT_UPDATE,
      attributesSyncMode: AttributesSyncMode.ADD_NEW_ONLY,
      titleSyncMode: TitleSyncMode.DO_NOT_UPDATE,
      categorySyncMode: CategorySyncMode.KEEP_MANUAL_MAPPING,
      barcodeSyncMode: BarcodeSyncMode.FILL_EMPTY_ONLY,
      priceSource: SyncPriceSource.WHOLESALE,
      zeroPriceAction: SyncZeroPriceAction.OUT_OF_STOCK,
      missingProductsAction: SyncMissingProductsAction.OUT_OF_STOCK,
      newProductsAction: SyncNewProductsAction.AUTO_PUBLISH,
      syncIntervalHours: 0,
      lastSyncedAt: null,
      lastSyncStatus: SyncStatus.IDLE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.syncSettings.set(supplierId, settings);
  }
  return settings;
}

export function updateSupplierSyncSettings(
  state: MockDbState,
  supplierId: string,
  payload: UpdateSupplierSyncSettingDto,
): SupplierSyncSettingDto {
  const current = getSupplierSyncSettings(state, supplierId);
  const updated: SupplierSyncSettingDto = {
    ...current,
    ...payload,
    updatedAt: new Date().toISOString(),
  };
  state.syncSettings.set(supplierId, updated);
  return updated;
}

export function getSupplierSyncLogs(state: MockDbState, supplierId: string): SupplierSyncLogDto[] {
  return state.syncLogs.get(supplierId) || [];
}

export function addSupplierSyncLog(
  state: MockDbState,
  log: SupplierSyncLogDto,
): SupplierSyncLogDto {
  const list = state.syncLogs.get(log.supplierId) || [];
  list.unshift(log);
  state.syncLogs.set(log.supplierId, list);
  return log;
}
