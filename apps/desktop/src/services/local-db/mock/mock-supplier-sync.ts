import {
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
} from '@smartfeed/shared';
import type { MockDbState } from '@/services/local-db/mock/mock-state';

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

export function clearSupplierSyncLogs(state: MockDbState, supplierId: string): boolean {
  state.syncLogs.set(supplierId, []);
  return true;
}
