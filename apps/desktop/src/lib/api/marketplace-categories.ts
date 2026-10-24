import type {
  CreateMarketplaceCategoryDto,
  UpdateMarketplaceCategoryDto,
  MarketplaceCategoryDto,
  LocalSupplierCategoryMarketplaceMapDto,
  SupplierCategoryRuleDto,
} from '@smartfeed/shared';
import { localDb } from '@/services/local-db';

export async function getMarketplaceCategories(
  marketplaceCode?: string,
  search?: string,
  _token?: string,
): Promise<MarketplaceCategoryDto[]> {
  return localDb.suppliers.getMarketplaceCategories(marketplaceCode, search);
}

export async function createMarketplaceCategory(
  payload: CreateMarketplaceCategoryDto,
  _token?: string,
): Promise<MarketplaceCategoryDto> {
  return localDb.suppliers.createMarketplaceCategory(payload);
}

export async function updateMarketplaceCategory(
  id: string,
  payload: UpdateMarketplaceCategoryDto,
  _token?: string,
): Promise<MarketplaceCategoryDto> {
  return localDb.suppliers.updateMarketplaceCategory(id, payload);
}

export async function importMarketplaceCategories(
  items: CreateMarketplaceCategoryDto[],
  _token?: string,
): Promise<{ importedCount: number }> {
  return localDb.suppliers.importMarketplaceCategories(items);
}

export async function autoMapSupplierCategories(
  supplierId: string,
  marketplaceCode = 'ROZETKA',
  _token?: string,
): Promise<{ mappedCount: number; categories: SupplierCategoryRuleDto[] }> {
  return localDb.suppliers.autoMapSupplierCategories(supplierId, marketplaceCode);
}

export async function getSupplierCategoryMarketplaceMaps(
  supplierCategoryRuleId?: string,
): Promise<LocalSupplierCategoryMarketplaceMapDto[]> {
  return localDb.suppliers.getSupplierCategoryMarketplaceMaps(supplierCategoryRuleId);
}

export async function upsertSupplierCategoryMarketplaceMap(
  payload: Partial<LocalSupplierCategoryMarketplaceMapDto> & {
    supplierCategoryRuleId: string;
    marketplaceCode: string;
    externalCategoryId: string;
    externalCategoryName: string;
  },
): Promise<LocalSupplierCategoryMarketplaceMapDto> {
  return localDb.suppliers.upsertSupplierCategoryMarketplaceMap(payload);
}

export async function deleteSupplierCategoryMarketplaceMap(
  supplierCategoryRuleId: string,
  marketplaceCode: string,
): Promise<void> {
  return localDb.suppliers.deleteSupplierCategoryMarketplaceMap(
    supplierCategoryRuleId,
    marketplaceCode,
  );
}
