import { useState, useMemo } from 'react';
import { SupplierDto } from '@smartfeed/shared';
import { usePagination } from '@/hooks/usePagination';
import type { SupplierFiltersState } from '@/modules/suppliers/types';

export function useSuppliersFilterPagination(suppliers: SupplierDto[]) {
  const [filters, setFilters] = useState<SupplierFiltersState>({
    search: '',
    currency: 'ALL',
    status: 'ALL',
  });

  const handleFilterChange = (patch: Partial<SupplierFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchesSearch =
        !filters.search ||
        s.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.code.toLowerCase().includes(filters.search.toLowerCase());

      const matchesCurrency = filters.currency === 'ALL' || s.baseCurrency === filters.currency;

      const matchesStatus =
        filters.status === 'ALL' ||
        (filters.status === 'ACTIVE' && s.isActive) ||
        (filters.status === 'INACTIVE' && !s.isActive);

      return matchesSearch && matchesCurrency && matchesStatus;
    });
  }, [suppliers, filters]);

  const pagination = usePagination<SupplierDto>(filteredSuppliers, {
    initialPageSize: 10,
    resetDeps: [filters.search, filters.currency, filters.status],
  });

  return {
    filters,
    handleFilterChange,
    filteredSuppliers,
    ...pagination,
  };
}
