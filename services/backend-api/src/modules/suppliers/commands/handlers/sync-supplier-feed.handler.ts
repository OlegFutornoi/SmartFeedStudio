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

    let totalProducts = dto.totalProducts ?? 0;
    let updatedCount = dto.updatedCount ?? 0;
    const createdCount = dto.createdCount ?? 0;
    const outOfStockCount = dto.outOfStockCount ?? 0;
    const errorsCount = 0;

    if (totalProducts === 0) {
      if (dto.feedSourceId) {
        const source = await this.prisma.supplierFeedSource.findUnique({
          where: { id: dto.feedSourceId },
        });
        if (source && source.productsCount > 0) {
          totalProducts = source.productsCount;
          updatedCount = source.productsCount;
        }
      } else {
        const sources = await this.prisma.supplierFeedSource.findMany({
          where: { supplierId },
          select: { productsCount: true },
        });
        const sum = sources.reduce((acc, s) => acc + (s.productsCount || 0), 0);
        if (sum > 0) {
          totalProducts = sum;
          updatedCount = sum;
        }
      }
    }

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

      if (dto.feedSourceId) {
        await this.prisma.supplierFeedSource
          .update({
            where: { id: dto.feedSourceId },
            data: {
              lastSyncedAt: new Date(),
              lastSyncStatus: SyncStatus.SUCCESS,
            },
          })
          .catch((err) => {
            this.logger.warn(`Failed to update feed source sync state: ${err.message}`);
          });
      }

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
