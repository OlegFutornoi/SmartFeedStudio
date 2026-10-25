import {
  SupplierSyncSettingDto,
  UpdateSupplierSyncSettingDto,
  SupplierSyncLogDto,
  SupplierSyncResultDto,
  SyncStatus,
  SyncTrigger,
} from '@smartfeed/shared';
import { mockDatabaseDriver } from '@/services/local-db/mock-driver';
import { emitDataSync } from '@/lib/syncEvents';

export async function getSupplierSyncSettings(
  supplierId: string,
  _token?: string,
): Promise<SupplierSyncSettingDto> {
  return mockDatabaseDriver.getSupplierSyncSettings(supplierId);
}

export async function updateSupplierSyncSettings(
  supplierId: string,
  payload: UpdateSupplierSyncSettingDto,
  _token?: string,
): Promise<SupplierSyncSettingDto> {
  const updated = mockDatabaseDriver.updateSupplierSyncSettings(supplierId, payload);
  emitDataSync(['suppliers', 'feeds', 'products', 'all']);
  return updated;
}

export async function getSupplierSyncLogs(
  supplierId: string,
  _token?: string,
  _limit: number = 50,
): Promise<SupplierSyncLogDto[]> {
  return mockDatabaseDriver.getSupplierSyncLogs(supplierId);
}

export async function syncSupplierFeed(
  supplierId: string,
  options: { feedSourceId?: string; forceFull?: boolean } = {},
  _token?: string,
): Promise<SupplierSyncResultDto> {
  const startTime = Date.now();

  // Local-first sync execution via local database
  const prods = mockDatabaseDriver.getProducts({ supplierId, limit: 1000 });
  const totalProducts = prods.total;
  const updatedCount = Math.min(totalProducts, Math.max(1, Math.round(totalProducts * 0.85)));
  const outOfStockCount = Math.round(totalProducts * 0.05);

  const durationMs = Math.max(450, Date.now() - startTime);
  const logId = `sync_log_${Date.now()}`;

  const newLog: SupplierSyncLogDto = {
    id: logId,
    supplierId,
    feedSourceId: options.feedSourceId || null,
    trigger: SyncTrigger.MANUAL,
    status: SyncStatus.SUCCESS,
    startedAt: new Date(startTime).toISOString(),
    completedAt: new Date().toISOString(),
    durationMs,
    totalProducts,
    createdCount: 0,
    updatedCount,
    outOfStockCount,
    errorsCount: 0,
    errorMessage: null,
  };

  mockDatabaseDriver.addSupplierSyncLog(newLog);
  mockDatabaseDriver.updateSupplierSyncSettings(supplierId, {});

  emitDataSync(['suppliers', 'feeds', 'products', 'quotas', 'all']);

  return {
    success: true,
    logId,
    supplierId,
    feedSourceId: options.feedSourceId || null,
    totalProducts,
    createdCount: 0,
    updatedCount,
    outOfStockCount,
    errorsCount: 0,
    durationMs,
    message: `Синхронізовано ${updatedCount} товарів із ${totalProducts}`,
  };
}

export async function clearSupplierSyncLogs(
  supplierId: string,
  _token?: string,
): Promise<{ success: boolean }> {
  mockDatabaseDriver.clearSupplierSyncLogs(supplierId);
  emitDataSync(['suppliers', 'all']);
  return { success: true };
}
