import type {
  SupplierDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierCategoryRuleDto,
  UpdateSupplierCategoryRuleDto,
  MarketplaceCategoryDto,
  CreateMarketplaceCategoryDto,
  UpdateMarketplaceCategoryDto,
  LocalSupplierCategoryMarketplaceMapDto,
} from '@smartfeed/shared';
import { invokeLocalDb } from '@/services/local-db/client';

export class LocalSuppliersService {
  async getSuppliers(search?: string): Promise<SupplierDto[]> {
    return invokeLocalDb('db_get_suppliers', { search });
  }

  async getSupplierById(id: string): Promise<SupplierDto | null> {
    return invokeLocalDb('db_get_supplier_by_id', { id });
  }

  async createSupplier(payload: CreateSupplierDto & { id?: string }): Promise<SupplierDto> {
    return invokeLocalDb('db_create_supplier', { payload });
  }

  async updateSupplier(id: string, payload: UpdateSupplierDto): Promise<SupplierDto> {
    return invokeLocalDb('db_update_supplier', { id, payload });
  }

  async deleteSupplier(id: string): Promise<boolean> {
    return invokeLocalDb('db_delete_supplier', { id });
  }

  async getSupplierCategories(
    supplierId: string,
    search?: string,
  ): Promise<SupplierCategoryRuleDto[]> {
    return invokeLocalDb('db_get_supplier_categories', { supplierId, search });
  }

  async toggleSupplierCategory(
    supplierId: string,
    categoryId: string,
    isActive: boolean,
  ): Promise<SupplierCategoryRuleDto> {
    return invokeLocalDb('db_toggle_supplier_category', { supplierId, categoryId, isActive });
  }

  async batchToggleSupplierCategories(
    supplierId: string,
    categoryIds: string[],
    isActive: boolean,
  ): Promise<{ updatedCount: number }> {
    return invokeLocalDb('db_batch_toggle_supplier_categories', {
      supplierId,
      categoryIds,
      isActive,
    });
  }

  async updateSupplierCategoryRule(
    supplierId: string,
    categoryId: string,
    marginOrPayload?: number | null | UpdateSupplierCategoryRuleDto,
    fixedMarkup?: number | null,
  ): Promise<SupplierCategoryRuleDto> {
    const isObj = typeof marginOrPayload === 'object' && marginOrPayload !== null;
    return invokeLocalDb('db_update_supplier_category_rule', {
      supplierId,
      categoryId,
      marginPercent: isObj ? marginOrPayload.marginPercent : marginOrPayload,
      fixedMarkup: isObj ? marginOrPayload.fixedMarkup : fixedMarkup,
      payload: isObj ? marginOrPayload : { marginPercent: marginOrPayload, fixedMarkup },
    });
  }

  async getMarketplaceCategories(
    marketplaceCode?: string,
    search?: string,
  ): Promise<MarketplaceCategoryDto[]> {
    return invokeLocalDb('db_get_marketplace_categories', { marketplaceCode, search });
  }

  async createMarketplaceCategory(
    payload: CreateMarketplaceCategoryDto,
  ): Promise<MarketplaceCategoryDto> {
    return invokeLocalDb('db_create_marketplace_category', { payload });
  }

  async updateMarketplaceCategory(
    id: string,
    payload: UpdateMarketplaceCategoryDto,
  ): Promise<MarketplaceCategoryDto> {
    return invokeLocalDb('db_update_marketplace_category', { id, payload });
  }

  async importMarketplaceCategories(
    items: CreateMarketplaceCategoryDto[],
  ): Promise<{ importedCount: number }> {
    return invokeLocalDb('db_import_marketplace_categories', { items });
  }

  async autoMapSupplierCategories(
    supplierId: string,
    marketplaceCode?: string,
  ): Promise<{ mappedCount: number; categories: SupplierCategoryRuleDto[] }> {
    return invokeLocalDb('db_auto_map_supplier_categories', { supplierId, marketplaceCode });
  }

  async getSupplierCategoryMarketplaceMaps(
    supplierCategoryRuleId?: string,
  ): Promise<LocalSupplierCategoryMarketplaceMapDto[]> {
    return invokeLocalDb('db_get_supplier_category_marketplace_maps', { supplierCategoryRuleId });
  }

  async upsertSupplierCategoryMarketplaceMap(
    payload: Partial<LocalSupplierCategoryMarketplaceMapDto> & {
      supplierCategoryRuleId: string;
      marketplaceCode: string;
      externalCategoryId: string;
      externalCategoryName: string;
    },
  ): Promise<LocalSupplierCategoryMarketplaceMapDto> {
    return invokeLocalDb('db_upsert_supplier_category_marketplace_map', { payload });
  }

  async deleteSupplierCategoryMarketplaceMap(
    supplierCategoryRuleId: string,
    marketplaceCode: string,
  ): Promise<void> {
    return invokeLocalDb('db_delete_supplier_category_marketplace_map', {
      supplierCategoryRuleId,
      marketplaceCode,
    });
  }
}

export const localSuppliersService = new LocalSuppliersService();
