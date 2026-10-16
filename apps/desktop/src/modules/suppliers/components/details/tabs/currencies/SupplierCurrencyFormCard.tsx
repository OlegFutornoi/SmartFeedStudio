import React from 'react';
import { Coins, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CurrencyCode,
  ExchangeRateMode,
  PriceRoundingMode,
  getCurrencySymbol,
} from '@smartfeed/shared';
import { useTranslation } from '@/i18n';

interface SupplierCurrencyFormCardProps {
  baseCurrency: CurrencyCode;
  setBaseCurrency: (val: CurrencyCode) => void;
  exchangeMode: ExchangeRateMode;
  setExchangeMode: (val: ExchangeRateMode) => void;
  activeRate: number;
  setManualRate: (val: number) => void;
  bufferPercent: number;
  setBufferPercent: (val: number) => void;
  roundingMode: PriceRoundingMode;
  setRoundingMode: (val: PriceRoundingMode) => void;
  isSaving: boolean;
  onSave: () => Promise<void>;
  className?: string;
}

export const SupplierCurrencyFormCard: React.FC<SupplierCurrencyFormCardProps> = ({
  baseCurrency,
  setBaseCurrency,
  exchangeMode,
  setExchangeMode,
  activeRate,
  setManualRate,
  bufferPercent,
  setBufferPercent,
  roundingMode,
  setRoundingMode,
  isSaving,
  onSave,
  className,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <Card className={className || 'w-full border-border/80 bg-card shadow-xs'}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Coins className="size-4 text-primary" />
          {t('suppliers:currencyConfigTitle', {
            defaultValue: 'Налаштування валюти та обмінного курсу',
          })}
        </CardTitle>
        <CardDescription className="text-xs">
          Вкажіть базову валюту прайсу постачальника, джерело курсу та захисний буфер
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Base Currency */}
          <div>
            <Label className="text-xs font-medium text-foreground block mb-1.5">
              Базова валюта прайсу постачальника:
            </Label>
            <Select
              value={baseCurrency}
              onValueChange={(val) => setBaseCurrency(val as CurrencyCode)}
            >
              <SelectTrigger
                className="h-8.5 text-xs bg-background/80"
                data-testid="base-currency-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value={CurrencyCode.UAH}>UAH (Гривня ₴)</SelectItem>
                <SelectItem value={CurrencyCode.USD}>USD (Долар США $)</SelectItem>
                <SelectItem value={CurrencyCode.EUR}>EUR (Євро €)</SelectItem>
                <SelectItem value={CurrencyCode.PLN}>PLN (Польський злотий zł)</SelectItem>
                <SelectItem value={CurrencyCode.GBP}>GBP (Фунт стерлінгів £)</SelectItem>
                <SelectItem value={CurrencyCode.CNY}>CNY (Китайський юань ¥)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rate Mode */}
          <div>
            <Label className="text-xs font-medium text-foreground block mb-1.5">
              Режим отримання курсу до Гривні (UAH):
            </Label>
            <Select
              value={exchangeMode}
              onValueChange={(val) => setExchangeMode(val as ExchangeRateMode)}
            >
              <SelectTrigger className="h-8.5 text-xs bg-background/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value={ExchangeRateMode.AUTO_NBU}>
                  Офіційний курс НБУ (Автоматично)
                </SelectItem>
                <SelectItem value={ExchangeRateMode.AUTO_PRIVAT}>
                  ПриватБанк (Картковий курс)
                </SelectItem>
                <SelectItem value={ExchangeRateMode.MANUAL}>
                  Фіксований вручну / Банківський
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Exchange Rate & Buffer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div>
            <Label className="text-xs font-medium text-foreground block mb-1.5">
              {exchangeMode === ExchangeRateMode.MANUAL
                ? 'Курс обміну (вручну / обраний банк):'
                : 'Поточний курс обміну:'}
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0.01"
                disabled={exchangeMode !== ExchangeRateMode.MANUAL}
                value={activeRate}
                onChange={(e) => setManualRate(Number(e.target.value))}
                className="h-8.5 text-xs font-mono font-bold pr-12 bg-background/80"
                data-testid="exchange-rate-input"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                ₴/{getCurrencySymbol(baseCurrency)}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-foreground block mb-1.5">
              Валютний буфер ризику (% Buffer):
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="0.5"
                min="0"
                max="20"
                value={bufferPercent}
                onChange={(e) => setBufferPercent(Number(e.target.value))}
                className="h-8.5 text-xs font-mono pr-8 bg-background/80"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                %
              </span>
            </div>
            <p className="text-2xs text-muted-foreground mt-1">
              Захищає прибуток при різких коливаннях курсу між оновленнями фідів
            </p>
          </div>
        </div>

        {/* Rounding Mode */}
        <div>
          <Label className="text-xs font-medium text-foreground block mb-1.5">
            Правило маркетингового округлення цін:
          </Label>
          <Select
            value={roundingMode}
            onValueChange={(val) => setRoundingMode(val as PriceRoundingMode)}
          >
            <SelectTrigger className="h-8.5 text-xs bg-background/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value={PriceRoundingMode.NONE}>Без округлення (копійки як є)</SelectItem>
              <SelectItem value={PriceRoundingMode.NEAREST_INTEGER}>
                До цілої гривні (напр. 450 грн)
              </SelectItem>
              <SelectItem value={PriceRoundingMode.DECIMAL_99}>
                Маркетингове закінчення .99 (напр. 449.99 грн)
              </SelectItem>
              <SelectItem value={PriceRoundingMode.DECIMAL_95}>
                Маркетингове закінчення .95 (напр. 449.95 грн)
              </SelectItem>
              <SelectItem value={PriceRoundingMode.INTEGER_9}>
                Закінчення на 9 (напр. 449, 489, 999 грн)
              </SelectItem>
              <SelectItem value={PriceRoundingMode.INTEGER_7}>
                Закінчення на 7 (напр. 447, 487, 997 грн)
              </SelectItem>
              <SelectItem value={PriceRoundingMode.INTEGER_5}>
                Закінчення на 5 (напр. 445, 485, 995 грн)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={onSave}
          disabled={isSaving}
          size="sm"
          className="h-8 text-xs gap-1.5 mt-2"
          data-testid="save-currency-btn"
        >
          <CheckCircle2 className="size-3.5" />
          {isSaving
            ? 'Збереження...'
            : t('common:save', { defaultValue: 'Зберегти валютні налаштування' })}
        </Button>
      </CardContent>
    </Card>
  );
};
