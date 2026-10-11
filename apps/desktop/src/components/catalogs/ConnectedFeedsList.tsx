import React, { useState, useMemo } from 'react';
import { Search, Plus, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TablePagination } from '@/components/ui/table-pagination';
import { usePagination } from '@/hooks/usePagination';
import { useTranslation } from '@/i18n';
import { FeedSourceItemDto } from '@/lib/api';
import { DataTableViewOptions } from '@/components/ui/DataTableViewOptions';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import { FeedColumnId, FEED_COLUMNS } from '@/components/catalogs/connectedFeedsColumns.config';
import { ConnectedFeedsMetrics } from '@/components/catalogs/ConnectedFeedsMetrics';
import { ConnectedFeedsTableRow } from '@/components/catalogs/ConnectedFeedsTableRow';

export type { FeedColumnId };

interface ConnectedFeedsListProps {
  feeds: FeedSourceItemDto[];
  totalProductsCount: number;
  syncingId: string | null;
  isFeedLimitReached: boolean;
  isUk: boolean;
  onSyncFeed: (feed: FeedSourceItemDto) => void;
  onDeleteFeed: (feed: FeedSourceItemDto) => void;
  onOpenImportWizard: () => void;
}

export const ConnectedFeedsList: React.FC<ConnectedFeedsListProps> = ({
  feeds,
  totalProductsCount,
  syncingId,
  isFeedLimitReached,
  isUk,
  onSyncFeed,
  onDeleteFeed,
  onOpenImportWizard,
}) => {
  const { t } = useTranslation(['catalogs', 'common']);
  const [search, setSearch] = useState('');

  const { visibleColumns, toggleColumn, resetToDefaults, columnOptions } =
    useColumnVisibility<FeedColumnId>('desktop_feeds_columns', FEED_COLUMNS, isUk);

  const filteredCatalogs = useMemo(
    () =>
      feeds.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.fileFormat.toLowerCase().includes(search.toLowerCase()) ||
          (c.sourceUrl && c.sourceUrl.toLowerCase().includes(search.toLowerCase())),
      ),
    [feeds, search],
  );

  const { currentPage, pageSize, totalPages, totalItems, paginatedItems, setPage, setPageSize } =
    usePagination(filteredCatalogs, {
      initialPageSize: 10,
      resetDeps: [search],
    });

  const latestSyncDate = useMemo(() => {
    const dates = feeds
      .map((f) => (f.lastSyncedAt ? new Date(f.lastSyncedAt).getTime() : 0))
      .filter((d) => d > 0);
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates));
  }, [feeds]);

  return (
    <>
      {/* Metrics Row */}
      <ConnectedFeedsMetrics
        totalFeeds={feeds.length}
        totalProductsCount={totalProductsCount}
        latestSyncDate={latestSyncDate}
      />

      {/* Search & Catalogs List */}
      <Card className="border-border/80 bg-card/60 backdrop-blur-md overflow-hidden flex flex-col">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
          <div>
            <CardTitle className="text-base font-semibold">
              {t('catalogs:connectedFeeds')}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('catalogs:connectedFeedsDesc')}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {feeds.length > 0 && (
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  data-testid="catalogs-search-input"
                  placeholder={t('catalogs:searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-secondary/40 border border-border/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            )}
            {feeds.length > 0 && (
              <DataTableViewOptions<FeedColumnId>
                columnOptions={columnOptions}
                onToggleColumn={toggleColumn}
                onResetDefaults={resetToDefaults}
                isUk={isUk}
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1">
          {filteredCatalogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="p-3 bg-secondary/50 rounded-2xl border border-border/60 text-muted-foreground">
                <Radio className="size-8 stroke-[1.5]" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-semibold text-foreground">
                  {search ? t('catalogs:emptySearch') : t('catalogs:noFeedsTitle')}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {search ? t('catalogs:emptySearchDesc') : t('catalogs:noFeedsDesc')}
                </p>
              </div>
              {!search && (
                <Button
                  onClick={onOpenImportWizard}
                  disabled={isFeedLimitReached}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="size-3.5" />
                  <span>{t('catalogs:connectFeedBtn')}</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-b border-border/60 hover:bg-transparent">
                    {visibleColumns.feed && (
                      <TableHead className="h-9 px-3 py-2 text-xs font-semibold text-muted-foreground">
                        {isUk ? 'Назва та формат' : 'Feed & Format'}
                      </TableHead>
                    )}
                    {visibleColumns.source && (
                      <TableHead className="h-9 px-3 py-2 text-xs font-semibold text-muted-foreground">
                        {isUk ? 'Джерело / URL' : 'Source / URL'}
                      </TableHead>
                    )}
                    {visibleColumns.products && (
                      <TableHead className="h-9 px-3 py-2 text-xs font-semibold text-muted-foreground text-right">
                        {isUk ? 'Товарів' : 'Products'}
                      </TableHead>
                    )}
                    {visibleColumns.lastSynced && (
                      <TableHead className="h-9 px-3 py-2 text-xs font-semibold text-muted-foreground">
                        {isUk ? 'Остання синхронізація' : 'Last Synced'}
                      </TableHead>
                    )}
                    {visibleColumns.status && (
                      <TableHead className="h-9 px-3 py-2 text-xs font-semibold text-muted-foreground">
                        {isUk ? 'Статус' : 'Status'}
                      </TableHead>
                    )}
                    {visibleColumns.actions && (
                      <TableHead className="h-9 px-3 py-2 text-xs font-semibold text-muted-foreground text-right">
                        {isUk ? 'Дії' : 'Actions'}
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((catalog) => (
                    <ConnectedFeedsTableRow
                      key={catalog.id}
                      catalog={catalog}
                      visibleColumns={visibleColumns}
                      syncingId={syncingId}
                      isUk={isUk}
                      onSyncFeed={onSyncFeed}
                      onDeleteFeed={onDeleteFeed}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination Footer */}
        {filteredCatalogs.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 25, 50]}
            isUk={isUk}
            testIdPrefix="catalogs-pagination"
          />
        )}
      </Card>
    </>
  );
};
