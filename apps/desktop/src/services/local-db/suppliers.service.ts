import type { SupplierDto, CreateSupplierDto, UpdateSupplierDto } from '@smartfeed/shared';
import { invokeLocalDb } from './client';

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
}

export const localSuppliersService = new LocalSuppliersService();
