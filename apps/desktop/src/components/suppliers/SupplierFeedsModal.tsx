import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SupplierDto } from '@smartfeed/shared';
import {
  getSupplierFeedSources,
  syncSupplierFeedSource,
  deleteSupplierFeedSource,
  FeedSourceItemDto,
} from '@/lib/api';
import { useBackgroundJobs } from '@/contexts/BackgroundJobsContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Radio,
  Globe,
  FileText,
  RefreshCw,
  Upload,
  Trash2,
  Plus,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useQuotas } from '@/hooks/useQuotas';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { emitDataSync } from '@/lib/syncEvents';

interface SupplierFeedsModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierDto | null;
  onConnectNewFeed: (supplier: SupplierDto) => void;
}

export function SupplierFeedsModal({
  isOpen,
  onClose,
  supplier,
  onConnectNewFeed,
}: SupplierFeedsModalProps) {
  const { t, language } = useTranslation(['suppliers', 'common']);
  const isUk = language === 'uk';
  const { token } = useAuth();
  const { isFeedLimitReached } = useQuotas();
  const { addTrackedJob, runBackgroundTask } = useBackgroundJobs();

  const [sources, setSources] = useState<FeedSourceItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedToDelete, setFeedToDelete] = useState<FeedSourceItemDto | null>(null);

  const fetchSources = useCallback(async () => {
    if (!supplier) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSupplierFeedSources(supplier.id);
      setSources(data);
    } catch (err: any) {
      setError(err.message || 'Не вдалося завантажити список фідів');
    } finally {
      setIsLoading(false);
    }
  }, [supplier]);

  useEffect(() => {
    if (isOpen && supplier) {
      fetchSources();
    }
  }, [isOpen, supplier, fetchSources]);

  if (!isOpen || !supplier) return null;

  const handleSync = async (sourceId: string) => {
    setSyncingId(sourceId);
    try {
      const res = await syncSupplierFeedSource(supplier.id, sourceId);
      addTrackedJob(res.jobId);
      await fetchSources();
      emitDataSync(['suppliers', 'feeds', 'products', 'quotas']);
    } catch (err: any) {
      setError(err.message || 'Помилка синхронізації');
    } finally {
      setSyncingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!feedToDelete) return;
    const target = feedToDelete;
    setFeedToDelete(null);

    try {
      await runBackgroundTask({
        kind: 'DELETE_FEED',
        title: isUk ? `Видалення фіду «${target.name}»` : `Deleting feed «${target.name}»`,
        subtitle: isUk
          ? 'Видалення джерела та товарів у фоні'
          : 'Deleting feed and products in background',
        action: async () => {
          await deleteSupplierFeedSource(supplier.id, target.id, token || undefined, true);
          setSources((prev) => prev.filter((s) => s.id !== target.id));
          emitDataSync(['suppliers', 'feeds', 'products', 'quotas']);
        },
      });
    } catch (err: any) {
      setError(err.message || 'Не вдалося видалити фід');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-border bg-card flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Radio className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <span>
                  {t('suppliers:connectedFeedsTitle', { defaultValue: 'Підключені фіди' })}:
                </span>
                <span className="text-primary">{supplier.name}</span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {supplier.code}
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('suppliers:connectedFeedsDesc', {
                  defaultValue:
                    'Список активних джерел даних (URL / файли) для автоматичного оновлення цін і залишків',
                })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-card space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-xs">
                {t('common:loading', { defaultValue: 'Завантаження...' })}
              </span>
            </div>
          ) : sources.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="size-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
                <Radio className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {t('suppliers:noFeedsConnected', {
                    defaultValue: 'Жодного фіду ще не підключено',
                  })}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {t('suppliers:noFeedsConnectedDesc', {
                    defaultValue:
                      'Підключіть URL-посилання або завантажте файл каталогу для автоматичного імпорту товарів.',
                  })}
                </p>
              </div>
              <Button
                size="sm"
                className="text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  onClose();
                  onConnectNewFeed(supplier);
                }}
                disabled={isFeedLimitReached}
                title={
                  isFeedLimitReached
                    ? t('suppliers:feedLimitReachedTooltip', {
                        defaultValue:
                          'Ліміт джерел фідів вичерпано. Підвищіть тариф або видаліть зайві фіди.',
                      })
                    : undefined
                }
                data-testid="empty-connect-feed-btn"
              >
                <Plus className="size-3.5" />
                {t('suppliers:connectFeedBtn', { defaultValue: 'Підключити фід' })}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="p-4 rounded-xl border border-border bg-secondary/30 hover:border-primary/40 transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {source.sourceType === 'URL' ? (
                          <Globe className="size-4 text-primary shrink-0" />
                        ) : (
                          <FileText className="size-4 text-primary shrink-0" />
                        )}
                        <span className="font-semibold text-xs text-foreground truncate">
                          {source.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono uppercase bg-background"
                        >
                          {source.fileFormat}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        >
                          {source.sourceType}
                        </Badge>
                      </div>

                      {source.sourceUrl && (
                        <p
                          className="text-[11px] font-mono text-muted-foreground truncate"
                          title={source.sourceUrl}
                        >
                          {source.sourceUrl}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {source.sourceType === 'URL' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs px-2.5 gap-1.5 bg-background hover:bg-secondary"
                          disabled={syncingId === source.id}
                          onClick={() => handleSync(source.id)}
                        >
                          {syncingId === source.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="size-3.5 text-primary" />
                          )}
                          <span>{t('suppliers:syncNow', { defaultValue: 'Синхронізувати' })}</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs px-2.5 gap-1.5 bg-background hover:bg-secondary"
                          onClick={() => {
                            onClose();
                            onConnectNewFeed(supplier);
                          }}
                          title={t('suppliers:fileFeedSyncTooltip', {
                            defaultValue:
                              'Файлові каталоги оновлюються шляхом завантаження оновленого файлу',
                          })}
                        >
                          <Upload className="size-3.5 text-primary" />
                          <span>{t('suppliers:updateFile', { defaultValue: 'Оновити файл' })}</span>
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        onClick={() => setFeedToDelete(source)}
                        title={t('common:delete', { defaultValue: 'Видалити' })}
                        data-testid={`delete-feed-source-${source.id}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Sync status & metrics footer */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3 shrink-0" />
                      <span>
                        {t('suppliers:lastSynced', { defaultValue: 'Остання синхронізація:' })}
                      </span>
                      <strong className="text-foreground font-mono">
                        {source.lastSyncedAt
                          ? new Date(source.lastSyncedAt).toLocaleString('uk-UA')
                          : t('suppliers:neverSynced', { defaultValue: 'Ще не синхронізовано' })}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {source.lastSyncStatus === 'SUCCESS' ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="size-3" />
                          <span>{t('suppliers:statusSuccess', { defaultValue: 'Успішно' })}</span>
                        </span>
                      ) : source.lastSyncStatus === 'ERROR' ? (
                        <span className="flex items-center gap-1 text-destructive font-medium">
                          <AlertCircle className="size-3" />
                          <span>{t('suppliers:statusError', { defaultValue: 'Помилка' })}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-primary font-medium">
                          <Clock className="size-3" />
                          <span>{t('suppliers:statusPending', { defaultValue: 'Очікує' })}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              onClose();
              onConnectNewFeed(supplier);
            }}
            disabled={isFeedLimitReached}
            title={
              isFeedLimitReached
                ? t('suppliers:feedLimitReachedTooltip', {
                    defaultValue:
                      'Ліміт джерел фідів вичерпано. Підвищіть тариф або видаліть зайві фіди.',
                  })
                : undefined
            }
            data-testid="modal-connect-new-feed-btn"
          >
            <Plus className="size-3.5" />
            {t('suppliers:connectNewFeed', { defaultValue: 'Підключити новий фід' })}
          </Button>

          <Button size="sm" onClick={onClose} className="text-xs h-8 px-4">
            {t('common:close', { defaultValue: 'Закрити' })}
          </Button>
        </div>
      </div>

      {/* Styled Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={Boolean(feedToDelete)}
        onClose={() => setFeedToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={isUk ? 'Видалити підключений фід' : 'Delete Connected Feed'}
        description={
          <div className="space-y-2">
            <p>
              {isUk
                ? 'Ви впевнені, що хочете видалити це підключене джерело фіду?'
                : 'Are you sure you want to delete this connected feed source?'}
            </p>
            {feedToDelete && (
              <div className="p-2.5 rounded-lg bg-muted border border-border font-mono text-[11px] text-foreground font-semibold truncate">
                {feedToDelete.name}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              {isUk
                ? 'Всі імпортовані товари цього фіду також буде видалено з каталогу.'
                : 'All imported products from this feed will also be deleted from the catalog.'}
            </p>
          </div>
        }
        confirmLabel={isUk ? 'Видалити фід' : 'Delete feed'}
        cancelLabel={isUk ? 'Скасувати' : 'Cancel'}
      />
    </div>,
    document.body,
  );
}
