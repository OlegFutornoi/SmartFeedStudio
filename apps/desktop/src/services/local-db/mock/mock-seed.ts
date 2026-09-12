import type { MockDbState } from './mock-state';
import { syncCounters } from './mock-state';
import {
  FeedFormat,
  FeedSourceType,
  ProductStatus,
  ImageDownloadStatus,
  ImageSyncStatus,
} from '@smartfeed/shared';

export function seedDefaultMockData(state: MockDbState): void {
  const defaultSupplierId = 'sup_demo_01';

  state.suppliers = [
    {
      id: defaultSupplierId,
      userId: 'usr_admin',
      name: 'Brain Distribution',
      code: 'BRAIN',
      defaultMarginPercent: 15,
      defaultFixedMarkup: 0,
      isActive: true,
      activeFeedsCount: 3,
      productsCount: 450,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  state.feedSources.set(defaultSupplierId, [
    {
      id: 'feed_demo_01',
      supplierId: defaultSupplierId,
      name: 'Основний XML прайс (Rozetka)',
      sourceType: FeedSourceType.URL,
      fileFormat: FeedFormat.XML_ROZETKA,
      sourceUrl: 'https://supplier.com/feeds/price.xml',
      syncIntervalHours: 24,
      autoUpdatePrices: true,
      autoUpdateStocks: true,
      autoCreateNewProducts: true,
      productsCount: 15,
      lastSyncedAt: new Date().toISOString(),
      lastSyncStatus: 'SUCCESS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'feed_demo_02',
      supplierId: defaultSupplierId,
      name: 'Prom.ua Експортний фід',
      sourceType: FeedSourceType.URL,
      fileFormat: FeedFormat.XML_ROZETKA,
      sourceUrl: 'https://supplier.com/feeds/prom.xml',
      syncIntervalHours: 24,
      autoUpdatePrices: true,
      autoUpdateStocks: true,
      autoCreateNewProducts: true,
      productsCount: 10,
      lastSyncedAt: new Date().toISOString(),
      lastSyncStatus: 'SUCCESS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'feed_demo_03',
      supplierId: defaultSupplierId,
      name: 'Google Merchant Center Feed',
      sourceType: FeedSourceType.URL,
      fileFormat: FeedFormat.CSV,
      sourceUrl: 'https://supplier.com/feeds/google.csv',
      syncIntervalHours: 24,
      autoUpdatePrices: true,
      autoUpdateStocks: true,
      autoCreateNewProducts: true,
      productsCount: 5,
      lastSyncedAt: new Date().toISOString(),
      lastSyncStatus: 'SUCCESS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  state.pricingRules.set(defaultSupplierId, [
    {
      id: 'rule_demo_01',
      supplierId: defaultSupplierId,
      categoryId: 'cat_01',
      categoryNameUk: 'Ноутбуки',
      minPrice: 10000,
      maxPrice: 50000,
      marginPercent: 12,
      fixedMarkup: 200,
      priority: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  state.exportChannels = [
    {
      id: 'chan_demo_01',
      userId: 'usr_admin',
      name: 'Rozetka Main Feed',
      marketplaceCode: 'ROZETKA',
      feedFormat: FeedFormat.XML_ROZETKA,
      slug: 'rozetka-main',
      exportUrl: 'http://localhost:1420/export/rozetka-main.xml',
      commissionPercent: 12,
      extraFixedCost: 50,
      applyReverseMarkup: true,
      isActive: true,
      pricingRulesCount: 1,
      totalProductsCount: 320,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  state.exportPricingRules.set('chan_demo_01', [
    {
      id: 'exp_rule_01',
      exportChannelId: 'chan_demo_01',
      categoryId: 'cat_01',
      categoryNameUk: 'Ноутбуки',
      commissionPercent: 10,
      marginPercent: 22,
      fixedMarkup: 150,
      priority: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const categories = ['Ноутбуки', 'Смартфони', 'Монітори', 'Аксесуари'];
  state.products = Array.from({ length: 15 }, (_, i) => {
    const cat = categories[i % categories.length];
    const basePrice = (i + 1) * 1200;
    return {
      id: `prod_${i + 1}`,
      catalogId: 'cat_main',
      supplierId: defaultSupplierId,
      feedSourceId: 'feed_demo_01',
      supplierName: 'Brain Distribution',
      supplierCode: 'BRAIN',
      sku: `SKU-DEMO-${(i + 1).toString().padStart(4, '0')}`,
      titleUk: `${cat} Pro Model ${i + 1}`,
      categoryId: `cat_${(i % categories.length) + 1}`,
      categoryNameUk: cat,
      vendor: 'TechBrand',
      price: basePrice * 1.15,
      costPrice: basePrice,
      stockQuantity: 10 + i * 2,
      inStock: true,
      currency: 'UAH',
      status: ProductStatus.ACTIVE,
      images: [
        {
          id: `img_${i + 1}_1`,
          productId: `prod_${i + 1}`,
          originalUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
          localPath: `images/originals/00/00/img_${i + 1}_1.webp`,
          thumbnailPath: `images/thumbnails/00/00/img_${i + 1}_1_thumb.webp`,
          fileHash: `hash_demo_${i + 1}_1`,
          fileSize: 45200,
          order: 0,
          isMain: true,
          status: ImageDownloadStatus.READY,
          syncStatus: ImageSyncStatus.LOCAL_ONLY,
        },
        {
          id: `img_${i + 1}_2`,
          productId: `prod_${i + 1}`,
          originalUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
          localPath: `images/originals/00/00/img_${i + 1}_2.webp`,
          thumbnailPath: `images/thumbnails/00/00/img_${i + 1}_2_thumb.webp`,
          fileHash: `hash_demo_${i + 1}_2`,
          fileSize: 62100,
          order: 1,
          isMain: false,
          status: ImageDownloadStatus.READY,
          syncStatus: ImageSyncStatus.LOCAL_ONLY,
        },
      ],
      attributes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  syncCounters(state);
}
