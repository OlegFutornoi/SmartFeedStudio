export * from '@/services/feed-engine/format-detector';
export * from '@/services/feed-engine/auto-mapper';
export * from '@/services/feed-engine/stream-parser';
export * from '@/services/feed-engine/csv-parser';
export * from '@/services/feed-engine/xml-parser';
export * from '@/services/feed-engine/batch-ingester';

import { feedStreamParser, type RawParsedProduct } from '@/services/feed-engine/stream-parser';
import { batchIngester, type BatchIngestResult } from '@/services/feed-engine/batch-ingester';
import { autoMapColumns } from '@/services/feed-engine/auto-mapper';
import { detectFeedFormat } from '@/services/feed-engine/format-detector';
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
