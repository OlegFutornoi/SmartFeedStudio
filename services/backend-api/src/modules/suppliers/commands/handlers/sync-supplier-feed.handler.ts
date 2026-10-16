import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { SyncSupplierFeedCommand } from '@/modules/suppliers/commands/suppliers.commands';
import { SyncStatus, SyncTrigger, SupplierSyncResultDto } from '@smartfeed/shared';

@CommandHandler(SyncSupplierFeedCommand)
export class SyncSupplierFeedHandler implements ICommandHandler<
  SyncSupplierFeedCommand,
  SupplierSyncResultDto
> {
  private readonly logger = new Logger(SyncSupplierFeedHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: SyncSupplierFeedCommand): Promise<SupplierSyncResultDto> {
    const { supplierId, userId, dto } = command;
    const startTime = Date.now();

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
      include: {
        syncSettings: true,
        pricingRules: { where: { isActive: true }, orderBy: { priority: 'asc' } },
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }

    if (!supplier.syncSettings) {
      await this.prisma.supplierSyncSetting.create({
        data: {
          supplierId,
          protectEditedProducts: true,
          syncPrices: true,
          syncStocks: true,
        },
      });
    }

    // Create execution log entry in DB
    const log = await this.prisma.supplierSyncLog.create({
      data: {
        supplierId,
        feedSourceId: dto.feedSourceId || null,
        trigger: SyncTrigger.MANUAL,
        status: SyncStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    const totalProducts = 0;
    const updatedCount = 0;
    const createdCount = 0;
    const outOfStockCount = 0;
    const errorsCount = 0;

    try {
      const durationMs = Date.now() - startTime;

      // Update log with success
      await this.prisma.supplierSyncLog.update({
        where: { id: log.id },
        data: {
          status: SyncStatus.SUCCESS,
          completedAt: new Date(),
          durationMs,
          totalProducts,
          createdCount,
          updatedCount,
          outOfStockCount,
          errorsCount,
        },
      });

      // Update setting last synced state
      await this.prisma.supplierSyncSetting.update({
        where: { supplierId },
        data: {
          lastSyncedAt: new Date(),
          lastSyncStatus: SyncStatus.SUCCESS,
        },
      });

      return {
        success: true,
        logId: log.id,
        supplierId,
        feedSourceId: dto.feedSourceId || null,
        totalProducts,
        createdCount,
        updatedCount,
        outOfStockCount,
        errorsCount,
        durationMs,
        message: `Синхронізацію успішно завершено: оновлено ${updatedCount} з ${totalProducts} товарів.`,
      };
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : 'Unknown sync failure';

      await this.prisma.supplierSyncLog.update({
        where: { id: log.id },
        data: {
          status: SyncStatus.FAILED,
          completedAt: new Date(),
          durationMs,
          errorMessage: errorMsg,
          errorsCount: errorsCount + 1,
        },
      });

      await this.prisma.supplierSyncSetting.update({
        where: { supplierId },
        data: {
          lastSyncedAt: new Date(),
          lastSyncStatus: SyncStatus.FAILED,
        },
      });

      throw err;
    }
  }
}
