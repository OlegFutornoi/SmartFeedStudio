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
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import { DataTableColumnHeader } from '@/components/ui/DataTableColumnHeader';
import { api } from '@/lib/api';
import { LicenseColumnId, LICENSE_COLUMNS } from '@/components/plans/licensesColumns.config';

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
    sortBy: 'NEWEST',
  });

  const [licenseToDelete, setLicenseToDelete] = useState<AdminLicenseItemDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { visibleColumns, toggleColumn, resetToDefaults, columnOptions } =
    useColumnVisibility<LicenseColumnId>('admin_licenses', LICENSE_COLUMNS, isUk);

  const { filteredLicenses, isFiltered, tierOptions, statusOptions } = useLicensesFilter(
    licenses,
    filter,
    isUk,
  );

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
      sortBy: 'NEWEST',
    });
  }, []);

  const handleStatusChange = useCallback(
    async (id: string, newActive: boolean) => {
      await api.updateLicenseStatus(id, newActive);
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

  const now = useMemo(() => new Date(), []);
  const visibleColumnCount = useMemo(() => {
    return LICENSE_COLUMNS.filter((col) => visibleColumns[col.id] !== false).length;
  }, [visibleColumns]);

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
        columnOptions={columnOptions}
        onToggleColumn={toggleColumn}
        onResetColumns={resetToDefaults}
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
              <TableHead data-testid="th-key" className="text-xs">
                {isUk ? 'Ліцензійний ключ' : 'License Key'}
              </TableHead>
              <TableHead data-testid="th-user" className="text-xs">
                {isUk ? 'Користувач' : 'User'}
              </TableHead>
              {visibleColumns.tier !== false && (
                <TableHead data-testid="th-tier" className="text-xs">
                  {isUk ? 'Тарифний план' : 'Plan Tier'}
                </TableHead>
              )}
              {visibleColumns.status !== false && (
                <TableHead data-testid="th-status" className="text-xs">
                  {isUk ? 'Статус' : 'Status'}
                </TableHead>
              )}
              {visibleColumns.xmlLimit !== false && (
                <TableHead data-testid="th-xml-limit" className="text-xs">
                  <DataTableColumnHeader
                    title={isUk ? 'Ліміт XML' : 'XML Limit'}
                    isSorted={filter.sortBy === 'XML_DESC' ? 'desc' : false}
                    onToggleSort={() =>
                      setFilter((f) => ({
                        ...f,
                        sortBy: f.sortBy === 'XML_DESC' ? 'NEWEST' : 'XML_DESC',
                      }))
                    }
                  />
                </TableHead>
              )}
              {visibleColumns.aiCredits !== false && (
                <TableHead data-testid="th-ai-credits" className="text-xs">
                  <DataTableColumnHeader
                    title={isUk ? 'AI Кредити' : 'AI Credits'}
                    isSorted={filter.sortBy === 'AI_DESC' ? 'desc' : false}
                    onToggleSort={() =>
                      setFilter((f) => ({
                        ...f,
                        sortBy: f.sortBy === 'AI_DESC' ? 'NEWEST' : 'AI_DESC',
                      }))
                    }
                  />
                </TableHead>
              )}
              {visibleColumns.cloudBackup !== false && (
                <TableHead data-testid="th-cloud-backup" className="text-xs">
                  {isUk ? 'Хмарний бекап' : 'Cloud Backup'}
                </TableHead>
              )}
              {visibleColumns.expiresAt !== false && (
                <TableHead data-testid="th-expires" className="text-xs">
                  <DataTableColumnHeader
                    title={isUk ? 'Термін дії' : 'Expires At'}
                    isSorted={filter.sortBy === 'EXPIRY_ASC' ? 'asc' : false}
                    onToggleSort={() =>
                      setFilter((f) => ({
                        ...f,
                        sortBy: f.sortBy === 'EXPIRY_ASC' ? 'NEWEST' : 'EXPIRY_ASC',
                      }))
                    }
                  />
                </TableHead>
              )}
              <TableHead data-testid="th-actions" className="text-right text-xs">
                {isUk ? 'Дії' : 'Actions'}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLicenses.length === 0 ? (
              <TableRow data-testid="licenses-empty-row">
                <TableCell colSpan={visibleColumnCount} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-muted-foreground">
                    <SearchX className="size-8 text-muted-foreground/50" />
                    <p className="text-xs font-medium text-foreground">
                      {isUk
                        ? 'Жодної ліцензії за обраними фільтрами не знайдено'
                        : 'No licenses match your selected filters'}
                    </p>
                    <p className="text-xs text-muted-foreground">
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
                  visibleColumns={visibleColumns}
                  onStatusChange={handleStatusChange}
                  onOpenDelete={setLicenseToDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {totalItems > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          isUk={isUk}
          testIdPrefix="licenses-pagination"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <LicenseDeleteDialog
        open={Boolean(licenseToDelete)}
        onOpenChange={(open) => !open && setLicenseToDelete(null)}
        license={licenseToDelete}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        isUk={isUk}
      />
    </Card>
  );
}
