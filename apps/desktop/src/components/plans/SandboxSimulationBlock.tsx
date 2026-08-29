import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SandboxSimulationBlockProps {
  isUk?: boolean;
  t: (key: string) => string;
  isDisabled: boolean;
  successTestId: string;
  declineTestId: string;
  onSimulate: (status: 'Approved' | 'Declined') => void;
  compact?: boolean;
}

export function SandboxSimulationBlock({
  t,
  isDisabled,
  successTestId,
  declineTestId,
  onSimulate,
  compact,
}: SandboxSimulationBlockProps) {
  return (
    <div
      className={
        compact
          ? 'flex flex-col sm:flex-row gap-2 pt-1'
          : 'rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-2.5'
      }
    >
      {!compact && (
        <>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Sparkles className="size-3.5 shrink-0" />
            <span>{t('plans.sandboxTestingTitle')}</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t('plans.sandboxTestingDesc')}
          </p>
        </>
      )}

      <div className={compact ? 'contents' : 'flex flex-col sm:flex-row gap-2 pt-1'}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid={successTestId}
          onClick={() => onSimulate('Approved')}
          disabled={isDisabled}
          className="flex-1 h-auto min-h-[38px] py-1.5 px-2.5 text-xs leading-snug text-center whitespace-normal break-words border-emerald-500/40 bg-emerald-500/10 text-emerald-400 dark:text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 font-medium transition-colors cursor-pointer"
        >
          <span>{t('plans.simulateSuccessBtn')}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid={declineTestId}
          onClick={() => onSimulate('Declined')}
          disabled={isDisabled}
          className="flex-1 h-auto min-h-[38px] py-1.5 px-2.5 text-xs leading-snug text-center whitespace-normal break-words border-red-500/40 bg-red-500/10 text-red-400 dark:text-red-400 hover:bg-red-500/20 hover:text-red-300 font-medium transition-colors cursor-pointer"
        >
          <span>{t('plans.simulateDeclineBtn')}</span>
        </Button>
      </div>
    </div>
  );
}
