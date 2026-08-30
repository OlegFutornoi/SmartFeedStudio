import { localSuppliersService } from './suppliers.service';
import { localPricingService } from './pricing.service';
import { localExportService } from './export.service';
import { localProductsService } from './products.service';
import { localFeedsService } from './feeds.service';
import { mockDatabaseDriver } from './mock-driver';

export {
  localSuppliersService,
  localPricingService,
  localExportService,
  localProductsService,
  localFeedsService,
  mockDatabaseDriver,
};

export const localDb = {
  suppliers: localSuppliersService,
  pricing: localPricingService,
  export: localExportService,
  products: localProductsService,
  feeds: localFeedsService,
  mockDriver: mockDatabaseDriver,
};

export default localDb;
