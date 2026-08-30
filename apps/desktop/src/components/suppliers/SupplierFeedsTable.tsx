import React from 'react';
import {
  Globe,
  FileText,
  RefreshCw,
  Upload,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FeedSourceItemDto } from '@/lib/api';
import { useTranslation } from '@/i18n';

interface SupplierFeedsTableProps {
  sources: FeedSourceItemDto[];
  syncingId: string | null;
  onSync: (sourceId: string) => void;
  onUpdateFile: () => void;
  onDeletePrompt: (source: FeedSourceItemDto) => void;
}

export const SupplierFeedsTable: React.FC<SupplierFeedsTableProps> = ({
  sources,
  syncingId,
  onSync,
  onUpdateFile,
  onDeletePrompt,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
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
                <Badge variant="outline" className="text-[10px] font-mono uppercase bg-background">
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
                  onClick={() => onSync(source.id)}
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
                  onClick={onUpdateFile}
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
                onClick={() => onDeletePrompt(source)}
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
              <span>{t('suppliers:lastSynced', { defaultValue: 'Остання синхронізація:' })}</span>
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
  );
};
