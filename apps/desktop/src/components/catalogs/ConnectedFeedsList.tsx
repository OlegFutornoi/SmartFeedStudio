import React, { useState, useMemo } from 'react';
import {
  Layers,
  CheckCircle2,
  RefreshCw,
  Search,
  FileText,
  Plus,
  Trash2,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TablePagination } from '@/components/ui/table-pagination';
import { usePagination } from '@/hooks/usePagination';
import { useTranslation } from '@/i18n';
import { FeedSourceItemDto } from '@/lib/api';
import { formatDisplayUrl, formatFeedTitle } from '@/lib/formatters';

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
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/80 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('catalogs:totalCatalogs')}</CardTitle>
            <Layers className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{feeds.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('catalogs:activeFeeds')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('catalogs:totalSkus')}</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {totalProductsCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Indexed in SQLCipher DB</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('catalogs:lastSynced')}</CardTitle>
            <CheckCircle2
              className={`size-4 ${feeds.length > 0 ? 'text-foreground' : 'text-muted-foreground'}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground flex items-center gap-2">
              <span>
                {feeds.length > 0 ? t('catalogs:statusSynced') : t('catalogs:statusIdle')}
              </span>
              {feeds.length > 0 && (
                <span className="size-2 rounded-full bg-foreground animate-pulse" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {latestSyncDate
                ? latestSyncDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : t('catalogs:neverSynced')}
            </p>
          </CardContent>
        </Card>
      </div>

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

          {feeds.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                data-testid="catalogs-search-input"
                placeholder={t('catalogs:searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-secondary/40 border border-border/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          )}
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
            <div className="divide-y divide-border/60">
              {paginatedItems.map((catalog) => (
                <div
                  key={catalog.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className="font-semibold text-sm text-foreground truncate max-w-md"
                        title={catalog.name}
                      >
                        {formatFeedTitle(catalog.name, catalog.sourceUrl)}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {catalog.fileFormat}
                      </Badge>
                    </div>
                    <p
                      className="text-xs text-muted-foreground font-mono truncate max-w-md"
                      title={catalog.sourceUrl || undefined}
                    >
                      {formatDisplayUrl(catalog.sourceUrl) ||
                        (isUk ? 'Локальний файл' : 'Local File')}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-semibold text-foreground">
                        {(catalog.productsCount ?? 0).toLocaleString()} {t('catalogs:products')}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {catalog.lastSyncedAt
                          ? new Date(catalog.lastSyncedAt).toLocaleString(
                              isUk ? 'uk-UA' : 'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )
                          : '—'}
                      </div>
                    </div>

                    <Badge
                      variant={catalog.lastSyncStatus === 'SUCCESS' ? 'secondary' : 'default'}
                      className="text-xs flex items-center gap-1"
                    >
                      {catalog.lastSyncStatus === 'SUCCESS' && (
                        <CheckCircle2 className="h-3 w-3 text-foreground" />
                      )}
                      {syncingId === catalog.id && (
                        <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                      )}
                      <span>
                        {syncingId === catalog.id
                          ? t('catalogs:statusProcessing')
                          : catalog.lastSyncStatus === 'SUCCESS'
                            ? t('catalogs:statusSynced')
                            : t('catalogs:statusError')}
                      </span>
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={syncingId === catalog.id}
                      onClick={() => onSyncFeed(catalog)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      title={t('catalogs:syncNow')}
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${syncingId === catalog.id ? 'animate-spin' : ''}`}
                      />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteFeed(catalog)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title={t('common:delete')}
                      data-testid={`delete-feed-btn-${catalog.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
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
