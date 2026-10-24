import React from 'react';
import { Coins, CheckCircle2, RotateCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  type CustomRoundingRuleDto,
  type CustomRoundingRuleType,
  applyPriceRounding,
  getCurrencySymbol,
} from '@smartfeed/shared';
import {
  CURRENCY_OPTIONS,
  MODE_OPTIONS,
  BUFFER_PRESETS,
} from '@/modules/suppliers/components/details/tabs/currencies/useSupplierCurrenciesState';
import { PriceRoundingSelect } from '@/modules/suppliers/components/details/tabs/currencies/PriceRoundingSelect';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';

interface SupplierCurrencyFormCardProps {
  baseCurrency: CurrencyCode;
  setBaseCurrency: (val: CurrencyCode) => void;
  exchangeMode: ExchangeRateMode;
  setExchangeMode: (val: ExchangeRateMode) => void;
  activeRate: number;
  effectiveRate: number;
  setManualRate: (val: number) => void;
  bufferPercent: number;
  setBufferPercent: (val: number) => void;
  roundingMode: PriceRoundingMode | string;
  setRoundingMode: (val: PriceRoundingMode | string) => void;
  customRoundingRules?: CustomRoundingRuleDto[];
  onAddCustomRoundingRule?: (type: CustomRoundingRuleType, rawValue: number) => Promise<void>;
  onDeleteCustomRoundingRule?: (code: string) => Promise<void>;
  selectedBankId?: string;
  isDirty?: boolean;
  onReset?: () => void;
  isSaving: boolean;
  onSave: () => Promise<void>;
  className?: string;
}

export const SupplierCurrencyFormCard: React.FC<SupplierCurrencyFormCardProps> = (p) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const isUahBase = p.baseCurrency === CurrencyCode.UAH;
  const currencySymbol = getCurrencySymbol(p.baseCurrency);
  const sampleRounded = applyPriceRounding(483.4, p.roundingMode);
  const chipClass = (active: boolean) =>
    cn(
      'h-5 px-1.5 py-0 rounded-sm text-[10px] font-mono tabular-nums transition-colors disabled:opacity-40',
      active
        ? 'bg-card border-foreground/30 text-foreground font-semibold shadow-2xs'
        : 'bg-muted/15 border-border/50 text-muted-foreground hover:text-foreground',
    );

  return (
    <Card className={p.className || 'w-full border-border/70 bg-card shadow-xs'}>
      <CardHeader className="pb-2.5 pt-3.5 px-4 border-b border-border/40">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Coins className="size-4 text-muted-foreground" />
              {t('suppliers:currencyConfigTitle')}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {t('suppliers:currencyConfigDesc')}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="text-2xs font-mono tabular-nums px-2 py-0.5 rounded-sm bg-muted/30 border-border/60 text-foreground shrink-0"
            data-testid="effective-rate-badge"
          >
            {isUahBase
              ? '1 UAH = 1.00 ₴'
              : `${t('suppliers:effectiveRateShort')} ${p.effectiveRate.toFixed(2)} ₴/${currencySymbol}`}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <Label className="text-xs font-medium text-foreground block mb-1.5">
              {t('suppliers:baseCurrencyLabel')}
            </Label>
            <Select
              value={p.baseCurrency}
              onValueChange={(v) => p.setBaseCurrency(v as CurrencyCode)}
            >
              <SelectTrigger
                className="h-8 text-xs bg-background"
                data-testid="base-currency-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-xs">
                {CURRENCY_OPTIONS.map(([code, key, fallback]) => (
                  <SelectItem key={code} value={code}>
                    {t(key, { defaultValue: fallback })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              {CURRENCY_OPTIONS.map(([code]) => (
                <Button
                  key={code}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => p.setBaseCurrency(code)}
                  data-testid={`currency-chip-${code}`}
                  className={chipClass(p.baseCurrency === code)}
                >
                  {code}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-foreground block mb-1.5">
              {t('suppliers:exchangeModeLabel')}
            </Label>
            <Select
              value={p.exchangeMode}
              onValueChange={(v) => p.setExchangeMode(v as ExchangeRateMode)}
              disabled={isUahBase}
            >
              <SelectTrigger
                className="h-8 text-xs bg-background"
                data-testid="exchange-mode-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-xs">
                {MODE_OPTIONS.map(([mode, key, fallback]) => (
                  <SelectItem key={mode} value={mode}>
                    {t(key, { defaultValue: fallback })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-2xs text-muted-foreground mt-1.5 leading-tight">
              {isUahBase ? t('suppliers:uahBaseRateNotice') : t('suppliers:bankClickQuickHint')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-0.5">
          <div>
            <Label className="text-xs font-medium text-foreground block mb-1.5">
              {p.exchangeMode === ExchangeRateMode.MANUAL
                ? t('suppliers:exchangeRateManualLabel')
                : t('suppliers:exchangeRateCurrentLabel')}
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0.01"
                disabled={isUahBase || p.exchangeMode !== ExchangeRateMode.MANUAL}
                value={p.activeRate}
                onChange={(e) => p.setManualRate(Number(e.target.value))}
                spellCheck={false}
                autoComplete="off"
                className="h-8 text-xs font-mono tabular-nums font-semibold pr-12 bg-background"
                data-testid="exchange-rate-input"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                ₴/{currencySymbol}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-foreground block mb-1.5">
              {t('suppliers:currencyBufferLabel')}
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="0.5"
                min="0"
                max="20"
                disabled={isUahBase}
                value={isUahBase ? 0 : p.bufferPercent}
                onChange={(e) => p.setBufferPercent(Number(e.target.value))}
                spellCheck={false}
                autoComplete="off"
                className="h-8 text-xs font-mono tabular-nums pr-8 bg-background"
                data-testid="currency-buffer-input"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                %
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 mt-1.5">
              <div className="flex items-center gap-1 flex-wrap">
                {BUFFER_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUahBase}
                    onClick={() => p.setBufferPercent(preset)}
                    data-testid={`currency-buffer-chip-${preset}`}
                    className={chipClass(!isUahBase && Number(p.bufferPercent) === preset)}
                  >
                    {preset === 0 ? '0%' : `+${preset}%`}
                  </Button>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground truncate">
                {t('suppliers:currencyBufferShortHint')}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-0.5">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <Label className="text-xs font-medium text-foreground">
              {t('suppliers:priceRoundingLabel')}
            </Label>
            <span className="text-2xs font-mono tabular-nums text-muted-foreground">
              483.40 ₴ ➔ <strong className="text-foreground">{sampleRounded.toFixed(2)} ₴</strong>
            </span>
          </div>
          <PriceRoundingSelect
            value={p.roundingMode}
            onChange={p.setRoundingMode}
            customRules={p.customRoundingRules || []}
            onAddCustomRule={p.onAddCustomRoundingRule || (async () => {})}
            onDeleteCustomRule={p.onDeleteCustomRoundingRule || (async () => {})}
          />
        </div>

        <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={p.onSave}
              disabled={p.isSaving}
              size="sm"
              className="h-8 text-xs gap-1.5"
              data-testid="save-currency-btn"
            >
              <CheckCircle2 className="size-3.5" />
              {p.isSaving ? t('common:saving') : t('common:save')}
            </Button>
            {p.isDirty && p.onReset && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={p.onReset}
                disabled={p.isSaving}
                className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                data-testid="reset-currency-btn"
              >
                <RotateCcw className="size-3" />
                {t('suppliers:ruleCancelEditBtn')}
              </Button>
            )}
          </div>
          {p.isDirty && (
            <span className="text-2xs text-muted-foreground">
              {t('suppliers:unsavedCurrencyChanges')}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
