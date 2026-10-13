import type {
  SupplierDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierCategoryRuleDto,
} from '@smartfeed/shared';
import { invokeLocalDb } from '@/services/local-db/client';

export class LocalSuppliersService {
  async getSuppliers(search?: string): Promise<SupplierDto[]> {
    return invokeLocalDb('db_get_suppliers', { search });
  }

  async getSupplierById(id: string): Promise<SupplierDto | null> {
    return invokeLocalDb('db_get_supplier_by_id', { id });
  }

  async createSupplier(payload: CreateSupplierDto): Promise<SupplierDto> {
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
    marginPercent?: number | null,
    fixedMarkup?: number | null,
  ): Promise<SupplierCategoryRuleDto> {
    return invokeLocalDb('db_update_supplier_category_rule', {
      supplierId,
      categoryId,
      marginPercent,
      fixedMarkup,
    });
  }
}

export const localSuppliersService = new LocalSuppliersService();
