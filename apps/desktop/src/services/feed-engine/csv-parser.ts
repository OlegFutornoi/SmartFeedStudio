import { FeedFormat, type FeedColumnMapping } from '@smartfeed/shared';
import { autoMapColumns } from './auto-mapper';
import type { ParsedCategory, RawParsedProduct, FeedAnalysisResult } from './stream-parser';

/**
 * High-performance RFC 4180 compliant streaming CSV parser.
 * Handles multiline quoted text, escaped quotes, and dropshipping feeds.
 */
export class CsvFeedParser {
  /**
   * Fast structural analysis of CSV feeds without excessive memory allocation.
   */
  public analyze(content: string, format: FeedFormat, delimiter: string): FeedAnalysisResult {
    let headers: string[] = [];
    let suggestedMappings: FeedColumnMapping[] = [];
    const categoryMap = new Map<string, ParsedCategory>();
    const sampleProducts: RawParsedProduct[] = [];
    let totalDetected = 0;

    const targetToIndex = new Map<string, number>();

    this.parseCsvRows(content, delimiter, (row, rowIndex) => {
      if (rowIndex === 0) {
        headers = row;
        suggestedMappings = autoMapColumns(headers);
        suggestedMappings.forEach((m) => {
          const idx = headers.indexOf(m.sourceField);
          if (idx >= 0) targetToIndex.set(m.targetField, idx);
        });
        return;
      }

      totalDetected++;
      const product = this.mapRowToProduct(row, targetToIndex, totalDetected);

      // Track categories
      const catId = product.categoryId || 'default';
      const catName = product.categoryName || 'Загальна категорія';
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          id: catId,
          name: catName,
          parentId: null,
          productCount: 0,
        });
      }
      categoryMap.get(catId)!.productCount++;

      // Keep only first 50 sample products to save memory
      if (sampleProducts.length < 50) {
        sampleProducts.push(product);
      }
    });

    if (totalDetected === 0) {
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

    const categories = Array.from(categoryMap.values());
    const sampleCategories = categories.slice(0, 5).map((c) => ({
      externalId: c.id,
      name: c.name,
    }));

    return {
      format,
      totalDetected,
      categoriesCount: categories.length,
      categories,
      sampleCategories,
      sampleProducts,
      suggestedMappings,
    };
  }

  /**
   * Extract full products matching category filter.
   */
  public extractProducts(
    content: string,
    delimiter: string,
    options: {
      selectedCategoryIds?: string[];
      customMappings?: FeedColumnMapping[];
    },
  ): RawParsedProduct[] {
    let headers: string[] = [];
    const targetToIndex = new Map<string, number>();
    const products: RawParsedProduct[] = [];
    const categorySet =
      options.selectedCategoryIds && options.selectedCategoryIds.length > 0
        ? new Set(options.selectedCategoryIds)
        : null;

    let totalRows = 0;

    this.parseCsvRows(content, delimiter, (row, rowIndex) => {
      if (rowIndex === 0) {
        headers = row;
        const mappings =
          options.customMappings && options.customMappings.length > 0
            ? options.customMappings
            : autoMapColumns(headers);
        mappings.forEach((m) => {
          const idx = headers.indexOf(m.sourceField);
          if (idx >= 0) targetToIndex.set(m.targetField, idx);
        });
        return;
      }

      totalRows++;
      const product = this.mapRowToProduct(row, targetToIndex, totalRows);

      if (!categorySet || (product.categoryId && categorySet.has(product.categoryId))) {
        products.push(product);
      }
    });

    return products;
  }

  /**
   * RFC 4180 streaming tokenizer for quoted CSV with embedded newlines.
   */
  public parseCsvRows(
    content: string,
    delimiter: string,
    onRow: (row: string[], rowIndex: number) => boolean | void,
  ): number {
    let currentRow: string[] = [];
    let currentVal = '';
    let inQuotes = false;
    let totalRows = 0;
    const len = content.length;

    for (let i = 0; i < len; i++) {
      const char = content[i];

      if (char === '"') {
        if (inQuotes && content[i + 1] === '"') {
          currentVal += '"';
          i++; // skip escaped double quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        currentRow.push(currentVal.trim());
        currentVal = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && content[i + 1] === '\n') {
          i++; // skip CRLF
        }
        currentRow.push(currentVal.trim());
        currentVal = '';

        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].length > 0)) {
          totalRows++;
          const continueParsing = onRow(currentRow, totalRows - 1);
          if (continueParsing === false) return totalRows;
        }
        currentRow = [];
      } else {
        currentVal += char;
      }
    }

    // Flush last row
    if (currentVal.length > 0 || currentRow.length > 0) {
      currentRow.push(currentVal.trim());
      if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].length > 0)) {
        totalRows++;
        onRow(currentRow, totalRows - 1);
      }
    }

    return totalRows;
  }

  /**
   * Map raw row tokens into typed RawParsedProduct.
   */
  private mapRowToProduct(
    values: string[],
    targetToIndex: Map<string, number>,
    rowIdx: number,
  ): RawParsedProduct {
    const getVal = (target: string): string => {
      const i = targetToIndex.get(target);
      return i !== undefined && values[i] !== undefined ? values[i].trim() : '';
    };

    const sku = getVal('sku') || `CSV-${rowIdx}`;
    const titleUk = getVal('titleUk') || `Товар ${sku}`;
    const priceRaw = parseFloat(getVal('price').replace(',', '.')) || 0;
    const costPriceRaw = parseFloat(getVal('costPrice').replace(',', '.')) || priceRaw;

    // In-stock detection
    const inStockRaw = getVal('inStock').toLowerCase();
    const qtyParsed = parseInt(getVal('stockQuantity'), 10);
    const hasExplicitStock =
      inStockRaw === 'instock' ||
      inStockRaw === 'true' ||
      inStockRaw === 'в наличии' ||
      inStockRaw === 'наявність' ||
      inStockRaw === '1';
    const isExplicitOutOfStock =
      inStockRaw === 'outofstock' || inStockRaw === 'false' || inStockRaw === '0';
    const stockQuantity = !isNaN(qtyParsed) ? qtyParsed : hasExplicitStock ? 10 : 0;
    const inStock = isExplicitOutOfStock ? false : hasExplicitStock || stockQuantity > 0;

    // Clean category name
    let rawCategory = getVal('categoryName');
    if (!rawCategory || rawCategory.startsWith('http') || rawCategory.includes('<')) {
      rawCategory = 'Загальна категорія';
    }
    const categoryName = rawCategory.trim();
    const categoryId =
      getVal('categoryId') ||
      categoryName
        .toLowerCase()
        .replace(/[^a-z0-9а-яіїєґ]+/gi, '_')
        .replace(/^_+|_+$/g, '');

    // Comma/whitespace separated images
    const rawImages = getVal('imageUrl');
    const images: string[] = rawImages
      ? rawImages
          .split(/[,\s]+/)
          .map((u) => u.trim())
          .filter((u) => u.startsWith('http://') || u.startsWith('https://'))
      : [];

    return {
      sku,
      titleUk,
      price: priceRaw,
      costPrice: costPriceRaw,
      currency: 'UAH',
      stockQuantity,
      inStock,
      categoryId,
      categoryName,
      vendor: getVal('vendor') || undefined,
      descriptionUk: getVal('descriptionUk') || undefined,
      images,
    };
  }
}

export const csvFeedParser = new CsvFeedParser();
