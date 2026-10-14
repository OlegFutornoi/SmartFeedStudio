import React, { useState, useEffect, useCallback } from 'react';
import { Rss, Plus, RefreshCw, Trash2, FileText, Globe, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { FeedSourceType, SupplierDto } from '@smartfeed/shared';
import {
  getSupplierFeedSources,
  deleteSupplierFeedSource,
  type FeedSourceItemDto,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { useDataSync } from '@/lib/syncEvents';

interface SupplierFeedsTabProps {
  supplier: SupplierDto;
  onConnectFeed: () => void;
  onRefreshSupplier: () => void;
}

export const SupplierFeedsTab: React.FC<SupplierFeedsTabProps> = ({
  supplier,
  onConnectFeed,
  onRefreshSupplier,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const { token } = useAuth();
  const [sources, setSources] = useState<FeedSourceItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [feedToDelete, setFeedToDelete] = useState<FeedSourceItemDto | null>(null);

  const loadSources = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSupplierFeedSources(supplier.id, token || undefined);
      setSources(data || []);
    } catch (err) {
      console.warn('[SupplierFeedsTab:loadSources] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supplier.id, token]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  useDataSync(['feeds', 'all'], () => {
    loadSources();
  });

  const handleDeleteSource = async (sourceId: string) => {
    try {
      await deleteSupplierFeedSource(supplier.id, sourceId, token || undefined, false);
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
      onRefreshSupplier();
    } catch (err) {
      console.warn('[SupplierFeedsTab:handleDeleteSource] Error:', err);
    }
  };

  const handleSyncSource = async (sourceId: string) => {
    setSyncingId(sourceId);
    setTimeout(() => {
      setSyncingId(null);
      onRefreshSupplier();
    }, 1200);
  };

  return (
    <div className="space-y-4" data-testid="supplier-feeds-tab">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t('suppliers:tabFeedsTitle', { defaultValue: 'Підключені фіди:' })}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('suppliers:tabFeedsDesc', {
              defaultValue: 'Автоматичні XML/CSV URL-посилання та додані локальні файли каталогу',
            })}
          </p>
        </div>
        {sources.length > 0 && (
          <Button
            onClick={onConnectFeed}
            size="sm"
            className="h-8 text-xs gap-1.5"
            data-testid="connect-feed-btn"
          >
            <Plus className="size-3.5" />
            {t('suppliers:connectNewFeed', { defaultValue: 'Підключити новий фід' })}
          </Button>
        )}
      </div>

      {isLoading ? (
        <Card className="border border-border/80 bg-card/40 p-8 text-center">
          <p className="text-xs text-muted-foreground animate-pulse">
            {t('common:loading', { defaultValue: 'Завантаження...' })}
          </p>
        </Card>
      ) : sources.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-card/40 p-8 text-center">
          <div className="flex flex-col items-center justify-center gap-2.5">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Rss className="size-5" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">
              {t('suppliers:noFeedsTitle', { defaultValue: 'Немає підключених фідів' })}
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              {t('suppliers:noFeedsDesc', {
                defaultValue: 'Додайте XML/CSV посилання або завантажте файл для імпорту товарів',
              })}
            </p>
            <Button
              onClick={onConnectFeed}
              size="sm"
              className="mt-2 text-xs gap-1.5"
              data-testid="connect-feed-btn"
            >
              <Plus className="size-3.5" />
              {t('suppliers:connectFirstFeed', { defaultValue: 'Додати перший фід' })}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-xs">
          <Table className="text-xs">
            {/* 100% Solid Sticky Header */}
            <TableHeader className="sticky top-0 bg-card z-10 border-b border-border/80">
              <TableRow className="h-9 hover:bg-transparent">
                <TableHead className="pl-3.5 font-semibold text-foreground">
                  {t('suppliers:columnFeedName', { defaultValue: 'Назва джерела' })}
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  {t('suppliers:columnTypeFormat', { defaultValue: 'Тип / Формат' })}
                </TableHead>
                <TableHead className="font-semibold text-foreground text-center">
                  {t('suppliers:columnProducts', { defaultValue: 'Товари' })}
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  {t('suppliers:columnLastSync', { defaultValue: 'Остання синхронізація' })}
                </TableHead>
                <TableHead className="pr-3.5 text-right font-semibold text-foreground">
                  {t('common:actions', { defaultValue: 'Дії' })}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((src) => {
                const isFile = src.sourceType === FeedSourceType.FILE;
                const isSyncing = syncingId === src.id;

                return (
                  <TableRow
                    key={src.id}
                    className="h-12 border-b border-border/60 hover:bg-muted/40"
                  >
                    <TableCell className="pl-3.5 py-2 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {isFile ? (
                          <FileText className="size-4 text-amber-500 shrink-0" />
                        ) : (
                          <Globe className="size-4 text-sky-500 shrink-0" />
                        )}
                        <div className="truncate max-w-[220px]">
                          <p className="font-medium truncate">{src.name}</p>
                          {src.sourceUrl && (
                            <p className="text-2xs text-muted-foreground font-mono truncate">
                              {src.sourceUrl}
                            </p>
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
                          {isFile ? 'Локальний файл' : 'URL потік'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-2 text-center font-mono font-medium">
                      {(src.productsCount || 0).toLocaleString()}
                    </TableCell>

                    <TableCell className="py-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        <span>
                          {src.lastSyncedAt
                            ? new Date(src.lastSyncedAt).toLocaleDateString()
                            : 'Щойно'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="pr-3.5 py-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncSource(src.id)}
                          disabled={isSyncing}
                          className="h-7 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground"
                          data-testid={`sync-feed-source-${src.id}`}
                        >
                          <RefreshCw
                            className={`size-3 ${isSyncing ? 'animate-spin text-primary' : ''}`}
                          />
                          <span>Синхронізувати</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setFeedToDelete(src)}
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
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Confirm Delete Feed Dialog */}
      <ConfirmDeleteDialog
        isOpen={!!feedToDelete}
        onClose={() => setFeedToDelete(null)}
        onConfirm={async () => {
          if (!feedToDelete) return;
          await handleDeleteSource(feedToDelete.id);
          setFeedToDelete(null);
        }}
        title="Видалити підключений фід?"
        description={`Ви впевнені, що бажаєте видалити джерело "${feedToDelete?.name}"? Всі імпортовані товари будуть очищені.`}
      />
    </div>
  );
};
