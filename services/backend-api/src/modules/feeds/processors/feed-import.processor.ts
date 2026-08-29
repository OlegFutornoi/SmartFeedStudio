import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { FeedParserService } from '../services/feed-parser.service';
import { ImportJobStatus, ProductStatus } from '@smartfeed/shared';

export interface FeedImportJobData {
  importJobId: string;
  userId: string;
  supplierId: string;
  feedSourceId: string;
  content?: string;
  url?: string;
  selectedCategoryIds?: string[];
  catalogId?: string;
  autoUpdatePrices?: boolean;
  autoUpdateStocks?: boolean;
}

@Processor('feed-import')
export class FeedImportProcessor extends WorkerHost {
  private readonly logger = new Logger(FeedImportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly feedParser: FeedParserService,
  ) {
    super();
  }

  async process(job: Job<FeedImportJobData, any, string>): Promise<any> {
    const {
      importJobId,
      userId,
      supplierId,
      feedSourceId,
      content,
      url,
      selectedCategoryIds,
      catalogId,
      autoUpdatePrices = true,
      autoUpdateStocks = true,
    } = job.data;

    this.logger.log(`Starting feed import job ${importJobId} for user ${userId}`);

    // 1. Mark ImportJob as PARSING
    await this.prisma.importJob.update({
      where: { id: importJobId },
      data: {
        status: ImportJobStatus.PARSING,
        startedAt: new Date(),
      },
    });

    try {
      // 2. Fetch Supplier
      const supplier = await this.prisma.supplier.findFirst({
        where: { id: supplierId, userId },
      });
      if (!supplier) {
        throw new Error(`Supplier ${supplierId} not found`);
      }

      const markupConfig = {
        defaultMarginPercent: supplier.defaultMarginPercent
          ? Number(supplier.defaultMarginPercent)
          : 0,
        defaultFixedMarkup: supplier.defaultFixedMarkup ? Number(supplier.defaultFixedMarkup) : 0,
      };

      // 3. Obtain Feed Content (from direct content string or remote URL)
      let feedContent = content;
      if (!feedContent && url) {
        feedContent = await this.feedParser.fetchFeedFromUrl(url);
      }
      if (!feedContent) {
        throw new Error('No feed content or URL provided for import');
      }

      // 4. Parse feed with category filter
      const parsedFeed = this.feedParser.parseFeedContent(
        feedContent,
        markupConfig,
        selectedCategoryIds,
      );

      const totalItems = parsedFeed.products.length;
      await this.prisma.importJob.update({
        where: { id: importJobId },
        data: {
          totalItems,
          status: ImportJobStatus.SAVING,
        },
      });

      // 5. Ensure Catalog exists
      let targetCatalogId = catalogId;
      if (!targetCatalogId) {
        const defaultCatalog = await this.prisma.productCatalog.findFirst({
          where: { userId },
          orderBy: { isDefault: 'desc' },
        });

        if (defaultCatalog) {
          targetCatalogId = defaultCatalog.id;
        } else {
          const newCatalog = await this.prisma.productCatalog.create({
            data: {
              userId,
              name: 'Основний каталог',
              isDefault: true,
            },
          });
          targetCatalogId = newCatalog.id;
        }
      }

      // 6. Synchronize categories
      const categoryMap = new Map<string, string>(); // externalId -> internal DB id
      for (const cat of parsedFeed.categories) {
        if (selectedCategoryIds && selectedCategoryIds.length > 0) {
          if (!selectedCategoryIds.includes(cat.externalId)) continue;
        }

        const existingCategory = await this.prisma.productCategory.findFirst({
          where: {
            catalogId: targetCatalogId,
            externalId: cat.externalId,
          },
        });

        if (existingCategory) {
          categoryMap.set(cat.externalId, existingCategory.id);
        } else {
          const createdCat = await this.prisma.productCategory.create({
            data: {
              catalogId: targetCatalogId,
              externalId: cat.externalId,
              nameUk: cat.name,
            },
          });
          categoryMap.set(cat.externalId, createdCat.id);
        }
      }

      // 7. Batch Process Products in Chunks of 50
      let createdItems = 0;
      let updatedItems = 0;
      let failedItems = 0;
      const chunkSize = 50;

      for (let i = 0; i < parsedFeed.products.length; i += chunkSize) {
        const chunk = parsedFeed.products.slice(i, i + chunkSize);

        for (const item of chunk) {
          try {
            const internalCatId = item.categoryId ? categoryMap.get(item.categoryId) : undefined;

            const existingProduct = await this.prisma.product.findFirst({
              where: {
                catalogId: targetCatalogId,
                supplierId: supplier.id,
                sku: item.sku,
              },
            });

            if (existingProduct) {
              // Update existing product
              await this.prisma.product.update({
                where: { id: existingProduct.id },
                data: {
                  feedSourceId: feedSourceId || existingProduct.feedSourceId,
                  price: autoUpdatePrices ? item.price : undefined,
                  costPrice: autoUpdatePrices ? item.costPrice : undefined,
                  inStock: autoUpdateStocks ? item.inStock : undefined,
                  stockQuantity: autoUpdateStocks ? item.stockQuantity : undefined,
                  categoryId: internalCatId || existingProduct.categoryId,
                },
              });
              updatedItems++;
            } else {
              // Create new product
              await this.prisma.product.create({
                data: {
                  catalogId: targetCatalogId,
                  supplierId: supplier.id,
                  feedSourceId: feedSourceId || undefined,
                  categoryId: internalCatId,
                  sku: item.sku,
                  externalId: item.externalId,
                  vendorCode: item.vendorCode,
                  barcode: item.barcode,
                  titleUk: item.titleUk,
                  titleEn: item.titleEn,
                  descriptionUk: item.descriptionUk,
                  descriptionEn: item.descriptionEn,
                  vendor: item.vendor,
                  costPrice: item.costPrice,
                  price: item.price,
                  oldPrice: item.oldPrice,
                  currency: item.currency,
                  stockQuantity: item.stockQuantity,
                  inStock: item.inStock,
                  status: ProductStatus.ACTIVE,
                  rawPayload: item.rawPayload,
                  images: {
                    create: item.images.map((img) => ({
                      userId,
                      originalUrl: img.originalUrl,
                      order: img.order,
                      isMain: img.isMain,
                    })),
                  },
                  attributes: {
                    create: item.attributes.map((attr) => ({
                      nameUk: attr.nameUk,
                      nameEn: attr.nameEn,
                      valueUk: attr.valueUk,
                      valueEn: attr.valueEn,
                      unit: attr.unit,
                      order: attr.order,
                    })),
                  },
                },
              });
              createdItems++;
            }
          } catch (itemErr: any) {
            this.logger.warn(`Failed to process SKU ${item.sku}: ${itemErr.message}`);
            failedItems++;
          }
        }

        const processed = Math.min(i + chunkSize, totalItems);
        const progressPct = totalItems > 0 ? Math.round((processed / totalItems) * 100) : 100;

        await job.updateProgress(progressPct);

        await this.prisma.importJob.update({
          where: { id: importJobId },
          data: {
            processedItems: processed,
            createdItems,
            updatedItems,
            failedItems,
          },
        });
      }

      // 8. Update FeedSource
      await this.prisma.feedSource.update({
        where: { id: feedSourceId },
        data: {
          lastSyncedAt: new Date(),
          lastSyncStatus: 'SUCCESS',
        },
      });

      // 9. Mark ImportJob as COMPLETED
      await this.prisma.importJob.update({
        where: { id: importJobId },
        data: {
          status: ImportJobStatus.COMPLETED,
          completedAt: new Date(),
          processedItems: totalItems,
          createdItems,
          updatedItems,
          failedItems,
        },
      });

      this.logger.log(
        `Completed feed import job ${importJobId}: ${createdItems} created, ${updatedItems} updated, ${failedItems} failed.`,
      );

      return {
        success: true,
        totalItems,
        createdItems,
        updatedItems,
        failedItems,
      };
    } catch (err: any) {
      this.logger.error(`Feed import job ${importJobId} failed: ${err.message}`, err.stack);

      await this.prisma.feedSource
        .update({
          where: { id: feedSourceId },
          data: {
            lastSyncedAt: new Date(),
            lastSyncStatus: 'ERROR',
          },
        })
        .catch(() => {});

      await this.prisma.importJob
        .update({
          where: { id: importJobId },
          data: {
            status: ImportJobStatus.FAILED,
            completedAt: new Date(),
            errorLogs: { message: err.message, stack: err.stack },
          },
        })
        .catch(() => {});

      throw err;
    }
  }
}
