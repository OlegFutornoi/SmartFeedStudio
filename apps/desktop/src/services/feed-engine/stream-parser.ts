import { FeedFormat, type FeedColumnMapping } from '@smartfeed/shared';
import { detectFeedFormat } from '@/services/feed-engine/format-detector';
import { xmlFeedParser } from '@/services/feed-engine/xml-parser';
import { csvFeedParser } from '@/services/feed-engine/csv-parser';

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
 * Fast stream-like parser facade for XML/YML/CSV product feeds.
 */
export class FeedStreamParser {
  /**
   * Fast structural analysis of feed without heavy DOM or string allocations.
   */
  public analyze(content: string, _supplierId?: string): FeedAnalysisResult {
    const { format, delimiter, isXml } = detectFeedFormat(content);

    if (isXml) {
      return xmlFeedParser.analyze(content, format);
    } else {
      return csvFeedParser.analyze(content, format, delimiter || ';');
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

    if (isXml) {
      return xmlFeedParser.extractProducts(content, options);
    } else {
      return csvFeedParser.extractProducts(content, delimiter || ';', options);
    }
  }
}

export const feedStreamParser = new FeedStreamParser();
