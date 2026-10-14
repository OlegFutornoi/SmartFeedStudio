import React from 'react';
import { CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FeedSourceItemDto } from '@/lib/api';
import { formatDisplayUrl, formatFeedTitle } from '@/lib/formatters';
import { FeedColumnId } from '@/components/catalogs/connectedFeedsColumns.config';
import { useTranslation } from '@/i18n';

interface ConnectedFeedsTableRowProps {
  catalog: FeedSourceItemDto;
  visibleColumns: Record<FeedColumnId, boolean>;
  syncingId: string | null;
  isUk: boolean;
  onSyncFeed: (feed: FeedSourceItemDto) => void;
  onDeleteFeed: (feed: FeedSourceItemDto) => void;
}

export const ConnectedFeedsTableRow: React.FC<ConnectedFeedsTableRowProps> = ({
  catalog,
  visibleColumns,
  syncingId,
  isUk,
  onSyncFeed,
  onDeleteFeed,
}) => {
  const { t } = useTranslation(['catalogs', 'common']);

  return (
    <TableRow className="hover:bg-muted/30 transition-colors border-b border-border/40 text-xs">
      {visibleColumns.feed && (
        <TableCell className="px-3 py-2">
          <div className="flex items-center gap-2">
            <span
              className="font-medium text-xs text-foreground truncate max-w-xs"
              title={catalog.name}
            >
              {formatFeedTitle(catalog.name, catalog.sourceUrl)}
            </span>
            <Badge variant="outline" className="text-2xs font-mono h-4.5 px-1.5">
              {catalog.fileFormat}
            </Badge>
          </div>
        </TableCell>
      )}
      {visibleColumns.source && (
        <TableCell className="px-3 py-2">
          <span
            className="text-xs font-mono text-muted-foreground truncate block max-w-xs"
            title={catalog.sourceUrl || undefined}
          >
            {formatDisplayUrl(catalog.sourceUrl) || (isUk ? 'Локальний файл' : 'Local File')}
          </span>
        </TableCell>
      )}
      {visibleColumns.products && (
        <TableCell className="px-3 py-2 text-right">
          <span className="font-semibold text-xs text-foreground">
            {(catalog.productsCount ?? 0).toLocaleString()}
          </span>
        </TableCell>
      )}
      {visibleColumns.lastSynced && (
        <TableCell className="px-3 py-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {catalog.lastSyncedAt
              ? new Date(catalog.lastSyncedAt).toLocaleString(isUk ? 'uk-UA' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </span>
        </TableCell>
      )}
      {visibleColumns.status && (
        <TableCell className="px-3 py-2">
          <Badge
            variant={catalog.lastSyncStatus === 'SUCCESS' ? 'secondary' : 'default'}
            className="text-2xs h-5 px-1.5 flex items-center gap-1 w-fit"
          >
            {catalog.lastSyncStatus === 'SUCCESS' && (
              <CheckCircle2 className="size-3 text-foreground" />
            )}
            {syncingId === catalog.id && <RefreshCw className="size-3 animate-spin text-primary" />}
            <span>
              {syncingId === catalog.id
                ? t('catalogs:statusProcessing')
                : catalog.lastSyncStatus === 'SUCCESS'
                  ? t('catalogs:statusSynced')
                  : t('catalogs:statusError')}
            </span>
          </Badge>
        </TableCell>
      )}
      {visibleColumns.actions && (
        <TableCell className="px-3 py-2 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={syncingId === catalog.id}
              onClick={() => onSyncFeed(catalog)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title={t('catalogs:syncNow')}
            >
              <RefreshCw className={`size-3.5 ${syncingId === catalog.id ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteFeed(catalog)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title={t('common:delete')}
              data-testid={`delete-feed-btn-${catalog.id}`}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
};
