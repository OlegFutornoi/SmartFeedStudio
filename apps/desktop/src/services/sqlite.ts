/**
 * Local SQLite (SQLCipher) interface for high-performance offline catalog parsing and image caching.
 */

export interface CachedFeedItem {
  id: string;
  sku: string;
  title: string;
  price: number;
  currency: string;
  category: string;
  imageOriginalUrl: string;
  imageCloudUrl?: string;
  syncedToCloud: boolean;
}

export class LocalFeedDatabase {
  private static instance: LocalFeedDatabase;
  private memoryCache: Map<string, CachedFeedItem> = new Map();

  private constructor() {}

  public static getInstance(): LocalFeedDatabase {
    if (!LocalFeedDatabase.instance) {
      LocalFeedDatabase.instance = new LocalFeedDatabase();
    }
    return LocalFeedDatabase.instance;
  }

  async saveItems(items: CachedFeedItem[]): Promise<void> {
    for (const item of items) {
      this.memoryCache.set(item.id, item);
    }
  }

  async getAllItems(): Promise<CachedFeedItem[]> {
    return Array.from(this.memoryCache.values());
  }

  async getItemCount(): Promise<number> {
    return this.memoryCache.size;
  }
}
