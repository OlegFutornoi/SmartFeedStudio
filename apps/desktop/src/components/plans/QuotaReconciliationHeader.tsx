import React from 'react';
import { X, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuotaReconciliationHeaderProps {
  currentPlanName: string;
  isUk: boolean;
  currentProductsUsed: number;
  maxProductsLimit: number;
  currentFeedsUsed: number;
  maxFeedsLimit: number;
  onClose: () => void;
  onNavigatePlans: () => void;
}

export const QuotaReconciliationHeader: React.FC<QuotaReconciliationHeaderProps> = ({
  currentPlanName,
  isUk,
  currentProductsUsed,
  maxProductsLimit,
  currentFeedsUsed,
  maxFeedsLimit,
  onClose,
  onNavigatePlans,
}) => {
  return (
    <>
      {/* 100% Solid Opaque Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground sm:text-lg">
              {isUk ? 'Узгодження лімітів тарифного плану' : 'Plan Limits Reconciliation'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isUk
                ? `Поточний тариф «${currentPlanName}»: оберіть що видалити або підвищіть тариф`
                : `Current plan «${currentPlanName}»: choose what to remove or upgrade`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          data-testid="close-reconciliation-dialog-btn"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={isUk ? 'Закрити' : 'Close'}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Live Quota Status Bar */}
      <div className="px-6 py-3 bg-muted/40 border-b border-border/60 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 rounded-xl border border-border/60 bg-card">
            <span className="text-muted-foreground block text-[11px]">
              {isUk ? 'Товарів у базі' : 'Products in DB'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5 font-bold font-mono">
              <span
                className={
                  currentProductsUsed > maxProductsLimit ? 'text-destructive' : 'text-foreground'
                }
              >
                {currentProductsUsed.toLocaleString()}
              </span>
              <span className="text-muted-foreground font-normal text-[10px]">
                / {maxProductsLimit.toLocaleString()} SKU
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-border/60 bg-card">
            <span className="text-muted-foreground block text-[11px]">
              {isUk ? 'Підключені фіди' : 'Connected Feeds'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5 font-bold font-mono">
              <span
                className={
                  currentFeedsUsed > maxFeedsLimit ? 'text-destructive' : 'text-foreground'
                }
              >
                {currentFeedsUsed}
              </span>
              <span className="text-muted-foreground font-normal text-[10px]">
                / {maxFeedsLimit}
              </span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl border border-border/60 bg-card flex items-center justify-between">
            <div>
              <span className="text-muted-foreground block text-[11px]">
                {isUk ? 'Альтернатива' : 'Alternative'}
              </span>
              <span className="font-semibold text-xs text-primary block mt-0.5">PRO Тариф</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-primary/40 text-primary hover:bg-primary/10 gap-1 rounded-lg"
              onClick={onNavigatePlans}
            >
              <Sparkles className="h-3 w-3" />
              {isUk ? 'Апгрейд' : 'Upgrade'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
