import React, { useState, useEffect, useCallback } from 'react';
import { Rss, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { Table, TableHeader, TableBody, TableRow, TableHead } from '@/components/ui/table';
import type { SupplierDto } from '@smartfeed/shared';
import {
  getSupplierFeedSources,
  deleteSupplierFeedSource,
  syncSupplierFeedSource,
  type FeedSourceItemDto,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { useDataSync } from '@/lib/syncEvents';
import { SupplierCurrenciesTab } from '@/modules/suppliers/components/details/tabs/SupplierCurrenciesTab';
import { SupplierFeedRow } from '@/modules/suppliers/components/details/tabs/feeds/SupplierFeedRow';

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
  const [selectedFeedForCurrency, setSelectedFeedForCurrency] = useState<FeedSourceItemDto | null>(
    null,
  );

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
      await deleteSupplierFeedSource(supplier.id, sourceId, token || undefined, true);
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
      onRefreshSupplier();
    } catch (err) {
      console.warn('[SupplierFeedsTab:handleDeleteSource] Error:', err);
    }
  };

  const handleSyncSource = async (sourceId: string) => {
    setSyncingId(sourceId);
    try {
      await syncSupplierFeedSource(supplier.id, sourceId, token || undefined);
      await loadSources();
      onRefreshSupplier();
    } catch (err) {
      console.warn('[SupplierFeedsTab:handleSyncSource] Error:', err);
    } finally {
      setSyncingId(null);
    }
  };

  if (selectedFeedForCurrency) {
    return (
      <SupplierCurrenciesTab
        feed={selectedFeedForCurrency}
        onBack={() => setSelectedFeedForCurrency(null)}
        onRefreshFeed={() => {
          loadSources();
          onRefreshSupplier();
        }}
      />
    );
  }

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
                <TableHead className="font-semibold text-foreground text-center">
                  {t('suppliers:columnCurrencyRate', { defaultValue: 'Валюта та курс' })}
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
              {sources.map((src) => (
                <SupplierFeedRow
                  key={src.id}
                  source={src}
                  isSyncing={syncingId === src.id}
                  onConfigureCurrency={setSelectedFeedForCurrency}
                  onSync={handleSyncSource}
                  onDelete={setFeedToDelete}
                />
              ))}
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
        title={t('suppliers:deleteFeedTitle', { defaultValue: 'Видалити підключений фід?' })}
        description={t('suppliers:deleteFeedWithProducts', {
          defaultValue: `Ви впевнені, що бажаєте видалити джерело "${feedToDelete?.name}"? Всі імпортовані товари будуть очищені.`,
        })}
      />
    </div>
  );
};
