import { FeedFormat } from '@smartfeed/shared';
import type { ParsedCategory, RawParsedProduct, FeedAnalysisResult } from './stream-parser';

/**
 * Fast regex-based XML / YML feed parser.
 */
export class XmlFeedParser {
  public analyze(content: string, format: FeedFormat): FeedAnalysisResult {
    const { categories, products, totalCount } = this.extractXmlData(content, true);

    const sampleCategories = categories.slice(0, 5).map((c) => ({
      externalId: c.id,
      name: c.name,
    }));

    return {
      format,
      totalDetected: totalCount,
      categoriesCount: categories.length,
      categories,
      sampleCategories,
      sampleProducts: products.slice(0, 10),
      suggestedMappings: [],
    };
  }

  public extractProducts(
    content: string,
    options: { selectedCategoryIds?: string[] },
  ): RawParsedProduct[] {
    const { products } = this.extractXmlData(content, false);
    if (!options.selectedCategoryIds || options.selectedCategoryIds.length === 0) {
      return products;
    }
    const categorySet = new Set(options.selectedCategoryIds);
    return products.filter((p) => !p.categoryId || categorySet.has(p.categoryId));
  }

  private extractXmlData(
    content: string,
    limitSample = false,
  ): {
    categories: ParsedCategory[];
    products: RawParsedProduct[];
    totalCount: number;
  } {
    const categoryMap = new Map<string, ParsedCategory>();

    // 1. Extract Categories
    const categoryRegex = /<category\b([^>]*)>([\s\S]*?)<\/category>/gi;
    let catMatch: RegExpExecArray | null;
    while ((catMatch = categoryRegex.exec(content)) !== null) {
      const attrs = catMatch[1];
      const name = catMatch[2].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
      const idMatch = attrs.match(/\bid="([^"]+)"/i);
      const parentIdMatch = attrs.match(/\bparentId="([^"]+)"/i);
      if (idMatch) {
        const id = idMatch[1];
        const parentId = parentIdMatch ? parentIdMatch[1] : null;
        categoryMap.set(id, { id, name, parentId, productCount: 0 });
      }
    }

    // 2. Extract Offers / Items
    const products: RawParsedProduct[] = [];
    const offerRegex = /<(?:offer|item)\b([^>]*)>([\s\S]*?)<\/(?:offer|item)>/gi;
    let offerMatch: RegExpExecArray | null;
    let totalCount = 0;

    while ((offerMatch = offerRegex.exec(content)) !== null) {
      totalCount++;
      const attrs = offerMatch[1];
      const inner = offerMatch[2];
      const idMatch = attrs.match(/\bid="([^"]+)"/i);
      const availableMatch = attrs.match(/\bavailable="([^"]+)"/i);
      const attrId = idMatch ? idMatch[1] : '';
      const availableAttr = availableMatch ? availableMatch[1] : undefined;

      const sku =
        this.extractXmlTag(inner, 'vendorCode') ||
        this.extractXmlTag(inner, 'g:id') ||
        this.extractXmlTag(inner, 'g:mpn') ||
        this.extractXmlTag(inner, 'article') ||
        attrId ||
        `SKU-${totalCount}`;

      const titleUk =
        this.extractXmlTag(inner, 'name_ua') ||
        this.extractXmlTag(inner, 'name_uk') ||
        this.extractXmlTag(inner, 'name') ||
        this.extractXmlTag(inner, 'title') ||
        this.extractXmlTag(inner, 'g:title') ||
        'Без назви';

      const priceRaw = parseFloat(
        this.extractXmlTag(inner, 'price') || this.extractXmlTag(inner, 'g:price') || '0',
      );
      const costPriceRaw = parseFloat(
        this.extractXmlTag(inner, 'price_cost') ||
          this.extractXmlTag(inner, 'cost') ||
          this.extractXmlTag(inner, 'g:cost_of_goods_sold') ||
          String(priceRaw),
      );

      const categoryId =
        this.extractXmlTag(inner, 'categoryId') ||
        this.extractXmlTag(inner, 'g:product_type') ||
        null;

      if (categoryId && categoryMap.has(categoryId)) {
        const cat = categoryMap.get(categoryId)!;
        cat.productCount++;
      }

      const qtyRaw = parseInt(
        this.extractXmlTag(inner, 'quantity') ||
          this.extractXmlTag(inner, 'quantity_in_stock') ||
          this.extractXmlTag(inner, 'stock') ||
          this.extractXmlTag(inner, 'g:quantity') ||
          '10',
        10,
      );

      const inStock = availableAttr !== undefined ? availableAttr !== 'false' : qtyRaw > 0;

      const vendor =
        this.extractXmlTag(inner, 'vendor') ||
        this.extractXmlTag(inner, 'brand') ||
        this.extractXmlTag(inner, 'g:brand') ||
        undefined;

      const descriptionUk =
        this.extractXmlTag(inner, 'description_ua') ||
        this.extractXmlTag(inner, 'description') ||
        this.extractXmlTag(inner, 'g:description') ||
        undefined;

      // Extract Picture URLs
      const images: string[] = [];
      const picRegex =
        /<(?:picture|g:image_link|image)>([^<]+)<\/(?:picture|g:image_link|image)>/gi;
      let picMatch: RegExpExecArray | null;
      while ((picMatch = picRegex.exec(inner)) !== null) {
        images.push(picMatch[1].trim());
      }

      const parsedProduct: RawParsedProduct = {
        sku,
        titleUk,
        price: isNaN(priceRaw) ? 0 : priceRaw,
        costPrice: isNaN(costPriceRaw) ? 0 : costPriceRaw,
        currency: this.extractXmlTag(inner, 'currencyId') || 'UAH',
        stockQuantity: isNaN(qtyRaw) ? 0 : qtyRaw,
        inStock,
        categoryId,
        categoryName:
          categoryId && categoryMap.has(categoryId) ? categoryMap.get(categoryId)!.name : undefined,
        vendor,
        descriptionUk,
        images,
      };

      if (!limitSample || products.length < 50) {
        products.push(parsedProduct);
      }
    }

    // Default category if none defined
    if (categoryMap.size === 0 && totalCount > 0) {
      categoryMap.set('default', {
        id: 'default',
        name: 'Основна категорія',
        parentId: null,
        productCount: totalCount,
      });
    }

    return {
      categories: Array.from(categoryMap.values()),
      products,
      totalCount,
    };
  }

  private extractXmlTag(xml: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = regex.exec(xml);
    if (!match) return null;
    return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
  }
}

export const xmlFeedParser = new XmlFeedParser();
