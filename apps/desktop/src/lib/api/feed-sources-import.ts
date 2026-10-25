import { localDb } from '@/services/local-db';
import { fetchFeedContent } from '@/lib/api/feeds-mutations';
import type { ImportFeedResultDto } from '@/lib/api/feeds';

export async function importFeedUrl(
  dto: { supplierId: string; url: string; catalogId?: string },
  token?: string,
): Promise<ImportFeedResultDto> {
  const content = await fetchFeedContent(dto.url, token);
  const res = await localDb.feeds.importFeedContent(content, {
    supplierId: dto.supplierId,
    sourceUrl: dto.url,
  });

  return {
    feedSourceId: res.feedSourceId,
    totalItems: res.totalProcessed,
    createdItems: res.createdCount,
    updatedItems: 0,
    categoriesCreated: 0,
    format: 'XML',
  };
}

export async function importFeedContent(
  dto: { supplierId: string; content: string; fileName?: string; catalogId?: string },
  _token?: string,
): Promise<ImportFeedResultDto> {
  const res = await localDb.feeds.importFeedContent(dto.content, {
    supplierId: dto.supplierId,
    fileName: dto.fileName,
  });

  return {
    feedSourceId: res.feedSourceId,
    totalItems: res.totalProcessed,
    createdItems: res.createdCount,
    updatedItems: 0,
    categoriesCreated: 0,
    format: 'XML',
  };
}
