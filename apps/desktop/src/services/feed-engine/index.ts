export * from './format-detector';
export * from './auto-mapper';
export * from './stream-parser';
export * from './batch-ingester';

import { feedStreamParser } from './stream-parser';
import { batchIngester } from './batch-ingester';
import { autoMapColumns } from './auto-mapper';
import { detectFeedFormat } from './format-detector';

export const feedEngine = {
  detectFormat: detectFeedFormat,
  autoMap: autoMapColumns,
  analyze: (content: string, supplierId?: string) => feedStreamParser.analyze(content, supplierId),
  parseProducts: (
    content: string,
    options: {
      selectedCategoryIds?: string[];
      supplierId: string;
    },
  ) => feedStreamParser.parseProducts(content, options),
  ingest: (supplierId: string, rawProducts: any[], feedSourceId?: string) =>
    batchIngester.ingestProducts(supplierId, rawProducts, feedSourceId),
};
