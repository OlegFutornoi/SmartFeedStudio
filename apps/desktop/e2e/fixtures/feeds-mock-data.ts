export const mockFeedSources = [
  {
    id: 'src_feed_1',
    supplierId: 'sup_test_1',
    name: 'Livolo Main XML',
    sourceType: 'URL',
    fileFormat: 'XML_ROZETKA',
    sourceUrl: 'https://livolo.kiev.ua/products_feed.xml',
    autoUpdatePrices: true,
    autoUpdateStocks: true,
    lastSyncedAt: new Date().toISOString(),
    lastSyncStatus: 'SUCCESS',
    productsCount: 250,
  },
];

export const mockAnalysis = {
  format: 'XML_ROZETKA',
  totalDetected: 50,
  categoriesCount: 3,
  categories: [
    { id: '101', externalId: '101', name: 'Сенсорні вимикачі', productCount: 30 },
    { id: '102', externalId: '102', name: 'Розумні розетки', productCount: 15 },
    { id: '103', externalId: '103', name: 'Рамки для вимикачів', productCount: 5 },
  ],
  sampleCategories: [{ externalId: '101', name: 'Сенсорні вимикачі' }],
  sampleProducts: [
    {
      sku: 'VL-C701-11',
      titleUk: 'Сенсорний вимикач 1-клавішний білий',
      costPrice: 500,
      price: 725,
      currency: 'UAH',
      stockQuantity: 20,
      inStock: true,
      images: [],
    },
  ],
};

export const constrainedFeedAnalysis = {
  format: 'XML_ROZETKA',
  totalDetected: 55,
  categoriesCount: 2,
  categories: [
    { id: 'cat_1', name: 'Сенсорні вимикачі', productCount: 30 },
    { id: 'cat_2', name: 'Розумні розетки', productCount: 25 },
  ],
  sampleProducts: [
    {
      sku: 'VL-C701-11',
      titleUk: 'Сенсорний вимикач 1-клавішний білий',
      price: 900,
      costPrice: 650,
      inStock: true,
      images: [],
    },
  ],
};
