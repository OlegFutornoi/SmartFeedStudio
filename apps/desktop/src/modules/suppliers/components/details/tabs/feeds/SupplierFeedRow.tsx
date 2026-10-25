import React from 'react';
import { FileText, Globe, CheckCircle2, Coins, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableRow, TableCell } from '@/components/ui/table';
import { FeedSourceType, getCurrencySymbol } from '@smartfeed/shared';
import type { FeedSourceItemDto } from '@/lib/api';
import { useTranslation } from '@/i18n';

interface SupplierFeedRowProps {
  source: FeedSourceItemDto;
  isSyncing: boolean;
  onConfigureCurrency: (src: FeedSourceItemDto) => void;
  onSync: (id: string) => void;
  onDelete: (src: FeedSourceItemDto) => void;
}

export const SupplierFeedRow: React.FC<SupplierFeedRowProps> = ({
  source: src,
  isSyncing,
  onConfigureCurrency,
  onSync,
  onDelete,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const isFile = src.sourceType === FeedSourceType.FILE;

  return (
    <TableRow className="h-12 border-b border-border/60 hover:bg-muted/40">
      <TableCell className="pl-3.5 py-2 font-medium text-foreground">
        <div className="flex items-center gap-2">
          {isFile ? (
            <FileText className="size-4 text-muted-foreground shrink-0" />
          ) : (
            <Globe className="size-4 text-muted-foreground shrink-0" />
          )}
          <div className="truncate max-w-[220px]">
            <p className="font-medium truncate">{src.name}</p>
            {src.sourceUrl && (
              <p className="text-2xs text-muted-foreground font-mono truncate">{src.sourceUrl}</p>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell className="py-2">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-2xs font-mono h-5">
            {src.fileFormat}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {isFile
              ? t('suppliers:localFile', { defaultValue: 'Локальний файл' })
              : t('suppliers:urlStream', { defaultValue: 'URL потік' })}
          </span>
        </div>
      </TableCell>

      <TableCell className="py-2 text-center font-mono font-medium">
        {(src.productsCount || 0).toLocaleString()}
      </TableCell>

      <TableCell className="py-2 text-center">
        <Badge
          variant="outline"
          className="text-2xs font-mono tabular-nums px-2 py-0.5"
          data-testid={`feed-currency-badge-${src.id}`}
        >
          {src.baseCurrency === 'UAH' || !src.baseCurrency
            ? 'UAH (₴) • 1:1'
            : `${src.baseCurrency} (${getCurrencySymbol(src.baseCurrency)}) • ${src.exchangeRate?.toFixed(2) || '1.00'} ₴${src.currencyBufferPercent ? ` (+${src.currencyBufferPercent}%)` : ''}`}
        </Badge>
      </TableCell>

      <TableCell className="py-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-success" />
          <span>
            {src.lastSyncedAt
              ? new Date(src.lastSyncedAt).toLocaleDateString()
              : t('suppliers:justNow', { defaultValue: 'Щойно' })}
          </span>
        </div>
      </TableCell>

      <TableCell className="pr-3.5 py-2 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onConfigureCurrency(src)}
            className="h-7 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground"
            data-testid={`configure-feed-currency-${src.id}`}
            title={t('suppliers:configureFeedCurrency', {
              defaultValue: 'Налаштувати валюту та курс',
            })}
          >
            <Coins className="size-3 text-primary" />
            <span>{t('suppliers:currency', { defaultValue: 'Валюта' })}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSync(src.id)}
            disabled={isSyncing}
            className="h-7 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground"
            data-testid={`sync-feed-source-${src.id}`}
          >
            <RefreshCw className={`size-3 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
            <span>{t('suppliers:syncNow', { defaultValue: 'Синхронізувати' })}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(src)}
            className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            title={t('common:delete', { defaultValue: 'Видалити' })}
            data-testid={`delete-feed-source-${src.id}`}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
