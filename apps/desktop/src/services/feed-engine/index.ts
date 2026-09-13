export * from './format-detector';
export * from './auto-mapper';
export * from './stream-parser';
export * from './csv-parser';
export * from './xml-parser';
export * from './batch-ingester';

import { feedStreamParser, type RawParsedProduct } from './stream-parser';
import { batchIngester, type BatchIngestResult } from './batch-ingester';
import { autoMapColumns } from './auto-mapper';
import { detectFeedFormat } from './format-detector';
import type { FeedColumnMapping } from '@smartfeed/shared';

export const feedEngine = {
  detectFormat: detectFeedFormat,
  autoMap: autoMapColumns,
  analyze: (content: string, supplierId?: string) => feedStreamParser.analyze(content, supplierId),
  parseProducts: (
    content: string,
    options: {
      selectedCategoryIds?: string[];
      supplierId: string;
      customMappings?: FeedColumnMapping[];
    },
  ): RawParsedProduct[] => feedStreamParser.parseProducts(content, options),
  ingest: (
    supplierId: string,
    rawProducts: RawParsedProduct[],
    feedSourceId?: string,
  ): Promise<BatchIngestResult> =>
    batchIngester.ingestProducts(supplierId, rawProducts, feedSourceId),
};
