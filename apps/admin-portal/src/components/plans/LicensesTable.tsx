'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminLicenseItemDto } from '@smartfeed/shared';
import { SearchX } from 'lucide-react';
import { LicensesTableToolbar } from '@/components/plans/LicensesTableToolbar';
import { LicensesTableRow } from '@/components/plans/LicensesTableRow';
import { LicenseDeleteDialog } from '@/components/plans/LicenseDeleteDialog';
import { useLicensesFilter, LicensesFilterState } from '@/components/plans/useLicensesFilter';
import { TablePagination } from '@/components/ui/table-pagination';
import { usePagination } from '@/hooks/usePagination';
import { api } from '@/lib/api';

interface LicensesTableProps {
  licenses: AdminLicenseItemDto[];
  isUk: boolean;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
}

export function LicensesTable({ licenses, isUk, onRefresh, isLoading }: LicensesTableProps) {
  const [filter, setFilter] = useState<LicensesFilterState>({
    searchQuery: '',
    selectedTier: 'ALL',
    selectedStatus: 'ALL',
    selectedCloud: 'ALL',
    sortBy: 'NEWEST',
  });

  const [licenseToDelete, setLicenseToDelete] = useState<AdminLicenseItemDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { filteredLicenses, isFiltered, tierOptions, statusOptions, cloudOptions, sortOptions } =
    useLicensesFilter(licenses, filter, isUk);

  const { currentPage, pageSize, totalPages, totalItems, paginatedItems, setPage, setPageSize } =
    usePagination(filteredLicenses, {
      initialPageSize: 10,
      resetDeps: [filter],
    });

  const handleResetFilters = useCallback(() => {
    setFilter({
      searchQuery: '',
      selectedTier: 'ALL',
      selectedStatus: 'ALL',
      selectedCloud: 'ALL',
      sortBy: 'NEWEST',
    });
  }, []);

  // Optimistic status update — no full refresh needed
  const handleStatusChange = useCallback(
    async (id: string, newActive: boolean) => {
      await api.updateLicenseStatus(id, newActive);
      // Only do a background refresh; the LicenseRowActions already updates locally via optimism.
      // We still refresh to sync backend truth, but don't block the UI.
      if (onRefresh) {
        onRefresh().catch(console.error);
      }
    },
    [onRefresh],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!licenseToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteLicense(licenseToDelete.id);
      setLicenseToDelete(null);
      if (onRefresh) await onRefresh();
    } finally {
      setIsDeleting(false);
    }
  }, [licenseToDelete, onRefresh]);

  // Stable now reference for row expiration calculations
  const now = useMemo(() => new Date(), []);

  return (
    <Card
      data-testid="licenses-table-card"
      className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm flex-1 flex flex-col min-h-[580px] rounded-lg overflow-hidden"
    >
      <LicensesTableToolbar
        searchQuery={filter.searchQuery}
        onSearchChange={(v) => setFilter((f) => ({ ...f, searchQuery: v }))}
        selectedTier={filter.selectedTier}
        onTierChange={(v) => setFilter((f) => ({ ...f, selectedTier: v }))}
        tierOptions={tierOptions}
        selectedStatus={filter.selectedStatus}
        onStatusChange={(v) => setFilter((f) => ({ ...f, selectedStatus: v }))}
        statusOptions={statusOptions}
        selectedCloud={filter.selectedCloud}
        onCloudChange={(v) => setFilter((f) => ({ ...f, selectedCloud: v }))}
        cloudOptions={cloudOptions}
        sortBy={filter.sortBy}
        onSortChange={(v) => setFilter((f) => ({ ...f, sortBy: v }))}
        sortOptions={sortOptions}
        totalCount={licenses.length}
        filteredCount={filteredLicenses.length}
        isFiltered={isFiltered}
        onResetFilters={handleResetFilters}
        isUk={isUk}
        isLoading={isLoading}
        onRefresh={onRefresh}
      />

      <CardContent className="p-0 flex-1 flex flex-col">
        <Table data-testid="licenses-table">
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs">{isUk ? 'Ліцензійний ключ' : 'License Key'}</TableHead>
              <TableHead className="text-xs">{isUk ? 'Користувач' : 'User'}</TableHead>
              <TableHead className="text-xs">{isUk ? 'Тарифний план' : 'Plan Tier'}</TableHead>
              <TableHead className="text-xs">{isUk ? 'Статус' : 'Status'}</TableHead>
              <TableHead className="text-xs">{isUk ? 'Ліміт XML' : 'XML Limit'}</TableHead>
              <TableHead className="text-xs">{isUk ? 'AI Кредити' : 'AI Credits'}</TableHead>
              <TableHead className="text-xs">{isUk ? 'Хмарний бекап' : 'Cloud Backup'}</TableHead>
              <TableHead className="text-xs">{isUk ? 'Термін дії' : 'Expires At'}</TableHead>
              <TableHead className="text-right text-xs">{isUk ? 'Дії' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLicenses.length === 0 ? (
              <TableRow data-testid="licenses-empty-row">
                <TableCell colSpan={9} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-muted-foreground">
                    <SearchX className="size-8 text-muted-foreground/50" />
                    <p className="text-xs font-medium text-foreground">
                      {isUk
                        ? 'Жодної ліцензії за обраними фільтрами не знайдено'
                        : 'No licenses match your selected filters'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {isUk
                        ? 'Спробуйте змінити пошуковий запит або скинути активні фільтри.'
                        : 'Try adjusting your search terms or clearing active filters.'}
                    </p>
                    {isFiltered && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-testid="licenses-empty-reset-btn"
                        onClick={handleResetFilters}
                        className="mt-2 h-7 text-xs"
                      >
                        {isUk ? 'Скинути фільтри' : 'Clear Filters'}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((lic) => (
                <LicensesTableRow
                  key={lic.id}
                  license={lic}
                  isUk={isUk}
                  now={now}
                  onStatusChange={handleStatusChange}
                  onOpenDelete={setLicenseToDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Pagination Footer */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        isUk={isUk}
        testIdPrefix="licenses-pagination"
      />

      <LicenseDeleteDialog
        open={Boolean(licenseToDelete)}
        onOpenChange={(open) => !open && setLicenseToDelete(null)}
        license={licenseToDelete}
        isUk={isUk}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </Card>
  );
}
