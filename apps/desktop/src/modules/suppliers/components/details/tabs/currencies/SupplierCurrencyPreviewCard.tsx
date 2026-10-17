import React, { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CurrencyCode,
  PriceRoundingMode,
  convertSupplierPrice,
  getCurrencySymbol,
} from '@smartfeed/shared';
import { useTranslation } from '@/i18n';

interface SupplierCurrencyPreviewCardProps {
  baseCurrency: CurrencyCode;
  activeRate: number;
  bufferPercent: number;
  roundingMode: PriceRoundingMode;
  isFetchingRates: boolean;
  onRefreshRates: () => void;
}

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

  const conversion = useMemo(() => {
    return convertSupplierPrice({
      costPrice: previewCost,
      fromCurrency: baseCurrency,
      toCurrency: CurrencyCode.UAH,
      exchangeRate: activeRate,
      bufferPercent,
      roundingMode,
    });
  }, [previewCost, baseCurrency, activeRate, bufferPercent, roundingMode]);

  return (
    <Card className="border-border/80 bg-card shadow-xs flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">
            {t('suppliers:liveConversionTitle', { defaultValue: 'Конвертація в реальному часі' })}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefreshRates}
            disabled={isFetchingRates}
            className="size-7"
            title={t('suppliers:refreshNbuRatesTooltip', { defaultValue: 'Оновити курси НБУ' })}
          >
            <RefreshCw
              className={`size-3 text-muted-foreground ${isFetchingRates ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
        <CardDescription className="text-xs">
          {t('suppliers:liveConversionDesc', { defaultValue: 'Тестовий розрахунок для товару' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <span className="text-xs text-muted-foreground block mb-1">
            {t('suppliers:costInSupplierCurrency', {
              defaultValue: 'Ціна у валюті постачальника',
            })}{' '}
            ({getCurrencySymbol(baseCurrency)}):
          </span>
          <Input
            type="number"
            min="0"
            value={previewCost}
            onChange={(e) => setPreviewCost(Number(e.target.value))}
            className="h-9 font-bold font-mono text-base text-primary bg-background/80"
          />
        </div>

        <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {t('suppliers:baseRateLabel', { defaultValue: 'Базовий курс:' })}
            </span>
            <span className="font-mono">{conversion.baseExchangeRate} ₴</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {t('suppliers:effectiveRateLabel', {
                buffer: bufferPercent,
                defaultValue: `Ефективний курс (+${bufferPercent}%):`,
              })}
            </span>
            <span className="font-mono font-semibold text-foreground">
              {conversion.effectiveExchangeRate} ₴
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {t('suppliers:bufferAmountLabel', { defaultValue: 'Валютний буфер у сумі:' })}
            </span>
            <span className="font-mono text-success">+{conversion.bufferApplied} ₴</span>
          </div>
          <div className="pt-2 border-t border-border/80 flex items-center justify-between">
            <span className="font-bold text-foreground">
              {t('suppliers:convertedToUahLabel', { defaultValue: 'Конвертовано в UAH:' })}
            </span>
            <span
              className="text-base font-bold font-mono text-primary"
              data-testid="converted-currency-price"
            >
              {conversion.finalConvertedPrice} ₴
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
