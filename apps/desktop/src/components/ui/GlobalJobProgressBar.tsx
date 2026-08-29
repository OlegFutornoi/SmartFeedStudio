import {
  Loader2,
  Radio,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  FolderTree,
  X,
} from 'lucide-react';
import { useBackgroundJobs, BackgroundTaskItem } from '@/contexts/BackgroundJobsContext';
import { useTranslation } from '@/i18n';

export function GlobalJobProgressBar() {
  const { activeJobs, backgroundTasks, hasActiveJobs, dismissTask } = useBackgroundJobs();
  const { t } = useTranslation(['suppliers', 'common']);

  const visibleTasks = backgroundTasks.filter(
    (t) => t.status === 'PROCESSING' || t.status === 'COMPLETED' || t.status === 'FAILED',
  );

  const totalActiveCount = activeJobs.length + visibleTasks.length;

  if (!hasActiveJobs && visibleTasks.length === 0) {
    return null;
  }

  // Prioritize active background task, then BullMQ import job
  if (visibleTasks.length > 0) {
    const currentTask: BackgroundTaskItem = visibleTasks[0];
    const isCompleted = currentTask.status === 'COMPLETED';
    const isFailed = currentTask.status === 'FAILED';

    const getTaskIcon = () => {
      if (isCompleted) {
        return <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />;
      }
      if (isFailed) {
        return <AlertCircle className="size-3.5 text-destructive shrink-0" />;
      }
      switch (currentTask.kind) {
        case 'DELETE_FEED':
        case 'DELETE_CATEGORIES':
          return <Trash2 className="size-3.5 text-destructive shrink-0" />;
        case 'DELETE_SUPPLIER':
          return <Building2 className="size-3.5 text-destructive shrink-0" />;
        case 'SYNC':
          return <Radio className="size-3.5 text-primary shrink-0" />;
        default:
          return <FolderTree className="size-3.5 text-primary shrink-0" />;
      }
    };

    return (
      <div
        className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-3 duration-300"
        data-testid="global-job-progress-bar"
      >
        <div className="w-80 p-3.5 rounded-xl bg-card border border-border shadow-2xl space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isCompleted
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : isFailed
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-primary/10 text-primary'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="size-4" />
                ) : isFailed ? (
                  <AlertCircle className="size-4" />
                ) : (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground truncate flex items-center gap-1.5">
                  {getTaskIcon()}
                  <span className="truncate">{currentTask.title}</span>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono truncate">
                  {isCompleted
                    ? t('suppliers:operationCompleted', { defaultValue: 'Операцію завершено' })
                    : isFailed
                      ? currentTask.errorMessage || 'Помилка виконання'
                      : currentTask.subtitle ||
                        t('suppliers:backgroundOperationRunning', {
                          defaultValue: 'Операція виконується у фоні',
                        })}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => dismissTask(currentTask.id)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
              aria-label={t('common:close', { defaultValue: 'Закрити' })}
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Progress bar track */}
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ease-out rounded-full ${
                isCompleted
                  ? 'bg-emerald-500 w-full'
                  : isFailed
                    ? 'bg-destructive w-full'
                    : 'bg-primary animate-pulse w-full'
              }`}
            />
          </div>

          <div className="text-[10px] text-muted-foreground flex items-center justify-between">
            <span>
              {t('suppliers:backgroundCleanupHint', {
                defaultValue: 'Видалення триває у фоні, ви можете закрити вікно',
              })}
            </span>
            {totalActiveCount > 1 && (
              <span className="font-semibold text-foreground font-mono">
                {t('suppliers:queueCount', {
                  count: totalActiveCount - 1,
                  defaultValue: `+${totalActiveCount - 1} в черзі`,
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // BullMQ active import job
  const currentJob = activeJobs[0];
  const total = currentJob.totalItems || 0;
  const processed = currentJob.processedItems || 0;
  const percent =
    currentJob.progressPercent || (total > 0 ? Math.round((processed / total) * 100) : 0);
  const feedDisplayName =
    currentJob.feedSource?.name ||
    t('suppliers:importInProgressTitle', { defaultValue: 'Імпорт фіду у фоні' });

  return (
    <div
      className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-3 duration-300"
      data-testid="global-job-progress-bar"
    >
      <div className="w-80 p-3.5 rounded-xl bg-card border border-border shadow-2xl space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Loader2 className="size-3.5 animate-spin" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground truncate flex items-center gap-1.5">
                <Radio className="size-3 text-emerald-400 shrink-0" />
                <span className="truncate">{feedDisplayName}</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                {total > 0
                  ? `${processed.toLocaleString('uk-UA')} / ${total.toLocaleString('uk-UA')} SKU`
                  : t('suppliers:processingFeed', { defaultValue: 'Обробка структури...' })}
              </div>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-primary shrink-0">{percent}%</span>
        </div>

        {/* Progress bar track */}
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
            style={{ width: `${Math.min(100, Math.max(5, percent))}%` }}
          />
        </div>

        <div className="text-[10px] text-muted-foreground flex items-center justify-between">
          <span>
            {t('suppliers:backgroundImportHint', {
              defaultValue: 'Ви можете продовжувати роботу',
            })}
          </span>
          {activeJobs.length > 1 && (
            <span className="font-semibold text-foreground font-mono">
              {t('suppliers:queueCount', {
                count: activeJobs.length - 1,
                defaultValue: `+${activeJobs.length - 1} в черзі`,
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
