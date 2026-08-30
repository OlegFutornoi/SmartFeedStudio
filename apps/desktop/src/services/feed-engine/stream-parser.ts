import { FeedFormat, type FeedColumnMapping } from '@smartfeed/shared';
import { detectFeedFormat } from './format-detector';
import { autoMapColumns } from './auto-mapper';

export interface ParsedCategory {
  id: string;
  name: string;
  parentId?: string | null;
  productCount: number;
}

export interface RawParsedProduct {
  sku: string;
  titleUk: string;
  price: number;
  costPrice: number;
  currency: string;
  stockQuantity: number;
  inStock: boolean;
  categoryId?: string | null;
  categoryName?: string;
  vendor?: string;
  descriptionUk?: string;
  images?: string[];
  barcode?: string;
  rawAttributes?: Record<string, string>;
}

export interface FeedAnalysisResult {
  format: FeedFormat;
  totalDetected: number;
  categoriesCount: number;
  categories: ParsedCategory[];
  sampleCategories: { externalId: string; name: string }[];
  sampleProducts: RawParsedProduct[];
  suggestedMappings: FeedColumnMapping[];
}

/**
 * Fast stream-like parser for XML/YML/CSV feeds.
 */
export class FeedStreamParser {
  /**
   * Fast analysis of feed structure without heavy DOM allocations.
   */
  public analyze(content: string, _supplierId?: string): FeedAnalysisResult {
    const { format, delimiter, isXml } = detectFeedFormat(content);

    if (isXml) {
      return this.analyzeXml(content, format);
    } else {
      return this.analyzeCsv(content, format, delimiter || ';');
    }
  }

  /**
   * Parse full feed items matching selected category IDs.
   */
  public parseProducts(
    content: string,
    options: {
      selectedCategoryIds?: string[];
      supplierId: string;
      customMappings?: FeedColumnMapping[];
    },
  ): RawParsedProduct[] {
    const { isXml, delimiter } = detectFeedFormat(content);
    const categorySet =
      options.selectedCategoryIds && options.selectedCategoryIds.length > 0
        ? new Set(options.selectedCategoryIds)
        : null;

    if (isXml) {
      const { products } = this.extractXmlData(content);
      if (!categorySet) return products;
      return products.filter((p) => !p.categoryId || categorySet.has(p.categoryId));
    } else {
      const { products } = this.extractCsvData(content, delimiter || ';', options.customMappings);
      if (!categorySet) return products;
      return products.filter((p) => !p.categoryId || categorySet.has(p.categoryId));
    }
  }

  // ==========================================
  // XML / YML Parser Implementation
  // ==========================================

  private analyzeXml(content: string, format: FeedFormat): FeedAnalysisResult {
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
    const categoryRegex =
      /<category\s+id="([^"]+)"(?:\s+parentId="([^"]+)")?>([^<]+)<\/category>/gi;
    let catMatch: RegExpExecArray | null;
    while ((catMatch = categoryRegex.exec(content)) !== null) {
      const id = catMatch[1];
      const parentId = catMatch[2] || null;
      const name = catMatch[3].trim();
      categoryMap.set(id, { id, name, parentId, productCount: 0 });
    }

    // 2. Extract Offers / Items
    const products: RawParsedProduct[] = [];
    const offerRegex =
      /<(?:offer|item)(?:\s+id="([^"]+)")?(?:\s+available="([^"]+)")?[^>]*>([\s\S]*?)<\/(?:offer|item)>/gi;
    let offerMatch: RegExpExecArray | null;
    let totalCount = 0;

    while ((offerMatch = offerRegex.exec(content)) !== null) {
      totalCount++;
      const attrId = offerMatch[1] || '';
      const availableAttr = offerMatch[2];
      const inner = offerMatch[3];

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

  // ==========================================
  // CSV Parser Implementation
  // ==========================================

  private analyzeCsv(content: string, format: FeedFormat, delimiter: string): FeedAnalysisResult {
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      return {
        format,
        totalDetected: 0,
        categoriesCount: 0,
        categories: [],
        sampleCategories: [],
        sampleProducts: [],
        suggestedMappings: [],
      };
    }

    const headers = this.parseCsvRow(lines[0], delimiter);
    const suggestedMappings = autoMapColumns(headers);
    const { categories, products, totalCount } = this.extractCsvData(
      content,
      delimiter,
      suggestedMappings,
    );

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
      suggestedMappings,
    };
  }

  private extractCsvData(
    content: string,
    delimiter: string,
    mappings?: FeedColumnMapping[],
  ): {
    categories: ParsedCategory[];
    products: RawParsedProduct[];
    totalCount: number;
  } {
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length <= 1) {
      return { categories: [], products: [], totalCount: 0 };
    }

    const headers = this.parseCsvRow(lines[0], delimiter);
    const activeMappings = mappings && mappings.length > 0 ? mappings : autoMapColumns(headers);

    const headerIndexMap = new Map<string, number>();
    headers.forEach((h, idx) => headerIndexMap.set(h.toLowerCase().trim(), idx));

    const targetToIndex = new Map<string, number>();
    activeMappings.forEach((m) => {
      const idx = headers.indexOf(m.sourceField);
      if (idx >= 0) targetToIndex.set(m.targetField, idx);
    });

    const categoryMap = new Map<string, ParsedCategory>();
    const products: RawParsedProduct[] = [];
    const rows = lines.slice(1);

    rows.forEach((line, idx) => {
      const values = this.parseCsvRow(line, delimiter);
      if (values.length === 0 || values.every((v) => !v)) return;

      const getVal = (target: string): string => {
        const i = targetToIndex.get(target);
        return i !== undefined && values[i] ? values[i].trim() : '';
      };

      const sku = getVal('sku') || `CSV-${idx + 1}`;
      const titleUk = getVal('titleUk') || `Товар ${sku}`;
      const priceRaw = parseFloat(getVal('price').replace(',', '.')) || 0;
      const costPriceRaw = parseFloat(getVal('costPrice').replace(',', '.')) || priceRaw;
      const qtyRaw = parseInt(getVal('stockQuantity'), 10) || 10;
      const categoryName = getVal('categoryName') || 'Загальна категорія';
      const categoryId = getVal('categoryId') || categoryName.toLowerCase().replace(/\s+/g, '_');

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          id: categoryId,
          name: categoryName,
          parentId: null,
          productCount: 0,
        });
      }
      categoryMap.get(categoryId)!.productCount++;

      const images = getVal('imageUrl') ? [getVal('imageUrl')] : [];

      products.push({
        sku,
        titleUk,
        price: priceRaw,
        costPrice: costPriceRaw,
        currency: 'UAH',
        stockQuantity: qtyRaw,
        inStock: qtyRaw > 0,
        categoryId,
        categoryName,
        vendor: getVal('vendor') || undefined,
        descriptionUk: getVal('descriptionUk') || undefined,
        images,
      });
    });

    return {
      categories: Array.from(categoryMap.values()),
      products,
      totalCount: products.length,
    };
  }

  private parseCsvRow(row: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ''));
    return result;
  }
}

export const feedStreamParser = new FeedStreamParser();
