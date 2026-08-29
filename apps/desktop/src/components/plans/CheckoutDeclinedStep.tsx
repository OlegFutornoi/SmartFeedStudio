import { XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CheckoutDeclinedStepProps {
  errorMessage: string | null;
  isUk: boolean;
  t: (key: string) => string;
  onClose: () => void;
  onRetry: () => void;
}

export function CheckoutDeclinedStep({
  errorMessage,
  isUk,
  t,
  onClose,
  onRetry,
}: CheckoutDeclinedStepProps) {
  return (
    <div className="py-6 flex flex-col items-center justify-center text-center space-y-5 animate-in zoom-in-95 duration-200">
      <div className="size-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 ring-8 ring-red-500/5">
        <XCircle className="size-9" />
      </div>

      <div className="space-y-1.5">
        <h3
          className="text-xl font-extrabold text-red-400 dark:text-red-400"
          data-testid="payment-declined-title"
        >
          {t('plans.paymentDeclinedTitle')}
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm" data-testid="payment-declined-desc">
          {errorMessage || t('plans.paymentDeclinedDesc')}
        </p>
      </div>

      <div className="w-full rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 dark:text-red-300 text-center font-medium">
        {isUk
          ? '⚠️ Доступ до операцій з каталогами залишається заблокованим.'
          : '⚠️ Access to catalog operations remains locked.'}
      </div>

      <div className="grid grid-cols-2 gap-3 w-full pt-2">
        <Button
          variant="outline"
          onClick={onClose}
          className="w-full text-xs font-semibold h-10 cursor-pointer"
        >
          <span>{t('plans.closeBtn')}</span>
        </Button>
        <Button
          onClick={onRetry}
          data-testid="try-again-payment-btn"
          className="w-full text-xs font-bold gap-1.5 h-10 cursor-pointer"
        >
          <RefreshCw className="size-3.5" />
          <span>{t('plans.tryAgainBtn')}</span>
        </Button>
      </div>
    </div>
  );
}
