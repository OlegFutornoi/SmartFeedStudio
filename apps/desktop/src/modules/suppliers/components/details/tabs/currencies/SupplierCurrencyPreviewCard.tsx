import React, { useState, useMemo } from 'react';
import { RefreshCw, Calculator, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CurrencyCode,
  PriceRoundingMode,
  convertSupplierPrice,
  getCurrencySymbol,
} from '@smartfeed/shared';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';

interface SupplierCurrencyPreviewCardProps {
  baseCurrency: CurrencyCode;
  activeRate: number;
  bufferPercent: number;
  roundingMode: PriceRoundingMode | string;
  isFetchingRates: boolean;
  onRefreshRates: () => void;
}

const QUICK_TEST_COSTS = [10, 25, 100, 500];

export const SupplierCurrencyPreviewCard: React.FC<SupplierCurrencyPreviewCardProps> = ({
  baseCurrency,
  activeRate,
  bufferPercent,
  roundingMode,
  isFetchingRates,
  onRefreshRates,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const [previewCost, setPreviewCost] = useState<number>(25);

  const symbol = getCurrencySymbol(baseCurrency);
  const safeBuffer = baseCurrency === CurrencyCode.UAH ? 0 : bufferPercent;

  const conversion = useMemo(() => {
    return convertSupplierPrice({
      costPrice: previewCost,
      fromCurrency: baseCurrency,
      toCurrency: CurrencyCode.UAH,
      exchangeRate: activeRate,
      bufferPercent: safeBuffer,
      roundingMode,
    });
  }, [previewCost, baseCurrency, activeRate, safeBuffer, roundingMode]);

  const roundingDelta = useMemo(() => {
    return Math.round((conversion.finalConvertedPrice - conversion.rawConvertedPrice) * 100) / 100;
  }, [conversion.finalConvertedPrice, conversion.rawConvertedPrice]);

  return (
    <Card className="border-border/70 bg-card shadow-xs">
      <CardContent className="p-3 space-y-2">
        {/* Header bar with quick test cost presets */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Calculator className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-semibold text-foreground truncate">
              {t('suppliers:liveConversionTitle', { defaultValue: 'Конвертація в реальному часі' })}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {QUICK_TEST_COSTS.map((cost) => {
              const active = previewCost === cost;
              return (
                <Button
                  key={cost}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewCost(cost)}
                  data-testid={`currency-sim-chip-${cost}`}
                  className={cn(
                    'h-5 px-1.5 py-0 rounded-sm text-[10px] font-mono tabular-nums transition-colors',
                    active
                      ? 'bg-card border-foreground/30 text-foreground font-semibold shadow-2xs'
                      : 'bg-muted/15 border-border/50 text-muted-foreground hover:text-foreground',
                  )}
                >
                  {symbol}
                  {cost}
                </Button>
              );
            })}

            <Button
              variant="ghost"
              size="icon"
              onClick={onRefreshRates}
              disabled={isFetchingRates}
              className="size-5 text-muted-foreground hover:text-foreground"
              title={t('suppliers:refreshNbuRatesTooltip', { defaultValue: 'Оновити курси НБУ' })}
            >
              <RefreshCw className={cn('size-3', isFetchingRates && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Inline Cost Input ➔ Converted UAH Result */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
          <div className="flex items-center gap-2">
            <span className="text-2xs text-muted-foreground">
              {t('suppliers:costInSupplierCurrency', {
                defaultValue: 'Ціна прайсу',
              })}
              :
            </span>
            <div className="relative w-24">
              <Input
                type="number"
                min="0"
                step="1"
                value={previewCost}
                onChange={(e) => setPreviewCost(Number(e.target.value))}
                spellCheck={false}
                autoComplete="off"
                className="h-7 font-semibold font-mono tabular-nums text-xs pr-5 text-right bg-background"
                data-testid="currency-sim-cost-input"
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-2xs text-muted-foreground font-mono">
                {symbol}
              </span>
            </div>
          </div>

          <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />

          <div className="flex items-baseline gap-1.5 text-right">
            <span className="text-2xs text-muted-foreground">
              {t('suppliers:convertedToUahLabel', { defaultValue: 'В UAH:' })}
            </span>
            <span
              className="text-sm font-bold font-mono tabular-nums text-primary"
              data-testid="converted-currency-price"
            >
              {conversion.finalConvertedPrice.toFixed(2)} ₴
            </span>
          </div>
        </div>

        {/* Compact single-line rate & buffer telemetry */}
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/30 font-mono tabular-nums">
          <span>
            {t('suppliers:baseRateLabel', { defaultValue: 'Базовий курс:' })}{' '}
            <strong className="text-foreground">{conversion.baseExchangeRate.toFixed(2)} ₴</strong>
          </span>
          <span>
            {t('suppliers:effectiveRateShort', { defaultValue: 'Ефективний:' })}{' '}
            <strong className="text-foreground">
              {conversion.effectiveExchangeRate.toFixed(2)} ₴
            </strong>
          </span>
          <span className="text-success">
            +{conversion.bufferApplied.toFixed(2)} ₴
            {roundingDelta !== 0 && (
              <span className="text-muted-foreground ml-1">
                ({roundingDelta > 0 ? `+${roundingDelta.toFixed(2)}` : roundingDelta.toFixed(2)} ₴)
              </span>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
