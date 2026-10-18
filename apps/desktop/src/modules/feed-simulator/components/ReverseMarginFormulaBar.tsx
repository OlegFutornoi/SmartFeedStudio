import { ShieldCheck, AlertOctagon, Calculator } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import type { CinemaScenario } from '@/modules/feed-simulator/services/reverse-margin-cinema.service';

interface ReverseMarginFormulaBarProps {
  scenario: CinemaScenario;
}

export function ReverseMarginFormulaBar({ scenario }: ReverseMarginFormulaBarProps) {
  const { t } = useTranslation(['suppliers']);

  return (
    <div className="p-3 rounded-md border border-border/60 bg-muted/15 space-y-2.5">
      {/* Formula Spotlight Ribbon */}
      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-border/60 pb-2">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-sm bg-muted border border-border/60 text-muted-foreground flex items-center justify-center shrink-0">
            <Calculator className="size-3.5" />
          </div>
          <div>
            <span className="text-2xs font-semibold text-foreground">
              {t('suppliers:cinemaFormulaTitle')}
            </span>
            <span className="font-mono text-2xs text-foreground font-semibold ml-1.5">
              {t('suppliers:cinemaFormulaSub')}
            </span>
          </div>
        </div>

        <Badge
          variant="outline"
          className="border-border bg-background text-foreground text-3xs font-mono tabular-nums px-2 py-0.5"
        >
          {scenario.formulaDisplay}
        </Badge>
      </div>

      {/* Side-by-side Comparative Profit Impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* Left: Naive calculation failure */}
        <div className="p-2.5 rounded-md border border-destructive/25 bg-destructive/5 space-y-1">
          <div className="flex items-center justify-between text-3xs">
            <span className="font-semibold text-destructive flex items-center gap-1">
              <AlertOctagon className="size-3" />
              {t('suppliers:cinemaNaiveTitle')}
            </span>
            <span className="font-mono tabular-nums text-destructive font-bold">
              {t('suppliers:cinemaNaiveLoss', { loss: scenario.profitLostToFee })}
            </span>
          </div>
          <p className="text-3xs text-muted-foreground leading-snug tabular-nums">
            {t('suppliers:cinemaNaiveDesc', {
              price: scenario.naivePrice,
              mName: scenario.marketplaceName,
              fee: scenario.naiveMarketplaceFee,
              profit: scenario.naiveActualProfit,
            })}
          </p>
        </div>

        {/* Right: SmartFeed Guaranteed Success */}
        <div className="p-2.5 rounded-md border border-success/30 bg-success/10 space-y-1">
          <div className="flex items-center justify-between text-3xs">
            <span className="font-semibold text-success flex items-center gap-1">
              <ShieldCheck className="size-3" />
              {t('suppliers:cinemaSmartTitle')}
            </span>
            <span className="font-mono tabular-nums text-success font-bold">
              {t('suppliers:cinemaSmartBadge')}
            </span>
          </div>
          <p className="text-3xs text-muted-foreground leading-snug tabular-nums">
            {t('suppliers:cinemaSmartDesc', {
              price: scenario.smartRetailPrice,
              fee: scenario.smartMarketplaceFee,
              profit: scenario.guaranteedProfit,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
