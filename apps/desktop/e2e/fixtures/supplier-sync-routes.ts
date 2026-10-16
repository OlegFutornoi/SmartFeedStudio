import type { Page } from '@playwright/test';
import type { SupplierSyncLogDto, SupplierSyncSettingDto } from '@smartfeed/shared';
import {
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
  SyncTrigger,
} from '@smartfeed/shared';

/** Stateful mock of the supplier sync-settings / sync-logs / manual sync endpoints. */
export async function setupSupplierSyncRoutes(page: Page) {
  let currentSyncSettings: SupplierSyncSettingDto = {
    id: 'sync_set_sup_test_1',
    supplierId: 'sup_test_1',
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
    lastSyncedAt: new Date().toISOString(),
    lastSyncStatus: SyncStatus.SUCCESS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const currentSyncLogs: SupplierSyncLogDto[] = [
    {
      id: 'log_1',
      supplierId: 'sup_test_1',
      feedSourceId: 'feed_1',
      trigger: SyncTrigger.MANUAL,
      status: SyncStatus.SUCCESS,
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 3598000).toISOString(),
      durationMs: 2000,
      totalProducts: 250,
      createdCount: 0,
      updatedCount: 215,
      outOfStockCount: 12,
      errorsCount: 0,
      errorMessage: null,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  await page.route(/\/api\/suppliers\/([^/?#]+)\/sync-settings/, async (route) => {
    if (route.request().method() === 'PATCH') {
      const patch = route.request().postDataJSON() || {};
      currentSyncSettings = { ...currentSyncSettings, ...patch };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(currentSyncSettings),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(currentSyncSettings),
    });
  });

  await page.route(/\/api\/suppliers\/([^/?#]+)\/sync-logs/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(currentSyncLogs),
    });
  });

  await page.route(/\/api\/suppliers\/([^/?#]+)\/sync(\?.*)?$/, async (route) => {
    const newLog: SupplierSyncLogDto = {
      id: `log_${Date.now()}`,
      supplierId: 'sup_test_1',
      feedSourceId: null,
      trigger: SyncTrigger.MANUAL,
      status: SyncStatus.SUCCESS,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: 1500,
      totalProducts: 250,
      createdCount: 0,
      updatedCount: 220,
      outOfStockCount: 10,
      errorsCount: 0,
      errorMessage: null,
      createdAt: new Date().toISOString(),
    };
    currentSyncLogs.unshift(newLog);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        logId: newLog.id,
        supplierId: 'sup_test_1',
        totalProducts: 250,
        createdCount: 0,
        updatedCount: 220,
        outOfStockCount: 10,
        errorsCount: 0,
        durationMs: 1500,
        message: 'Синхронізацію успішно завершено',
      }),
    });
  });
}
