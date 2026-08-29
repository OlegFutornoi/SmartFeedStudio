import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FeedParserService } from '../services/feed-parser.service';
import { ImportFeedContentCommand } from './import-feed-content.command';
import { ProductStatus } from '@smartfeed/shared';

export interface ImportFeedResult {
  feedSourceId?: string;
  totalItems: number;
  createdItems: number;
  updatedItems: number;
  categoriesCreated: number;
  format: string;
}

@CommandHandler(ImportFeedContentCommand)
export class ImportFeedContentHandler implements ICommandHandler<ImportFeedContentCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feedParser: FeedParserService,
  ) {}

  async execute(command: ImportFeedContentCommand): Promise<ImportFeedResult> {
    const {
      userId,
      supplierId,
      feedContent,
      catalogId: customCatalogId,
      sourceType,
      sourceUrl,
      fileName,
    } = command;

    // 1. Verify supplier exists and belongs to user
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID "${supplierId}" not found`);
    }

    // 2. Resolve or create default ProductCatalog
    let catalogId = customCatalogId;
    if (!catalogId) {
      let defaultCatalog = await this.prisma.productCatalog.findFirst({
        where: { userId, isDefault: true },
      });
      if (!defaultCatalog) {
        defaultCatalog = await this.prisma.productCatalog.create({
          data: {
            userId,
            name: 'Головний каталог товарів',
            isDefault: true,
          },
        });
      }
      catalogId = defaultCatalog.id;
    }

    // 3. Parse feed content with supplier markup rules
    const parsed = this.feedParser.parseFeedContent(feedContent, {
      defaultMarginPercent: Number(supplier.defaultMarginPercent),
      defaultFixedMarkup: Number(supplier.defaultFixedMarkup),
    });

    // 4. Create or update FeedSource record in DB
    const feedName = fileName || sourceUrl || `Фід ${parsed.format} (${supplier.name})`;
    let feedSource = await this.prisma.feedSource.findFirst({
      where: {
        supplierId,
        sourceType,
        ...(sourceUrl
          ? { sourceUrl }
          : fileName
            ? { s3FileKey: fileName }
            : { fileFormat: parsed.format }),
      },
    });

    if (!feedSource) {
      feedSource = await this.prisma.feedSource.create({
        data: {
          supplierId,
          name: feedName,
          sourceType,
          fileFormat: parsed.format,
          sourceUrl: sourceUrl || undefined,
          s3FileKey: fileName || undefined,
          lastSyncedAt: new Date(),
          lastSyncStatus: 'SUCCESS',
        },
      });
    } else {
      feedSource = await this.prisma.feedSource.update({
        where: { id: feedSource.id },
        data: {
          fileFormat: parsed.format,
          lastSyncedAt: new Date(),
          lastSyncStatus: 'SUCCESS',
        },
      });
    }

    // 4. Map & Upsert categories
    const categoryMap = new Map<string, string>(); // externalId -> DB categoryId
    let categoriesCreated = 0;

    for (const cat of parsed.categories) {
      const existing = await this.prisma.productCategory.findFirst({
        where: {
          catalogId,
          externalId: cat.externalId,
        },
      });

      if (existing) {
        categoryMap.set(cat.externalId, existing.id);
      } else {
        const created = await this.prisma.productCategory.create({
          data: {
            catalogId,
            externalId: cat.externalId,
            nameUk: cat.name,
          },
        });
        categoryMap.set(cat.externalId, created.id);
        categoriesCreated++;
      }
    }

    // 5. Batch Process Products (Upsert by catalogId + supplierId + sku)
    let createdCount = 0;
    let updatedCount = 0;

    for (const item of parsed.products) {
      const dbCategoryId = item.categoryId ? categoryMap.get(item.categoryId) || null : null;

      const existingProduct = await this.prisma.product.findUnique({
        where: {
          catalogId_supplierId_sku: {
            catalogId,
            supplierId,
            sku: item.sku,
          },
        },
      });

      if (existingProduct) {
        await this.prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            feedSourceId: feedSource.id,
            titleUk: item.titleUk,
            titleEn: item.titleEn,
            descriptionUk: item.descriptionUk,
            descriptionEn: item.descriptionEn,
            costPrice: item.costPrice,
            price: item.price,
            oldPrice: item.oldPrice,
            stockQuantity: item.stockQuantity,
            inStock: item.inStock,
            categoryId: dbCategoryId || existingProduct.categoryId,
            vendor: item.vendor || existingProduct.vendor,
            barcode: item.barcode || existingProduct.barcode,
            vendorCode: item.vendorCode || existingProduct.vendorCode,
            rawPayload: item.rawPayload as any,
          },
        });
        updatedCount++;
      } else {
        await this.prisma.product.create({
          data: {
            catalogId,
            supplierId,
            feedSourceId: feedSource.id,
            categoryId: dbCategoryId,
            sku: item.sku,
            externalId: item.externalId,
            barcode: item.barcode,
            vendorCode: item.vendorCode,
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
            rawPayload: item.rawPayload as any,
            images:
              item.images && item.images.length > 0
                ? {
                    create: item.images.map((img) => ({
                      userId,
                      originalUrl: img.originalUrl,
                      order: img.order,
                      isMain: img.isMain,
                    })),
                  }
                : undefined,
            attributes:
              item.attributes && item.attributes.length > 0
                ? {
                    create: item.attributes.map((attr) => ({
                      nameUk: attr.nameUk,
                      nameEn: attr.nameEn,
                      valueUk: attr.valueUk,
                      valueEn: attr.valueEn,
                      unit: attr.unit,
                      order: attr.order,
                    })),
                  }
                : undefined,
          },
        });
        createdCount++;
      }
    }

    return {
      feedSourceId: feedSource.id,
      totalItems: parsed.products.length,
      createdItems: createdCount,
      updatedItems: updatedCount,
      categoriesCreated,
      format: parsed.format,
    };
  }
}
