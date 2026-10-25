import { localSuppliersService } from '@/services/local-db/suppliers.service';
import { localPricingService } from '@/services/local-db/pricing.service';
import { localExportService } from '@/services/local-db/export.service';
import { localProductsService } from '@/services/local-db/products.service';
import { localFeedsService } from '@/services/local-db/feeds.service';
import { localImagesService } from '@/services/local-db/images.service';
import { localCountersService } from '@/services/local-db/counters.service';
import { localCurrenciesService } from '@/services/local-db/currencies.service';
import { mockDatabaseDriver } from '@/services/local-db/mock-driver';

export {
  localSuppliersService,
  localPricingService,
  localExportService,
  localProductsService,
  localFeedsService,
  localImagesService,
  localCountersService,
  localCurrenciesService,
  mockDatabaseDriver,
};

export const localDb = {
  suppliers: localSuppliersService,
  pricing: localPricingService,
  export: localExportService,
  products: localProductsService,
  feeds: localFeedsService,
  images: localImagesService,
  counters: localCountersService,
  currencies: localCurrenciesService,
  mockDriver: mockDatabaseDriver,
};

export default localDb;
