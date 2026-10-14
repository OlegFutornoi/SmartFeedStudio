import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusType =
  | 'APPROVED'
  | 'ACTIVE'
  | 'SUCCESS'
  | 'DONE'
  | 'COMPLETED'
  | 'SYNCED'
  | 'PENDING'
  | 'SYNCING'
  | 'PROCESSING'
  | 'DECLINED'
  | 'EXPIRED'
  | 'ERROR'
  | 'FAILED'
  | 'SUSPENDED'
  | 'INACTIVE'
  | 'DRAFT'
  | string;

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  isUk?: boolean;
  className?: string;
  showDot?: boolean;
  testId?: string;
}

const DEFAULT_LABELS_UK: Record<string, string> = {
  APPROVED: 'Оплачено',
  ACTIVE: 'Активна',
  SUCCESS: 'Успішно',
  DONE: 'Виконано',
  COMPLETED: 'Завершено',
  SYNCED: 'Синхронізовано',
  PENDING: 'Очікує',
  SYNCING: 'Синхронізація',
  PROCESSING: 'Обробка',
  DECLINED: 'Відхилено',
  EXPIRED: 'Закінчилася',
  ERROR: 'Помилка',
  FAILED: 'Не вдалося',
  SUSPENDED: 'Призупинена',
  INACTIVE: 'Неактивна',
  DRAFT: 'Чернетка',
};

const DEFAULT_LABELS_EN: Record<string, string> = {
  APPROVED: 'Approved',
  ACTIVE: 'Active',
  SUCCESS: 'Success',
  DONE: 'Done',
  COMPLETED: 'Completed',
  SYNCED: 'Synced',
  PENDING: 'Pending',
  SYNCING: 'Syncing',
  PROCESSING: 'Processing',
  DECLINED: 'Declined',
  EXPIRED: 'Expired',
  ERROR: 'Error',
  FAILED: 'Failed',
  SUSPENDED: 'Suspended',
  INACTIVE: 'Inactive',
  DRAFT: 'Draft',
};

export function StatusBadge({
  status,
  label,
  isUk = true,
  className,
  showDot = true,
  testId,
}: StatusBadgeProps) {
  const normalizedStatus = (status || '').toUpperCase();

  const isSuccess = [
    'APPROVED',
    'ACTIVE',
    'SUCCESS',
    'DONE',
    'COMPLETED',
    'SYNCED',
    'PAID',
  ].includes(normalizedStatus);
  const isWarning = ['PENDING', 'SYNCING', 'PROCESSING', 'TRIAL'].includes(normalizedStatus);
  const isDestructive = ['DECLINED', 'EXPIRED', 'ERROR', 'FAILED'].includes(normalizedStatus);

  const styleConfig = isSuccess
    ? {
        badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        dot: 'bg-emerald-500',
      }
    : isWarning
      ? {
          badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          dot: 'bg-amber-500',
        }
      : isDestructive
        ? {
            badge: 'bg-destructive/10 text-destructive border-destructive/20',
            dot: 'bg-destructive',
          }
        : {
            badge: 'bg-muted/50 text-muted-foreground border-border',
            dot: 'bg-muted-foreground',
          };

  const resolvedLabel =
    label ||
    (isUk ? DEFAULT_LABELS_UK[normalizedStatus] : DEFAULT_LABELS_EN[normalizedStatus]) ||
    status;

  return (
    <Badge
      variant="outline"
      data-testid={testId || `status-badge-${normalizedStatus.toLowerCase()}`}
      className={cn(
        'rounded-full px-2 py-0 text-2xs h-5 inline-flex items-center gap-1.5 font-normal border transition-colors select-none',
        styleConfig.badge,
        className,
      )}
    >
      {showDot && <span className={cn('size-1.5 rounded-full shrink-0', styleConfig.dot)} />}
      <span>{resolvedLabel}</span>
    </Badge>
  );
}
