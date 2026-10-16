import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetSupplierSyncSettingsQuery } from '@/modules/suppliers/queries/suppliers.queries';
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
} from '@smartfeed/shared';

@QueryHandler(GetSupplierSyncSettingsQuery)
export class GetSupplierSyncSettingsHandler implements IQueryHandler<GetSupplierSyncSettingsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetSupplierSyncSettingsQuery) {
    const { supplierId, userId } = query;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
      include: { syncSettings: true },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }

    if (supplier.syncSettings) {
      return supplier.syncSettings;
    }

    // Auto-create default settings atomically if none exist
    return this.prisma.supplierSyncSetting.upsert({
      where: { supplierId },
      update: {},
      create: {
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
        lastSyncStatus: SyncStatus.IDLE,
      },
    });
  }
}
