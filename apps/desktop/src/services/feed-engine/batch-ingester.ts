import { ProductStatus, type ProductDto, type SupplierPricingRuleDto } from '@smartfeed/shared';
import { localDb } from '../local-db';
import { emitDataSync } from '@/lib/syncEvents';
import type { RawParsedProduct } from './stream-parser';

export interface BatchIngestResult {
  totalProcessed: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
}

/**
 * Batch ingester with pricing rules and local database persistence.
 */
export class BatchIngester {
  public async ingestProducts(
    supplierId: string,
    rawProducts: RawParsedProduct[],
    feedSourceId?: string,
  ): Promise<BatchIngestResult> {
    const supplier = await localDb.suppliers.getSupplierById(supplierId);
    const pricingRules = await localDb.pricing.getPricingRules(supplierId);

    const defaultMargin = supplier?.defaultMarginPercent || 0;
    const defaultFixed = supplier?.defaultFixedMarkup || 0;

    const productsToUpsert: ProductDto[] = rawProducts.map((raw, idx) => {
      const costPrice = raw.costPrice > 0 ? raw.costPrice : raw.price;
      const { finalPrice } = this.calculatePrice(
        costPrice,
        raw.categoryId,
        pricingRules,
        defaultMargin,
        defaultFixed,
      );

      return {
        id: `prod_${supplierId}_${raw.sku}_${Date.now()}_${idx}`,
        catalogId: 'cat_local_default',
        supplierId,
        supplierName: supplier?.name || 'Постачальник',
        supplierCode: supplier?.code,
        feedSourceId: feedSourceId || null,
        sku: raw.sku,
        titleUk: raw.titleUk,
        costPrice,
        price: finalPrice,
        currency: raw.currency || 'UAH',
        stockQuantity: raw.stockQuantity,
        inStock: raw.inStock,
        categoryId: raw.categoryId || undefined,
        categoryNameUk: raw.categoryName,
        images: (raw.images || []).map((url, i) => ({
          originalUrl: url,
          order: i,
          isMain: i === 0,
        })),
        attributes: [],
        status: ProductStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    // Batch upsert to local database
    await localDb.products.bulkUpsert(productsToUpsert);

    // Reactive sync event emission
    emitDataSync(['products', 'feeds', 'suppliers', 'quotas']);

    return {
      totalProcessed: productsToUpsert.length,
      createdCount: productsToUpsert.length,
      updatedCount: 0,
      failedCount: 0,
    };
  }

  private calculatePrice(
    costPrice: number,
    categoryId: string | null | undefined,
    rules: SupplierPricingRuleDto[],
    defaultMarginPercent: number,
    defaultFixedMarkup: number,
  ): { finalPrice: number; marginPercent: number; fixedMarkup: number } {
    if (costPrice <= 0) {
      return {
        finalPrice: 0,
        marginPercent: defaultMarginPercent,
        fixedMarkup: defaultFixedMarkup,
      };
    }

    // Check specific rule
    const matchingRule = rules.find((r) => {
      if (!r.isActive) return false;
      if (r.categoryId && categoryId && r.categoryId !== categoryId) return false;
      if (r.minPrice !== null && r.minPrice !== undefined && costPrice < r.minPrice) return false;
      if (r.maxPrice !== null && r.maxPrice !== undefined && costPrice > r.maxPrice) return false;
      return true;
    });

    const marginPercent = matchingRule ? matchingRule.marginPercent : defaultMarginPercent;
    const fixedMarkup = matchingRule ? matchingRule.fixedMarkup : defaultFixedMarkup;

    const finalPrice =
      Math.round((costPrice * (1 + marginPercent / 100) + fixedMarkup) * 100) / 100;

    return { finalPrice, marginPercent, fixedMarkup };
  }
}

export const batchIngester = new BatchIngester();
