import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, AlertCircle, Coins, Percent } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { ReverseEarningsResult } from '@/modules/feed-simulator/types';

interface ReverseMarginProfitBreakdownProps {
  result: ReverseEarningsResult;
  costPrice: number;
  marketplaceName: string;
  marketplacePercent: number;
}

export function ReverseMarginProfitBreakdown({
  result,
  costPrice,
  marketplaceName,
  marketplacePercent,
}: ReverseMarginProfitBreakdownProps) {
  const { t } = useTranslation(['suppliers', 'common']);
  const isLoss = result.safetyStatus === 'BURNOUT_LOSS';
  const isRisk = result.safetyStatus === 'RISK';

  return (
    <div className="space-y-3" data-testid="reverse-margin-profit-breakdown">
      {/* 4 Waterfall metric boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2 rounded-lg bg-secondary/30 border border-border/50 space-y-0.5">
          <span className="text-2xs text-muted-foreground block">
            {t('suppliers:cinemaSupplierCost', { defaultValue: 'Закупка у фіді' })}
          </span>
          <div className="font-mono font-bold text-foreground">
            {costPrice.toLocaleString('uk-UA')} ₴
          </div>
        </div>

        <div className="p-2 rounded-lg bg-secondary/30 border border-border/50 space-y-0.5">
          <span className="text-2xs text-muted-foreground block flex items-center justify-center gap-1">
            <Percent className="size-2.5 text-primary" />
            {marketplaceName} ({marketplacePercent}%)
          </span>
          <div className="font-mono font-bold text-foreground">
            -{result.marketplaceFee.toLocaleString('uk-UA')} ₴
          </div>
        </div>

        <div
          className={`p-2 rounded-lg border space-y-0.5 ${
            isLoss
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : isRisk
                ? 'bg-secondary/60 border-border text-foreground'
                : 'bg-primary/10 border-primary/20 text-primary'
          }`}
        >
          <span className="text-2xs block flex items-center justify-center gap-1 font-medium">
            <Coins className="size-2.5" />
            {t('suppliers:cinemaNetProfit', { defaultValue: 'Чистий прибуток' })}
          </span>
          <div className="font-mono font-bold text-sm" data-testid="net-profit-cash-value">
            {result.netProfitCash > 0
              ? `+${result.netProfitCash.toLocaleString('uk-UA')}`
              : result.netProfitCash.toLocaleString('uk-UA')}{' '}
            ₴
          </div>
        </div>

        <div className="p-2 rounded-lg bg-secondary/30 border border-border/50 space-y-0.5">
          <span className="text-2xs text-muted-foreground block">
            {t('suppliers:cinemaMarginRoi', { defaultValue: 'Маржа / ROI' })}
          </span>
          <div
            className="font-mono font-bold text-foreground flex items-center justify-center gap-1"
            data-testid="margin-percent-badge"
          >
            <span>{result.marginPercent}%</span>
            <Badge variant="outline" className="text-3xs font-mono px-1 py-0">
              +{result.markupPercent}%
            </Badge>
          </div>
        </div>
      </div>

      {/* Dynamic Anti-Burnout Safety Badge */}
      <div
        data-testid={`safety-status-${result.safetyStatus.toLowerCase()}`}
        className={`p-2.5 rounded-lg border flex items-center gap-2 text-2xs transition-colors ${
          isLoss
            ? 'bg-destructive/10 border-destructive/30 text-destructive'
            : isRisk
              ? 'bg-secondary/60 border-border text-foreground'
              : 'bg-primary/10 border-primary/20 text-foreground'
        }`}
      >
        {isLoss ? (
          <AlertCircle className="size-4 shrink-0 text-destructive" />
        ) : isRisk ? (
          <AlertTriangle className="size-4 shrink-0 text-primary" />
        ) : (
          <ShieldCheck className="size-4 shrink-0 text-primary" />
        )}
        <span className="font-medium">
          {isLoss
            ? t('suppliers:cinemaStatusBurnout', {
                defaultValue:
                  'КРИТИЧНО: Торгівля в мінус! Комісія маркетплейса та закупка перевищують ціну продажу.',
              })
            : isRisk
              ? t('suppliers:cinemaStatusRisk', {
                  defaultValue: 'Ризикована ціна: логістика та повернення можуть з’їсти маржу.',
                })
              : t('suppliers:cinemaStatusSafe', {
                  defaultValue: 'Безпечна ціна: SmartFeed гарантує стабільний чистий прибуток.',
                })}
        </span>
      </div>
    </div>
  );
}
